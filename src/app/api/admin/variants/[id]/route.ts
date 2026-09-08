import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => null);

    const data: Record<string, unknown> = {};
    if (body?.stock !== undefined) {
      const stock = Number(body.stock);
      if (!Number.isInteger(stock) || stock < 0 || stock > 100000) {
        return jsonError("Stock must be an integer between 0 and 100000.", 422);
      }
      data.stock = stock;
    }
    if (typeof body?.active === "boolean") data.active = body.active;
    if (typeof body?.optionName === "string" && body.optionName.trim()) {
      data.optionName = body.optionName.trim().slice(0, 120);
    }
    if (Object.keys(data).length === 0) return jsonError("Nothing to update.", 400);

    await prisma.variant.update({ where: { id }, data });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
