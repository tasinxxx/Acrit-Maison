import { BespokeForm } from "@/components/bespoke-form";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  title: "Bespoke",
  description:
    "Commission a one-of-a-kind piece with the Acrit Maison atelier — engagement rings, redesigns and made-to-measure jewelry, discussed personally from first sketch to finished piece.",
  alternates: { canonical: "/bespoke" },
  openGraph: {
    title: "Bespoke · Acrit Maison",
    description:
      "Commission a one-of-a-kind piece with the Acrit Maison atelier — discussed personally from first sketch to finished piece.",
    url: `${SITE_URL}/bespoke`,
  },
};

const STEPS = [
  {
    n: "01",
    title: "Tell us the idea",
    body: "Send the form below — the occasion, the metal, a budget you have in mind. A photograph or sketch helps but is never required.",
  },
  {
    n: "02",
    title: "A conversation, not a quote",
    body: "We reply within two working days with honest questions and a realistic range. If bespoke is not the right path, we will say so and suggest what is.",
  },
  {
    n: "03",
    title: "Design and confirm",
    body: "Once the direction is agreed we confirm the final design, materials and price in writing before anything is made.",
  },
  {
    n: "04",
    title: "Made, finished, delivered",
    body: "Your piece is made to order, inspected by hand, and delivered insured inside Dhaka or couriered across Bangladesh.",
  },
];

export default function BespokePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Bespoke", item: `${SITE_URL}/bespoke` },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="max-w-2xl mb-12 sm:mb-16">
        <p className="eyebrow">The atelier</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-3">Bespoke</h1>
        <p className="text-muted mt-5 leading-relaxed">
          Some pieces cannot be chosen from a shelf. A stone that belonged to a grandmother, a band that must sit
          beside an existing ring, a shape you have carried in your head for years — these are made, not bought.
          Our bespoke service begins with a conversation and ends with a piece made for one person only.
        </p>
      </header>

      <section className="grid gap-px bg-line border border-line mb-14 sm:mb-20" aria-label="How bespoke works">
        {STEPS.map((s) => (
          <div key={s.n} className="bg-surface p-6 sm:p-8">
            <p className="font-display text-3xl text-accent-deep">{s.n}</p>
            <h2 className="font-display text-xl mt-2">{s.title}</h2>
            <p className="text-muted text-sm mt-2 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl mb-6">Request a consultation</h2>
          <BespokeForm />
        </div>
        <aside className="space-y-6 h-fit lg:sticky lg:top-24">
          <div className="card p-6">
            <p className="eyebrow mb-3">Good to know</p>
            <ul className="space-y-3 text-sm text-muted leading-relaxed">
              <li>Consultations are free and carry no obligation.</li>
              <li>We reply within two working days, personally.</li>
              <li>Prices are confirmed in writing before making begins.</li>
              <li>Made-to-order pieces take two to six weeks depending on the work.</li>
              <li>We can often reset stones you already own — mention it in your description.</li>
            </ul>
          </div>
          <div className="card p-6">
            <p className="eyebrow mb-3">Honesty first</p>
            <p className="text-sm text-muted leading-relaxed">
              We state every material plainly — karat, sterling, lab-grown or natural — and we never invent
              heritage or urgency to close a sale. If a commission is outside what we can do well, we will tell
              you and suggest who might help.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
