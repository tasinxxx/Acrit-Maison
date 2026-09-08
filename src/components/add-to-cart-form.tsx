"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { formatMoney } from "@/lib/settings";
import { track } from "@/lib/analytics";

type Variant = {
  id: string;
  optionName: string;
  sku: string;
  unitPriceCents: number;
  stock: number;
  active: boolean;
};

type Props = {
  variants: Variant[];
  basePriceCents: number;
  compareAtCents?: number | null;
  currency: string;
  allowBackorder: boolean;
  madeToOrder: boolean;
  productName: string;
  slug: string;
};

export function AddToCartForm({
  variants,
  basePriceCents,
  compareAtCents,
  currency,
  allowBackorder,
  madeToOrder,
  productName,
  slug,
}: Props) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const activeVariants = useMemo(() => variants.filter((v) => v.active), [variants]);
  const [selectedId, setSelectedId] = useState<string | null>(activeVariants[0]?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  const selected = variants.find((v) => v.id === selectedId) ?? null;
  const unitPrice = selected?.unitPriceCents ?? basePriceCents;
  const maxQty = selected ? Math.max(1, Math.min(20, Math.max(selected.stock, madeToOrder ? 20 : 1))) : 1;
  const outOfStock = selected ? selected.stock === 0 && !allowBackorder && !madeToOrder : false;
  const lowStock = selected ? selected.stock > 0 && selected.stock <= 3 && !madeToOrder : false;
  const madeToOrderMode = selected ? selected.stock === 0 && madeToOrder : madeToOrder;

  async function addToCart() {
    if (!selected) return;
    setAdding(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: selected.id, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ kind: "error", text: data.error || "Could not add to cart." });
      } else {
        track("add_to_cart", { product: productName, variant: selected.optionName, quantity, value: selected.unitPriceCents * quantity });
        setMessage({ kind: "success", text: "Added to your cart." });
        router.refresh();
        // Open the cart drawer on the next tick after refresh.
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("am:open-cart"));
        }, 150);
      }
    } catch {
      setMessage({ kind: "error", text: "Network error. Please try again." });
    } finally {
      setAdding(false);
    }
  }

  if (activeVariants.length === 0) {
    return (
      <div className="mt-6">
        <p className="text-danger text-sm font-medium">This piece is currently unavailable.</p>
        <p className="text-muted text-sm mt-1">Check back soon, or message us on WhatsApp for a restock date.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={unitPrice}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-baseline gap-3"
          aria-live="polite"
        >
          <span className="font-display text-3xl">{formatMoney(unitPrice, currency)}</span>
          {compareAtCents && compareAtCents > basePriceCents && (
            <s className="text-muted">{formatMoney(compareAtCents, currency)}</s>
          )}
        </motion.div>
      </AnimatePresence>

      <fieldset className="mt-6">
        <legend className="label">Select option</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Variant">
          {activeVariants.map((v) => {
            const isSelected = v.id === selectedId;
            const disabled = v.stock === 0 && !allowBackorder && !madeToOrder;
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={disabled}
                onClick={() => {
                  setSelectedId(v.id);
                  setQuantity(1);
                  setMessage(null);
                }}
                className={`relative px-4 py-2.5 text-sm border transition-colors min-h-[44px] ${
                  isSelected
                    ? "border-ink bg-ink text-bg"
                    : disabled
                      ? "border-line text-muted/50 line-through cursor-not-allowed"
                      : "border-line-strong text-ink hover:border-accent"
                }`}
              >
                {v.optionName}
                {v.unitPriceCents !== basePriceCents && (
                  <span className={`ml-1.5 text-xs ${isSelected ? "text-bg/70" : "text-muted"}`}>
                    {v.unitPriceCents > basePriceCents ? "+" : "−"}
                    {formatMoney(Math.abs(v.unitPriceCents - basePriceCents), currency)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 flex items-center gap-4">
        <div className="flex items-center border border-line-strong">
          <button
            type="button"
            className="w-11 h-11 flex items-center justify-center text-lg hover:bg-bg-deep transition-colors disabled:opacity-40"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1 || outOfStock}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-medium" aria-live="polite" aria-label={`Quantity ${quantity}`}>
            {quantity}
          </span>
          <button
            type="button"
            className="w-11 h-11 flex items-center justify-center text-lg hover:bg-bg-deep transition-colors disabled:opacity-40"
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            disabled={quantity >= maxQty || outOfStock}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        {lowStock && <span className="text-xs text-danger font-medium">Only {selected?.stock} left</span>}
        {madeToOrderMode && (
          <span className="text-xs text-accent-deep font-medium">Made to order · ships in 2–3 weeks</span>
        )}
        {selected && selected.stock === 0 && allowBackorder && !madeToOrder && (
          <span className="text-xs text-muted">Backorder — ships in 4–6 weeks</span>
        )}
      </div>

      <motion.button
        type="button"
        onClick={addToCart}
        disabled={adding || outOfStock}
        whileTap={reduce ? undefined : { scale: 0.985 }}
        className="btn btn-primary w-full mt-6"
      >
        {outOfStock ? "Sold out" : madeToOrderMode ? "Commission this piece" : adding ? "Adding…" : "Add to cart"}
      </motion.button>

      <AnimatePresence>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-3 text-sm ${message.kind === "error" ? "text-danger" : "text-success"}`}
            role="status"
          >
            {message.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
