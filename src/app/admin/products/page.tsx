import { prisma } from "@/lib/prisma";
import { useState } from "react";
import { ProductManager } from "@/components/admin/product-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Products", robots: { index: false } };

export default function AdminProductsPage() {
  return <ProductManager />;
}
