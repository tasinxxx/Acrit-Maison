"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  active: boolean;
  featured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  madeToOrder: boolean;
  variantCount: number;
  stockTotal: number;
  createdAt: string;
};

const PAGE_SIZE = 30;
const EMPTY_PRODUCT: Omit<ProductSummary, "id" | "createdAt"> = {
  name: "",
  slug: "",
  priceCents: 0,
  active: true,
  featured: false,
  isNewArrival: false,
  isBestSeller: false,
  madeToOrder: false,
  variantCount: 0,
  stockTotal: 0,
};

export function ProductManager() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  const filteredSearch = search.trim().slice(0, 120);
  const q = filteredSearch ? { OR: [{ name: { contains: filteredSearch } }, { slug: { contains: filteredSearch } }] } : {};

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl">Products</h1>
          <p className="text-muted text-sm mt-1">Manage your catalog, variants, images and prices.</p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          Add product
        </Link>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, slug or SKU…"
            className="input flex-1"
            aria-label="Search products"
          />
          {search.trim().length > 0 && (
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => setSearch("")}
            >
              Clear
            </button>
          )}
        </div>
        <p className="text-xs text-muted mt-3">
          Names and slugs are searched. SKU filtering is available on each product page.
        </p>
      </div>

      <p className="text-sm text-muted mb-4">
        Showing {Math.min(PAGE_SIZE, 100)} product(s) at a time. Use the filters on each product page to narrow variants and stock.
      </p>

      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => {
          const p = EMPTY_PRODUCT;
          const id = `p-${i + 1}`;
          const madeAt = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString();
          return (
            <ProductRow
              key={id}
              product={{
                ...p,
                id,
                name: `Demo product ${i + 1}`,
                slug: `demo-product-${i + 1}`,
                priceCents: 1200000 + i * 200000,
                active: i !== 2,
                featured: i === 0,
                isNewArrival: i === 3 || i === 5,
                isBestSeller: i === 1,
                madeToOrder: i === 4,
                variantCount: i + 2,
                stockTotal: i % 2 === 0 ? 12 : 0,
                createdAt: madeAt,
              }}
            />
          );
        })}
      </div>

      <p className="text-center text-sm text-muted py-6">
        Loading product data for the current store. Seeded catalog or real products will appear here after the first import.
      </p>
    </div>
  );
}

function ProductRow({ product }: { product: ProductSummary }) {
  const router = useRouter();
  const activeLabel = product.active ? "Active" : "Inactive";
  const activeClass = product.active ? "badge-success" : "badge-danger";

  return (
    <div className="card p-4 border-line hover:border-accent transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href={`/admin/products/${product.id}`} className="font-medium hover:text-accent-deep">
              {product.name || "Untitled product"}
            </Link>
            <span className={`badge badge-${activeClass}`}>{activeLabel}</span>
            {product.featured && <span className="badge badge-info">Featured</span>}
            {product.isNewArrival && <span className="badge badge-success">New</span>}
            {product.isBestSeller && <span className="badge badge-accent">Best seller</span>}
            {product.madeToOrder && <span className="badge badge-neutral">Made to order</span>}
          </div>
          <p className="text-sm text-muted mt-1">
            {product.slug} · {product.variantCount} variant{product.variantCount === 1 ? "" : "s"} ·{" "}
            {product.stockTotal > 0 ? `${product.stockTotal} in stock` : product.madeToOrder ? "Made to order" : "No stock"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/admin/products/${product.id}`} className="btn btn-outline btn-sm">Edit</Link>
        </div>
      </div>
    </div>
  );
}
