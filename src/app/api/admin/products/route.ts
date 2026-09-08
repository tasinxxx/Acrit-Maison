import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { productInputSchema } from "@/lib/validation";
import { jsonOk, handleApiError, parseBody } from "@/lib/api";

export async function GET() {
  try {
    await requireAdmin();
    const products = await prisma.product.findMany({
      include: { variants: true, images: true },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ products });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const input = await parseBody(request, productInputSchema);

    const slugTaken = await prisma.product.findUnique({ where: { slug: input.slug } });
    if (slugTaken) return jsonOk({ error: "A product with this slug already exists." }, 409);

    const product = await prisma.product.create({
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
    return jsonOk({ ok: true, id: product.id });
  } catch (error) {
    return handleApiError(error);
  }
}
