import { prisma } from "@/lib/prisma";
import { getCurrentCustomer, readCartToken, getOrCreateCartToken } from "@/lib/auth";
import { getOrCreateCart } from "@/lib/cart";
import { priceCartByToken } from "@/lib/pricing";
import { addToCartSchema, updateCartItemSchema } from "@/lib/validation";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const token = await readCartToken();
    const cart = await priceCartByToken(token);
    return jsonOk({ cart });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = addToCartSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid input.", 422);
    }
    const { variantId, quantity } = parsed.data;
    const token = await getOrCreateCartToken();
    const customer = await getCurrentCustomer();

    const variant = await prisma.variant.findUnique({ where: { id: variantId }, include: { product: true } });
    if (!variant || !variant.active || !variant.product.active) {
      return jsonError("This variant is not available.", 404);
    }

    const cart = await getOrCreateCart(token, customer?.id ?? null);

    const existing = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
    });
    const newQty = Math.min(20, (existing?.quantity ?? 0) + quantity);

    if (!variant.product.allowBackorder && newQty > variant.stock) {
      return jsonError(
        variant.stock === 0
          ? "This item is out of stock."
          : `Only ${variant.stock} in stock. Your cart holds the maximum available.`,
        409,
        { available: variant.stock },
      );
    }

    if (existing) {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
    } else {
      await prisma.cartItem.create({ data: { cartId: cart.id, variantId, quantity: newQty } });
    }

    const priced = await priceCartByToken(token);
    return jsonOk({ ok: true, cart: priced });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = updateCartItemSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid input.", 422);
    }
    const { itemId, quantity } = parsed.data;
    const token = await readCartToken();
    if (!token) return jsonError("Cart not found.", 404);

    const cart = await prisma.cart.findUnique({ where: { token } });
    if (!cart) return jsonError("Cart not found.", 404);

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { variant: { include: { product: true } } },
    });
    if (!item || item.cartId !== cart.id) return jsonError("Cart item not found.", 404);

    if (quantity === 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      if (!item.variant.product.allowBackorder && quantity > item.variant.stock) {
        return jsonError(`Only ${item.variant.stock} available.`, 409, { available: item.variant.stock });
      }
      await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    }

    const priced = await priceCartByToken(token);
    return jsonOk({ ok: true, cart: priced });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    if (!itemId) return jsonError("itemId is required.", 400);

    const token = await readCartToken();
    if (!token) return jsonError("Cart not found.", 404);

    const cart = await prisma.cart.findUnique({ where: { token } });
    if (!cart) return jsonError("Cart not found.", 404);

    const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item || item.cartId !== cart.id) return jsonError("Cart item not found.", 404);

    await prisma.cartItem.delete({ where: { id: itemId } });
    const priced = await priceCartByToken(token);
    return jsonOk({ ok: true, cart: priced });
  } catch (error) {
    return handleApiError(error);
  }
}
