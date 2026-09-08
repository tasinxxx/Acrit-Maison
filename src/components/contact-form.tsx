"use client";

import { useState } from "react";

export function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(formData.get("name") ?? "").trim(),
          email: String(formData.get("email") ?? "").trim(),
          orderNumber: String(formData.get("orderNumber") ?? "").trim(),
          message: String(formData.get("message") ?? "").trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setDone(data.message || "Message received — we will reply soon.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card p-8 text-center" role="status">
        <p className="eyebrow">Message received</p>
        <p className="font-display text-2xl mt-3">{done}</p>
        <p className="text-muted text-sm mt-3">
          We usually reply within one working day, Sunday to Thursday.
        </p>
      </div>
    );
  }

  return (
    <form action={submit} className="card p-6 sm:p-8 space-y-5" aria-label="Contact form">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c-name">Your name</label>
          <input id="c-name" name="name" required maxLength={120} className="input" autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="c-email">Email</label>
          <input id="c-email" name="email" type="email" required maxLength={254} className="input" autoComplete="email" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="c-order">Order number (optional)</label>
        <input id="c-order" name="orderNumber" className="input" placeholder="AM-26-000123" autoComplete="off" />
      </div>
      <div>
        <label className="label" htmlFor="c-message">Message</label>
        <textarea
          id="c-message"
          name="message"
          required
          rows={6}
          maxLength={2000}
          className="input"
          placeholder="Sizing help, care questions, an order query — anything at all."
        />
        <p className="text-xs text-muted mt-1.5">Between 10 and 2,000 characters.</p>
      </div>
      {error && <p className="text-danger text-sm" role="alert">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn-primary w-full sm:w-auto">
        {busy ? "Sending…" : "Send message"}
      </button>
      <p className="text-xs text-muted leading-relaxed">
        We use your details only to answer this message. For order questions, including the order number helps us
        reply faster.
      </p>
    </form>
  );
}
