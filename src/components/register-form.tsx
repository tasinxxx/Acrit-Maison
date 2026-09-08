"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        setBusy(false);
        return;
      }
      router.push("/account");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form action={submit} className="card p-6 space-y-4">
      <div>
        <label className="label" htmlFor="name">Name</label>
        <input id="name" name="name" required className="input" autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="input" autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required minLength={8} className="input" autoComplete="new-password" />
        <p className="text-xs text-muted mt-1">At least 8 characters.</p>
      </div>
      <div>
        <label className="label" htmlFor="confirm">Confirm password</label>
        <input id="confirm" name="confirm" type="password" required minLength={8} className="input" autoComplete="new-password" />
      </div>
      {error && (
        <p className="text-danger text-sm" role="alert">{error}</p>
      )}
      <button type="submit" disabled={busy} className="btn btn-primary w-full">
        {busy ? "Creating account…" : "Create account"}
      </button>
      <p className="text-sm text-muted text-center">
        Already have an account?{" "}
        <Link href="/login" className="underline hover:text-ink">
          Sign in
        </Link>
      </p>
    </form>
  );
}
