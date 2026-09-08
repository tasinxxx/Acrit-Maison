import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/auth";
import { getSettings, formatMoney } from "@/lib/settings";
import { PAID_STATUSES } from "@/lib/orders";
import { AccountActions } from "@/components/account-actions";
import { ReviewForm } from "@/components/review-form";
import OrderStatusBadge from "@/components/order-status-badge";

export const dynamic = "force-dynamic";

export const metadata = { title: "My account", robots: { index: false } };

export default async function AccountPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login");

  const [orders, wishlist, addresses] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: customer.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.wishlistItem.findMany({
      where: { customerId: customer.id },
      include: { product: { include: { images: true, variants: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.address.findMany({
      where: { customerId: customer.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const settings = await getSettings();

  // Products from paid orders that the customer has not yet reviewed.
  const myReviews = await prisma.review.findMany({ where: { customerId: customer.id } });
  const reviewedProductIds = new Set(myReviews.map((r) => r.productId));
  const purchasedProductIds = new Set(
    orders
      .filter((o) => (PAID_STATUSES as string[]).includes(o.status))
      .flatMap((o) => o.items.map((i) => i.productId)),
  );
  const reviewableIds = [...purchasedProductIds].filter((id) => !reviewedProductIds.has(id));
  const reviewableProducts =
    reviewableIds.length > 0
      ? await prisma.product.findMany({ where: { id: { in: reviewableIds } }, select: { id: true, name: true } })
      : [];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">My account</h1>
          <p className="text-muted mt-1">
            {customer.name} · {customer.email}
            {customer.role === "ADMIN" && (
              <>
                {" · "}
                <a href="/admin" className="underline hover:text-ink">Admin dashboard</a>
              </>
            )}
          </p>
        </div>
        <AccountActions />
      </div>

      <section className="mb-10">
        <h2 className="font-display text-2xl mb-4">Orders</h2>
        {orders.length === 0 ? (
          <p className="text-muted">No orders yet.</p>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => (
              <li key={o.id} className="card p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <a href={`/order/${o.number}`} className="font-medium hover:text-accent">{o.number}</a>
                    <p className="text-xs text-muted">
                      {o.createdAt.toLocaleDateString("en-IE", { year: "numeric", month: "short", day: "numeric" })} ·{" "}
                      {o.items.length} item{o.items.length === 1 ? "" : "s"} · {formatMoney(o.totalCents, o.currency)}
                    </p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl mb-4">Wishlist</h2>
        {wishlist.length === 0 ? (
          <p className="text-muted">Nothing saved yet.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {wishlist.map((w) => (
              <li key={w.id} className="card p-4 flex items-center justify-between gap-3">
                <div>
                  <a href={`/products/${w.product.slug}`} className="font-medium hover:text-accent">
                    {w.product.name}
                  </a>
                  <p className="text-xs text-muted">
                    {w.product.variants.some((v) => v.active && v.stock > 0) ? "In stock" : "Out of stock"}
                  </p>
                </div>
                <a href={`/products/${w.product.slug}`} className="text-sm underline hover:text-ink">
                  View
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl mb-4">Addresses</h2>
        {addresses.length === 0 ? (
          <p className="text-muted">No saved addresses. One is saved automatically when you tick “save address” at checkout.</p>
        ) : (
          <ul className="space-y-3">
            {addresses.map((a) => (
              <li key={a.id} className="card p-4 text-sm">
                <p className="font-medium">
                  {a.fullName} {a.isDefault && <span className="badge bg-green-100 text-green-900 ml-1">default</span>}
                </p>
                <p className="text-muted">
                  {a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.region} {a.postalCode}, {a.country}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {reviewableProducts.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-4">Review your purchases</h2>
          <p className="text-muted text-sm mb-4">
            Reviews are checked before publication. Only verified purchases can be reviewed.
          </p>
          <div className="space-y-4">
            {reviewableProducts.map((p) => (
              <ReviewForm key={p.id} productId={p.id} productName={p.name} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
