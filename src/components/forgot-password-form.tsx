"use client";

import { useState } from "react";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(formData.get("email") ?? "") }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setDone(data.message || "Check your email for the reset link.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card p-6 text-sm">
        <p className="text-success font-medium" role="status">{done}</p>
        <p className="text-muted mt-2">
          No email provider is configured on this deployment yet, so the link is written to the server log by the
          mail integration point.
        </p>
        <Link href="/login" className="btn btn-quiet mt-5 w-full">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={submit} className="card p-6 space-y-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="input" autoComplete="email" />
      </div>
      {error && <p className="text-danger text-sm" role="alert">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn-primary w-full">
        {busy ? "Sending…" : "Send reset link"}
      </button>
      <p className="text-sm text-muted text-center">
        Remembered it?{" "}
        <Link href="/login" className="underline hover:text-ink">
          Sign in
        </Link>
      </p>
    </form>
  );
}
