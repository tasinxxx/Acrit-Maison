"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { track } from "@/lib/analytics";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/new-arrivals", label: "New Arrivals" },
  { href: "/best-sellers", label: "Best Sellers" },
  { href: "/collections", label: "Collections" },
  { href: "/bespoke", label: "Bespoke" },
  { href: "/journal", label: "Journal" },
];

const CATEGORIES = [
  { href: "/shop?category=rings", label: "Rings" },
  { href: "/shop?category=necklaces", label: "Necklaces" },
  { href: "/shop?category=bracelets", label: "Bracelets" },
  { href: "/shop?category=earrings", label: "Earrings" },
];

type CartPreview = {
  itemCount: number;
  subtotalCents: number;
  lines: {
    itemId: string;
    slug: string;
    name: string;
    variantName: string;
    quantity: number;
    lineTotalCents: number;
    imageUrl: string | null;
  }[];
};

function money(cents: number): string {
  return `৳${new Intl.NumberFormat("en-IN").format(cents / 100)}`;
}

export function SiteHeader({ storeName, whatsappNumber }: { storeName: string; whatsappNumber: string }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartPreview | null>(null);
  const [cartLoading, setCartLoading] = useState(false);

  // Admin pages carry their own chrome.
  if (pathname.startsWith("/admin")) return null;

  async function loadCart() {
    setCartLoading(true);
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      if (res.ok) setCart(data.cart);
    } catch {
      // ignore; header shows fallback
    } finally {
      setCartLoading(false);
    }
  }

  function openCart() {
    setCartOpen(true);
    void loadCart();
  }

  // Close overlays on navigation.
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setCartOpen(false);
  }, [pathname]);

  // Lock body scroll while an overlay is open.
  useEffect(() => {
    const open = menuOpen || searchOpen || cartOpen;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, searchOpen, cartOpen]);

  const drawerEase = reduce ? { duration: 0.15 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-ink text-bg text-center text-[11px] tracking-[0.18em] uppercase py-2 px-4">
        Complimentary insured delivery inside Dhaka on orders over ৳20,000
      </div>

      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-sm border-b border-line">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Left: mobile menu button + desktop nav */}
            <div className="flex items-center gap-6 min-w-0">
              <button
                type="button"
                className="lg:hidden h-11 w-11 -ml-2 flex items-center justify-center text-ink"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  {menuOpen ? (
                    <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" />
                  ) : (
                    <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="1.5" />
                  )}
                </svg>
              </button>
              <nav className="hidden lg:flex items-center gap-7 text-[13px] tracking-[0.08em] uppercase" aria-label="Primary">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`link-quiet whitespace-nowrap transition-colors ${
                      pathname === item.href ? "text-accent-deep" : "text-ink hover:text-accent-deep"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Center: wordmark */}
            <Link
              href="/"
              className="font-display text-xl sm:text-2xl tracking-[0.08em] whitespace-nowrap absolute left-1/2 -translate-x-1/2"
              aria-label={`${storeName} home`}
            >
              {storeName.toUpperCase()}
            </Link>

            {/* Right: search, account, cart */}
            <div className="flex items-center gap-1 sm:gap-3">
              <button
                type="button"
                className="h-11 w-11 flex items-center justify-center text-ink hover:text-accent-deep transition-colors"
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
              >
                <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
              <Link
                href="/account"
                className="hidden sm:block h-11 w-11 flex items-center justify-center text-ink hover:text-accent-deep transition-colors"
                aria-label="Account"
              >
                <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <circle cx="10" cy="6.5" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M3 17c1.5-3.5 4-5 7-5s5.5 1.5 7 5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </Link>
              <button
                type="button"
                className="relative h-11 w-11 flex items-center justify-center text-ink hover:text-accent-deep transition-colors"
                aria-label={`Cart${cart?.itemCount ? `, ${cart.itemCount} items` : ""}`}
                onClick={openCart}
              >
                <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M4 6h12l-1 11H5L4 6z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M7 6V5a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                {cart && cart.itemCount > 0 && (
                  <span
                    className="absolute top-0.5 right-0.5 bg-accent text-white text-[10px] font-semibold min-w-[16px] h-4 flex items-center justify-center px-0.5 rounded-full"
                    aria-hidden="true"
                  >
                    {cart.itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-ink/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-bg flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              initial={reduce ? { opacity: 0 } : { x: "-100%" }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: "-100%" }}
              transition={drawerEase}
            >
              <div className="flex items-center justify-between px-5 h-16 border-b border-line">
                <span className="font-display text-lg tracking-[0.08em]">{storeName.toUpperCase()}</span>
                <button type="button" className="p-2 -mr-2" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
                  <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto slim-scroll px-5 py-6" aria-label="Mobile">
                <ul className="space-y-1">
                  {NAV.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block py-3 font-display text-2xl border-b border-line"
                        onClick={() => setMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="eyebrow mt-8 mb-3">Categories</p>
                <ul className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((c) => (
                    <li key={c.href}>
                      <Link
                        href={c.href}
                        className="block card px-4 py-3 text-sm card-hover"
                        onClick={() => setMenuOpen(false)}
                      >
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <ul className="mt-8 space-y-3 text-sm text-muted">
                  <li>
                    <Link href="/account" className="hover:text-ink" onClick={() => setMenuOpen(false)}>
                      My account
                    </Link>
                  </li>
                  <li>
                    <Link href="/care-guide" className="hover:text-ink" onClick={() => setMenuOpen(false)}>
                      Care guide
                    </Link>
                  </li>
                  <li>
                    <a
                      href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-ink"
                    >
                      WhatsApp us
                    </a>
                  </li>
                </ul>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>

      {/* Cart drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-ink/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-bg flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-label="Cart"
              initial={reduce ? { opacity: 0 } : { x: "100%" }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: "100%" }}
              transition={drawerEase}
            >
              <div className="flex items-center justify-between px-5 h-16 border-b border-line">
                <span className="eyebrow">Your cart</span>
                <button type="button" className="p-2 -mr-2" aria-label="Close cart" onClick={() => setCartOpen(false)}>
                  <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto slim-scroll px-5 py-5">
                {cartLoading ? (
                  <div className="space-y-4" aria-label="Loading cart">
                    {[0, 1].map((i) => (
                      <div key={i} className="flex gap-4 animate-pulse">
                        <div className="w-16 h-16 bg-bg-deep" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-3 bg-bg-deep w-3/4" />
                          <div className="h-3 bg-bg-deep w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !cart || cart.lines.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-muted text-sm">Your cart is empty.</p>
                    <Link href="/shop" className="btn btn-outline mt-5" onClick={() => setCartOpen(false)}>
                      Discover pieces
                    </Link>
                  </div>
                ) : (
                  <ul className="space-y-5">
                    {cart.lines.map((line) => (
                      <li key={line.itemId} className="flex gap-4">
                        <Link href={`/products/${line.slug}`} className="w-16 h-16 bg-bg-deep overflow-hidden shrink-0">
                          {line.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={line.imageUrl} alt={line.name} className="w-full h-full object-cover" />
                          ) : null}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{line.name}</p>
                          <p className="text-xs text-muted">{line.variantName}</p>
                          <p className="text-xs text-muted">Qty {line.quantity}</p>
                        </div>
                        <span className="text-sm whitespace-nowrap">{money(line.lineTotalCents)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {cart && cart.lines.length > 0 && (
                <div className="border-t border-line px-5 py-4">
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-muted">Subtotal</span>
                    <span className="font-medium">{money(cart.subtotalCents)}</span>
                  </div>
                  <Link href="/checkout" className="btn btn-primary w-full" onClick={() => setCartOpen(false)}>
                    Checkout
                  </Link>
                  <Link
                    href="/cart"
                    className="btn btn-quiet w-full mt-2"
                    onClick={() => setCartOpen(false)}
                  >
                    View cart
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ slug: string; name: string; priceCents: number; imageUrl: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const input = document.querySelector<HTMLInputElement>("#header-search-input");
    input?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (res.ok) setResults(data.products ?? []);
      } catch {
        // keep previous results
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 bg-ink/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-x-0 top-0 z-50 bg-bg border-b border-line max-h-[85vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        initial={reduceSafe() ? { opacity: 0 } : { y: "-100%" }}
        animate={reduceSafe() ? { opacity: 1 } : { y: 0 }}
        exit={reduceSafe() ? { opacity: 0 } : { y: "-100%" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-5">
          <div className="flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-muted shrink-0" aria-hidden="true">
              <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <input
              id="header-search-input"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.trim().length >= 2) track("search", { query: e.target.value.trim().slice(0, 80) });
              }}
              placeholder="Search rings, necklaces, gold…"
              className="flex-1 bg-transparent border-0 focus:outline-none text-lg font-display py-2"
              aria-label="Search products"
            />
            <button type="button" className="p-2 text-muted hover:text-ink" aria-label="Close search" onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
          <div className="rule my-3" />
          <div className="overflow-y-auto slim-scroll pb-6">
            {loading ? (
              <p className="text-sm text-muted py-4">Searching…</p>
            ) : query.trim().length >= 2 && searched && results.length === 0 ? (
              <p className="text-sm text-muted py-4">
                Nothing found for “{query.trim()}”. Try “ring”, “gold” or “necklace”.
              </p>
            ) : results.length > 0 ? (
              <ul className="divide-y divide-line">
                {results.map((r) => (
                  <li key={r.slug}>
                    <Link href={`/products/${r.slug}`} className="flex items-center gap-4 py-3 group" onClick={onClose}>
                      <span className="w-12 h-12 bg-bg-deep overflow-hidden shrink-0">
                        {r.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : null}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium truncate group-hover:text-accent-deep">{r.name}</span>
                      </span>
                      <span className="text-sm whitespace-nowrap">{money(r.priceCents)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-4">
                <p className="eyebrow mb-3">Popular searches</p>
                <div className="flex flex-wrap gap-2">
                  {["Ring", "Necklace", "Gold", "Solitaire", "Bangle"].map((term) => (
                    <button
                      key={term}
                      type="button"
                      className="badge badge-neutral hover:border-accent transition-colors"
                      onClick={() => setQuery(term)}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

function reduceSafe(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
