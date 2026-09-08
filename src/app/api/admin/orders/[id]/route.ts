import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { applyTransition, ORDER_STATUSES, type OrderStatus } from "@/lib/orders";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { formatMoney, getSettings } from "@/lib/settings";

const map: Record<string, OrderStatus> = {
  markPaid: "PAID",
  process: "PROCESSING",
  pack: "PACKED",
  ship: "SHIPPED",
  outForDelivery: "OUT_FOR_DELIVERY",
  deliver: "DELIVERED",
  cancel: "CANCELLED",
  refund: "REFUNDED",
  requestReturn: "RETURN_REQUESTED",
  markReturned: "RETURNED",
  markFailed: "FAILED",
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) return jsonError("Order not found.", 404);
    return jsonOk({
      id: order.id,
      number: order.number,
      email: order.email,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentRef: order.paymentRef ?? null,
      totalCents: order.totalCents,
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
      itemCount: order.items.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Accept either a JSON body (Classic/React form action wire-up) or a
    // FormData body (server action POST from status-driven forms). Fail closed
    // when neither parses cleanly.
    let body: { action?: unknown; carrier?: unknown; trackingNumber?: unknown };
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      body = await request.json().catch(() => ({}));
    } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const fd = await request.formData();
      body = {
        action: fd.get("action"),
        carrier: fd.get("carrier"),
        trackingNumber: fd.get("trackingNumber"),
      };
    } else {
      body = await request.json().catch(() => ({}));
    }

    const action = typeof body.action === "string" ? body.action : null;

    const to = action ? map[action] : undefined;
    if (!to || !(ORDER_STATUSES as readonly string[]).includes(to)) {
      return jsonError("Unknown action.", 400);
    }

    const result = await applyTransition(id, to, {
      carrier: typeof body.carrier === "string" ? body.carrier.slice(0, 80) : undefined,
      trackingNumber: typeof body.trackingNumber === "string" ? body.trackingNumber.slice(0, 80) : undefined,
    });
    if (!result.ok) return jsonError(result.error, 409);

    const order = await prisma.order.findUnique({ where: { id } });

    // Refunds against a Stripe payment should also refund through Stripe.
    if (to === "REFUNDED" && order?.paymentRef && order.paymentMethod === "CARD") {
      const { getStripe } = await import("@/lib/stripe");
      const stripe = getStripe();
      if (stripe) {
        await stripe.refunds.create({ payment_intent: order.paymentRef }).catch((err) => {
          console.error("[admin] Stripe refund failed:", err);
        });
      }
    }

    // Status emails on key customer-visible transitions. sendMail logs when no
    // provider is configured; it never claims an email was sent.
    if (order) {
      const settings = await getSettings();
      const trackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/order/${order.number}?token=${order.accessToken}`;
      if (to === "PAID") {
        await sendMail({
          to: order.email,
          subject: `Payment confirmed — order ${order.number} · ${settings.storeName}`,
          text: `Payment for order ${order.number} (${formatMoney(order.totalCents, order.currency)}) is confirmed. Your order is confirmed and in preparation.\nTrack: ${trackUrl}`,
        });
      } else if (to === "SHIPPED") {
        await sendMail({
          to: order.email,
          subject: `Order ${order.number} shipped · ${settings.storeName}`,
          text: `Order ${order.number} is on its way.${order.carrier ? ` Carrier: ${order.carrier}.` : ""}${order.trackingNumber ? ` Tracking: ${order.trackingNumber}.` : ""}\nTrack: ${trackUrl}`,
        });
      } else if (to === "DELIVERED") {
        await sendMail({
          to: order.email,
          subject: `Order ${order.number} delivered · ${settings.storeName}`,
          text: `Order ${order.number} has been delivered. If anything is not right, reply within 7 days to arrange a return.\nTrack: ${trackUrl}`,
        });
      } else if (to === "CANCELLED") {
        await sendMail({
          to: order.email,
          subject: `Order ${order.number} cancelled · ${settings.storeName}`,
          text: `Order ${order.number} has been cancelled and any reserved stock released. If you did not request this, reply to reach us.`,
        });
      }
    }

    revalidatePath(`/admin/orders/${order?.number ?? id}`);
    revalidatePath("/admin/orders");

    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    let orderId = id;
    let order = await prisma.order.findUnique({ where: { id } });

    // Accept a numeric order number in place of the internal ID so the admin
    // detail page can PATCH using the human-readable number.
    if (!order) {
      const num = Number(id);
      if (!isNaN(num)) {
        order = await prisma.order.findUnique({ where: { number: id } });
        if (order) orderId = order.id;
      }
    }
    if (!order) return jsonError("Order not found.", 404);

    const body = await request.formData();
    const rawAction = body.get("action");
    const action = typeof rawAction === "string" ? rawAction : null;
    const rawCarrier = body.get("carrier");
    const carrier = typeof rawCarrier === "string" ? rawCarrier.slice(0, 80) : undefined;
    const rawTrackingNumber = body.get("trackingNumber");
    const trackingNumber = typeof rawTrackingNumber === "string" ? rawTrackingNumber.slice(0, 80) : undefined;

    const to = action ? map[action] : undefined;
    if (!to || !(ORDER_STATUSES as readonly string[]).includes(to)) {
      return jsonError("Unknown action.", 400);
    }

    const result = await applyTransition(orderId, to, { carrier, trackingNumber });
    if (!result.ok) return jsonError(result.error, 409);

    const updated = await prisma.order.findUnique({ where: { id: orderId } });
    if (!updated) return jsonError("Order not found after transition.", 404);

    // Refunds against a Stripe payment should also refund through Stripe.
    if (to === "REFUNDED" && updated.paymentRef && updated.paymentMethod === "CARD") {
      const { getStripe } = await import("@/lib/stripe");
      const stripe = getStripe();
      if (stripe) {
        await stripe.refunds.create({ payment_intent: updated.paymentRef }).catch((err) => {
          console.error("[admin] Stripe refund failed:", err);
        });
      }
    }

    // Status emails on key customer-visible transitions. sendMail logs when no
    // provider is configured; it never claims an email was sent.
    {
      const settings = await getSettings();
      const trackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/order/${updated.number}?token=${updated.accessToken}`;
      if (to === "PAID") {
        await sendMail({
          to: updated.email,
          subject: `Payment confirmed — order ${updated.number} · ${settings.storeName}`,
          text: `Payment for order ${updated.number} (${formatMoney(updated.totalCents, updated.currency)}) is confirmed. Your order is confirmed and in preparation.\nTrack: ${trackUrl}`,
        });
      } else if (to === "SHIPPED") {
        await sendMail({
          to: updated.email,
          subject: `Order ${updated.number} shipped · ${settings.storeName}`,
          text: `Order ${updated.number} is on its way.${updated.carrier ? ` Carrier: ${updated.carrier}.` : ""}${updated.trackingNumber ? ` Tracking: ${updated.trackingNumber}.` : ""}\nTrack: ${trackUrl}`,
        });
      } else if (to === "DELIVERED") {
        await sendMail({
          to: updated.email,
          subject: `Order ${updated.number} delivered · ${settings.storeName}`,
          text: `Order ${updated.number} has been delivered. If anything is not right, reply within 7 days to arrange a return.\nTrack: ${trackUrl}`,
        });
      } else if (to === "CANCELLED") {
        await sendMail({
          to: updated.email,
          subject: `Order ${updated.number} cancelled · ${settings.storeName}`,
          text: `Order ${updated.number} has been cancelled and any reserved stock released. If you did not request this, reply to reach us.`,
        });
      }
    }

    revalidatePath(`/admin/orders/${updated.number}`);
    revalidatePath("/admin/orders");

    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
