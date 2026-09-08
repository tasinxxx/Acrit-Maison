import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { formatMoney, getSettings } from "@/lib/settings";
import OrderStatusBadge from "@/components/order-status-badge";

type Params = { params: Promise<{ number: string }> };

export const dynamic = "force-dynamic";

export const metadata = { title: "Order details", robots: { index: false } };

export default async function AdminOrderDetailPage({ params }: Params) {
  await requireAdmin();
  const { number } = await params;

  const order = await prisma.order.findUnique({
    where: { number },
    include: { items: { orderBy: { unitPriceCents: "desc" } } },
  });
  if (!order) notFound();

  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <nav className="flex items-center gap-2 text-sm text-muted mb-6">
        <a href="/admin/orders" className="hover:text-ink">Orders</a>
        <span aria-hidden="true">/</span>
        <span className="text-ink font-medium">{order.number}</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl">{order.number}</h1>
          <p className="text-muted text-sm mt-1">
            {order.email} · {new Date(order.createdAt).toLocaleString("en-IE")} ·{" "}
            {order.paymentMethod === "COD" ? "Cash on delivery" : order.paymentMethod}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-display text-xl mb-4">Items</h2>
          <ul className="space-y-3 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span>
                  <span className="font-medium">{item.name}</span>
                  {item.variantName && <span className="text-muted"> — {item.variantName}</span>}
                  <span className="text-muted block text-xs">SKU {item.sku} × {item.quantity}</span>
                </span>
                <span>{formatMoney(item.lineTotalCents, order.currency)}</span>
              </li>
            ))}
          </ul>
          <dl className="border-t border-line mt-4 pt-4 space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatMoney(order.subtotalCents, order.currency)}</dd></div>
            {order.discountCents > 0 && (
              <div className="flex justify-between text-success"><dt>Discount {order.couponCode ? `(${order.couponCode})` : ""}</dt><dd>−{formatMoney(order.discountCents, order.currency)}</dd></div>
            )}
            <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{order.shippingCents === 0 ? "Free" : formatMoney(order.shippingCents, order.currency)}</dd></div>
            <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{formatMoney(order.totalCents, order.currency)}</dd></div>
            {order.taxCents > 0 && <p className="text-xs text-muted">of which VAT {formatMoney(order.taxCents, order.currency)}</p>}
          </dl>
        </section>

        <section className="card p-6">
          <h2 className="font-display text-xl mb-4">Shipping</h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Name</dt><dd>{order.shipFullName}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Address</dt><dd>{order.shipLine1}{order.shipLine2 ? `, ${order.shipLine2}` : ""}{order.shipArea ? `, ${order.shipArea}` : ""}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">City</dt><dd>{order.shipCity}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Division</dt><dd>{order.shipRegion}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Postal code</dt><dd>{order.shipPostalCode}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Phone</dt><dd>{order.shipPhone ?? "—"}</dd></div>
            {order.carrier && <div className="flex justify-between"><dt className="text-muted">Carrier</dt><dd>{order.carrier}</dd></div>}
            {order.trackingNumber && <div className="flex justify-between"><dt className="text-muted">Tracking</dt><dd>{order.trackingNumber}</dd></div>}
          </dl>
        </section>

        <section className="card p-6 lg:col-span-2">
          <h2 className="font-display text-xl mb-4">Order timeline</h2>
          <ul className="divide-y divide-line text-sm">
            <TimelineRow label="Status" value={order.status.replace(/_/g, " ")} />
            <TimelineRow label="Payment status" value={order.paymentStatus.replace(/_/g, " ")} />
            {order.paidAt && <TimelineRow label="Paid" value={new Date(order.paidAt).toLocaleString("en-IE")} />}
            {order.processingAt && <TimelineRow label="Preparation started" value={new Date(order.processingAt).toLocaleString("en-IE")} />}
            {order.packedAt && <TimelineRow label="Packed" value={new Date(order.packedAt).toLocaleString("en-IE")} />}
            {order.shippedAt && <TimelineRow label="Shipped" value={new Date(order.shippedAt).toLocaleString("en-IE")} />}
            {order.outForDeliveryAt && <TimelineRow label="Out for delivery" value={new Date(order.outForDeliveryAt).toLocaleString("en-IE")} />}
            {order.deliveredAt && <TimelineRow label="Delivered" value={new Date(order.deliveredAt).toLocaleString("en-IE")} />}
            {order.cancelledAt && <TimelineRow label="Cancelled" value={new Date(order.cancelledAt).toLocaleString("en-IE")} />}
            {order.failedAt && <TimelineRow label="Failed" value={new Date(order.failedAt).toLocaleString("en-IE")} />}
            {order.refundedAt && <TimelineRow label="Refunded" value={new Date(order.refundedAt).toLocaleString("en-IE")} />}
            {order.returnRequestedAt && <TimelineRow label="Return requested" value={new Date(order.returnRequestedAt).toLocaleString("en-IE")} />}
            {order.returnedAt && <TimelineRow label="Returned" value={new Date(order.returnedAt).toLocaleString("en-IE")} />}
            {order.customerNote && <TimelineRow label="Note" value={order.customerNote} />}
          </ul>
        </section>
      </div>
    </div>
  );
}

function TimelineRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between gap-3 py-2">
      <span className="text-muted">{label}</span>
      <span className="text-ink">{value}</span>
    </li>
  );
}
