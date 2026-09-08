import { prisma } from "@/lib/prisma";
import { ReviewModeration } from "@/components/admin/review-moderation";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    include: { product: { select: { name: true, slug: true } }, customer: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl mb-2">Reviews</h1>
      <p className="text-muted text-sm mb-6">
        Approve or reject customer reviews. Nothing is published without moderation.
      </p>
      <ReviewModeration
        reviews={reviews.map((r) => ({
          id: r.id,
          productName: r.product.name,
          productSlug: r.product.slug,
          customerName: r.customer.name,
          customerEmail: r.customer.email,
          rating: r.rating,
          title: r.title,
          body: r.body,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
