import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Collections",
  description: "The Acrit Maison collections — curated stories in gold and sterling silver.",
  alternates: { canonical: "/collections" },
};

export default async function CollectionsPage() {
  const collections = await prisma.collection.findMany({
    where: { active: true },
    orderBy: { position: "asc" },
    include: { _count: { select: { products: { where: { active: true } } } } },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <header className="mb-10 sm:mb-14 max-w-2xl">
        <p className="eyebrow">The maison</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-3">Collections</h1>
        <p className="text-muted mt-4 leading-relaxed">
          Each collection is a small, complete story — pieces that share a material, a mood, or a way of being worn.
        </p>
      </header>

      {collections.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-muted">Collections are being prepared. In the meantime, browse the full shop.</p>
          <Link href="/shop" className="btn btn-outline mt-6">
            Shop all jewelry
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:gap-10">
          {collections.map((c, i) => (
            <Link
              key={c.id}
              href={`/collections/${c.slug}`}
              className={`group block ${i % 2 === 1 ? "sm:mt-12" : ""}`}
            >
              <div className="aspect-[4/5] sm:aspect-[5/4] bg-bg-deep overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.imageUrl ?? "/img/hero-editorial.jpg"}
                  alt={`${c.name} collection`}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              </div>
              <div className="pt-5">
                <h2 className="font-display text-2xl group-hover:text-accent-deep transition-colors">{c.name}</h2>
                {c.tagline && <p className="text-muted text-sm mt-1.5">{c.tagline}</p>}
                <p className="text-xs text-muted mt-2">
                  {c._count.products} piece{c._count.products === 1 ? "" : "s"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
