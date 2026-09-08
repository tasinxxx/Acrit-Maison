"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { track } from "@/lib/analytics";

type Props = {
  productId: string;
  slug?: string;
  signedIn: boolean;
  compact?: boolean;
  initialSaved?: boolean;
};

export function WishlistButton({ productId, slug, signedIn, compact = false, initialSaved = false }: Props) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  // Sync initial saved state (used on PDP where we know it server-side).
  useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  // On cards, check saved state once.
  useEffect(() => {
    if (!signedIn || initialSaved) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`);
        const data = await res.json();
        if (!cancelled && res.ok) setSaved(Boolean(data.saved));
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, signedIn, initialSaved]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(slug ? `/products/${slug}` : "/wishlist")}`);
      return;
    }
    if (busy) return;
    setBusy(true);
    const next = !saved;
    setSaved(next); // optimistic
    try {
      const res = next
        ? await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          })
        : await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      track(next ? "wishlist_add" : "wishlist_remove", { productId });
    } catch {
      setSaved(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.button
      type="button"
      onClick={toggle}
      disabled={busy}
      whileTap={reduce ? undefined : { scale: 0.82 }}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      className={
        compact
          ? `relative flex items-center justify-center w-9 h-9 bg-surface/90 border border-line hover:border-accent transition-colors after:absolute after:-inset-1.5 after:content-[''] ${
              saved ? "text-accent-deep" : "text-ink"
            }`
          : `btn btn-quiet ${saved ? "!border-accent !text-accent-deep" : ""}`
      }
    >
      <svg
        width={compact ? 15 : 16}
        height={compact ? 15 : 16}
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M12 21s-7.5-4.8-10-9.5C.6 8 2.5 4.5 6 4.5c2.3 0 4.4 1.4 6 3.6 1.6-2.2 3.7-3.6 6-3.6 3.5 0 5.4 3.5 4 7-2.5 4.7-10 9.5-10 9.5z" />
      </svg>
      {!compact && <span>{saved ? "Saved" : "Add to wishlist"}</span>}
      <AnimatePresence>
        {saved && !reduce && (
          <motion.span
            key="ring"
            className="absolute inset-0 rounded-full border border-accent"
            initial={{ opacity: 0.7, scale: 0.9 }}
            animate={{ opacity: 0, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}
