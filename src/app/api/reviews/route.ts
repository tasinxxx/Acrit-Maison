import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth";
import { reviewSchema } from "@/lib/validation";
import { jsonError, jsonOk, handleApiError, parseBody } from "@/lib/api";
import { PAID_STATUSES } from "@/lib/orders";

export async function POST(request: Request) {
  try {
    const customer = await requireCustomer();
    const input = await parseBody(request, reviewSchema);

    const product = await prisma.product.findUnique({ where: { id: input.productId } });
    if (!product || !product.active) return jsonError("Product not found.", 404);

    // Verified purchase only: a PAID-or-later order belonging to this
    // customer must contain the product.
    const orders = await prisma.order.findMany({
      where: { customerId: customer.id, status: { in: PAID_STATUSES } },
      include: { items: true },
    });
    const purchased = orders.some((o) => o.items.some((i) => i.productId === input.productId));
    if (!purchased) {
      return jsonError("Only verified buyers can review this product.", 403);
    }

    const existing = await prisma.review.findUnique({
      where: { productId_customerId: { productId: input.productId, customerId: customer.id } },
    });
    if (existing) return jsonError("You have already reviewed this product.", 409);

    await prisma.review.create({
      data: {
        productId: input.productId,
        customerId: customer.id,
        orderId: orders.find((o) => o.items.some((i) => i.productId === input.productId))?.id ?? null,
        rating: input.rating,
        title: input.title,
        body: input.body,
        status: "PENDING",
      },
    });

    return jsonOk({ ok: true, message: "Thank you — your review will appear once it has been checked." });
  } catch (error) {
    return handleApiError(error);
  }
}
