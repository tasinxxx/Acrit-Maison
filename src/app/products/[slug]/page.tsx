import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings, whatsappLink } from "@/lib/settings";
import { ProductCard } from "@/components/product-card";
import { AddToCartForm } from "@/components/add-to-cart-form";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductGallery } from "@/components/product-gallery";
import { SizeGuideDialog } from "@/components/size-guide-dialog";
import { Reveal } from "@/components/motion/reveal";
import { getCurrentCustomer } from "@/lib/auth";
import { PAID_STATUSES } from "@/lib/orders";

type Params = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  let product = null;
  try {
    product = await prisma.product.findUnique({
      where: { slug },
      include: { images: { orderBy: { position: "asc" } } },
    });
  } catch {
    // Database unavailable at build time (e.g. no local PostgreSQL).
    // Return generic metadata; runtime metadata is produced by the page itself.
  }
  if (!product) return { title: "Acrit Maison — Fine Jewelry" };
  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.shortDescription,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.seoTitle || product.name,
      description: product.seoDescription || product.shortDescription,
      images: product.images.length > 0 ? [{ url: product.images[0].url }] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { optionName: "asc" } },
      category: true,
      collection: true,
      reviews: {
        where: { status: "APPROVED" },
        include: { customer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!product || !product.active) notFound();

  const settings = await getSettings();
  const customer = await getCurrentCustomer();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Wishlist state for the signed-in customer.
  let wishlisted = false;
  if (customer) {
    const item = await prisma.wishlistItem.findUnique({
      where: { customerId_productId: { customerId: customer.id, productId: product.id } },
    });
    wishlisted = Boolean(item);
  }

  // Complete the look: same collection, then same category.
  const completeTheLook = await prisma.product.findMany({
    where: {
      active: true,
      id: { not: product.id },
      ...(product.collectionId ? { collectionId: product.collectionId } : product.categoryId ? { categoryId: product.categoryId } : {}),
    },
    include: { images: { orderBy: { position: "asc" } }, variants: true },
    take: 4,
    orderBy: { isBestSeller: "desc" },
  });

  const variants = product.variants.map((v) => ({
    id: v.id,
    optionName: v.optionName,
    sku: v.sku,
    unitPriceCents: product.priceCents + v.priceDeltaCents,
    stock: v.stock,
    active: v.active,
  }));

  const activeVariants = variants.filter((v) => v.active);
  const totalStock = activeVariants.reduce((n, v) => n + v.stock, 0);
  const hasRingSizes = product.variants.some((v) => /^(1[2-9]|2[0-4])$/.test(v.size ?? ""));
  const hasBangleSizes = product.variants.some((v) => /^(2\.[2-9]|3\.0)$/.test(v.size ?? ""));
  const isNecklace = product.category?.slug === "necklaces";

  const rating =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : null;

  const specs = [
    { label: "Material", value: product.material },
    { label: "Purity", value: product.purity },
    { label: "Stone", value: product.gemstone },
    { label: "Weight", value: product.weightGrams ? `${product.weightGrams} g` : "" },
    { label: "Dimensions", value: product.dimensions },
  ].filter((s) => s.value);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        description: product.shortDescription || product.description,
        sku: activeVariants[0]?.sku,
        brand: { "@type": "Brand", name: settings.storeName },
        image: product.images.map((i) => (i.url.startsWith("http") ? i.url : `${siteUrl}${i.url}`)),
        ...(rating
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: rating.toFixed(1),
                reviewCount: product.reviews.length,
              },
            }
          : {}),
        ...(activeVariants.length > 0
          ? {
              offers: {
                "@type": "Offer",
                priceCurrency: settings.currency,
                price: (Math.min(...activeVariants.map((v) => v.unitPriceCents)) / 100).toFixed(2),
                availability:
                  totalStock > 0 || product.madeToOrder || product.allowBackorder
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                url: `${siteUrl}/products/${product.slug}`,
              },
            }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Shop", item: `${siteUrl}/shop` },
          ...(product.category
            ? [{ "@type": "ListItem", position: 3, name: product.category.name, item: `${siteUrl}/shop?category=${product.category.slug}` }]
            : []),
          { "@type": "ListItem", position: product.category ? 4 : 3, name: product.name },
        ],
      },
    ],
  };

  const waMessage = `Hello Acrit Maison, I'd like to ask about the ${product.name} (${siteUrl}/products/${product.slug}).`;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-xs tracking-[0.14em] uppercase text-muted mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <Link href="/shop" className="hover:text-ink">Shop</Link>
        {product.category && (
          <>
            <span className="mx-2" aria-hidden="true">/</span>
            <Link href={`/shop?category=${product.category.slug}`} className="hover:text-ink">
              {product.category.name}
            </Link>
          </>
        )}
        <span className="mx-2" aria-hidden="true">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery
          images={product.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt }))}
          name={product.name}
        />

        <div>
          {product.collection && (
            <p className="eyebrow">
              <Link href={`/collections/${product.collection.slug}`} className="hover:text-accent-deep">
                {product.collection.name}
              </Link>
            </p>
          )}
          <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] leading-tight mt-2">{product.name}</h1>
          {rating && (
            <p className="text-sm text-muted mt-2" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
              <span className="text-accent-deep" aria-hidden="true">{"★".repeat(Math.round(rating))}</span>{" "}
              {rating.toFixed(1)} · {product.reviews.length} verified review{product.reviews.length === 1 ? "" : "s"}
            </p>
          )}

          <p className="text-muted mt-4 leading-relaxed">{product.shortDescription}</p>

          <AddToCartForm
            variants={variants}
            basePriceCents={product.priceCents}
            compareAtCents={product.compareAtCents}
            currency={settings.currency}
            allowBackorder={product.allowBackorder}
            madeToOrder={product.madeToOrder}
            productName={product.name}
            slug={product.slug}
          />

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <WishlistButton productId={product.id} slug={product.slug} signedIn={Boolean(customer)} initialSaved={wishlisted} />
            <a
              href={whatsappLink(settings.whatsappNumber, waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-quiet"
            >
              Ask on WhatsApp
            </a>
          </div>

          {/* Specs */}
          {specs.length > 0 && (
            <dl className="mt-9 border-t border-line pt-7 space-y-3 text-sm">
              {specs.map((s) => (
                <div key={s.label} className="grid grid-cols-[110px_1fr] gap-3">
                  <dt className="text-muted">{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {/* Size guides */}
          {(hasRingSizes || hasBangleSizes || isNecklace) && (
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {hasRingSizes && (
                <span>
                  Need a ring size? <SizeGuideDialog kind="ring" />
                </span>
              )}
              {hasBangleSizes && (
                <span>
                  Need a bangle size? <SizeGuideDialog kind="bracelet" />
                </span>
              )}
              {isNecklace && (
                <span>
                  Chain lengths explained — <SizeGuideDialog kind="necklace" />
                </span>
              )}
            </div>
          )}

          {/* Details accordions */}
          <div className="mt-9 border-t border-line">
            {product.description && (
              <details className="group border-b border-line">
                <summary className="flex items-center justify-between py-4 cursor-pointer text-sm font-medium tracking-[0.06em] uppercase">
                  The piece
                  <span className="text-muted transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="text-muted text-sm leading-relaxed pb-5 whitespace-pre-line">{product.description}</p>
              </details>
            )}
            <details className="group border-b border-line">
              <summary className="flex items-center justify-between py-4 cursor-pointer text-sm font-medium tracking-[0.06em] uppercase">
                Delivery & returns
                <span className="text-muted transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <div className="text-muted text-sm leading-relaxed pb-5 space-y-2">
                <p>
                  Inside Dhaka: 1–2 working days (standard) or same-day (express). Outside Dhaka: 2–4 working
                  days. Complimentary insured standard delivery inside Dhaka on orders over ৳20,000.
                </p>
                <p>Cash on delivery available. Every order ships in signature packaging with an insured courier.</p>
                <p>
                  Returns accepted within 7 days of delivery for unworn pieces in original packaging — see{" "}
                  <Link href="/delivery-returns" className="underline hover:text-ink">
                    delivery &amp; returns
                  </Link>{" "}
                  for details.
                </p>
              </div>
            </details>
            <details className="group border-b border-line">
              <summary className="flex items-center justify-between py-4 cursor-pointer text-sm font-medium tracking-[0.06em] uppercase">
                Care
                <span className="text-muted transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <div className="text-muted text-sm leading-relaxed pb-5 space-y-2">
                {product.careInstructions && <p>{product.careInstructions}</p>}
                <p>
                  Read the full{" "}
                  <Link href="/care-guide" className="underline hover:text-ink">
                    jewelry care guide
                  </Link>
                  .
                </p>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-20 sm:mt-28 border-t border-line pt-12">
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl">
            Reviews{" "}
            {product.reviews.length > 0 && (
              <span className="text-muted text-lg font-normal">({product.reviews.length})</span>
            )}
          </h2>
          <p className="text-muted text-sm mt-2">
            Only customers with a confirmed purchase can review — every review is verified and checked before
            publication.
          </p>
          {product.reviews.length === 0 ? (
            <p className="text-muted text-sm mt-6 card p-6">
              No reviews yet. Verified buyers can review this piece from their account after delivery.
            </p>
          ) : (
            <ul className="mt-8 space-y-5">
              {product.reviews.map((r) => (
                <li key={r.id} className="card p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{r.title}</span>
                    <span className="text-sm text-accent-deep" aria-label={`${r.rating} out of 5`}>
                      {"★".repeat(r.rating)}
                      <span className="text-line" aria-hidden="true">{"★".repeat(5 - r.rating)}</span>
                    </span>
                  </div>
                  <p className="text-muted text-sm mt-2 leading-relaxed">{r.body}</p>
                  <p className="text-xs text-muted mt-3 flex items-center gap-2">
                    <span>{r.customer.name}</span>
                    <span className="badge badge-success">Verified purchase</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Complete the look */}
      {completeTheLook.length > 0 && (
        <section className="mt-20 sm:mt-28 border-t border-line pt-12">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="eyebrow">Styled together</p>
              <h2 className="font-display text-3xl mt-2">Complete the look</h2>
            </div>
            <Link href="/shop" className="text-sm text-muted hover:text-accent-deep hidden sm:block">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6">
            {completeTheLook.map((p) => {
              const minDelta = p.variants.length > 0 ? Math.min(...p.variants.map((v) => v.priceDeltaCents)) : 0;
              return (
                <Reveal key={p.id}>
                  <RelatedCard p={p} minDelta={minDelta} signedIn={Boolean(customer)} />
                </Reveal>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function RelatedCard({
  p,
  minDelta,
  signedIn,
}: {
  p: {
    slug: string; name: string; priceCents: number; compareAtCents: number | null; isNewArrival: boolean;
    isBestSeller: boolean; madeToOrder: boolean; images: { url: string; alt: string }[];
    variants: { stock: number; active: boolean }[];
  };
  minDelta: number;
  signedIn: boolean;
}) {
  return (
    <ProductCard
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
      signedIn={signedIn}
    />
  );
}
