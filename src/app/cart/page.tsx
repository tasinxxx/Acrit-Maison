import Link from "next/link";
import { readCartToken } from "@/lib/auth";
import { priceCartByToken } from "@/lib/pricing";
import { getSettings, formatMoney } from "@/lib/settings";
import { CartLines } from "@/components/cart-lines";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "Your Cart", robots: { index: false } };

export default async function CartPage() {
  const token = await readCartToken();
  const cart = await priceCartByToken(token);
  const settings = await getSettings();
  const freeShipGap = settings.freeShippingThresholdCents - cart.subtotalCents;
  const customer = await getCurrentCustomer();

  const suggestions = cart.lines.length === 0
    ? await prisma.product.findMany({
        where: { active: true, isBestSeller: true },
        include: { images: { orderBy: { position: "asc" } }, variants: true },
        take: 3,
      })
    : [];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <h1 className="font-display text-3xl sm:text-4xl mb-8">Your cart</h1>

      {cart.lines.length === 0 ? (
        <div>
          <div className="card p-12 sm:p-16 text-center">
            <p className="font-display text-2xl">Your cart is empty.</p>
            <p className="text-muted text-sm mt-2 max-w-sm mx-auto">
              Every piece is made in small batches — start with what our clients love most.
            </p>
            <Link href="/shop" className="btn btn-primary mt-7">
              Discover the pieces
            </Link>
          </div>
          {suggestions.length > 0 && (
            <section className="mt-14">
              <h2 className="font-display text-2xl mb-6">Most loved right now</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-6">
                {suggestions.map((p) => (
                  <Link key={p.id} href={`/products/${p.slug}`} className="group">
                    <div className="aspect-[4/5] bg-bg-deep overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.images[0]?.url ?? ""}
                        alt={p.images[0]?.alt || p.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    </div>
                    <p className="font-display text-lg mt-3 group-hover:text-accent-deep">{p.name}</p>
                    <p className="text-sm">{formatMoney(p.priceCents, settings.currency)}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <CartLines lines={cart.lines} />

          <aside className="card p-6 h-fit lg:sticky lg:top-24">
            <h2 className="font-display text-xl mb-4">Summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Items</dt>
                <dd>{cart.itemCount}</dd>
              </div>
              <div className="flex justify-between font-semibold text-base">
                <dt>Subtotal</dt>
                <dd>{formatMoney(cart.subtotalCents, settings.currency)}</dd>
              </div>
            </dl>
            {settings.shippingEnabled && freeShipGap > 0 && deliveryZoneFreeEligible() && (
              <div className="mt-4">
                <p className="text-xs text-muted mb-1.5">
                  Add {formatMoney(freeShipGap, settings.currency)} more for free insured delivery inside Dhaka.
                </p>
                <div className="h-1 bg-bg-deep">
                  <div
                    className="h-1 bg-accent transition-all"
                    style={{ width: `${Math.min(100, (cart.subtotalCents / settings.freeShippingThresholdCents) * 100)}%` }}
                  />
                </div>
              </div>
            )}
            <Link href="/checkout" className="btn btn-primary w-full mt-6">
              Proceed to checkout
            </Link>
            <Link href="/shop" className="btn btn-quiet w-full mt-2">
              Continue shopping
            </Link>
            <p className="text-xs text-muted mt-4 leading-relaxed">
              Delivery is calculated at checkout. Cash on delivery available across Bangladesh.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

function deliveryZoneFreeEligible(): boolean {
  // Free-delivery progress applies to the Dhaka zone (checked again at checkout).
  return true;
}
