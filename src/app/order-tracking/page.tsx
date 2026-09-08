import { TrackingLookup } from "@/components/tracking-lookup";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  title: "Track an Order",
  description:
    "Track your Acrit Maison order with your order number and the access token from your confirmation.",
  alternates: { canonical: "/order-tracking" },
  openGraph: {
    title: "Track an Order · Acrit Maison",
    description: "Track your order with your order number and the access token from your confirmation.",
    url: `${SITE_URL}/order-tracking`,
  },
};

export default function OrderTrackingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Track an Order", item: `${SITE_URL}/order-tracking` },
    ],
  };

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="mb-8">
        <p className="eyebrow">Client care</p>
        <h1 className="font-display text-4xl mt-3">Track an order</h1>
        <p className="text-muted mt-3 text-sm leading-relaxed">
          Enter the order number and the access token from your confirmation email or the link shown after
          checkout. Signed in? Your orders are always in{" "}
          <a href="/account" className="underline hover:text-ink">My account</a>.
        </p>
      </header>

      <TrackingLookup />
    </div>
  );
}
