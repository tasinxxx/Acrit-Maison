import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  let products: Array<{ slug: string; updatedAt: Date }> = [];
  let categories: Array<{ slug: string }> = [];
  let collections: Array<{ slug: string }> = [];
  let posts: Array<{ slug: string; updatedAt: Date }> = [];

  try {
    const results = await Promise.all([
      prisma.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }),
      prisma.category.findMany({ select: { slug: true } }),
      prisma.collection.findMany({ where: { active: true }, select: { slug: true } }),
      prisma.journalPost.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    ]);
    products = results[0];
    categories = results[1];
    collections = results[2];
    posts = results[3];
  } catch {
    // Database unavailable at build time — return static routes only.
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/new-arrivals`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/best-sellers`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/collections`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/bespoke`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/journal`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/about`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/care-guide`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/delivery-returns`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/order-tracking`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/search`, changeFrequency: "monthly", priority: 0.3 },
  ];

  return [
    ...staticRoutes,
    ...categories.map((c) => ({
      url: `${base}/collections/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...collections.map((c) => ({
      url: `${base}/collections/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${base}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...posts.map((p) => ({
      url: `${base}/journal/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
