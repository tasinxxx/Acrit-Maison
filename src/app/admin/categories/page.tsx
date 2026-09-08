import { prisma } from "@/lib/prisma";
import { CategoryManager } from "@/components/admin/category-manager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <h1 className="font-display text-2xl mb-2">Categories</h1>
      <p className="text-muted text-sm mb-6">
        Product categories shown in the shop navigation. Slugs map to /collections/&lt;slug&gt; pages.
      </p>
      <CategoryManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          position: c.position,
          productCount: c._count.products,
        }))}
      />
    </div>
  );
}
