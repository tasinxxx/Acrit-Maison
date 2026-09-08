import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/auth";
import { ProductCard } from "@/components/product-card";

type Search = { searchParams: Promise<{ q?: string }> };

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Search",
  description: "Search Acrit Maison pieces by name, material or stone.",
  robots: { index: false },
};

export default async function SearchPage({ searchParams }: Search) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().slice(0, 80);

  const products = query
    ? await prisma.product.findMany({
        where: {
          active: true,
          OR: [
            { name: { contains: query } },
            { shortDescription: { contains: query } },
            { description: { contains: query } },
            { material: { contains: query } },
            { purity: { contains: query } },
            { gemstone: { contains: query } },
          ],
        },
        include: { images: { orderBy: { position: "asc" } }, variants: true },
        take: 24,
        orderBy: { createdAt: "desc" },
      })
    : [];

  const customer = await getCurrentCustomer();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <h1 className="font-display text-4xl sm:text-5xl mb-8">Search</h1>
      <form role="search" action="/search" method="get" className="flex flex-col sm:flex-row gap-2 max-w-xl mb-10">
        <label htmlFor="q" className="sr-only">
          Search products
        </label>
        <input
          id="q"
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search rings, gold, pearls…"
          className="input"
        />
        <button type="submit" className="btn btn-primary shrink-0">
          Search
        </button>
      </form>

      {!query ? (
        <p className="text-muted">Type a search term above — try “ring”, “gold” or “pearl”.</p>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-display text-xl">Nothing found for “{query}”.</p>
          <p className="text-muted text-sm mt-2">Try a broader term, or browse the full collection.</p>
          <Link href="/shop" className="btn btn-outline mt-6">
            Shop all jewelry
          </Link>
        </div>
      ) : (
        <>
          <p className="text-muted text-sm mb-6" aria-live="polite">
            {products.length} result{products.length === 1 ? "" : "s"} for “{query}”
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 sm:gap-x-6">
            {products.map((p) => {
              const minDelta = p.variants.length > 0 ? Math.min(...p.variants.map((v) => v.priceDeltaCents)) : 0;
              return (
                <ProductCard
                  key={p.id}
                  signedIn={Boolean(customer)}
                  slug={p.slug}
                  name={p.name}
                  priceCents={p.priceCents}
                  compareAtCents={p.compareAtCents}
                  fromPriceCents={minDelta !== 0 ? p.priceCents + minDelta : undefined}
                  imageUrl={p.images[0]?.url ?? null}
                  hoverImageUrl={p.images[1]?.url ?? null}
                  altText={p.images[0]?.alt || p.name}
                  inStock={p.variants.some((v) => v.active && v.stock > 0)}
                  isNew={p.isNewArrival}
                  isBestSeller={p.isBestSeller}
                  madeToOrder={p.madeToOrder}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
