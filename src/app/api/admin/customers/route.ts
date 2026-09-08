import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim().slice(0, 120);
    const customerId = searchParams.get("customerId") ?? "";
    const page = Math.max(1, Math.min(100, Number(searchParams.get("page") ?? "1")));
    const pageSize = Math.max(1, Math.min(100, Number(searchParams.get("pageSize") ?? "40")));

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { email: { contains: q } },
        { name: { contains: q } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: { _count: { select: { orders: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.customer.count({ where }),
    ]);

    return jsonOk({
      customers: customers.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        role: c.role,
        createdAt: c.createdAt.toISOString(),
        orderCount: c._count.orders,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => null);
    const customerId = typeof body?.customerId === "string" ? body.customerId : "";

    if (!customerId) {
      return jsonError("customerId is required.", 400);
    }

    const orders = await prisma.order.findMany({
      where: { customerId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    const paidOrders = await prisma.order.findMany({
      where: { status: { in: ["PAID", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "RETURN_REQUESTED", "RETURNED", "REFUNDED"] }, customerId },
      select: { totalCents: true },
    });

    const lifetimeCents = paidOrders.reduce((s, o) => s + o.totalCents, 0);

    return jsonOk({
      customerId,
      orders: orders.map((o) => ({
        id: o.id,
        number: o.number,
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentRef: o.paymentRef ?? null,
        totalCents: o.totalCents,
        currency: o.currency,
        createdAt: o.createdAt.toISOString(),
        itemCount: o.items.length,
        shipFullName: o.shipFullName,
        shipCity: o.shipCity,
        shipPostalCode: o.shipPostalCode,
        shipCountry: o.shipCountry,
      })),
      lifetimeCents,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
