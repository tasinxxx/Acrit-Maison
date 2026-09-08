import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim().slice(0, 120);
    const status = (searchParams.get("status") ?? "").trim().toUpperCase();
    const page = Math.max(1, Math.min(1000, Number(searchParams.get("page") ?? "1")));
    const pageSize = Math.max(1, Math.min(200, Number(searchParams.get("pageSize") ?? "40")));

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { number: { contains: q } },
        { email: { contains: q } },
      ];
    }
    if (status && status !== "ALL") {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: { take: 1 } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return jsonOk({
      orders: orders.map((o) => ({
        id: o.id,
        number: o.number,
        email: o.email,
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentRef: o.paymentRef ?? null,
        totalCents: o.totalCents,
        currency: o.currency,
        createdAt: o.createdAt.toISOString(),
        itemCount: o.items.length,
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
