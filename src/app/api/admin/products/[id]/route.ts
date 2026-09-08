import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { productInputSchema } from "@/lib/validation";
import { jsonError, jsonOk, handleApiError, parseBody } from "@/lib/api";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const input = await parseBody(request, productInputSchema);

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return jsonError("Product not found.", 404);

    if (input.slug !== product.slug) {
      const taken = await prisma.product.findUnique({ where: { slug: input.slug } });
      if (taken) return jsonError("A product with this slug already exists.", 409);
    }

    await prisma.product.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
        shortDescription: input.shortDescription,
        description: input.description,
        priceCents: input.priceCents,
        compareAtCents: input.compareAtCents ?? null,
        material: input.material,
        dimensions: input.dimensions,
        careInstructions: input.careInstructions,
        featured: input.featured,
        active: input.active,
        allowBackorder: input.allowBackorder,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        categoryId: input.categoryId || null,
      },
    });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => null);

    const data: Record<string, unknown> = {};
    if (typeof body?.active === "boolean") data.active = body.active;
    if (typeof body?.featured === "boolean") data.featured = body.featured;
    if (typeof body?.allowBackorder === "boolean") data.allowBackorder = body.allowBackorder;
    if (Object.keys(data).length === 0) return jsonError("Nothing to update.", 400);

    await prisma.product.update({ where: { id }, data });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
