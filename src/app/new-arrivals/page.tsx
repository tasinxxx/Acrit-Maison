import { ShopBrowser, type ShopQuery } from "@/components/shop-browser";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "New Arrivals",
  description: "The latest Acrit Maison pieces — fresh from the bench, in gold and sterling silver.",
  alternates: { canonical: "/new-arrivals" },
};

export default async function NewArrivalsPage({ searchParams }: { searchParams: Promise<ShopQuery> }) {
  const query = await searchParams;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <header className="mb-8 sm:mb-12 max-w-2xl">
        <p className="eyebrow">Fresh from the bench</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-3">New arrivals</h1>
        <p className="text-muted mt-4 leading-relaxed">
          The newest additions to the maison — made in small runs, they rarely stay long.
        </p>
      </header>

      <ShopBrowser basePath="/new-arrivals" query={query} presetFlag="isNewArrival" />
    </div>
  );
}
