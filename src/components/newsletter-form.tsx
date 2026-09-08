"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

export function NewsletterForm({ source = "footer" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState("error");
        setMessage(data.error || "Could not subscribe. Please try again.");
        return;
      }
      setState("done");
      setMessage(data.message || "You are on the list.");
    } catch {
      setState("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (state === "done") {
    return (
      <p className="text-sm text-accent border border-accent/40 px-4 py-3" role="status">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
      <label htmlFor={`newsletter-${source}`} className="sr-only">
        Email address
      </label>
      <input
        id={`newsletter-${source}`}
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className="input flex-1 !bg-white/5 !border-white/20 !text-bg placeholder:!text-bg/40"
        autoComplete="email"
      />
      <button type="submit" disabled={state === "loading"} className="btn btn-gold shrink-0">
        {state === "loading" ? "Joining…" : "Join"}
      </button>
      {state === "error" && (
        <p className="text-xs text-red-300 sm:hidden" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
