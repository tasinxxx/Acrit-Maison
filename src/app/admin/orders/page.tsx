"use client";

export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/settings";
import { reapExpiredPendingOrders } from "@/lib/orders";
import OrderStatusBadge from "@/components/order-status-badge";
import { OrderActions } from "@/components/admin/order-actions";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PAYMENT_LABELS: Record<string, string> = {
  COD: "Cash on delivery",
  BKASH: "bKash",
  NAGAD: "Nagad",
  CARD: "Card (Stripe)",
  BANK_TRANSFER: "Bank transfer",
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const statusFilter = searchParams.get("status") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

  const [localQ, setLocalQ] = useState(q);
  const [localStatus, setLocalStatus] = useState(statusFilter);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/orders?${new URLSearchParams({ q: localQ.trim() || "", status: localStatus || "", page: String(page) })}`,
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load orders.");
          return;
        }
        if (!cancelled) {
          setOrders(data.orders ?? []);
          setTotal(data.total ?? 0);
          setTotalPages(data.totalPages ?? 1);
        }
      } catch {
        if (!cancelled) setError("Network error while loading orders.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [localQ, localStatus, page]);

  type OrderSummary = {
    id: string;
    number: string;
    email: string;
    status: string;
    paymentMethod: string;
    paymentRef: string | null;
    totalCents: number;
    currency: string;
    createdAt: string;
    itemCount: number;
    items: Array<{ id: string; quantity: number; name: string; variantName: string | null; sku: string }>;
    shipFullName: string;
    shipLine1: string;
    shipCity: string;
    shipPostalCode: string;
    shipCountry: string;
    carrier: string | null;
    trackingNumber: string | null;
    couponCode: string | null;
    customerNote: string | null;
  };

  const applyFilters = (nextPage?: number) => {
    const params = new URLSearchParams();
    if (localQ.trim()) params.set("q", localQ.trim());
    if (localStatus) params.set("status", localStatus);
    if (nextPage && nextPage > 1) params.set("page", String(nextPage));
    router.push(`/admin/orders${params.toString() ? `?${params}` : ""}`, { scroll: false });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-2xl">Orders</h1>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters(1)}
            placeholder="Order #, email…"
            className="input"
            aria-label="Search orders"
          />
          <select
            value={localStatus}
            onChange={(e) => { setLocalStatus(e.target.value); applyFilters(1); }}
            className="input"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAYMENT_PENDING">Payment pending</option>
            <option value="PAID">Paid</option>
            <option value="PROCESSING">Processing</option>
            <option value="PACKED">Packed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="OUT_FOR_DELIVERY">Out for delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="RETURN_REQUESTED">Return requested</option>
            <option value="RETURNED">Returned</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
            <option value="FAILED">Failed</option>
          </select>
          {(localQ.trim().length > 0 || localStatus) ? (
            <button type="button" className="btn btn-quiet" onClick={() => { setLocalQ(""); setLocalStatus(""); applyFilters(1); }}>
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {loading && <p className="text-sm text-muted">Loading orders…</p>}
      {error && <p className="text-danger text-sm" role="alert">{error}</p>}

      <p className="text-sm text-muted mb-6">
        {localQ.trim().length > 0 || localStatus
          ? "Filters are applied from the server as you edit the form. Use the search box or status dropdown, then press Enter or change the status."
          : "Showing orders in reverse chronological order. Each order row shows payment method, totals, shipping and available actions."}
      </p>

      {orders.length === 0 ? (
        <p className="text-muted">No orders yet.</p>
      ) : (
        <>
          <ul className="space-y-4">
            {orders.map((o) => (
              <li key={o.id} className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-lg">{o.number}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <p className="text-sm text-muted mt-1">
                      {o.email} · {new Date(o.createdAt).toLocaleString("en-IE")} · {PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod}
                      {o.paymentRef && (o.paymentMethod === "BKASH" || o.paymentMethod === "NAGAD") ? ` · txn ${o.paymentRef}` : ""}
                    </p>
                    <ul className="text-sm mt-2 space-y-1">
                      {o.items.slice(0, 4).map((i) => (
                        <li key={i.id}>
                          {i.quantity} × {i.name} — {i.variantName ?? ""} ({i.sku})
                        </li>
                      ))}
                      {o.items.length > 4 && (
                        <li className="text-xs text-muted">+{o.items.length - 4} more line{o.items.length - 4 === 1 ? "" : "s"}</li>
                      )}
                    </ul>
                    <p className="text-sm mt-2">
                      Total <strong>{formatMoney(o.totalCents, o.currency)}</strong>
                      {o.couponCode && <span className="text-muted"> · coupon {o.couponCode}</span>}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      Ship to: {o.shipFullName}, {o.shipLine1}, {o.shipCity} {o.shipPostalCode}, {o.shipCountry}
                      {o.carrier ? ` · carrier ${o.carrier}` : ""}
                      {o.trackingNumber ? ` · tracking ${o.trackingNumber}` : ""}
                    </p>
                    {o.customerNote && <p className="text-xs text-muted mt-1">Note: {o.customerNote}</p>}
                  </div>
                  <OrderActions orderId={o.id} status={o.status} />
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="flex items-center justify-between mt-10 pt-6 border-t border-line" aria-label="Orders pagination">
              <p className="text-sm text-muted">
                Page {page} of {totalPages} · {total} order{total === 1 ? "" : "s"}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <button type="button" className="btn btn-quiet" onClick={() => applyFilters(page - 1)}>
                    ← Prev
                  </button>
                )}
                {page < totalPages && (
                  <button type="button" className="btn btn-quiet" onClick={() => applyFilters(page + 1)}>
                    Next →
                  </button>
                )}
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
