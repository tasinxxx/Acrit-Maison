import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/auth";
import { ProductCard } from "@/components/product-card";
import { ShopFilters, type FilterState } from "@/components/shop-filters";
import { SortSelect } from "@/components/sort-select";

export type ShopQuery = {
  category?: string;
  collection?: string;
  material?: string;
  purity?: string;
  min?: string;
  max?: string;
  availability?: string;
  sort?: string;
  page?: string;
  q?: string;
};

const SORTS = ["newest", "price-asc", "price-desc", "name"] as const;
type Sort = (typeof SORTS)[number];
const PAGE_SIZE = 12;

function buildUrl(base: string, params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

type BrowserProps = {
  basePath: string;
  query: ShopQuery;
  presetCategorySlug?: string;
  presetCollectionId?: string;
  presetFlag?: "isNewArrival" | "isBestSeller";
};

export async function ShopBrowser({ basePath, query, presetCategorySlug, presetCollectionId, presetFlag }: BrowserProps) {
  const sortKey: Sort = SORTS.includes(query.sort as Sort) ? (query.sort as Sort) : "newest";
  const page = Math.max(1, Math.min(500, Number(query.page) || 1));
  const availability = query.availability === "in-stock" ? "in-stock" : "all";

  const [categories, collections, materials, purities] = await Promise.all([
    prisma.category.findMany({ orderBy: { position: "asc" } }),
    prisma.collection.findMany({ where: { active: true }, orderBy: { position: "asc" } }),
    prisma.product.findMany({
      where: { active: true, material: { not: "" } },
      select: { material: true },
      distinct: ["material"],
      orderBy: { material: "asc" },
      take: 30,
    }),
    prisma.product.findMany({
      where: { active: true, purity: { not: "" } },
      select: { purity: true },
      distinct: ["purity"],
      orderBy: { purity: "asc" },
      take: 30,
    }),
  ]);

  const selectedCategory = presetCategorySlug
    ? categories.find((c) => c.slug === presetCategorySlug)
    : query.category
      ? categories.find((c) => c.slug === query.category)
      : undefined;
  const selectedCollection = presetCollectionId
    ? collections.find((c) => c.id === presetCollectionId)
    : query.collection
      ? collections.find((c) => c.slug === query.collection)
      : undefined;

  const minTaka = query.min ? Number(query.min) : undefined;
  const maxTaka = query.max ? Number(query.max) : undefined;

  const where = {
    active: true,
    ...(presetFlag ? { [presetFlag]: true } : {}),
    ...(selectedCategory ? { categoryId: selectedCategory.id } : {}),
    ...(selectedCollection ? { collectionId: selectedCollection.id } : {}),
    ...(query.material ? { material: { contains: query.material } } : {}),
    ...(query.purity ? { purity: { contains: query.purity } } : {}),
    ...(minTaka !== undefined && Number.isFinite(minTaka) ? { priceCents: { gte: Math.round(minTaka * 100) } } : {}),
    ...(maxTaka !== undefined && Number.isFinite(maxTaka)
      ? { priceCents: { ...(minTaka !== undefined && Number.isFinite(minTaka) ? { gte: Math.round(minTaka * 100) } : {}), lte: Math.round(maxTaka * 100) } }
      : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q } },
            { shortDescription: { contains: query.q } },
            { material: { contains: query.q } },
            { purity: { contains: query.q } },
            { gemstone: { contains: query.q } },
          ],
        }
      : {}),
  };

  const orderBy =
    sortKey === "price-asc"
      ? { priceCents: "asc" as const }
      : sortKey === "price-desc"
        ? { priceCents: "desc" as const }
        : sortKey === "name"
          ? { name: "asc" as const }
          : [{ createdAt: "desc" as const }];

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { images: { orderBy: { position: "asc" } }, variants: true },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const customer = await getCurrentCustomer();
  const signedIn = Boolean(customer);

  const filtered = availability === "in-stock" ? products.filter((p) => p.variants.some((v) => v.active && v.stock > 0) || p.madeToOrder) : products;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const currentFilters: FilterState = {
    category: selectedCategory?.slug ?? "",
    collection: selectedCollection?.slug ?? "",
    material: query.material ?? "",
    purity: query.purity ?? "",
    min: query.min ?? "",
    max: query.max ?? "",
    availability,
    sort: sortKey,
  };

  const qBase = buildUrl(basePath, {
    category: currentFilters.category || undefined,
    collection: currentFilters.collection || undefined,
    material: currentFilters.material || undefined,
    purity: currentFilters.purity || undefined,
    min: currentFilters.min || undefined,
    max: currentFilters.max || undefined,
    availability: availability !== "all" ? availability : undefined,
    sort: sortKey !== "newest" ? sortKey : undefined,
    q: query.q || undefined,
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-12">
      <ShopFilters
        basePath={basePath}
        current={currentFilters}
        categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
        collections={collections.map((c) => ({ name: c.name, slug: c.slug }))}
        materials={materials.map((m) => m.material)}
        purities={purities.map((p) => p.purity)}
      />

      <div>
        <div className="flex items-center justify-between mb-6 gap-3">
          <p className="text-sm text-muted" aria-live="polite">
            {total} piece{total === 1 ? "" : "s"}
            {availability === "in-stock" ? " · in stock" : ""}
          </p>
          <form action={basePath} method="get" className="flex items-center gap-2">
            {/* Preserve active filters on sort change */}
            {Object.entries({
              category: currentFilters.category,
              collection: currentFilters.collection,
              material: currentFilters.material,
              purity: currentFilters.purity,
              min: currentFilters.min,
              max: currentFilters.max,
              availability: availability !== "all" ? availability : "",
              q: query.q ?? "",
            }).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
            <label htmlFor="sort" className="sr-only">
              Sort pieces
            </label>
            <SortSelect value={sortKey} />
            <noscript>
              <button type="submit" className="btn btn-quiet !py-2">
                Sort
              </button>
            </noscript>
          </form>
        </div>

        {filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="font-display text-xl">No pieces match these filters.</p>
            <p className="text-muted text-sm mt-2">Try widening the price range or clearing a filter.</p>
            <Link href={basePath} className="btn btn-outline mt-6">
              Clear all filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 sm:gap-x-6">
            {filtered.map((p) => {
              const minDelta = p.variants.length > 0 ? Math.min(...p.variants.map((v) => v.priceDeltaCents)) : 0;
              return (
                <ProductCard
                  key={p.id}
                  signedIn={signedIn}
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
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-2 mt-14" aria-label="Pagination">
            {page > 1 && (
              <Link href={`${qBase}${qBase.includes("?") ? "&" : "?"}page=${page - 1}`} className="btn btn-quiet !py-2 !px-4">
                ← Prev
              </Link>
            )}
            <span className="text-sm text-muted px-3">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link href={`${qBase}${qBase.includes("?") ? "&" : "?"}page=${page + 1}`} className="btn btn-quiet !py-2 !px-4">
                Next →
              </Link>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
