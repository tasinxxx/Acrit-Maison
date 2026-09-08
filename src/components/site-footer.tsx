import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";

const SHOP_LINKS = [
  { href: "/shop?category=rings", label: "Rings" },
  { href: "/shop?category=necklaces", label: "Necklaces" },
  { href: "/shop?category=bracelets", label: "Bracelets" },
  { href: "/shop?category=earrings", label: "Earrings" },
  { href: "/collections", label: "All collections" },
];

const MAISON_LINKS = [
  { href: "/about", label: "Our story" },
  { href: "/bespoke", label: "Bespoke" },
  { href: "/journal", label: "Journal" },
  { href: "/care-guide", label: "Care guide" },
  { href: "/contact", label: "Contact" },
];

const HELP_LINKS = [
  { href: "/delivery-returns", label: "Delivery & returns" },
  { href: "/order-tracking", label: "Track an order" },
  { href: "/account", label: "My account" },
  { href: "/wishlist", label: "Wishlist" },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink text-bg mt-24">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow !text-accent">The Maison list</p>
            <h2 className="font-display text-3xl sm:text-4xl mt-2">First word on new pieces.</h2>
            <p className="text-bg/60 mt-3 text-sm max-w-md leading-relaxed">
              Quiet updates on new arrivals, restocks and care notes. No noise — a letter only when we have
              something worth saying.
            </p>
          </div>
          <div className="lg:justify-self-end w-full max-w-md">
            <NewsletterForm source="footer" />
          </div>
        </div>
      </div>

      {/* Link columns */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl tracking-[0.08em]">ACRIT MAISON</p>
          <p className="text-bg/60 text-sm mt-4 leading-relaxed max-w-xs">
            A modern jewelry house. Pieces in gold and sterling silver, made in small batches and finished by
            hand in Dhaka.
          </p>
          <div className="flex gap-4 mt-6 text-sm">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-bg/60 hover:text-accent transition-colors">
              Instagram
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-bg/60 hover:text-accent transition-colors">
              Facebook
            </a>
          </div>
        </div>

        <nav aria-label="Shop">
          <p className="eyebrow !text-bg/50 mb-4">Shop</p>
          <ul className="space-y-2.5 text-sm">
            {SHOP_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-bg/70 hover:text-accent transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="The maison">
          <p className="eyebrow !text-bg/50 mb-4">The maison</p>
          <ul className="space-y-2.5 text-sm">
            {MAISON_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-bg/70 hover:text-accent transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Client care">
          <p className="eyebrow !text-bg/50 mb-4">Client care</p>
          <ul className="space-y-2.5 text-sm">
            {HELP_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-bg/70 hover:text-accent transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-bg/50 text-xs mt-6 leading-relaxed">
            Sun–Thu, 10am–7pm
            <br />
            care@acritmaison.example
          </p>
        </nav>
      </div>

      {/* Payments & legal */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-bg/50">
          <span>© {new Date().getFullYear()} Acrit Maison. All rights reserved.</span>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Cash on Delivery</span>
            <span aria-hidden="true">·</span>
            <span>bKash</span>
            <span aria-hidden="true">·</span>
            <span>Nagad</span>
            <span aria-hidden="true">·</span>
            <span>Card (Stripe)</span>
          </span>
          <span>Prices include applicable taxes</span>
        </div>
      </div>
    </footer>
  );
}
