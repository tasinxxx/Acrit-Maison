import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { journalPostInputSchema } from "@/lib/validation";
import { jsonError, jsonOk, handleApiError, parseBody } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const input = await parseBody(request, journalPostInputSchema);

    const existing = await prisma.journalPost.findUnique({ where: { id }, select: { id: true, publishedAt: true } });
    if (!existing) return jsonError("Post not found.", 404);

    const slugTaken = await prisma.journalPost.findUnique({ where: { slug: input.slug }, select: { id: true } });
    if (slugTaken && slugTaken.id !== id) return jsonError("Another post already uses that slug.", 409);

    await prisma.journalPost.update({
      where: { id },
      data: {
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt,
        body: input.body,
        category: input.category,
        coverImage: input.coverImage || null,
        readMinutes: input.readMinutes,
        published: input.published,
        publishedAt: input.published ? (existing.publishedAt ?? new Date()) : null,
        seoTitle: input.seoTitle || null,
        seoDescription: input.seoDescription || null,
      },
    });

    revalidatePath("/journal");
    revalidatePath(`/journal/${input.slug}`);
    revalidatePath("/sitemap.xml");

    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existing = await prisma.journalPost.findUnique({ where: { id }, select: { slug: true } });
    if (!existing) return jsonError("Post not found.", 404);

    await prisma.journalPost.delete({ where: { id } });
    revalidatePath("/journal");
    revalidatePath(`/journal/${existing.slug}`);
    revalidatePath("/sitemap.xml");
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
