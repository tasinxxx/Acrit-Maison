import { ContactForm } from "@/components/contact-form";
import { getSettings } from "@/lib/settings";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contact",
  description:
    "Contact Acrit Maison — sizing help, care questions, order queries or bespoke ideas. A human replies, usually within one working day.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact · Acrit Maison",
    description: "Sizing help, care questions, order queries or bespoke ideas — a human replies.",
    url: `${SITE_URL}/contact`,
  },
};

export default async function ContactPage() {
  const s = await getSettings();
  const waDigits = s.whatsappNumber.replace(/\D/g, "");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Contact", item: `${SITE_URL}/contact` },
    ],
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="mb-12">
        <p className="eyebrow">Client care</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-3">Contact</h1>
        <p className="text-muted mt-4 leading-relaxed">
          Questions before you buy, care help after, or an idea for something made just for you — write to us and
          a person answers, usually within one working day.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <ContactForm />

        <aside className="space-y-6 h-fit">
          <div className="card p-6 text-sm">
            <p className="eyebrow mb-3">Direct</p>
            <ul className="space-y-3 text-muted">
              <li>
                <span className="block text-ink">Email</span>
                <a href={`mailto:${s.storeEmail}`} className="underline hover:text-ink">{s.storeEmail}</a>
              </li>
              {s.storePhone && (
                <li>
                  <span className="block text-ink">Phone</span>
                  <a href={`tel:${s.storePhone.replace(/[^+\d]/g, "")}`} className="underline hover:text-ink">
                    {s.storePhone}
                  </a>
                </li>
              )}
              {waDigits && (
                <li>
                  <span className="block text-ink">WhatsApp</span>
                  <a
                    href={`https://wa.me/${waDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-ink"
                  >
                    Message us on WhatsApp
                  </a>
                </li>
              )}
              <li>
                <span className="block text-ink">Hours</span>
                Sunday–Thursday, 10am–7pm
              </li>
              {s.storeAddress && (
                <li>
                  <span className="block text-ink">Studio</span>
                  {s.storeAddress}
                </li>
              )}
            </ul>
          </div>
          <div className="card p-6 text-sm">
            <p className="eyebrow mb-3">Faster answers</p>
            <ul className="space-y-2 text-muted leading-relaxed">
              <li>· Order status? Open the link in your confirmation email.</li>
              <li>· Ring sizing? See the size chart on each product page.</li>
              <li>· Care questions? The <a href="/care-guide" className="underline hover:text-ink">care guide</a> covers most of it.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
