import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { variantInputSchema } from "@/lib/validation";
import { jsonError, jsonOk, handleApiError, parseBody } from "@/lib/api";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const input = await parseBody(request, variantInputSchema);

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return jsonError("Product not found.", 404);

    const skuTaken = await prisma.variant.findUnique({ where: { sku: input.sku } });
    if (skuTaken) return jsonError("A variant with this SKU already exists.", 409);

    await prisma.variant.create({
      data: {
        productId: id,
        sku: input.sku,
        optionName: input.optionName,
        color: input.color ?? null,
        size: input.size ?? null,
        priceDeltaCents: input.priceDeltaCents,
        stock: input.stock,
        active: input.active,
      },
    });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
