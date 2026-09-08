import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/bespoke", label: "Bespoke" },
  { href: "/admin/journal", label: "Journal" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login");
  if (customer.role !== "ADMIN") redirect("/");

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-muted mb-2">Admin</p>
      <nav className="flex gap-4 overflow-x-auto pb-4 mb-6 border-b border-line text-sm whitespace-nowrap">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-accent">
            {l.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
