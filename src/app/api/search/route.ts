import { prisma } from "@/lib/prisma";
import { jsonOk, handleApiError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim().slice(0, 80);
    if (q.length < 2) return jsonOk({ products: [] });

    const products = await prisma.product.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: q } },
          { shortDescription: { contains: q } },
          { material: { contains: q } },
          { purity: { contains: q } },
          { gemstone: { contains: q } },
        ],
      },
      select: {
        slug: true,
        name: true,
        priceCents: true,
        images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
      },
      take: 8,
      orderBy: { isBestSeller: "desc" },
    });

    return jsonOk({
      products: products.map((p) => ({
        slug: p.slug,
        name: p.name,
        priceCents: p.priceCents,
        imageUrl: p.images[0]?.url ?? null,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
