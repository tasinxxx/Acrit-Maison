"use client";

import { useState } from "react";

export function ReviewForm({ productId, productName }: { productId: string; productName: string }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, title, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ kind: "error", text: data.error || "Could not submit review." });
      } else {
        setStatus({ kind: "ok", text: data.message || "Review submitted." });
        setTitle("");
        setBody("");
      }
    } catch {
      setStatus({ kind: "error", text: "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-4">
      <p className="font-medium mb-3">{productName}</p>
      <div className="flex gap-4 flex-wrap mb-3">
        <label className="text-sm">
          Rating{" "}
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="input w-auto ml-1">
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} ★{" ".repeat(0)}{"★".repeat(n)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Review title"
        required
        minLength={3}
        maxLength={120}
        className="input mb-2"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What did you think? (minimum 10 characters)"
        required
        minLength={10}
        maxLength={2000}
        rows={3}
        className="input"
      />
      {status && (
        <p className={`text-sm mt-2 ${status.kind === "error" ? "text-danger" : "text-success"}`} role="status">
          {status.text}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn btn-primary mt-3">
        {busy ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
