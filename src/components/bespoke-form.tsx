"use client";

import { useState } from "react";

const JEWELRY_TYPES = ["Ring", "Necklace", "Bracelet", "Earrings", "Other"];
const BUDGETS = ["Under ৳25,000", "৳25,000 – ৳50,000", "৳50,000 – ৳100,000", "৳100,000 – ৳250,000", "Above ৳250,000"];
const TIMELINES = ["No rush", "Within 1 month", "1–3 months", "3–6 months"];

export function BespokeForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setBusy(true);
    setError(null);
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      jewelryType: String(formData.get("jewelryType") ?? ""),
      budget: String(formData.get("budget") ?? ""),
      timeline: String(formData.get("timeline") ?? ""),
      description: String(formData.get("description") ?? "").trim(),
      referenceUrl: String(formData.get("referenceUrl") ?? "").trim(),
    };
    if (payload.description.length < 20) {
      setError("Please describe the piece in at least 20 characters so we can respond usefully.");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/bespoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setDone(data.message || "Thank you — your request is with the atelier.");
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
        <p className="eyebrow">Request received</p>
        <p className="font-display text-2xl mt-3">{done}</p>
        <p className="text-muted text-sm mt-4 max-w-md mx-auto leading-relaxed">
          We read every request personally and reply within two working days. If your idea is time-sensitive,
          mention it on WhatsApp and quote the email you used here.
        </p>
      </div>
    );
  }

  return (
    <form action={submit} className="card p-6 sm:p-8 space-y-5" aria-label="Bespoke consultation request">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Your name</label>
          <input id="name" name="name" required maxLength={120} className="input" autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required maxLength={254} className="input" autoComplete="email" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="phone">Mobile number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="01712 345678"
            className="input"
            autoComplete="tel"
            inputMode="tel"
          />
        </div>
        <div>
          <label className="label" htmlFor="jewelryType">Piece</label>
          <select id="jewelryType" name="jewelryType" required className="input" defaultValue="Ring">
            {JEWELRY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="budget">Budget</label>
          <select id="budget" name="budget" required className="input" defaultValue={BUDGETS[2]}>
            {BUDGETS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="sm:max-w-xs">
        <label className="label" htmlFor="timeline">Timeline</label>
        <select id="timeline" name="timeline" required className="input" defaultValue={TIMELINES[0]}>
          {TIMELINES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="description">Describe the piece</label>
        <textarea
          id="description"
          name="description"
          required
          rows={6}
          maxLength={4000}
          className="input"
          placeholder="The occasion, the metal and stones you have in mind, any sketches or pieces you love — the more you tell us, the better our first reply."
        />
        <p className="text-xs text-muted mt-1.5">At least 20 characters.</p>
      </div>

      <div>
        <label className="label" htmlFor="referenceUrl">Reference link (optional)</label>
        <input
          id="referenceUrl"
          name="referenceUrl"
          type="url"
          className="input"
          placeholder="https://…"
          autoComplete="url"
        />
      </div>

      {error && (
        <p className="text-danger text-sm" role="alert">{error}</p>
      )}

      <button type="submit" disabled={busy} className="btn btn-primary w-full sm:w-auto">
        {busy ? "Sending…" : "Request a consultation"}
      </button>
      <p className="text-xs text-muted leading-relaxed">
        We use your details only to reply to this request. Nothing is charged — bespoke conversations are free.
      </p>
    </form>
  );
}
