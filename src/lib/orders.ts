import { prisma } from "./prisma";

// Order lifecycle transitions (Bangladesh-first jewelry fulfilment). All
// transitions are validated here so no route can move an order into an
// impossible state.
//
//   PENDING           -> PAYMENT_PENDING | PAID | PROCESSING | CANCELLED | FAILED
//   PAYMENT_PENDING   -> PAID | CANCELLED | FAILED
//   PAID              -> PROCESSING | CANCELLED | REFUNDED
//   PROCESSING        -> PACKED | CANCELLED | REFUNDED
//   PACKED            -> SHIPPED | CANCELLED | REFUNDED
//   SHIPPED           -> OUT_FOR_DELIVERY | RETURN_REQUESTED | REFUNDED
//   OUT_FOR_DELIVERY  -> DELIVERED | RETURN_REQUESTED
//   DELIVERED         -> RETURN_REQUESTED | REFUNDED
//   RETURN_REQUESTED  -> RETURNED | DELIVERED (request declined)
//   RETURNED          -> REFUNDED
//   CANCELLED, REFUNDED, FAILED are terminal.

export const ORDER_STATUSES = [
  "PENDING",
  "PAYMENT_PENDING",
  "PAID",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
  "FAILED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAYMENT_PENDING", "PAID", "PROCESSING", "CANCELLED", "FAILED"],
  PAYMENT_PENDING: ["PAID", "CANCELLED", "FAILED"],
  PAID: ["PROCESSING", "CANCELLED", "REFUNDED"],
  PROCESSING: ["PACKED", "CANCELLED", "REFUNDED"],
  PACKED: ["SHIPPED", "CANCELLED", "REFUNDED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "RETURN_REQUESTED", "REFUNDED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "RETURN_REQUESTED"],
  DELIVERED: ["RETURN_REQUESTED", "REFUNDED"],
  RETURN_REQUESTED: ["RETURNED", "DELIVERED"],
  RETURNED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
  FAILED: [],
};

export function canTransition(from: string, to: OrderStatus): boolean {
  return (TRANSITIONS[from as OrderStatus] ?? []).includes(to);
}

export const STATUS_TIMESTAMPS: Partial<Record<OrderStatus, string>> = {
  PAID: "paidAt",
  PROCESSING: "processingAt",
  PACKED: "packedAt",
  SHIPPED: "shippedAt",
  OUT_FOR_DELIVERY: "outForDeliveryAt",
  DELIVERED: "deliveredAt",
  CANCELLED: "cancelledAt",
  REFUNDED: "refundedAt",
  RETURN_REQUESTED: "returnRequestedAt",
  RETURNED: "returnedAt",
  FAILED: "failedAt",
};

// Payment status is derived from the order status so it can never disagree.
export function paymentStatusFor(status: OrderStatus): string {
  if (status === "PAID" || status === "PROCESSING" || status === "PACKED" || status === "SHIPPED" ||
      status === "OUT_FOR_DELIVERY" || status === "DELIVERED" || status === "RETURN_REQUESTED" || status === "RETURNED") {
    return "PAID";
  }
  if (status === "REFUNDED") return "REFUNDED";
  if (status === "FAILED") return "FAILED";
  return "PENDING";
}

// Statuses at which the customer has paid and may review.
export const PAID_STATUSES: OrderStatus[] = [
  "PAID",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
];

// Human-readable labels + short descriptions for the customer-facing tracker.
export const STATUS_META: Record<OrderStatus, { label: string; description: string }> = {
  PENDING: { label: "Order received", description: "We have your order and are confirming the details." },
  PAYMENT_PENDING: { label: "Awaiting payment", description: "Complete the payment to begin crafting your order." },
  PAID: { label: "Payment confirmed", description: "Payment received. Your order is confirmed." },
  PROCESSING: { label: "In preparation", description: "Your pieces are being prepared and quality-checked." },
  PACKED: { label: "Packed", description: "Packed with care in our signature box, ready for courier handover." },
  SHIPPED: { label: "Shipped", description: "Handed to the courier and on the way." },
  OUT_FOR_DELIVERY: { label: "Out for delivery", description: "The courier will arrive today." },
  DELIVERED: { label: "Delivered", description: "Delivered. We hope you love it." },
  CANCELLED: { label: "Cancelled", description: "This order was cancelled. Stock has been returned." },
  RETURN_REQUESTED: { label: "Return requested", description: "We have received your return request and will contact you." },
  RETURNED: { label: "Returned", description: "The return is complete and being inspected for refund." },
  REFUNDED: { label: "Refunded", description: "Your refund has been processed." },
  FAILED: { label: "Payment failed", description: "The payment could not be completed. Stock has been released." },
};

// The forward "journey" shown in the tracking timeline, in order.
export const TRACKING_STEPS: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export async function restockOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.restocked) return;
  for (const item of order.items) {
    if (!item.variantId) continue;
    await prisma.variant.update({
      where: { id: item.variantId },
      data: { stock: { increment: item.quantity } },
    }).catch(() => undefined); // variant may have been deleted; skip
  }
  await prisma.order.update({ where: { id: orderId }, data: { restocked: true } });
}

export async function applyTransition(
  orderId: string,
  to: OrderStatus,
  extra?: { carrier?: string; trackingNumber?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "Order not found." };
  if (!canTransition(order.status, to)) {
    return { ok: false, error: `Cannot move an order from ${order.status} to ${to}.` };
  }

  const now = new Date();
  const data: Record<string, unknown> = { status: to, paymentStatus: paymentStatusFor(to) };

  const tsField = STATUS_TIMESTAMPS[to];
  if (tsField) data[tsField] = now;
  if (to === "SHIPPED") {
    if (extra?.carrier !== undefined) data.carrier = extra.carrier;
    if (extra?.trackingNumber !== undefined) data.trackingNumber = extra.trackingNumber;
  }

  await prisma.order.update({ where: { id: orderId }, data });

  // Cancel, fail, return and refund return goods to stock exactly once.
  if (to === "CANCELLED" || to === "FAILED" || to === "RETURNED" || to === "REFUNDED") {
    await restockOrder(orderId);
  }

  return { ok: true };
}

// Unpaid COD/mobile-money orders older than the grace window are cancelled and
// restocked. Called opportunistically by the admin dashboard and order list.
export const PAYMENT_GRACE_HOURS = 24;

export async function reapExpiredPendingOrders(): Promise<number> {
  const cutoff = new Date(Date.now() - PAYMENT_GRACE_HOURS * 60 * 60 * 1000);
  const stale = await prisma.order.findMany({
    where: { status: { in: ["PENDING", "PAYMENT_PENDING"] }, createdAt: { lt: cutoff } },
    select: { id: true },
  });
  for (const order of stale) {
    await applyTransition(order.id, "CANCELLED");
  }
  return stale.length;
}
