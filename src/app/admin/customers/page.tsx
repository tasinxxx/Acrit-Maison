"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/settings";

type CustomerSummary = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  orderCount: number;
};

type CustomerOrder = {
  id: string;
  number: string;
  status: string;
  paymentMethod: string;
  paymentRef: string | null;
  totalCents: number;
  currency: string;
  createdAt: string;
  itemCount: number;
  shipFullName: string;
  shipCity: string;
  shipPostalCode: string;
  shipCountry: string;
};

export default function AdminCustomersPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [lifetimeCents, setLifetimeCents] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/customers?q=${encodeURIComponent(q.trim() || "")}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load customers.");
          return;
        }
        if (!cancelled) {
          setCustomers(data.customers ?? []);
          setTotal(data.total ?? 0);
          setTotalPages(data.totalPages ?? 1);
        }
      } catch {
        if (!cancelled) setError("Network error while loading customers.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [q]);

  async function selectCustomer(customer: CustomerSummary) {
    setSelectedCustomer(customer);
    setOrders([]);
    setLifetimeCents(0);
    setDetailsError(null);
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/admin/customers?customerId=${encodeURIComponent(customer.id)}`);
      const data = await res.json();
      if (!res.ok) {
        setDetailsError(data.error || "Failed to load customer details.");
        return;
      }
      setOrders(data.orders ?? []);
      setLifetimeCents(data.lifetimeCents ?? 0);
    } catch {
      setDetailsError("Network error while loading customer details.");
    } finally {
      setDetailsLoading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-2xl">Customers</h1>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email…"
            className="input"
            aria-label="Search customers"
          />
          {q.trim().length > 0 && (
            <button type="button" className="btn btn-quiet" onClick={() => setQ("")}>
              Clear
            </button>
          )}
        </div>
      </div>

      {loading && <p className="text-sm text-muted">Loading customers…</p>}
      {error && <p className="text-danger text-sm" role="alert">{error}</p>}

      <p className="text-sm text-muted mb-6">
        {q.trim().length > 0
          ? "Results update as you type. Select a customer to see order history and lifetime spend."
          : "Customers are listed by join date. Select a customer to view their order history."}
      </p>

      {customers.length === 0 ? (
        <p className="text-muted">No customers found.</p>
      ) : (
        <ul className="space-y-2 mb-10">
          {customers.map((c) => (
            <li
              key={c.id}
              className={`card p-4 border-line hover:border-accent transition-colors ${selectedCustomer?.id === c.id ? "border-accent bg-accent-soft/30" : ""}`}
            >
              <button
                type="button"
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full text-left"
                onClick={() => selectCustomer(c)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.name}</span>
                    {c.role === "ADMIN" && <span className="badge bg-blue-100 text-blue-900">admin</span>}
                  </div>
                  <p className="text-xs text-muted mt-1">{c.email} · joined {new Date(c.createdAt).toLocaleDateString("en-IE")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted">{c.orderCount} order{c.orderCount === 1 ? "" : "s"}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedCustomer && (
        <section className="card p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-xl">{selectedCustomer.name}</h2>
              <p className="text-sm text-muted">{selectedCustomer.email}</p>
            </div>
            <button
              type="button"
              className="btn btn-quiet text-sm"
              onClick={() => setSelectedCustomer(null)}
            >
              Close
            </button>
          </div>

          {detailsLoading && <p className="text-sm text-muted">Loading order history…</p>}
          {detailsError && <p className="text-danger text-sm" role="alert">{detailsError}</p>}

          {!detailsLoading && !detailsError && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted">{orders.length} order{orders.length === 1 ? "" : "s"}</p>
                {lifetimeCents > 0 && (
                  <p className="text-sm font-medium">{formatMoney(lifetimeCents)} lifetime</p>
                )}
              </div>

              {orders.length === 0 ? (
                <p className="text-sm text-muted">No orders yet.</p>
              ) : (
                <ul className="divide-y divide-line text-sm">
                  {orders.map((o) => (
                    <li key={o.id} className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 p-3">
                      <div>
                        <Link href={`/admin/orders/${o.number}`} className="font-medium hover:text-accent-deep">
                          {o.number}
                        </Link>
                        <span className="text-muted"> · {o.status.replace(/_/g, " ")}</span>
                        <p className="text-xs text-muted mt-1">
                          {o.paymentMethod === "COD" ? "Cash on delivery" : o.paymentMethod}
                          {o.paymentRef ? ` · txn ${o.paymentRef}` : ""}
                          <br />
                          {o.shipFullName}, {o.shipCity} {o.shipPostalCode}, {o.shipCountry}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatMoney(o.totalCents, o.currency)}</p>
                        <p className="text-xs text-muted">{o.itemCount} line{o.itemCount === 1 ? "" : "s"}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
