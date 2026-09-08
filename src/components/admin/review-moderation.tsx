"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Review = {
  id: string;
  productName: string;
  productSlug: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string;
  body: string;
  status: string;
  createdAt: string;
};

export function ReviewModeration({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function moderate(id: string, status: "APPROVED" | "REJECTED") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Action failed.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  if (reviews.length === 0) return <p className="text-muted">No reviews submitted yet.</p>;

  return (
    <div>
      {error && <p className="text-danger text-sm mb-4" role="alert">{error}</p>}
      <ul className="space-y-3">
        {reviews.map((r) => (
          <li key={r.id} className="card p-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{r.title}</span>
                  <span className="text-sm">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  <span
                    className={`badge ${
                      r.status === "APPROVED"
                        ? "bg-green-100 text-green-900"
                        : r.status === "REJECTED"
                          ? "bg-red-100 text-red-900"
                          : "bg-yellow-100 text-yellow-900"
                    }`}
                  >
                    {r.status.toLowerCase()}
                  </span>
                </div>
                <p className="text-sm text-muted mt-1">{r.body}</p>
                <p className="text-xs text-muted mt-2">
                  {r.customerName} ({r.customerEmail}) on{" "}
                  <a href={`/products/${r.productSlug}`} className="underline">{r.productName}</a> ·{" "}
                  {new Date(r.createdAt).toLocaleDateString("en-IE")}
                </p>
              </div>
              {r.status === "PENDING" && (
                <div className="flex gap-2 shrink-0">
                  <button type="button" className="btn btn-outline" disabled={busy} onClick={() => moderate(r.id, "APPROVED")}>
                    Approve
                  </button>
                  <button type="button" className="btn btn-danger" disabled={busy} onClick={() => moderate(r.id, "REJECTED")}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
