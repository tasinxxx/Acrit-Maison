import { ShopBrowser, type ShopQuery } from "@/components/shop-browser";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop All Jewelry",
  description:
    "Browse every Acrit Maison piece — rings, necklaces, bracelets and earrings in gold and sterling silver, delivered across Bangladesh.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<ShopQuery> }) {
  const query = await searchParams;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <header className="mb-8 sm:mb-12 max-w-2xl">
        <p className="eyebrow">The collection</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-3">All jewelry</h1>
        <p className="text-muted mt-4 leading-relaxed">
          Every piece we make — in one view. Filter by category, purity and price to find yours.
        </p>
      </header>

      <ShopBrowser basePath="/shop" query={query} />
    </div>
  );
}
