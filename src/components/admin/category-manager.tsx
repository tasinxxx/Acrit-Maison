"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  position: number;
  productCount: number;
};

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function api(path: string, method: string, body?: unknown) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Request failed.");
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

  async function create(formData: FormData) {
    const ok = await api("/api/admin/categories", "POST", {
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      description: String(formData.get("description") ?? ""),
      position: Math.round(Number(formData.get("position") ?? 0)),
    });
    if (ok) (document.getElementById("cat-form") as HTMLFormElement)?.reset();
  }

  return (
    <div>
      {error && <p className="text-danger text-sm mb-4" role="alert">{error}</p>}

      <form id="cat-form" action={create} className="card p-6 mb-8 grid gap-4 sm:grid-cols-4">
        <div>
          <label className="label" htmlFor="c-name">Name</label>
          <input id="c-name" name="name" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="c-slug">Slug</label>
          <input id="c-slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="c-desc">Description</label>
          <input id="c-desc" name="description" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="c-pos">Position</label>
          <input id="c-pos" name="position" type="number" min={0} defaultValue={categories.length + 1} className="input" />
        </div>
        <div className="sm:col-span-3 flex items-end">
          <button type="submit" disabled={busy} className="btn btn-primary">
            {busy ? "Creating…" : "Create category"}
          </button>
        </div>
      </form>

      <ul className="card divide-y divide-line text-sm">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 p-4">
            <div>
              <span className="font-medium">{c.name}</span>
              <span className="text-muted"> · /collections/{c.slug} · {c.productCount} product{c.productCount === 1 ? "" : "s"}</span>
              {c.description && <p className="text-xs text-muted">{c.description}</p>}
            </div>
            <span className="text-xs text-muted">#{c.position}</span>
          </li>
        ))}
        {categories.length === 0 && <li className="p-4 text-muted">No categories yet.</li>}
      </ul>
    </div>
  );
}
