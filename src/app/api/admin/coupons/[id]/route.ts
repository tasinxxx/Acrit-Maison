import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => null);

    const data: Record<string, unknown> = {};
    if (typeof body?.active === "boolean") data.active = body.active;
    if (Object.keys(data).length === 0) return jsonError("Nothing to update.", 400);

    await prisma.coupon.update({ where: { id }, data });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
