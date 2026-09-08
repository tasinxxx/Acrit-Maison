import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/auth";
import { ProductCard } from "@/components/product-card";

export const dynamic = "force-dynamic";

export const metadata = { title: "Wishlist", robots: { index: false } };

export default async function WishlistPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login");

  const items = await prisma.wishlistItem.findMany({
    where: { customerId: customer.id },
    include: {
      product: {
        include: {
          images: { orderBy: { position: "asc" } },
          variants: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <header className="mb-10">
        <p className="eyebrow">Saved pieces</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-3">Wishlist</h1>
        <p className="text-muted mt-3 max-w-xl leading-relaxed">
          Pieces you have saved while browsing. Availability is shown live — a saved piece can sell out, and
          made-to-order pieces are always available.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-muted">Nothing saved yet.</p>
          <Link href="/shop" className="btn btn-primary mt-5">Discover pieces</Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {items.map((w) => {
            const p = w.product;
            const inStock = p.variants.some((v) => v.active && v.stock > 0);
            return (
              <li key={w.id}>
                <ProductCard
                  slug={p.slug}
                  name={p.name}
                  priceCents={p.priceCents}
                  compareAtCents={p.compareAtCents}
                  imageUrl={p.images[0]?.url ?? null}
                  isNew={p.isNewArrival}
                  isBestSeller={p.isBestSeller}
                  madeToOrder={p.madeToOrder}
                  inStock={inStock || p.madeToOrder || p.allowBackorder}
                  altText={p.images[0]?.alt || p.name}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
