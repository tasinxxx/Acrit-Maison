import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ShopBrowser, type ShopQuery } from "@/components/shop-browser";

type Params = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  let collection = null;
  try {
    collection = await prisma.collection.findUnique({ where: { slug } });
  } catch {
    // Database unavailable at build time.
  }
  if (!collection) return { title: "Acrit Maison — Collections" };
  return {
    title: collection.name,
    description:
      collection.tagline ||
      collection.description ||
      `Explore the ${collection.name} collection at Acrit Maison.`,
    alternates: { canonical: `/collections/${collection.slug}` },
    openGraph: {
      title: `${collection.name} · Acrit Maison`,
      description: collection.tagline || collection.description,
      images: collection.imageUrl ? [{ url: collection.imageUrl }] : undefined,
    },
  };
}

export default async function CollectionPage({ params, searchParams }: Params & { searchParams: Promise<ShopQuery> }) {
  const { slug } = await params;
  const query = await searchParams;
  const collection = await prisma.collection.findUnique({ where: { slug } });
  if (!collection || !collection.active) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000" },
      { "@type": "ListItem", position: 2, name: "Collections", item: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/collections` },
      { "@type": "ListItem", position: 3, name: collection.name },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-xs tracking-[0.14em] uppercase text-muted mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <Link href="/collections" className="hover:text-ink">Collections</Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span className="text-ink">{collection.name}</span>
      </nav>

      <header className="mb-8 sm:mb-12 max-w-2xl">
        <p className="eyebrow">Collection</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-3">{collection.name}</h1>
        {collection.tagline && <p className="font-display text-lg text-muted mt-3">{collection.tagline}</p>}
        {collection.description && <p className="text-muted mt-4 leading-relaxed">{collection.description}</p>}
      </header>

      <ShopBrowser basePath={`/collections/${collection.slug}`} query={query} presetCollectionId={collection.id} />
    </div>
  );
}
