"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Actions follow the Bangladesh-first lifecycle in src/lib/orders.ts:
//   PENDING -> PAYMENT_PENDING | PAID | PROCESSING | CANCELLED | FAILED
//   PAYMENT_PENDING -> PAID | CANCELLED | FAILED
//   PAID -> PROCESSING | CANCELLED | REFUNDED
//   PROCESSING -> PACKED | CANCELLED | REFUNDED
//   PACKED -> SHIPPED | CANCELLED | REFUNDED
//   SHIPPED -> OUT_FOR_DELIVERY | RETURN_REQUESTED | REFUNDED
//   OUT_FOR_DELIVERY -> DELIVERED | RETURN_REQUESTED
//   DELIVERED -> RETURN_REQUESTED | REFUNDED
//   RETURN_REQUESTED -> RETURNED | DELIVERED
//   RETURNED -> REFUNDED
const ACTIONS: Record<string, Array<{ action: string; label: string; needsTracking?: boolean }>> = {
  PENDING: [
    { action: "markPaid", label: "Mark paid" },
    { action: "process", label: "Start preparation" },
    { action: "cancel", label: "Cancel" },
    { action: "markFailed", label: "Mark failed" },
  ],
  PAYMENT_PENDING: [
    { action: "markPaid", label: "Mark paid" },
    { action: "cancel", label: "Cancel" },
    { action: "markFailed", label: "Mark failed" },
  ],
  PAID: [
    { action: "process", label: "Start preparation" },
    { action: "cancel", label: "Cancel" },
    { action: "refund", label: "Refund" },
  ],
  PROCESSING: [
    { action: "pack", label: "Mark packed" },
    { action: "cancel", label: "Cancel" },
    { action: "refund", label: "Refund" },
  ],
  PACKED: [
    { action: "ship", label: "Mark shipped", needsTracking: true },
    { action: "cancel", label: "Cancel" },
    { action: "refund", label: "Refund" },
  ],
  SHIPPED: [
    { action: "outForDelivery", label: "Out for delivery" },
    { action: "requestReturn", label: "Return requested" },
    { action: "refund", label: "Refund" },
  ],
  OUT_FOR_DELIVERY: [
    { action: "deliver", label: "Mark delivered" },
    { action: "requestReturn", label: "Return requested" },
  ],
  DELIVERED: [
    { action: "requestReturn", label: "Return requested" },
    { action: "refund", label: "Refund" },
  ],
  RETURN_REQUESTED: [
    { action: "markReturned", label: "Mark returned" },
    { action: "deliver", label: "Decline (keep delivered)" },
  ],
  RETURNED: [{ action: "refund", label: "Refund" }],
  CANCELLED: [],
  REFUNDED: [],
  FAILED: [],
};

export function OrderActions({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingFor, setTrackingFor] = useState<string | null>(null);
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const actions = ACTIONS[status] ?? [];

  async function run(action: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, carrier, trackingNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Action failed.");
      } else {
        setTrackingFor(null);
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  if (actions.length === 0) return <span className="text-xs text-muted">No actions available.</span>;

  return (
    <div className="shrink-0 sm:text-right">
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {actions.map((a) =>
          a.needsTracking ? (
            <button
              key={a.action}
              type="button"
              className="btn btn-outline"
              disabled={busy}
              onClick={() => setTrackingFor(trackingFor === a.action ? null : a.action)}
            >
              {a.label}…
            </button>
          ) : (
            <button
              key={a.action}
              type="button"
              className={`btn ${a.action === "cancel" || a.action === "refund" || a.action === "markFailed" ? "btn-danger" : "btn-outline"}`}
              disabled={busy}
              onClick={() => run(a.action)}
            >
              {a.label}
            </button>
          ),
        )}
      </div>

      {trackingFor === "ship" && (
        <div className="mt-3 space-y-2 sm:max-w-xs">
          <input
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="Carrier (e.g. Pathao, Sundarban)"
            className="input"
          />
          <input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Tracking number"
            className="input"
          />
          <button type="button" className="btn btn-primary w-full" disabled={busy} onClick={() => run("ship")}>
            Confirm shipment
          </button>
        </div>
      )}

      {error && <p className="text-danger text-xs mt-2">{error}</p>}
    </div>
  );
}
