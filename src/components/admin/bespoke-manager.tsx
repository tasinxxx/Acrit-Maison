"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type BespokeRequest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  jewelryType: string;
  budget: string;
  timeline: string;
  description: string;
  referenceUrl: string | null;
  status: string;
  adminNotes: string;
  createdAt: string;
};

const STATUSES = ["NEW", "IN_REVIEW", "QUOTED", "ACCEPTED", "DECLINED", "CLOSED"] as const;

export function BespokeManager({
  requests,
  statusStyles,
}: {
  requests: BespokeRequest[];
  statusStyles: Record<string, string>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  async function update(id: string, status: string, adminNotes?: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bespoke/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...(adminNotes !== undefined ? { adminNotes } : {}) }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Update failed.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  if (requests.length === 0) {
    return <p className="text-muted">No bespoke requests yet.</p>;
  }

  return (
    <div>
      {error && <p className="text-danger text-sm mb-4" role="alert">{error}</p>}
      <ul className="space-y-3">
        {requests.map((r) => {
          const open = openId === r.id;
          return (
            <li key={r.id} className="card p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{r.name}</span>
                    <span className={`badge ${statusStyles[r.status] ?? "badge-neutral"}`}>
                      {r.status.toLowerCase().replace("_", " ")}
                    </span>
                    <span className="text-xs text-muted">{r.jewelryType} · {r.budget}</span>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {r.email} · {r.phone} · {r.timeline} ·{" "}
                    {new Date(r.createdAt).toLocaleDateString("en-IE")}
                  </p>
                  <p className={`text-sm mt-2 ${open ? "" : "line-clamp-2"}`}>{r.description}</p>
                  {r.referenceUrl && (
                    <a
                      href={r.referenceUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-xs underline mt-1 inline-block hover:text-accent"
                    >
                      Reference link
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-quiet shrink-0 !py-2 !px-4 text-xs"
                  onClick={() => setOpenId(open ? null : r.id)}
                  aria-expanded={open}
                >
                  {open ? "Close" : "Manage"}
                </button>
              </div>

              {open && (
                <div className="border-t border-line mt-4 pt-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor={`status-${r.id}`}>Status</label>
                      <select
                        id={`status-${r.id}`}
                        className="input"
                        defaultValue={r.status}
                        onChange={(e) => update(r.id, e.target.value)}
                        disabled={busy}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s.replace("_", " ")}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label" htmlFor={`notes-${r.id}`}>Internal notes</label>
                      <textarea
                        id={`notes-${r.id}`}
                        rows={3}
                        maxLength={2000}
                        className="input"
                        defaultValue={r.adminNotes}
                        onBlur={(e) => {
                          if (e.target.value !== r.adminNotes) update(r.id, r.status, e.target.value);
                        }}
                        disabled={busy}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted">
                    Reply to {r.name} directly at{" "}
                    <a href={`mailto:${r.email}`} className="underline">{r.email}</a>. Notes are internal only.
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
