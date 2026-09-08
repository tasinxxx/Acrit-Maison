import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { bespokeStatusSchema } from "@/lib/validation";
import { jsonError, jsonOk, handleApiError, parseBody } from "@/lib/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const input = await parseBody(request, bespokeStatusSchema);

    const existing = await prisma.bespokeRequest.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return jsonError("Request not found.", 404);

    await prisma.bespokeRequest.update({
      where: { id },
      data: {
        status: input.status,
        ...(input.adminNotes !== undefined ? { adminNotes: input.adminNotes } : {}),
      },
    });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
