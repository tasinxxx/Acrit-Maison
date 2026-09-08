"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setBusy(true);
    setError(null);
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");
    if (password !== confirm) {
      setError("Passwords do not match.");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not reset the password.");
      } else {
        setDone(data.message || "Your password has been updated.");
        setTimeout(() => router.push("/login"), 1800);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card p-6">
        <p className="text-success font-medium" role="status">{done}</p>
        <p className="text-muted text-sm mt-2">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <form action={submit} className="card p-6 space-y-4">
      <div>
        <label className="label" htmlFor="password">New password</label>
        <input id="password" name="password" type="password" required minLength={8} className="input" autoComplete="new-password" />
        <p className="text-xs text-muted mt-1">At least 8 characters.</p>
      </div>
      <div>
        <label className="label" htmlFor="confirm">Confirm new password</label>
        <input id="confirm" name="confirm" type="password" required minLength={8} className="input" autoComplete="new-password" />
      </div>
      {error && <p className="text-danger text-sm" role="alert">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn-primary w-full">
        {busy ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}
