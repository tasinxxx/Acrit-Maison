import Link from "next/link";
import { getSettings, formatMoney } from "@/lib/settings";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Delivery & Returns",
  description:
    "Delivery zones, times and costs across Bangladesh, payment methods, and how returns and exchanges work at Acrit Maison.",
  alternates: { canonical: "/delivery-returns" },
  openGraph: {
    title: "Delivery & Returns · Acrit Maison",
    description: "Delivery zones, times and costs across Bangladesh, and how returns work.",
    url: `${SITE_URL}/delivery-returns`,
  },
};

export default async function DeliveryReturnsPage() {
  const s = await getSettings();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Delivery & Returns", item: `${SITE_URL}/delivery-returns` },
    ],
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="mb-12">
        <p className="eyebrow">Client care</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-3">Delivery &amp; Returns</h1>
        <p className="text-muted mt-4 leading-relaxed">
          Everything about how pieces travel to you, and what happens if something is not right. Questions?{" "}
          <Link href="/contact" className="underline hover:text-ink">Contact the maison</Link>.
        </p>
      </header>

      <section className="mb-12" aria-labelledby="delivery">
        <h2 id="delivery" className="font-display text-2xl mb-4">Delivery</h2>
        {s.shippingEnabled ? (
          <div className="card divide-y divide-line text-sm">
            <table className="w-full text-sm">
              <caption className="sr-only">Delivery costs by zone and speed</caption>
              <thead>
                <tr className="text-left">
                  <th scope="col" className="p-3 font-medium text-muted uppercase text-xs tracking-wide">Zone</th>
                  <th scope="col" className="p-3 font-medium text-muted uppercase text-xs tracking-wide">Standard</th>
                  <th scope="col" className="p-3 font-medium text-muted uppercase text-xs tracking-wide">Express</th>
                  <th scope="col" className="p-3 font-medium text-muted uppercase text-xs tracking-wide">Typical time</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-line">
                  <th scope="row" className="p-3 font-medium text-left">Inside Dhaka</th>
                  <td className="p-3">{formatMoney(s.insideDhakaStandardCents, s.currency)}</td>
                  <td className="p-3">{formatMoney(s.insideDhakaExpressCents, s.currency)}</td>
                  <td className="p-3 text-muted">1–2 working days standard</td>
                </tr>
                <tr className="border-t border-line">
                  <th scope="row" className="p-3 font-medium text-left">Outside Dhaka</th>
                  <td className="p-3">{formatMoney(s.outsideDhakaStandardCents, s.currency)}</td>
                  <td className="p-3">{formatMoney(s.outsideDhakaExpressCents, s.currency)}</td>
                  <td className="p-3 text-muted">2–4 working days standard</td>
                </tr>
              </tbody>
            </table>
            <p className="p-4 text-muted">
              Standard delivery inside Dhaka is complimentary on orders over{" "}
              {formatMoney(s.freeShippingThresholdCents, s.currency)}. Every parcel is insured for its full value
              and requires a signature on handover.
            </p>
          </div>
        ) : (
          <p className="text-muted text-sm">
            Online delivery is temporarily paused. You can still order by contacting us directly.
          </p>
        )}
        <ul className="mt-5 space-y-2 text-sm text-muted leading-relaxed">
          <li>· Made-to-order pieces show their crafting time on the product page; delivery time starts after the piece is finished.</li>
          <li>· We deliver across all eight divisions of Bangladesh via insured courier.</li>
          <li>· You receive the courier tracking reference as soon as the parcel is handed over.</li>
          <li>· Someone must be available at the delivery address to sign; the courier will call before arriving.</li>
        </ul>
      </section>

      <section className="mb-12" aria-labelledby="payment">
        <h2 id="payment" className="font-display text-2xl mb-4">Payment</h2>
        <ul className="card divide-y divide-line text-sm">
          <li className="p-4">
            <span className="font-medium block">Cash on Delivery</span>
            <span className="text-muted">Pay in cash when your piece arrives. Available across Bangladesh.</span>
          </li>
          <li className="p-4">
            <span className="font-medium block">bKash</span>
            <span className="text-muted">
              Send the order total{s.bkashNumber ? ` to ${s.bkashNumber}` : ""} quoting your order number; your
              order is confirmed as soon as the transaction is verified (usually within a few hours).
            </span>
          </li>
          <li className="p-4">
            <span className="font-medium block">Nagad</span>
            <span className="text-muted">
              Send the order total{s.nagadNumber ? ` to ${s.nagadNumber}` : ""} quoting your order number;
              confirmation follows verification of the transaction.
            </span>
          </li>
          <li className="p-4">
            <span className="font-medium block">Card (Visa, Mastercard, Amex)</span>
            <span className="text-muted">
              Processed securely through Stripe. Card details go directly to Stripe — we never see or store them.
            </span>
          </li>
        </ul>
      </section>

      <section className="mb-12" aria-labelledby="returns">
        <h2 id="returns" className="font-display text-2xl mb-4">Returns</h2>
        <div className="space-y-4 text-sm leading-relaxed">
          <p>
            We want you to be certain before you buy, and we would rather answer ten questions first than take a
            piece back afterwards. That said, if something is not right:
          </p>
          <ul className="space-y-3">
            <li className="card p-4">
              <span className="font-medium block mb-1">Seven days to change your mind</span>
              <span className="text-muted">
                Unused pieces in their original packaging, with the disclosure card included, can be returned
                within seven days of delivery for a refund of the piece price. Message us first so we know to
                expect the parcel.
              </span>
            </li>
            <li className="card p-4">
              <span className="font-medium block mb-1">Faults and repairs</span>
              <span className="text-muted">
                If a piece fails through a fault in materials or making, we repair or replace it — return costs
                are ours. Pieces damaged in wear can usually be repaired at cost; we will quote before any work.
              </span>
            </li>
            <li className="card p-4">
              <span className="font-medium block mb-1">Made-to-order and bespoke</span>
              <span className="text-muted">
                Pieces made to your size or commissioned as bespoke cannot be returned unless faulty — this is
                always confirmed in writing before making begins.
              </span>
            </li>
            <li className="card p-4">
              <span className="font-medium block mb-1">Pierced earrings</span>
              <span className="text-muted">
                For hygiene, pierced earrings can only be returned if faulty.
              </span>
            </li>
          </ul>
          <p className="text-muted">
            Refunds are issued to the original payment method: bKash or Nagad transfers are returned to the same
            number, card refunds go back through Stripe, and cash-on-delivery returns are refunded by bKash,
            Nagad or bank transfer within five working days of the piece reaching the maison.
          </p>
        </div>
      </section>

      <section aria-labelledby="cancellations">
        <h2 id="cancellations" className="font-display text-2xl mb-4">Cancellations</h2>
        <p className="text-sm text-muted leading-relaxed">
          Orders can be cancelled free of charge any time before they are handed to the courier — message us with
          your order number. Once a parcel is with the courier, treat it as a return and message us to arrange it.
        </p>
      </section>
    </div>
  );
}
