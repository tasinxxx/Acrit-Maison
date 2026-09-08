"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TrackingLookup() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function submit(formData: FormData) {
    setBusy(true);
    setError(null);
    const number = String(formData.get("orderNumber") ?? "").trim().toUpperCase();
    const token = String(formData.get("token") ?? "").trim();
    if (!/^AM-\d{2}-\d{6}$/.test(number) || token.length < 10) {
      setError("Enter the order number (AM-YY-XXXXXX) and the access token from your confirmation.");
      setBusy(false);
      return;
    }
    router.push(`/order/${encodeURIComponent(number)}?token=${encodeURIComponent(token)}`);
  }

  return (
    <form action={submit} className="card p-6 space-y-4" aria-label="Order lookup">
      <div>
        <label className="label" htmlFor="orderNumber">Order number</label>
        <input
          id="orderNumber"
          name="orderNumber"
          required
          className="input font-mono"
          placeholder="AM-26-000123"
          autoComplete="off"
        />
      </div>
      <div>
        <label className="label" htmlFor="token">Access token</label>
        <input
          id="token"
          name="token"
          required
          className="input font-mono"
          placeholder="From your confirmation email"
          autoComplete="off"
        />
        <p className="text-xs text-muted mt-1.5">
          The token is the part after “token=” in your confirmation link.
        </p>
      </div>
      {error && <p className="text-danger text-sm" role="alert">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn-primary w-full">
        {busy ? "Looking…" : "Find my order"}
      </button>
    </form>
  );
}
