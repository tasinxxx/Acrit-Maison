import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  title: "Care Guide",
  description:
    "How to care for 22K and 18K gold, sterling silver, lab-grown diamonds and pearls — practical habits from the Acrit Maison bench.",
  alternates: { canonical: "/care-guide" },
  openGraph: {
    title: "Care Guide · Acrit Maison",
    description: "Practical care habits for gold, silver, diamonds and pearls, from the Acrit Maison bench.",
    url: `${SITE_URL}/care-guide`,
  },
};

const SECTIONS = [
  {
    title: "The daily habits",
    items: [
      "Put jewelry on last, after perfume, lotion and dressing — and take it off first, before exercise, swimming, housework or sleep.",
      "Chlorine and perspiration dull high-karat gold fastest; lotions and hairspray film pearls and diamonds.",
      "Wipe pieces with the enclosed soft cloth at the end of the day. Thirty seconds now saves a polish later.",
    ],
  },
  {
    title: "22K and 18K gold",
    items: [
      "22K gold is 91.6% pure — deep in colour and naturally softer than lower karats. Softness is chemistry, not a flaw; small surface marks are part of wearing solid gold.",
      "Clean with warm water, two drops of mild dish soap and a soft brush along the underside of the piece. Pat dry on a lint-free cloth.",
      "Skip ultrasonic cleaners unless a jeweller has checked the piece first — they can loosen hand-set stones.",
      "Store gold pieces separately in their own pouches. Gold scratches gold.",
    ],
  },
  {
    title: "925 sterling silver",
    items: [
      "Our silver is rhodium-finished, which resists tarnish far longer than bare silver.",
      "When a soft lustre fade appears over time, a silver polishing cloth restores it. Avoid dip solutions on finished pieces.",
      "Silver likes to be worn — pieces worn often need the least care. Store pieces you are resting in sealed pouches, away from humid bathrooms.",
    ],
  },
  {
    title: "Lab-grown diamonds and natural stones",
    items: [
      "Lab-grown diamonds are chemically and optically diamond. Clean them as diamond: mild soap, warm water, soft brush, rinse, pat dry.",
      "Pearls are the exception to almost everything: they are soft and porous. Apply perfume and cosmetics before wearing, wipe with a dry soft cloth afterwards, and never soak or ultrasonic-clean them.",
      "Store pearls flat and separate from metal pieces, which can scratch their surface.",
    ],
  },
  {
    title: "Storage and travel",
    items: [
      "Store each piece in its own pouch — the pouch your order arrived with is made for this.",
      "Fasten chains before storing so they cannot knot; lay bracelets flat so bangles keep their shape.",
      "Travelling: use the pouch inside a hard case, and keep pieces separated so stones cannot mark metal.",
    ],
  },
  {
    title: "When something changes",
    items: [
      "If a claw looks proud of the stone, a link catches, or a hinge stops clicking — stop wearing the piece and contact us.",
      "All Acrit Maison pieces can be returned to the maison for inspection, re-finishing or repair. We will always quote before carrying out chargeable work.",
      "Annual check-ups are free: bring or send pieces in once a year and we will inspect settings and clasps at no cost.",
    ],
  },
];

export default function CareGuidePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Care Guide", item: `${SITE_URL}/care-guide` },
    ],
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="mb-12">
        <p className="eyebrow">Client care</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-3">Care Guide</h1>
        <p className="text-muted mt-4 leading-relaxed">
          Fine jewelry asks for very little: a few habits, a soft cloth and an occasional check. Everything on
          this page comes from our bench — the same advice we give in writing with every order.
        </p>
      </header>

      <div className="space-y-10">
        {SECTIONS.map((section, i) => (
          <Reveal key={section.title} delay={i * 0.04}>
            <section aria-labelledby={`care-${i}`}>
              <h2 id={`care-${i}`} className="font-display text-2xl mb-4">{section.title}</h2>
              <ul className="space-y-3 text-sm leading-relaxed">
                {section.items.map((item, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="text-accent-deep mt-0.5" aria-hidden="true">—</span>
                    <span className="text-muted">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
        ))}
      </div>

      <div className="card p-6 sm:p-8 text-center mt-14">
        <p className="eyebrow mb-2">Need help with a piece?</p>
        <p className="text-muted text-sm max-w-lg mx-auto leading-relaxed">
          Describe what you are seeing — a dull patch, a loose clasp, a bent band — and we will tell you honestly
          whether it is routine care or bench work.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-5">
          <Link href="/contact" className="btn btn-primary">Contact the maison</Link>
          <Link href="/journal/how-to-care-for-22k-gold" className="btn btn-quiet">Read the care essay</Link>
        </div>
      </div>
    </div>
  );
}
