import { ShopBrowser, type ShopQuery } from "@/components/shop-browser";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Best Sellers",
  description: "The Acrit Maison pieces our clients return to — the most loved rings, necklaces, bracelets and earrings.",
  alternates: { canonical: "/best-sellers" },
};

export default async function BestSellersPage({ searchParams }: { searchParams: Promise<ShopQuery> }) {
  const query = await searchParams;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <header className="mb-8 sm:mb-12 max-w-2xl">
        <p className="eyebrow">Most loved</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-3">Best sellers</h1>
        <p className="text-muted mt-4 leading-relaxed">
          The pieces our clients come back for — chosen by you, not by us.
        </p>
      </header>

      <ShopBrowser basePath="/best-sellers" query={query} presetFlag="isBestSeller" />
    </div>
  );
}
