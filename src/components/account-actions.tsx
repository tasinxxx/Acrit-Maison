"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AccountActions() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={logout} disabled={busy} className="btn btn-outline">
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
