import { prisma } from "@/lib/prisma";
import { getSettings, formatMoney } from "@/lib/settings";
import { reapExpiredPendingOrders } from "@/lib/orders";
import OrderStatusBadge from "@/components/order-status-badge";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  // Reap stale unpaid orders so inventory returns to stock automatically.
  const reaped = await reapExpiredPendingOrders();

  const [orderCount, paidRevenue, productCount, lowStock, pendingReviews, pendingBespoke, recentOrders] = await Promise.all([
    prisma.order.count(),
    prisma.order.findMany({ where: { status: { in: ["PAID", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "RETURN_REQUESTED", "RETURNED", "REFUNDED"] } }, select: { totalCents: true } }),
    prisma.product.count(),
    prisma.variant.findMany({ where: { active: true, stock: { lte: 2 } }, include: { product: { select: { name: true } } }, take: 8 }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.bespokeRequest.count({ where: { status: { in: ["NEW", "IN_REVIEW"] } } }),
    prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  const revenue = paidRevenue.reduce((s, o) => s + o.totalCents, 0);
  const settings = await getSettings();

  const kpis = [
    { label: "Orders", value: String(orderCount) },
    { label: "Paid revenue", value: formatMoney(revenue, settings.currency) },
    { label: "Products", value: String(productCount) },
    { label: "Pending reviews", value: String(pendingReviews) },
    { label: "Pending bespoke requests", value: String(pendingBespoke) },
  ];

  return (
    <div>
      {reaped > 0 && (
        <p className="card p-3 mb-6 text-sm text-muted">
          {reaped} unpaid order{reaped === 1 ? "" : "s"} older than 24 h were automatically cancelled and restocked.
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {kpis.map((k) => (
          <div key={k.label} className="card p-5">
            <p className="text-xs uppercase tracking-wide text-muted">{k.label}</p>
            <p className="font-display text-2xl mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-display text-xl mb-4">Low stock (≤ 2)</h2>
          {lowStock.length === 0 ? (
            <p className="text-muted text-sm">All variants are healthily stocked.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {lowStock.map((v) => (
                <li key={v.id} className="flex justify-between gap-3 p-3">
                  <span>
                    {v.product.name} — {v.optionName}
                  </span>
                  <span className={`font-semibold ${v.stock === 0 ? "text-danger" : "text-danger"}`}>
                    {v.stock} in stock
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="font-display text-xl mb-4">Pending reviews</h2>
          {pendingReviews === 0 ? (
            <p className="text-muted text-sm">No reviews awaiting check.</p>
          ) : (
            <p className="text-sm">
              <a href="/admin/reviews" className="text-accent-deep underline hover:text-accent">
                Review {pendingReviews} pending review{pendingReviews === 1 ? "" : "s"}.
              </a>
            </p>
          )}
        </section>

        <section className="card p-5">
          <h2 className="font-display text-xl mb-4">Recent orders</h2>
          {recentOrders.length === 0 ? (
            <p className="text-muted text-sm">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {recentOrders.map((o) => (
                <li key={o.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3">
                  <span>
                    <span className="font-medium">{o.number}</span>
                    <span className="text-muted"> · {o.email} · {formatMoney(o.totalCents, o.currency)}</span>
                    <span className="text-muted text-xs mt-1 inline-block">{o.items.length} line{o.items.length === 1 ? "" : "s"}</span>
                  </span>
                  <OrderStatusBadge status={o.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
