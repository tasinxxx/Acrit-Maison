"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type JournalPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  coverImage: string | null;
  readMinutes: number;
  published: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
};

const CATEGORIES = ["Care", "Styling", "Materials", "Craftsmanship", "Journal"];

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  coverImage: string;
  readMinutes: number;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
};

function emptyForm(): FormState {
  return {
    title: "",
    slug: "",
    excerpt: "",
    body: "",
    category: "Journal",
    coverImage: "",
    readMinutes: 4,
    published: false,
    seoTitle: "",
    seoDescription: "",
  };
}

function toForm(post: JournalPost): FormState {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    body: post.body,
    category: post.category,
    coverImage: post.coverImage ?? "",
    readMinutes: post.readMinutes,
    published: post.published,
    seoTitle: post.seoTitle ?? "",
    seoDescription: post.seoDescription ?? "",
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

export function JournalManager({ posts }: { posts: JournalPost[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState<FormState>(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm());

  function set<K extends keyof FormState>(setter: React.Dispatch<React.SetStateAction<FormState>>, key: K, value: FormState[K]) {
    setter((f) => ({ ...f, [key]: value }));
  }

  async function send(method: "POST" | "PATCH" | "DELETE", id?: string, body?: FormState) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(id ? `/api/admin/journal/${id}` : "/api/admin/journal", {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Action failed.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Network error.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function create() {
    const ok = await send("POST", undefined, { ...newForm, coverImage: newForm.coverImage });
    if (ok) {
      setNewForm(emptyForm());
      setCreating(false);
    }
  }

  async function save(id: string) {
    const ok = await send("PATCH", id, editForm);
    if (ok) setEditId(null);
  }

  async function remove(id: string, title: string) {
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;
    await send("DELETE", id);
  }

  const formFields = (form: FormState, setter: React.Dispatch<React.SetStateAction<FormState>>, idPrefix: string) => (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`${idPrefix}-title`}>Title</label>
          <input
            id={`${idPrefix}-title`}
            className="input"
            value={form.title}
            maxLength={200}
            onChange={(e) => {
              const title = e.target.value;
              setter((f) => ({
                ...f,
                title,
                // Keep the suggested slug in step while editing a fresh draft.
                slug: idPrefix === "new" ? slugify(title) : f.slug,
              }));
            }}
          />
        </div>
        <div>
          <label className="label" htmlFor={`${idPrefix}-slug`}>Slug (URL)</label>
          <input
            id={`${idPrefix}-slug`}
            className="input"
            value={form.slug}
            maxLength={200}
            onChange={(e) => set(setter, "slug", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor={`${idPrefix}-excerpt`}>Excerpt</label>
        <textarea
          id={`${idPrefix}-excerpt`}
          rows={2}
          maxLength={400}
          className="input"
          value={form.excerpt}
          onChange={(e) => set(setter, "excerpt", e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor={`${idPrefix}-body`}>Body</label>
        <textarea
          id={`${idPrefix}-body`}
          rows={12}
          maxLength={50000}
          className="input font-mono !text-sm"
          value={form.body}
          onChange={(e) => set(setter, "body", e.target.value)}
        />
        <p className="text-xs text-muted mt-1">Plain text; a blank line starts a new paragraph.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor={`${idPrefix}-category`}>Category</label>
          <select
            id={`${idPrefix}-category`}
            className="input"
            value={form.category}
            onChange={(e) => set(setter, "category", e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor={`${idPrefix}-minutes`}>Read minutes</label>
          <input
            id={`${idPrefix}-minutes`}
            type="number"
            min={1}
            max={120}
            className="input"
            value={form.readMinutes}
            onChange={(e) => set(setter, "readMinutes", Math.max(1, Math.min(120, Number(e.target.value) || 1)))}
          />
        </div>
        <div>
          <label className="label" htmlFor={`${idPrefix}-cover`}>Cover image URL</label>
          <input
            id={`${idPrefix}-cover`}
            className="input"
            value={form.coverImage}
            placeholder="/img/… or https://…"
            onChange={(e) => set(setter, "coverImage", e.target.value)}
          />
        </div>
      </div>

      <details className="card p-4">
        <summary className="cursor-pointer text-sm font-medium">SEO (optional)</summary>
        <div className="grid gap-4 mt-4">
          <div>
            <label className="label" htmlFor={`${idPrefix}-seo-title`}>SEO title</label>
            <input
              id={`${idPrefix}-seo-title`}
              className="input"
              maxLength={200}
              value={form.seoTitle}
              onChange={(e) => set(setter, "seoTitle", e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor={`${idPrefix}-seo-desc`}>SEO description</label>
            <textarea
              id={`${idPrefix}-seo-desc`}
              rows={2}
              maxLength={400}
              className="input"
              value={form.seoDescription}
              onChange={(e) => set(setter, "seoDescription", e.target.value)}
            />
          </div>
        </div>
      </details>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={form.published}
          onChange={(e) => set(setter, "published", e.target.checked)}
        />
        Published (visible on the public journal)
      </label>
    </div>
  );

  return (
    <div>
      {error && <p className="text-danger text-sm mb-4" role="alert">{error}</p>}

      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-muted">{posts.length} post{posts.length === 1 ? "" : "s"}</p>
        <button type="button" className="btn btn-primary" onClick={() => setCreating(!creating)} aria-expanded={creating}>
          {creating ? "Cancel" : "New post"}
        </button>
      </div>

      {creating && (
        <div className="card p-5 sm:p-6 mb-8">
          <h2 className="font-display text-xl mb-4">New journal post</h2>
          {formFields(newForm, setNewForm, "new")}
          <button type="button" className="btn btn-primary mt-5" disabled={busy || !newForm.title || !newForm.slug} onClick={create}>
            {busy ? "Saving…" : "Create post"}
          </button>
        </div>
      )}

      {posts.length === 0 && !creating ? (
        <p className="text-muted">No journal posts yet. Create the first one.</p>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => (
            <li key={p.id} className="card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{p.title}</span>
                    <span className={`badge ${p.published ? "badge-success" : "badge-neutral"}`}>
                      {p.published ? "published" : "draft"}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    /journal/{p.slug} · {p.category} · updated {new Date(p.updatedAt).toLocaleDateString("en-IE")}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {editId === p.id ? (
                    <button type="button" className="btn btn-quiet" onClick={() => setEditId(null)}>Close</button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-quiet"
                      onClick={() => {
                        setEditId(p.id);
                        setEditForm(toForm(p));
                      }}
                    >
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={busy}
                    onClick={() => remove(p.id, p.title)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {editId === p.id && (
                <div className="border-t border-line mt-4 pt-4">
                  {formFields(editForm, setEditForm, "edit")}
                  <button type="button" className="btn btn-primary mt-5" disabled={busy || !editForm.title || !editForm.slug} onClick={() => save(p.id)}>
                    {busy ? "Saving…" : "Save changes"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
