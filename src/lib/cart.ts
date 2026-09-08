import { prisma } from "./prisma";
import { readCartToken, getOrCreateCartToken } from "./auth";

// Cart access is centralised here so every route resolves the cart the same
// way: by cookie token, optionally bound to the signed-in customer.

export async function getOrCreateCart(token: string, customerId?: string | null) {
  const existing = await prisma.cart.findUnique({ where: { token }, include: { items: true } });
  if (existing) {
    if (customerId && existing.customerId !== customerId) {
      return prisma.cart.update({ where: { id: existing.id }, data: { customerId } });
    }
    return existing;
  }
  return prisma.cart.create({ data: { token, customerId: customerId ?? null } });
}

export async function findCartByRequestToken(): Promise<string | null> {
  return readCartToken();
}

export async function ensureCartToken(): Promise<string> {
  return getOrCreateCartToken();
}
