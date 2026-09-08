import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/auth";
import { ProductCard } from "@/components/product-card";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const dynamic = "force-dynamic";

type CardProduct = {
  slug: string;
  name: string;
  priceCents: number;
  compareAtCents: number | null;
  isNewArrival: boolean;
  isBestSeller: boolean;
  madeToOrder: boolean;
  images: { url: string; alt: string; position: number }[];
  variants: { priceDeltaCents: number; stock: number; active: boolean }[];
};

function cardProps(p: CardProduct) {
  const minDelta = p.variants.length > 0 ? Math.min(...p.variants.map((v) => v.priceDeltaCents)) : 0;
  return {
    slug: p.slug,
    name: p.name,
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents,
    fromPriceCents: minDelta !== 0 ? p.priceCents + minDelta : undefined,
    imageUrl: p.images[0]?.url ?? null,
    hoverImageUrl: p.images[1]?.url ?? null,
    altText: p.images[0]?.alt || p.name,
    inStock: p.variants.some((v) => v.active && v.stock > 0),
    isNew: p.isNewArrival,
    isBestSeller: p.isBestSeller,
    madeToOrder: p.madeToOrder,
  };
}

const CATEGORY_IMAGES: Record<string, string> = {
  Rings: "/img/category-rings.jpg",
  Necklaces: "/img/category-necklaces.jpg",
  Bracelets: "/img/category-bracelets.jpg",
  Earrings: "/img/category-earrings.jpg",
};

