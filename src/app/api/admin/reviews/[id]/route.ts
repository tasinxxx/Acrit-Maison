import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const status = body?.status;

    if (status !== "APPROVED" && status !== "REJECTED") {
      return jsonError("status must be APPROVED or REJECTED.", 422);
    }

    await prisma.review.update({ where: { id }, data: { status } });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
