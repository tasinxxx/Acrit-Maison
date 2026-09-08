import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { categoryInputSchema } from "@/lib/validation";
import { jsonOk, handleApiError, parseBody } from "@/lib/api";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const input = await parseBody(request, categoryInputSchema);

    const taken = await prisma.category.findUnique({ where: { slug: input.slug } });
    if (taken) return jsonOk({ error: "A category with this slug already exists." }, 409);

    await prisma.category.create({ data: input });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
