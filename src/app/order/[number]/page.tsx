import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/auth";
import { getSettings, formatMoney } from "@/lib/settings";
import { STATUS_META, TRACKING_STEPS, type OrderStatus } from "@/lib/orders";

type Params = { params: Promise<{ number: string }> };

export const dynamic = "force-dynamic";

export const metadata = { title: "Order confirmation", robots: { index: false } };

function paymentLabel(method: string): string {
  switch (method) {
    case "COD": return "Cash on delivery";
    case "BKASH": return "bKash";
    case "NAGAD": return "Nagad";
    case "CARD": return "Card (Stripe)";
    case "BANK_TRANSFER": return "Bank transfer";
    default: return method;
  }
}

export default async function OrderPage({
  params,
  searchParams,
}: Params & { searchParams: Promise<{ token?: string; paid?: string }> }) {
  const { number } = await params;
  const { token, paid } = await searchParams;

  const order = await prisma.order.findUnique({
    where: { number },
    include: { items: true },
  });
  if (!order) notFound();

  const customer = await getCurrentCustomer();
  const isOwner = customer && order.customerId === customer.id;
  const isStaff = customer?.role === "ADMIN";

  // Access: signed-in owner, staff, or the one-time access token from
  // checkout / the confirmation email. Everyone else sees nothing.
  const tokenValid = Boolean(token) && token === order.accessToken;
  if (!isOwner && !isStaff && !tokenValid) notFound();

  const settings = await getSettings();

  const status = order.status as OrderStatus;
  const meta = STATUS_META[status] ?? { label: status, description: "" };
  const stepIndex = TRACKING_STEPS.indexOf(status);
  const isTerminalBad = status === "CANCELLED" || status === "FAILED";

  const showPaymentInstructions =
    (order.paymentMethod === "BKASH" || order.paymentMethod === "NAGAD" || order.paymentMethod === "BANK_TRANSFER") &&
    order.paymentStatus === "PENDING";

  const canEdit = isStaff;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
      <div className="card p-8 text-center mb-8">
        {isTerminalBad ? (
          <p className="text-danger font-semibold">{meta.label}</p>
        ) : (
          <p className="text-success font-semibold">{meta.label}</p>
        )}
        <h1 className="font-display text-3xl mt-2">{order.number}</h1>
        <p className="text-muted mt-2 text-sm">{meta.description}</p>
        {paid === "1" && order.paymentStatus === "PAID" && (
          <p className="text-success text-sm mt-2">Payment received — thank you.</p>
        )}
      </div>

      {/* Tracker for the forward journey */}
      {!isTerminalBad && status !== "REFUNDED" && status !== "RETURNED" && (
        <section className="card p-6 mb-8" aria-label="Order progress">
          <ol className="space-y-3">
            {TRACKING_STEPS.map((step, i) => {
              const done = stepIndex >= i && stepIndex !== -1;
              const current = stepIndex === i;
              return (
                <li key={step} className="flex items-start gap-3 text-sm">
                  <span
                    aria-hidden="true"
                    className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${done ? "bg-accent" : "bg-line-strong"} ${current ? "ring-2 ring-accent-soft" : ""}`}
                  />
                  <span className={done ? "font-medium" : "text-muted"}>
                    {STATUS_META[step].label}
                    {current && <span className="block text-xs text-muted mt-0.5">{STATUS_META[step].description}</span>}
                  </span>
                </li>
              );
            })}
          </ol>
          {order.trackingNumber && (
            <p className="text-xs text-muted mt-4 border-t border-line pt-3">
              Carrier: {order.carrier ?? "—"} · Tracking: {order.trackingNumber}
            </p>
          )}
        </section>
      )}

      {/* Payment instructions for pending mobile-money / bank transfer orders */}
      {showPaymentInstructions && (
        <div className="card p-6 mb-8 text-sm">
          <h2 className="font-display text-xl mb-2">
            {order.paymentMethod === "BKASH"
              ? "bKash payment instructions"
              : order.paymentMethod === "NAGAD"
                ? "Nagad payment instructions"
                : "Bank transfer instructions"}
          </h2>
          {order.paymentMethod === "BKASH" && (
            <p className="text-muted">
              Send <strong>{formatMoney(order.totalCents, order.currency)}</strong> to the store's bKash
              number shown at checkout{settings.bkashNumber ? ` (${settings.bkashNumber})` : ""}, quoting order{" "}
              <strong>{order.number}</strong> as the reference. Then reply to your confirmation with the
              transaction ID, or send it to us on WhatsApp. Your order is held for 24 hours pending payment.
            </p>
          )}
          {order.paymentMethod === "NAGAD" && (
            <p className="text-muted">
              Send <strong>{formatMoney(order.totalCents, order.currency)}</strong> to the store's Nagad
              number shown at checkout{settings.nagadNumber ? ` (${settings.nagadNumber})` : ""}, quoting order{" "}
              <strong>{order.number}</strong> as the reference. Then reply to your confirmation with the
              transaction ID, or send it to us on WhatsApp. Your order is held for 24 hours pending payment.
            </p>
          )}
          {order.paymentMethod === "BANK_TRANSFER" && (
            <p className="text-muted">
              Transfer <strong>{formatMoney(order.totalCents, order.currency)}</strong> to {settings.storeName}.
              Quote order <strong>{order.number}</strong> as the reference. We ship once funds clear. The order
              is held for 24 hours pending payment.
            </p>
          )}
          {(order.paymentMethod === "BKASH" || order.paymentMethod === "NAGAD") && order.paymentRef && (
            <p className="text-xs text-muted mt-3 border-t border-line pt-3">
              Transaction ID recorded with your order: <strong>{order.paymentRef}</strong> — we verify it before
              preparation begins.
            </p>
          )}
        </div>
      )}

      {order.paymentMethod === "COD" && order.paymentStatus === "PENDING" && (
        <div className="card p-6 mb-8 text-sm">
          <h2 className="font-display text-xl mb-2">Cash on delivery</h2>
          <p className="text-muted">
            Keep <strong>{formatMoney(order.totalCents, order.currency)}</strong> ready for the courier. Pay in
            cash when your piece arrives.
          </p>
        </div>
      )}

      <section className="card p-6 mb-8">
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
          <div className="flex justify-between">
            <dt className="text-muted">Delivery ({order.deliveryZone === "INSIDE_DHAKA" ? "inside Dhaka" : "outside Dhaka"} · {order.shippingMethod.toLowerCase()})</dt>
            <dd>{order.shippingCents === 0 ? "Free" : formatMoney(order.shippingCents, order.currency)}</dd>
          </div>
          <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{formatMoney(order.totalCents, order.currency)}</dd></div>
          {order.taxCents > 0 && (
            <p className="text-xs text-muted">of which VAT {formatMoney(order.taxCents, order.currency)}</p>
          )}
          <p className="text-xs text-muted pt-1">Payment method: {paymentLabel(order.paymentMethod)}</p>
        </dl>
      </section>

      <section className="card p-6 text-sm mb-8">
        <h2 className="font-display text-xl mb-4">Delivery address</h2>
        <p className="text-muted">
          {order.shipFullName}<br />
          {order.shipLine1}{order.shipLine2 ? `, ${order.shipLine2}` : ""}{order.shipArea ? `, ${order.shipArea}` : ""}<br />
          {order.shipCity}, {order.shipRegion} {order.shipPostalCode}<br />
          {order.shipCountry}{order.shipPhone ? ` · ${order.shipPhone}` : ""}
        </p>
        <p className="text-xs text-muted mt-4">
          Questions about this order?{" "}
          <Link href="/contact" className="underline hover:text-ink">Contact the maison</Link> — quote your
          order number.
        </p>
      </section>

      {/* Staff status actions — plain HTML forms so they work without client JS */}
      {canEdit && (
        <section className="card p-6 mb-8" aria-label="Order actions">
          <h2 className="font-display text-xl mb-4">Update order</h2>
          <p className="text-sm text-muted mb-5">Use these forms to move the order to the next status. Each action sends an admin email when relevant.</p>

          <div className="grid gap-5 sm:grid-cols-2">
            {statusActionForms(status, order, settings)}
          </div>
        </section>
      )}
    </div>
  );
}

function statusActionForms(
  status: OrderStatus,
  order: { id: string; number: string; email: string; status: string; paymentMethod: string; carrier?: string | null; trackingNumber?: string | null },
  settings: { storeName: string },
) {
  const actions = orderActionsFor(status);
  if (actions.length === 0) {
    return <p className="text-sm text-muted">No further status actions are available for this order.</p>;
  }

  return actions.map((a) => (
    <form key={a.action} action={`/api/admin/orders/${order.id}`} method="POST" className="card p-4 border-line space-y-3 text-sm">
      <input type="hidden" name="action" value={a.action} />
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{a.label}</span>
        <button type="submit" className="btn btn-outline btn-sm shrink-0">{a.submitLabel ?? "Confirm"}</button>
      </div>
      {a.note && <p className="text-muted">{a.note}</p>}
      {a.needsTracking && (
        <div className="grid gap-3">
          <input name="carrier" defaultValue={order.carrier ?? ""} className="input" placeholder="Carrier (e.g. Pathao, Sundarban)" maxLength={80} />
          <input name="trackingNumber" defaultValue={order.trackingNumber ?? ""} className="input" placeholder="Tracking number" maxLength={80} />
        </div>
      )}
      {a.confirmDanger && (
        <p className="text-danger text-xs">This is permanent. {a.confirmDanger}</p>
      )}
    </form>
  ));
}

type StatusAction = {
  action: string;
  label: string;
  submitLabel?: string;
  note?: string;
  needsTracking?: boolean;
  confirmDanger?: string;
};

function orderActionsFor(status: OrderStatus): StatusAction[] {
  // Actions follow the Bangladesh-first lifecycle in src/lib/orders.ts.
  // Only show what is legal from the current status; the API enforces the same rules.
  const ACTIONS: Record<string, StatusAction[]> = {
    PENDING: [
      { action: "markPaid", label: "Mark paid", note: "Move to preparation immediately." },
      { action: "process", label: "Start preparation" },
      { action: "cancel", label: "Cancel order", submitLabel: "Cancel", confirmDanger: "Reserved stock will be released and the customer will get a cancellation email." },
      { action: "markFailed", label: "Mark failed", submitLabel: "Fail", confirmDanger: "Reserved stock will be released and the customer will get a failure email." },
    ],
    PAYMENT_PENDING: [
      { action: "markPaid", label: "Mark paid", note: "Move to preparation immediately." },
      { action: "cancel", label: "Cancel order", submitLabel: "Cancel", confirmDanger: "Reserved stock will be released and the customer will get a cancellation email." },
      { action: "markFailed", label: "Mark failed", submitLabel: "Fail", confirmDanger: "Reserved stock will be released and the customer will get a failure email." },
    ],
    PAID: [
      { action: "process", label: "Start preparation" },
      { action: "cancel", label: "Cancel order", submitLabel: "Cancel", confirmDanger: "Reserved stock will be released and the customer will get a cancellation email." },
      { action: "refund", label: "Refund", submitLabel: "Refund", confirmDanger: "This refunds the order and restores stock." },
    ],
    PROCESSING: [
      { action: "pack", label: "Mark packed" },
      { action: "cancel", label: "Cancel order", submitLabel: "Cancel", confirmDanger: "Reserved stock will be released and the customer will get a cancellation email." },
      { action: "refund", label: "Refund", submitLabel: "Refund", confirmDanger: "This refunds the order and restores stock." },
    ],
    PACKED: [
      { action: "ship", label: "Mark shipped", submitLabel: "Confirm shipment", needsTracking: true },
      { action: "cancel", label: "Cancel order", submitLabel: "Cancel", confirmDanger: "Reserved stock will be released and the customer will get a cancellation email." },
      { action: "refund", label: "Refund", submitLabel: "Refund", confirmDanger: "This refunds the order and restores stock." },
    ],
    SHIPPED: [
      { action: "outForDelivery", label: "Out for delivery" },
      { action: "requestReturn", label: "Return requested" },
      { action: "refund", label: "Refund", submitLabel: "Refund", confirmDanger: "This refunds the order and restores stock." },
    ],
    OUT_FOR_DELIVERY: [
      { action: "deliver", label: "Mark delivered" },
      { action: "requestReturn", label: "Return requested" },
    ],
    DELIVERED: [
      { action: "requestReturn", label: "Return requested" },
      { action: "refund", label: "Refund", submitLabel: "Refund", confirmDanger: "This refunds the order and restores stock." },
    ],
    RETURN_REQUESTED: [
      { action: "markReturned", label: "Mark returned" },
      { action: "deliver", label: "Decline return", note: "Keep the order as delivered." },
    ],
    RETURNED: [
      { action: "refund", label: "Refund", submitLabel: "Refund", confirmDanger: "This refunds the order and restores stock." },
    ],
    CANCELLED: [],
    REFUNDED: [],
    FAILED: [],
  };

  return ACTIONS[status] ?? [];
}
