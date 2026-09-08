"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StoreSettings } from "@/lib/settings";

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function submit(formData: FormData) {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: String(formData.get("storeName") ?? ""),
          storeEmail: String(formData.get("storeEmail") ?? ""),
          storePhone: String(formData.get("storePhone") ?? ""),
          whatsappNumber: String(formData.get("whatsappNumber") ?? ""),
          storeAddress: String(formData.get("storeAddress") ?? ""),
          vatRatePercent: Math.round(Number(formData.get("vatRatePercent") ?? 0)),
          insideDhakaStandardCents: Math.round(Number(formData.get("dhakaStandard") ?? 0) * 100),
          insideDhakaExpressCents: Math.round(Number(formData.get("dhakaExpress") ?? 0) * 100),
          outsideDhakaStandardCents: Math.round(Number(formData.get("outsideStandard") ?? 0) * 100),
          outsideDhakaExpressCents: Math.round(Number(formData.get("outsideExpress") ?? 0) * 100),
          freeShippingThresholdCents: Math.round(Number(formData.get("freeThreshold") ?? 0) * 100),
          shippingEnabled: formData.get("shippingEnabled") === "on",
          codEnabled: formData.get("codEnabled") === "on",
          bkashNumber: String(formData.get("bkashNumber") ?? ""),
          nagadNumber: String(formData.get("nagadNumber") ?? ""),
          instagramUrl: String(formData.get("instagramUrl") ?? ""),
          facebookUrl: String(formData.get("facebookUrl") ?? ""),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ kind: "error", text: data.error || "Could not save settings." });
      } else {
        setStatus({ kind: "ok", text: "Settings saved." });
        router.refresh();
      }
    } catch {
      setStatus({ kind: "error", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action={submit} className="card p-6 grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="s-name">Store name</label>
        <input id="s-name" name="storeName" defaultValue={settings.storeName} required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="s-email">Contact email</label>
        <input id="s-email" name="storeEmail" type="email" defaultValue={settings.storeEmail} required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="s-phone">Display phone</label>
        <input id="s-phone" name="storePhone" defaultValue={settings.storePhone} className="input" placeholder="+880 1XXX-XXXXXX" />
      </div>
      <div>
        <label className="label" htmlFor="s-wa">WhatsApp number (8801XXXXXXXXX)</label>
        <input id="s-wa" name="whatsappNumber" defaultValue={settings.whatsappNumber} className="input" inputMode="numeric" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="s-addr">Store address</label>
        <input id="s-addr" name="storeAddress" defaultValue={settings.storeAddress} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="s-vat">VAT rate (%)</label>
        <input id="s-vat" name="vatRatePercent" type="number" min={0} max={100} defaultValue={settings.vatRatePercent} required className="input" />
      </div>

      <fieldset className="sm:col-span-2 border-t border-line pt-4">
        <legend className="label">Delivery rates (৳)</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="s-dhaka-standard">Inside Dhaka — standard</label>
            <input id="s-dhaka-standard" name="dhakaStandard" type="number" step="0.01" min={0} defaultValue={(settings.insideDhakaStandardCents / 100).toFixed(2)} required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="s-dhaka-express">Inside Dhaka — express</label>
            <input id="s-dhaka-express" name="dhakaExpress" type="number" step="0.01" min={0} defaultValue={(settings.insideDhakaExpressCents / 100).toFixed(2)} required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="s-outside-standard">Outside Dhaka — standard</label>
            <input id="s-outside-standard" name="outsideStandard" type="number" step="0.01" min={0} defaultValue={(settings.outsideDhakaStandardCents / 100).toFixed(2)} required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="s-outside-express">Outside Dhaka — express</label>
            <input id="s-outside-express" name="outsideExpress" type="number" step="0.01" min={0} defaultValue={(settings.outsideDhakaExpressCents / 100).toFixed(2)} required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="s-free">Free standard delivery inside Dhaka over (৳)</label>
            <input id="s-free" name="freeThreshold" type="number" step="0.01" min={0} defaultValue={(settings.freeShippingThresholdCents / 100).toFixed(2)} required className="input" />
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="shippingEnabled" defaultChecked={settings.shippingEnabled} /> Shipping enabled
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="codEnabled" defaultChecked={settings.codEnabled} /> Cash on delivery enabled
          </label>
        </div>
      </fieldset>

      <fieldset className="sm:col-span-2 border-t border-line pt-4">
        <legend className="label">Mobile money (leave blank to hide at checkout)</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="s-bkash">bKash number</label>
            <input id="s-bkash" name="bkashNumber" defaultValue={settings.bkashNumber} className="input" inputMode="numeric" placeholder="01XXXXXXXXX" />
          </div>
          <div>
            <label className="label" htmlFor="s-nagad">Nagad number</label>
            <input id="s-nagad" name="nagadNumber" defaultValue={settings.nagadNumber} className="input" inputMode="numeric" placeholder="01XXXXXXXXX" />
          </div>
        </div>
      </fieldset>

      <fieldset className="sm:col-span-2 border-t border-line pt-4">
        <legend className="label">Social profiles</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="s-ig">Instagram URL</label>
            <input id="s-ig" name="instagramUrl" defaultValue={settings.instagramUrl} className="input" placeholder="https://instagram.com/…" />
          </div>
          <div>
            <label className="label" htmlFor="s-fb">Facebook URL</label>
            <input id="s-fb" name="facebookUrl" defaultValue={settings.facebookUrl} className="input" placeholder="https://facebook.com/…" />
          </div>
        </div>
      </fieldset>

      <div className="sm:col-span-2 flex items-center gap-4">
        <button type="submit" disabled={busy} className="btn btn-primary">
          {busy ? "Saving…" : "Save settings"}
        </button>
        {status && (
          <span className={`text-sm ${status.kind === "error" ? "text-danger" : "text-success"}`} role="status">
            {status.text}
          </span>
        )}
      </div>
    </form>
  );
}
