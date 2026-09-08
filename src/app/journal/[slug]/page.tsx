import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/motion/reveal";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type Params = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

async function getPost(slug: string) {
  return prisma.journalPost.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  let post = null;
  try {
    post = await getPost(slug);
  } catch {
    // Database unavailable at build time.
  }
  if (!post || !post.published) return { title: "Acrit Maison — Journal" };

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  return {
    title,
    description,
    alternates: { canonical: `/journal/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${SITE_URL}/journal/${post.slug}`,
      publishedTime: post.publishedAt?.toISOString(),
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
  };
}

export default async function JournalArticlePage({ params }: Params) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post || !post.published) notFound();

  const more = await prisma.journalPost.findMany({
    where: { published: true, slug: { not: post.slug } },
    orderBy: [{ publishedAt: "desc" }],
    take: 2,
  });

  const publishedIso = post.publishedAt?.toISOString() ?? post.createdAt.toISOString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    datePublished: publishedIso,
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Organization", name: "Acrit Maison", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Acrit Maison", url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/journal/${post.slug}`,
    ...(post.coverImage ? { image: post.coverImage } : {}),
  };

  const paragraphs = post.body.split(/\n{2,}/).filter((p) => p.trim().length > 0);

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-xs tracking-[0.14em] uppercase text-muted mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <Link href="/journal" className="hover:text-ink">Journal</Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span className="text-ink">{post.category}</span>
      </nav>

      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="badge badge-gold">{post.category}</span>
          <span className="text-xs text-muted">{post.readMinutes} min read</span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl leading-tight">{post.title}</h1>
        {post.excerpt && <p className="font-display text-lg text-muted mt-4 leading-relaxed">{post.excerpt}</p>}
        <p className="text-xs text-muted mt-4">
          {post.publishedAt
            ? post.publishedAt.toLocaleDateString("en-IE", { year: "numeric", month: "long", day: "numeric" })
            : null}
        </p>
      </header>

      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverImage} alt="" className="w-full mb-10 border border-line" />
      )}

      <Reveal>
        <div className="space-y-6 text-[15px] sm:text-base leading-[1.85]">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">{p}</p>
          ))}
        </div>
      </Reveal>

      <hr className="rule my-12" />

      <section aria-label="Questions">
        <div className="card p-6 sm:p-8 text-center">
          <p className="eyebrow mb-2">Questions about a piece?</p>
          <p className="text-muted text-sm leading-relaxed max-w-lg mx-auto">
            A human answers every message. Ask us about care, sizing or materials before or after you buy.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-5">
            <Link href="/contact" className="btn btn-outline">Contact the maison</Link>
            <Link href="/shop" className="btn btn-primary">Shop the collection</Link>
          </div>
        </div>
      </section>

      {more.length > 0 && (
        <section className="mt-12" aria-label="More from the journal">
          <h2 className="font-display text-2xl mb-5">More from the journal</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {more.map((m) => (
              <li key={m.id}>
                <Link href={`/journal/${m.slug}`} className="group block card card-hover p-5 h-full">
                  <span className="badge badge-neutral mb-2">{m.category}</span>
                  <span className="block font-display text-lg leading-snug group-hover:text-accent-deep transition-colors">
                    {m.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
