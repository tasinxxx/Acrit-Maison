import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/auth";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

function productIdFrom(request: Request): string | null {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("productId");
  return id && id.length >= 1 && id.length <= 64 ? id : null;
}

export async function GET(request: Request) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return jsonOk({ saved: false });
    const productId = productIdFrom(request);
    if (!productId) return jsonError("productId is required.", 400);
    const item = await prisma.wishlistItem.findUnique({
      where: { customerId_productId: { customerId: customer.id, productId } },
    });
    return jsonOk({ saved: Boolean(item) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return jsonError("You must be signed in.", 401);
    const body = (await request.json().catch(() => null)) as { productId?: string } | null;
    const productId = body?.productId;
    if (!productId || typeof productId !== "string" || productId.length > 64) {
      return jsonError("productId is required.", 400);
    }
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) return jsonError("Product not found.", 404);
    await prisma.wishlistItem.upsert({
      where: { customerId_productId: { customerId: customer.id, productId } },
      update: {},
      create: { customerId: customer.id, productId },
    });
    return jsonOk({ ok: true, saved: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return jsonError("You must be signed in.", 401);
    const productId = productIdFrom(request);
    if (!productId) return jsonError("productId is required.", 400);
    await prisma.wishlistItem.deleteMany({
      where: { customerId: customer.id, productId },
    });
    return jsonOk({ ok: true, saved: false });
  } catch (error) {
    return handleApiError(error);
  }
}
