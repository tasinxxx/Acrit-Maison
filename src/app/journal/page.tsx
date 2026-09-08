import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/motion/reveal";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Journal",
  description:
    "Care notes, material explainers and styling essays from the Acrit Maison atelier — written to help you buy well and wear pieces for decades.",
  alternates: { canonical: "/journal" },
  openGraph: {
    title: "Journal · Acrit Maison",
    description: "Care notes, material explainers and styling essays from the Acrit Maison atelier.",
    url: `${SITE_URL}/journal`,
  },
};

const CATEGORY_BLURB: Record<string, string> = {
  Care: "Keeping pieces beautiful",
  Styling: "Wearing and choosing",
  Materials: "What things are made of",
  Craftsmanship: "How pieces are made",
  Journal: "Notes from the maison",
};

export default async function JournalPage() {
  const posts = await prisma.journalPost.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Journal",
    url: `${SITE_URL}/journal`,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="max-w-2xl mb-12 sm:mb-16">
        <p className="eyebrow">Notes from the maison</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-3">Journal</h1>
        <p className="text-muted mt-5 leading-relaxed">
          Short, useful writing on caring for jewelry, understanding materials and choosing pieces that last.
          No trend lists, no invented scarcity — just what we know from the bench.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-muted">The first entries are being written. Check back soon.</p>
      ) : (
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <li key={post.id}>
              <Reveal delay={i * 0.06}>
                <Link href={`/journal/${post.slug}`} className="group block card card-hover h-full">
                  {post.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.coverImage} alt="" className="w-full aspect-[4/3] object-cover" />
                  ) : (
                    <div className="w-full aspect-[4/3] bg-bg-deep flex items-center justify-center" aria-hidden="true">
                      <span className="font-display text-4xl text-line-strong">A</span>
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="badge badge-gold">{post.category}</span>
                      <span className="text-xs text-muted">{post.readMinutes} min read</span>
                    </div>
                    <h2 className="font-display text-xl leading-snug group-hover:text-accent-deep transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && <p className="text-muted text-sm mt-2 leading-relaxed">{post.excerpt}</p>}
                    {post.publishedAt && (
                      <p className="text-xs text-muted mt-3">
                        {post.publishedAt.toLocaleDateString("en-IE", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    )}
                  </div>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
