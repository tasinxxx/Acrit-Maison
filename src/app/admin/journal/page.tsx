import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { JournalManager } from "@/components/admin/journal-manager";

export const dynamic = "force-dynamic";

export default async function AdminJournalPage() {
  const posts = await prisma.journalPost.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <div>
      <h1 className="font-display text-2xl mb-2">Journal</h1>
      <p className="text-muted text-sm mb-6">
        Write and manage journal entries. Drafts are invisible to customers until published; published posts are
        listed on <Link href="/journal" className="underline">the public journal</Link> and included in the sitemap.
      </p>
      <JournalManager
        posts={posts.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          body: p.body,
          category: p.category,
          coverImage: p.coverImage,
          readMinutes: p.readMinutes,
          published: p.published,
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
          updatedAt: p.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
