"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/settings";

type Coupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  minSubtotalCents: number;
  active: boolean;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
};

export function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function api(path: string, method: string, body?: unknown) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Request failed.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Network error.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function create(formData: FormData) {
    const expires = String(formData.get("expiresAt") ?? "");
    const ok = await api("/api/admin/coupons", "POST", {
      code: String(formData.get("code") ?? ""),
      type: String(formData.get("type") ?? "PERCENT"),
      value:
        String(formData.get("type")) === "PERCENT"
          ? Math.round(Number(formData.get("value")))
          : Math.round(Number(formData.get("value")) * 100),
      minSubtotalCents: Math.round(Number(formData.get("minSubtotal") ?? 0) * 100),
      active: true,
      usageLimit: formData.get("usageLimit") ? Math.round(Number(formData.get("usageLimit"))) : null,
      expiresAt: expires || null,
    });
    if (ok) (document.getElementById("coupon-form") as HTMLFormElement)?.reset();
  }

  return (
    <div>
      {error && <p className="text-danger text-sm mb-4" role="alert">{error}</p>}

      <form id="coupon-form" action={create} className="card p-6 mb-8 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="cp-code">Code</label>
          <input id="cp-code" name="code" required className="input uppercase" placeholder="WELCOME10" />
        </div>
        <div>
          <label className="label" htmlFor="cp-type">Type</label>
          <select id="cp-type" name="type" className="input">
            <option value="PERCENT">Percent off</option>
            <option value="FIXED">Fixed amount (€)</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="cp-value">Value</label>
          <input id="cp-value" name="value" type="number" step="0.01" min="0.01" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="cp-min">Minimum subtotal (€)</label>
          <input id="cp-min" name="minSubtotal" type="number" step="0.01" min="0" defaultValue="0" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="cp-limit">Usage limit (optional)</label>
          <input id="cp-limit" name="usageLimit" type="number" min={1} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="cp-exp">Expires (optional)</label>
          <input id="cp-exp" name="expiresAt" type="datetime-local" className="input" />
        </div>
        <div className="sm:col-span-3">
          <button type="submit" disabled={busy} className="btn btn-primary">
            {busy ? "Creating…" : "Create coupon"}
          </button>
        </div>
      </form>

      <ul className="card divide-y divide-line text-sm">
        {coupons.map((c) => (
          <li key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4">
            <div>
              <span className="font-mono font-semibold">{c.code}</span>
              <span className="text-muted">
                {" "}· {c.type === "PERCENT" ? `${c.value}% off` : `${formatMoney(c.value)} off`}
                {c.minSubtotalCents > 0 && ` · min ${formatMoney(c.minSubtotalCents)}`}
                {c.usageLimit !== null && ` · ${c.usedCount}/${c.usageLimit} used`}
                {c.usageLimit === null && c.usedCount > 0 && ` · ${c.usedCount} used`}
                {c.expiresAt && ` · expires ${new Date(c.expiresAt).toLocaleDateString("en-IE")}`}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`badge ${c.active ? "bg-green-100 text-green-900" : "bg-gray-200 text-gray-700"}`}>
                {c.active ? "active" : "inactive"}
              </span>
              <button
                type="button"
                className="btn btn-outline"
                disabled={busy}
                onClick={() => api(`/api/admin/coupons/${c.id}`, "PATCH", { active: !c.active })}
              >
                {c.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </li>
        ))}
        {coupons.length === 0 && <li className="p-4 text-muted">No coupons yet.</li>}
      </ul>
    </div>
  );
}
