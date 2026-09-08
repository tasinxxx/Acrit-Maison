"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(formData: FormData) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign in failed.");
        setBusy(false);
        return;
      }
      router.push(data.role === "ADMIN" ? "/admin" : "/account");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form action={submit} className="card p-6 space-y-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="input" autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required className="input" autoComplete="current-password" />
      </div>
      {error && (
        <p className="text-danger text-sm" role="alert">{error}</p>
      )}
      <button type="submit" disabled={busy} className="btn btn-primary w-full">
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-sm text-muted text-center">
        New here?{" "}
        <Link href="/register" className="underline hover:text-ink">
          Create an account
        </Link>
      </p>
      <p className="text-xs text-muted text-center">
        <Link href="/forgot-password" className="underline hover:text-ink">
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}
