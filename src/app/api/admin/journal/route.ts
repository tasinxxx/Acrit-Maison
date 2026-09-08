import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { journalPostInputSchema } from "@/lib/validation";
import { jsonError, jsonOk, handleApiError, parseBody } from "@/lib/api";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const input = await parseBody(request, journalPostInputSchema);

    const exists = await prisma.journalPost.findUnique({ where: { slug: input.slug }, select: { id: true } });
    if (exists) return jsonError("A post with that slug already exists.", 409);

    const post = await prisma.journalPost.create({
      data: {
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt,
        body: input.body,
        category: input.category,
        coverImage: input.coverImage || null,
        readMinutes: input.readMinutes,
        published: input.published,
        publishedAt: input.published ? new Date() : null,
        seoTitle: input.seoTitle || null,
        seoDescription: input.seoDescription || null,
      },
    });

    revalidatePath("/journal");
    revalidatePath(`/journal/${post.slug}`);
    revalidatePath("/sitemap.xml");

    return jsonOk({ ok: true, id: post.id });
  } catch (error) {
    return handleApiError(error);
  }
}
