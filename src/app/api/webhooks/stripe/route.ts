import { prisma } from "@/lib/prisma";
import { applyTransition } from "@/lib/orders";
import { getStripe, webhookSecretConfigured } from "@/lib/stripe";
import { jsonError, jsonOk } from "@/lib/api";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) return jsonError("Stripe is not configured.", 503);
  if (!webhookSecretConfigured()) return jsonError("Webhook secret not configured.", 503);

  const signature = request.headers.get("stripe-signature");
  if (!signature) return jsonError("Missing stripe-signature header.", 400);

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch {
    return jsonError("Invalid signature.", 400);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.client_reference_id ?? session.metadata?.orderId;
      if (orderId) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        // Only transition from PAYMENT_PENDING (or the initial PENDING state if
        // the webhook races ahead of the redirect) — never from a paid state.
        if (order && (order.status === "PAYMENT_PENDING" || order.status === "PENDING")) {
          await applyTransition(orderId, "PAID");
          await prisma.order.update({
            where: { id: orderId },
            data: { paymentRef: session.payment_intent as string | null },
          });
        }
      }
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const order = await prisma.order.findFirst({ where: { paymentRef: charge.payment_intent as string } });
      if (order && order.status !== "REFUNDED") {
        await applyTransition(order.id, "REFUNDED");
      }
      break;
    }
    case "checkout.session.expired": {
      // The customer abandoned Stripe Checkout: fail the order and release the
      // reserved stock. applyTransition only moves PAYMENT_PENDING -> FAILED and
      // restocks exactly once.
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.client_reference_id ?? session.metadata?.orderId;
      if (orderId) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (order && order.status === "PAYMENT_PENDING") {
          await applyTransition(orderId, "FAILED");
        }
      }
      break;
    }
    default:
      break;
  }

  return jsonOk({ received: true });
}
