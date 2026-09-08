"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { formatMoney } from "@/lib/settings";
import { track } from "@/lib/analytics";
import type { PricedLine } from "@/lib/pricing";

export function CartLines({ lines }: { lines: PricedLine[] }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateItem(itemId: string, quantity: number) {
    setBusyId(itemId);
    setError(null);
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not update the cart.");
      } else {
        if (quantity === 0) track("remove_from_cart", { itemId });
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeItem(itemId: string) {
    setBusyId(itemId);
    setError(null);
    try {
      const res = await fetch(`/api/cart?itemId=${encodeURIComponent(itemId)}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Could not remove the item.");
      } else {
        track("remove_from_cart", { itemId });
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {error && (
        <p className="text-danger text-sm mb-4" role="alert">
          {error}
        </p>
      )}
      <ul className="divide-y divide-line border-y border-line">
        <AnimatePresence initial={false}>
          {lines.map((line) => {
            const unavailable = !line.active;
            const overStock = line.active && !line.available;
            const madeToOrderLine = line.madeToOrder && line.quantity > line.stock;
            return (
              <motion.li
                key={line.itemId}
                layout={!reduce}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="py-6 flex gap-4 sm:gap-6"
              >
                <Link href={`/products/${line.slug}`} className="shrink-0 w-20 sm:w-28">
                  <div className="aspect-[4/5] bg-bg-deep overflow-hidden">
                    {line.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={line.imageUrl} alt={line.name} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/products/${line.slug}`} className="font-display text-lg hover:text-accent-deep">
                        {line.name}
                      </Link>
                      <p className="text-sm text-muted truncate">{line.variantName}</p>
                      <p className="text-xs text-muted mt-0.5">{formatMoney(line.unitPriceCents)} each</p>
                    </div>
                    <span className="font-medium whitespace-nowrap">{formatMoney(line.lineTotalCents)}</span>
                  </div>

                  {unavailable ? (
                    <p className="text-danger text-sm mt-2">No longer available — please remove this item.</p>
                  ) : overStock ? (
                    <p className="text-danger text-sm mt-2">
                      Only {line.stock} in stock — reduce the quantity to continue.
                    </p>
                  ) : madeToOrderLine ? (
                    <p className="text-accent-deep text-sm mt-2">Made to order — ships in 2–3 weeks.</p>
                  ) : line.allowBackorder && line.quantity > line.stock ? (
                    <p className="text-muted text-sm mt-2">Backorder — ships in 4–6 weeks.</p>
                  ) : (
                    <p className="text-success text-xs mt-2">In stock</p>
                  )}

                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center border border-line-strong">
                      <button
                        type="button"
                        className="w-9 h-9 flex items-center justify-center hover:bg-bg-deep transition-colors disabled:opacity-40"
                        onClick={() => updateItem(line.itemId, line.quantity - 1)}
                        disabled={busyId === line.itemId || line.quantity <= 1}
                        aria-label={`Decrease quantity of ${line.name}`}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm" aria-label={`Quantity ${line.quantity}`}>
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        className="w-9 h-9 flex items-center justify-center hover:bg-bg-deep transition-colors disabled:opacity-40"
                        onClick={() => updateItem(line.itemId, line.quantity + 1)}
                        disabled={busyId === line.itemId || (!line.allowBackorder && !line.madeToOrder && line.quantity >= Math.max(line.stock, 1)) || line.quantity >= 20}
                        aria-label={`Increase quantity of ${line.name}`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(line.itemId)}
                      disabled={busyId === line.itemId}
                      className="text-xs tracking-[0.08em] uppercase text-muted hover:text-danger transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
