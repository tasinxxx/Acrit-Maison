"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { WishlistButton } from "@/components/wishlist-button";
import { formatMoney } from "@/lib/settings";

type Props = {
  slug: string;
  name: string;
  priceCents: number;
  compareAtCents?: number | null;
  fromPriceCents?: number;
  imageUrl?: string | null;
  hoverImageUrl?: string | null;
  altText?: string;
  inStock?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  madeToOrder?: boolean;
  signedIn?: boolean;
};

export function ProductCard({
  slug,
  name,
  priceCents,
  compareAtCents,
  fromPriceCents,
  imageUrl,
  hoverImageUrl,
  altText,
  inStock = true,
  isNew = false,
  isBestSeller = false,
  madeToOrder = false,
  signedIn = false,
}: Props) {
  const reduce = useReducedMotion();
  const showFrom = fromPriceCents !== undefined && fromPriceCents !== priceCents;
  const displayPrice = showFrom ? Math.min(fromPriceCents, priceCents) : priceCents;
  const onSale = Boolean(compareAtCents && compareAtCents > priceCents);

  return (
    <motion.div
      className="group relative"
      whileHover={reduce ? undefined : { y: -4 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative overflow-hidden bg-bg-deep aspect-[4/5]">
        <Link href={`/products/${slug}`} aria-label={altText || name} className="block h-full">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={altText || name}
              loading="lazy"
              className={`w-full h-full object-cover transition-opacity duration-500 ${
                hoverImageUrl && hoverImageUrl !== imageUrl ? "group-hover:opacity-0" : ""
              }`}
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-muted text-sm">No image</span>
          )}
          {hoverImageUrl && hoverImageUrl !== imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hoverImageUrl}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
          )}
        </Link>

        {/* Flags */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          {onSale && <span className="badge badge-danger">Sale</span>}
          {isNew && <span className="badge badge-gold">New</span>}
          {isBestSeller && !isNew && <span className="badge badge-dark">Best seller</span>}
          {!inStock && !madeToOrder && <span className="badge badge-neutral">Sold out</span>}
          {madeToOrder && inStock === false && <span className="badge badge-gold">Made to order</span>}
        </div>

        {/* Wishlist heart */}
        <div className="absolute top-2.5 right-2.5">
          <WishlistButton productId={slug} slug={slug} signedIn={signedIn} compact />
        </div>

        {/* Quick view / view piece bar */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out hidden md:block">
          <Link
            href={`/products/${slug}`}
            className="block bg-ink/90 text-bg text-center text-[11px] tracking-[0.18em] uppercase py-3 hover:bg-accent-deep transition-colors"
          >
            View piece
          </Link>
        </div>
      </div>

      <div className="pt-4 pb-2 text-center md:text-left">
        <h3 className="font-display text-lg leading-snug">
          <Link href={`/products/${slug}`} className="hover:text-accent-deep transition-colors">
            {name}
          </Link>
        </h3>
        <div className="mt-1 flex items-baseline justify-center md:justify-start gap-2 text-sm">
          {showFrom && <span className="text-muted text-xs">from</span>}
          <span className="font-medium">{formatMoney(displayPrice)}</span>
          {onSale && compareAtCents && <s className="text-muted text-xs">{formatMoney(compareAtCents)}</s>}
        </div>
        {!inStock && !madeToOrder && (
          <p className="mt-1 text-xs text-muted">Join the waitlist via WhatsApp</p>
        )}
      </div>
    </motion.div>
  );
}
