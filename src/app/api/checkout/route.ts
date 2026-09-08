import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer, readCartToken } from "@/lib/auth";
import { priceCartByToken, computeTotals, checkCoupon } from "@/lib/pricing";
import { checkoutSchema } from "@/lib/validation";
import { jsonError, jsonOk, handleApiError, parseBody } from "@/lib/api";
import { getStripe, cardPaymentsEnabled } from "@/lib/stripe";
import { getSettings } from "@/lib/settings";
import { rateLimit, maybeCleanup } from "@/lib/rate-limit";
import { sendMail } from "@/lib/mail";
import { formatMoney } from "@/lib/settings";
import { trackServer } from "@/lib/analytics";

export async function POST(request: Request) {
  try {
    maybeCleanup();
    const customer = await getCurrentCustomer();

    // Rate-limit order placement per identity to blunt abuse.
    const rlKey = `checkout:${customer?.id ?? request.headers.get("x-forwarded-for") ?? "anon"}`;
    const rl = rateLimit(rlKey, 10, 60 * 60 * 1000);
    if (!rl.ok) return jsonError("Too many orders attempted. Please try again later.", 429);

    const input = await parseBody(request, checkoutSchema);
    const token = await readCartToken();
    const cart = await priceCartByToken(token);

    if (cart.lines.length === 0) return jsonError("Your cart is empty.", 400);

    // Block unavailable lines (deactivated products/variants or oversold stock).
    for (const line of cart.lines) {
      if (!line.active) return jsonError(`${line.name} is no longer available. Please remove it from your cart.`, 409);
      if (!line.available) {
        return jsonError(`Only ${line.stock} of ${line.name} (${line.variantName}) left in stock.`, 409);
      }
    }

    // Validate coupon server-side; an invalid code fails loudly rather than
    // silently charging full price after showing a discount.
    if (input.couponCode) {
      const check = await checkCoupon(input.couponCode, cart.subtotalCents);
      if (!check.ok) return jsonError(`Discount code: ${check.reason}`, 422);
    }

    // COD only when enabled; mobile money only when a number is configured.
    const settings = await getSettings();
    if (input.paymentMethod === "COD" && !settings.codEnabled) {
      return jsonError("Cash on delivery is currently unavailable. Choose another payment method.", 409);
    }
    if (input.paymentMethod === "BKASH" && !settings.bkashNumber) {
      return jsonError("bKash payment is not yet configured. Choose another payment method.", 409);
    }
    if (input.paymentMethod === "NAGAD" && !settings.nagadNumber) {
      return jsonError("Nagad payment is not yet configured. Choose another payment method.", 409);
    }
    // A transaction ID only makes sense with mobile money.
    const txnId = input.paymentTxnId?.trim() || "";
    if (txnId && input.paymentMethod !== "BKASH" && input.paymentMethod !== "NAGAD") {
      return jsonError("A transaction ID applies to bKash or Nagad payments only.", 422);
    }

    const totals = await computeTotals(cart.subtotalCents, input.deliveryZone, input.shippingMethod, input.couponCode || null);

    const orderNumber = await nextOrderNumber();
    const orderId = `order_${orderNumber}`;
    const accessToken = randomBytes(24).toString("base64url");

    // Reserve stock atomically: decrement each variant with a guard that the
    // stock is still sufficient. Made-to-order pieces skip the guard. If any
    // guard fails, roll the order back.
    const reserved: { variantId: string; quantity: number }[] = [];
    try {
      const order = await prisma.order.create({
        data: {
          id: orderId,
          number: orderNumber,
          accessToken,
          customerId: customer?.id ?? null,
          email: input.email,
          status: "PENDING",
          paymentStatus: "PENDING",
          subtotalCents: totals.subtotalCents,
          shippingCents: totals.shippingCents,
          taxCents: totals.taxCents,
          discountCents: totals.discountCents,
          totalCents: totals.totalCents,
          currency: settings.currency,
          couponCode: totals.couponCode,
          deliveryZone: input.deliveryZone,
          shippingMethod: input.shippingMethod,
          paymentMethod: input.paymentMethod,
          customerNote: input.customerNote || null,
          paymentRef: txnId || null,
          shipFullName: input.shipping.fullName,
          shipLine1: input.shipping.line1,
          shipLine2: input.shipping.line2 || null,
          shipArea: input.shipping.area || null,
          shipCity: input.shipping.city,
          shipRegion: input.shipping.region,
          shipPostalCode: input.shipping.postalCode,
          shipCountry: input.shipping.country || "BD",
          shipPhone: input.shipping.phone,
          items: {
            create: cart.lines.map((l) => ({
              productId: l.productId,
              variantId: l.variantId,
              name: l.name,
              variantName: l.variantName,
              sku: l.sku,
              unitPriceCents: l.unitPriceCents,
              quantity: l.quantity,
              lineTotalCents: l.lineTotalCents,
              imageUrl: l.imageUrl,
            })),
          },
        },
      });

      for (const line of cart.lines) {
        if (line.madeToOrder) continue; // no stock to reserve
        const result = await prisma.variant.updateMany({
          where: { id: line.variantId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (result.count === 0 && !line.allowBackorder) {
          throw new StockConflictError(line.name);
        }
        reserved.push({ variantId: line.variantId, quantity: line.quantity });
      }

      // Record coupon usage.
      if (totals.couponCode) {
        await prisma.coupon.update({
          where: { code: totals.couponCode },
          data: { usedCount: { increment: 1 } },
        }).catch(() => undefined);
      }

      // Save address for signed-in customers who asked for it.
      if (customer && input.saveAddress) {
        await prisma.address.create({
          data: {
            customerId: customer.id,
            fullName: input.shipping.fullName,
            line1: input.shipping.line1,
            line2: input.shipping.line2 || null,
            area: input.shipping.area || null,
            city: input.shipping.city,
            region: input.shipping.region,
            postalCode: input.shipping.postalCode,
            country: input.shipping.country || "BD",
            phone: input.shipping.phone,
          },
        });
      }

      // Empty the cart.
      if (token) {
        const c = await prisma.cart.findUnique({ where: { token } });
        if (c) await prisma.cartItem.deleteMany({ where: { cartId: c.id } });
      }

      trackServer("purchase", { orderNumber, total: totals.totalCents, paymentMethod: input.paymentMethod });

      // Payment routing.
      if (input.paymentMethod === "CARD") {
        const stripe = getStripe();
        if (!stripe || !cardPaymentsEnabled()) {
          // Card chosen but not configured: cancel and restock immediately.
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "FAILED", failedAt: new Date(), paymentStatus: "FAILED" },
          });
          for (const r of reserved) {
            await prisma.variant.updateMany({
              where: { id: r.variantId },
              data: { stock: { increment: r.quantity } },
            });
          }
          return jsonError(
            "Card payments are not available on this store yet. Choose Cash on Delivery, bKash or Nagad.",
            503,
          );
        }

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          customer_email: input.email,
          client_reference_id: order.id,
          line_items: [
            ...cart.lines.map((l) => ({
              quantity: l.quantity,
              price_data: {
                currency: settings.currency.toLowerCase(),
                unit_amount: l.unitPriceCents,
                product_data: { name: `${l.name} — ${l.variantName}`, metadata: { sku: l.sku } },
              },
            })),
            ...(totals.shippingCents > 0
              ? [{
                  quantity: 1,
                  price_data: {
                    currency: settings.currency.toLowerCase(),
                    unit_amount: totals.shippingCents,
                    product_data: { name: input.shippingMethod === "EXPRESS" ? "Express delivery" : "Standard delivery" },
                  },
                }]
              : []),
            ...(totals.discountCents > 0
              ? [{
                  quantity: 1,
                  price_data: {
                    currency: settings.currency.toLowerCase(),
                    unit_amount: -totals.discountCents,
                    product_data: { name: `Discount (${totals.couponCode})` },
                  },
                }]
              : []),
          ],
          success_url: `${siteUrl}/order/${order.number}?token=${accessToken}&paid=1`,
          cancel_url: `${siteUrl}/checkout?cancelled=1`,
          metadata: { orderNumber: order.number },
        });

        // Move to PAYMENT_PENDING while the customer completes payment.
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "PAYMENT_PENDING", paymentStatus: "PENDING" },
        });

        return jsonOk({ ok: true, orderNumber: order.number, token: accessToken, redirectUrl: session.url });
      }

      // COD / bKash / Nagad / bank transfer: order stays PENDING with
      // instructions shown on the confirmation page. No payment success is
      // ever simulated.
      await sendMail({
        to: input.email,
        subject: `Order ${orderNumber} received — ${settings.storeName}`,
        text: [
          `Thank you for your order ${orderNumber}.`,
          `Total: ${formatMoney(totals.totalCents, settings.currency)}`,
          `Payment method: ${paymentLabel(input.paymentMethod)}`,
          `Track your order: ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/order/${orderNumber}?token=${accessToken}`,
        ].join("\n"),
      });

      return jsonOk({ ok: true, orderNumber: order.number, token: accessToken });
    } catch (err) {
      // Roll back: cancel order, restore any reserved stock.
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "FAILED", failedAt: new Date(), paymentStatus: "FAILED" },
      }).catch(() => undefined);
      for (const r of reserved) {
        await prisma.variant.updateMany({
          where: { id: r.variantId },
          data: { stock: { increment: r.quantity } },
        }).catch(() => undefined);
      }
      throw err;
    }
  } catch (error) {
    if (error instanceof StockConflictError) {
      return jsonError(error.message, 409);
    }
    return handleApiError(error);
  }
}

class StockConflictError extends Error {}

function paymentLabel(method: string): string {
  switch (method) {
    case "COD": return "Cash on delivery";
    case "BKASH": return "bKash";
    case "NAGAD": return "Nagad";
    case "BANK_TRANSFER": return "Bank transfer";
    default: return method;
  }
}

async function nextOrderNumber(): Promise<string> {
  const count = await prisma.order.count();
  // AM-YY-XXXXXX style; uniqueness enforced by the unique index with retry.
  for (let attempt = 0; attempt < 5; attempt++) {
    const year = String(new Date().getFullYear()).slice(-2);
    const candidate = `AM-${year}-${String(count + 1 + attempt).padStart(6, "0")}`;
    const exists = await prisma.order.findUnique({ where: { number: candidate } });
    if (!exists) return candidate;
  }
  throw new Error("Could not allocate an order number.");
}