export default async function HomePage() {
  const customer = await getCurrentCustomer();
  const signedIn = Boolean(customer);

  const [categories, newArrivals, bestSellers, collection] = await Promise.all([
    prisma.category.findMany({ orderBy: { position: "asc" } }),
    prisma.product.findMany({
      where: { active: true, isNewArrival: true },
      include: { images: { orderBy: { position: "asc" } }, variants: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.product.findMany({
      where: { active: true, isBestSeller: true },
      include: { images: { orderBy: { position: "asc" } }, variants: true },
      orderBy: { createdAt: "asc" },
      take: 4,
    }),
    prisma.collection.findFirst({
      where: { active: true },
      orderBy: { position: "asc" },
      include: {
        products: {
          where: { active: true },
          include: { images: { orderBy: { position: "asc" } }, variants: true },
          take: 3,
          orderBy: { createdAt: "asc" },
        },
      },
    }),
  ]);

  return (
    <div>
      {/* ------------------------------------------------ Hero */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 items-center gap-0">
            <div className="py-14 sm:py-20 lg:py-28 lg:pr-16">
              <Reveal>
                <p className="eyebrow">A modern jewelry house</p>
                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.02] mt-5">
                  Jewelry that
                  <br />
                  whispers,
                  <br />
                  <span className="italic text-accent-deep">never shouts.</span>
                </h1>
                <p className="text-muted mt-6 max-w-md leading-relaxed">
                  Considered pieces in gold and sterling silver — designed quietly, made in small batches, and
                  finished by hand. For every day, and for the days that matter.
                </p>
                <div className="mt-9 flex flex-col sm:flex-row gap-3">
                  <Link href="/shop" className="btn btn-primary">
                    Discover the pieces
                  </Link>
                  <Link href="/bespoke" className="btn btn-outline">
                    Commission bespoke
                  </Link>
                </div>
              </Reveal>
            </div>
            <div className="relative lg:h-full min-h-[320px] sm:min-h-[420px] lg:min-h-[640px] bg-bg-deep">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/hero-editorial.jpg"
                alt="Fine gold jewelry arranged on warm ivory"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Brand statement */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-20 text-center">
          <Reveal>
            <p className="eyebrow">Our philosophy</p>
            <p className="font-display text-2xl sm:text-3xl leading-snug mt-4">
              We make fewer things, better. Each piece is drawn with intention, cast in precious metal, and
              finished by hand — made to be worn often, cared for, and kept.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------ Shop by category */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <Reveal>
          <div className="flex items-end justify-between mb-8 sm:mb-10">
            <div>
              <p className="eyebrow">The atelier</p>
              <h2 className="font-display text-3xl sm:text-4xl mt-2">Shop by category</h2>
            </div>
            <Link href="/shop" className="text-sm text-muted hover:text-accent-deep transition-colors hidden sm:block">
              View all pieces →
            </Link>
          </div>
        </Reveal>
        <RevealGroup className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((c) => (
            <RevealItem key={c.id}>
              <Link href={`/shop?category=${c.slug}`} className="group block">
                <div className="aspect-[4/5] bg-bg-deep overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={CATEGORY_IMAGES[c.name] ?? "/img/hero-editorial.jpg"}
                    alt={`${c.name} collection`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                </div>
                <div className="pt-4 text-center">
                  <p className="font-display text-xl">{c.name}</p>
                  <p className="text-xs text-muted mt-1">{c.description}</p>
                </div>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
        <div className="sm:hidden text-center mt-8">
          <Link href="/shop" className="btn btn-quiet">
            View all pieces
          </Link>
        </div>
      </section>

      {/* ------------------------------------------------ New arrivals */}
      {newArrivals.length > 0 && (
        <section className="border-t border-line bg-surface">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <Reveal>
              <div className="flex items-end justify-between mb-8 sm:mb-10">
                <div>
                  <p className="eyebrow">Just arrived</p>
                  <h2 className="font-display text-3xl sm:text-4xl mt-2">New arrivals</h2>
                </div>
                <Link href="/new-arrivals" className="text-sm text-muted hover:text-accent-deep transition-colors hidden sm:block">
                  All new arrivals →
                </Link>
              </div>
            </Reveal>
            <RevealGroup className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6">
              {newArrivals.map((p) => (
                <RevealItem key={p.id}>
                  <ProductCard signedIn={signedIn} {...cardProps(p)} />
                </RevealItem>
              ))}
            </RevealGroup>
            <div className="sm:hidden text-center mt-10">
              <Link href="/new-arrivals" className="btn btn-quiet">
                All new arrivals
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------ Best sellers */}
      {bestSellers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <Reveal>
            <div className="flex items-end justify-between mb-8 sm:mb-10">
              <div>
                <p className="eyebrow">Most loved</p>
                <h2 className="font-display text-3xl sm:text-4xl mt-2">Best sellers</h2>
              </div>
              <Link href="/best-sellers" className="text-sm text-muted hover:text-accent-deep transition-colors hidden sm:block">
                All best sellers →
              </Link>
            </div>
          </Reveal>
          <RevealGroup className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6">
            {bestSellers.map((p) => (
              <RevealItem key={p.id}>
                <ProductCard signedIn={signedIn} {...cardProps(p)} />
              </RevealItem>
            ))}
          </RevealGroup>
          <div className="sm:hidden text-center mt-10">
            <Link href="/best-sellers" className="btn btn-quiet">
              All best sellers
            </Link>
          </div>
        </section>
      )}

      {/* ------------------------------------------------ Featured collection */}
      {collection && collection.products.length > 0 && (
        <section className="bg-ink text-bg">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <Reveal>
              <div className="max-w-xl">
                <p className="eyebrow !text-accent">Featured collection</p>
                <h2 className="font-display text-3xl sm:text-5xl mt-3">{collection.name}</h2>
                {collection.tagline && <p className="text-bg/60 mt-3 leading-relaxed">{collection.tagline}</p>}
              </div>
            </Reveal>
            <RevealGroup className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-6 mt-10 sm:mt-14">
              {collection.products.map((p) => (
                <RevealItem key={p.id}>
                  <ProductCard signedIn={signedIn} {...cardProps(p)} />
                </RevealItem>
              ))}
            </RevealGroup>
            <Reveal>
              <div className="mt-12 text-center">
                <Link href={`/collections/${collection.slug}`} className="btn btn-gold">
                  Explore {collection.name}
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ------------------------------------------------ Brand story */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <Reveal>
            <div className="aspect-[4/3] bg-bg-deep overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/story-atelier.jpg"
                alt="Hands finishing a jewelry piece at the bench"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow">The maison</p>
            <h2 className="font-display text-3xl sm:text-4xl mt-3">Made to be kept.</h2>
            <p className="text-muted mt-5 leading-relaxed">
              Acrit Maison began with a simple conviction: that jewelry in Bangladesh can be modern, honest and
              quietly luxurious — without pretending to be something it is not.
            </p>
            <p className="text-muted mt-4 leading-relaxed">
              We work in small batches with trusted workshops. Every piece is inspected by hand before it is
              packed, and every material is stated plainly on the product page. No invented heritage. No empty
              claims. Just well-made jewelry.
            </p>
            <Link href="/about" className="btn btn-outline mt-8">
              Our story
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------ Craftsmanship / materials */}
      <section className="bg-bg-deep">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="eyebrow">Materials & craft</p>
              <h2 className="font-display text-3xl sm:text-4xl mt-3">What we make, and how</h2>
            </div>
          </Reveal>
          <RevealGroup className="grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "Precious metals",
                body: "Solid 18K and 22K gold, gold vermeil, and 925 sterling silver. Every karat and plating depth is stated plainly on each piece.",
                icon: "metal",
              },
              {
                title: "Hand finishing",
                body: "Casting, setting and polishing are done by hand in small runs. Each piece passes a final bench inspection before it leaves us.",
                icon: "hand",
              },
              {
                title: "Honest stones",
                body: "Natural and lab-grown stones, disclosed for exactly what they are — with clarity, cut and treatment information on every product page.",
                icon: "stone",
              },
            ].map((item) => (
              <RevealItem key={item.title}>
                <div className="card card-hover p-8 h-full">
                  <MaterialIcon kind={item.icon} />
                  <h3 className="font-display text-xl mt-5">{item.title}</h3>
                  <p className="text-muted text-sm mt-3 leading-relaxed">{item.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ------------------------------------------------ Trust */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <RevealGroup className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { title: "Insured delivery", body: "Insured courier across Bangladesh" },
              { title: "Cash on delivery", body: "Pay when your piece arrives" },
              { title: "Verified reviews", body: "Only from confirmed purchases" },
              { title: "WhatsApp care", body: "Real people, real answers" },
            ].map((t) => (
              <RevealItem key={t.title}>
                <div>
                  <p className="font-display text-lg">{t.title}</p>
                  <p className="text-muted text-sm mt-1.5">{t.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ------------------------------------------------ Social gallery */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <Reveal>
          <div className="text-center mb-10">
            <p className="eyebrow">@acritmaison</p>
            <h2 className="font-display text-3xl sm:text-4xl mt-3">Worn, not stored.</h2>
            <p className="text-muted text-sm mt-3 max-w-md mx-auto">
              Tag us in how you wear your pieces — we share a selection from our community.
            </p>
          </div>
        </Reveal>
        <RevealGroup className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {["gallery-1", "gallery-2", "gallery-3", "gallery-4"].map((img, i) => (
            <RevealItem key={img} className={i % 2 === 1 ? "sm:mt-8" : ""}>
              <div className="aspect-square bg-bg-deep overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/img/${img}.jpg`}
                  alt="Acrit Maison piece worn by a client"
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-[1.05]"
                />
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>
    </div>
  );
}

function MaterialIcon({ kind }: { kind: string }) {
  const common = { stroke: "var(--am-accent-deep)", strokeWidth: 1.3, fill: "none" } as const;
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
      {kind === "metal" && (
        <>
          <rect x="6" y="12" width="24" height="5" {...common} />
          <rect x="8" y="19" width="20" height="5" {...common} />
        </>
      )}
      {kind === "hand" && (
        <>
          <circle cx="18" cy="14" r="7" {...common} />
          <path d="M14 14l3 3 5-5" {...common} />
        </>
      )}
      {kind === "stone" && <path d="M18 6l8 9-8 15-8-15 8-9z" {...common} />}
    </svg>
  );
}
