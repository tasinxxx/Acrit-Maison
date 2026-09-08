import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  title: "Our Story",
  description:
    "Acrit Maison is a modern jewelry house: gold and sterling silver pieces made in small batches, finished by hand in Dhaka, and described exactly as they are.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "Our Story · Acrit Maison",
    description:
      "A modern jewelry house: small-batch gold and sterling silver, finished by hand in Dhaka, described exactly as they are.",
    url: `${SITE_URL}/about`,
  },
};

const VALUES = [
  {
    title: "Materials, stated plainly",
    body: "Every product page says what a piece is made of — the karat of the gold, whether a stone is lab-grown or natural, how a finish was achieved. If a detail is not written, we did not claim it.",
  },
  {
    title: "Small batches, honest stock",
    body: "Pieces are made in small batches rather than bulk. When something shows as in stock, it is in stock; when it is made to order, we say so and give a realistic timeline.",
  },
  {
    title: "Made for decades",
    body: "We design for the second and third decade of wear: solid metals rather than plated shortcuts, clasps that can be repaired, proportions that outlast a season.",
  },
  {
    title: "A human answers",
    body: "Questions go to people who work with the pieces, not to a script. Sizing help, care questions, bespoke ideas — write to us and a person replies.",
  },
];

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Our Story", item: `${SITE_URL}/about` },
    ],
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="mb-12">
        <p className="eyebrow">The maison</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-3">Quietly made, plainly described</h1>
      </header>

      <div className="space-y-6 text-[15px] sm:text-base leading-[1.85] mb-14">
          <p>
            Acrit Maison began with a simple frustration: in Bangladesh, buying fine jewelry usually means choosing
            between two extremes — heavyweight traditional gold sold by weight, or imported pieces described in
            marketing language that explains nothing. We wanted a third option. A modern jewelry house where the
            design leads, the materials are honest, and the price reflects the work.
          </p>
          <p>
            Our pieces are made in small batches and finished by hand in Dhaka. We work in solid 22K and 18K gold
            and 925 sterling silver, with natural and lab-grown stones that are disclosed for exactly what they
            are. Nothing is invented to make a sale: no fake urgency, no invented heritage, no reviews we did not
            receive.
          </p>
          <p>
            We design for daily wear first. A ring should survive a kitchen, a commute and a decade. A chain
            should clasp securely and lie flat. A pair of hoops should be light enough to forget. When a piece
            cannot be made to that standard, it does not enter the collection.
          </p>
          <p>
            If something you own from us needs care — a re-polish, a re-size, a clasp that has loosened — send it
            back to the maison. Pieces we made are pieces we will look after.
          </p>
        </div>

      <section className="grid gap-px bg-line border border-line mb-14 sm:grid-cols-2" aria-label="What we stand for">
        {VALUES.map((v) => (
          <div key={v.title} className="bg-surface p-6 sm:p-8">
            <h2 className="font-display text-xl">{v.title}</h2>
            <p className="text-muted text-sm mt-3 leading-relaxed">{v.body}</p>
          </div>
        ))}
      </section>

      <section className="card p-6 sm:p-10 text-center mb-14">
        <p className="eyebrow mb-3">See for yourself</p>
        <h2 className="font-display text-2xl sm:text-3xl max-w-xl mx-auto">
          The collection is small on purpose — every piece earns its place.
        </h2>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Link href="/shop" className="btn btn-primary">Shop the collection</Link>
          <Link href="/bespoke" className="btn btn-outline">Commission a bespoke piece</Link>
        </div>
      </section>

      <section aria-label="Practical information">
        <h2 className="font-display text-2xl mb-5">Practical things</h2>
        <ul className="space-y-3 text-sm text-muted">
          <li>
            <Link href="/delivery-returns" className="underline hover:text-ink">Delivery &amp; returns</Link> —
            zones, times, costs and how returns work.
          </li>
          <li>
            <Link href="/care-guide" className="underline hover:text-ink">Care guide</Link> — keeping gold,
            silver and pearls beautiful.
          </li>
          <li>
            <Link href="/journal" className="underline hover:text-ink">Journal</Link> — material explainers and
            care notes.
          </li>
          <li>
            <Link href="/contact" className="underline hover:text-ink">Contact</Link> — a human replies, usually
            within a working day.
          </li>
        </ul>
      </section>
    </div>
  );
}

