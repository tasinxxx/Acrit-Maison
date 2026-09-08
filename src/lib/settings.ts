import { prisma } from "./prisma";

export type StoreSettings = {
  storeName: string;
  storeEmail: string;
  storePhone: string; // display phone, e.g. +880 1XXX-XXXXXX
  whatsappNumber: string; // digits-only international, e.g. 8801XXXXXXXXX
  storeAddress: string;
  currency: string; // "BDT"
  vatRatePercent: number; // VAT included in prices; reported as the portion within the total
  // Delivery zones (Bangladesh-first)
  insideDhakaStandardCents: number;
  insideDhakaExpressCents: number;
  outsideDhakaStandardCents: number;
  outsideDhakaExpressCents: number;
  freeShippingThresholdCents: number;
  shippingEnabled: boolean;
  // Payments. COD and mobile money are always offered; card requires Stripe.
  codEnabled: boolean;
  bkashNumber: string; // empty = not configured; shown as "send to" instructions
  nagadNumber: string;
  // Social
  instagramUrl: string;
  facebookUrl: string;
};

const DEFAULTS: StoreSettings = {
  storeName: "Acrit Maison",
  storeEmail: "care@acritmaison.example",
  storePhone: "+880 1000-000000",
  whatsappNumber: "8801000000000",
  storeAddress: "Dhaka, Bangladesh",
  currency: "BDT",
  vatRatePercent: 0,
  insideDhakaStandardCents: 8000, // ৳80
  insideDhakaExpressCents: 15000, // ৳150
  outsideDhakaStandardCents: 15000, // ৳150
  outsideDhakaExpressCents: 30000, // ৳300
  freeShippingThresholdCents: 2000000, // ৳20,000
  shippingEnabled: true,
  codEnabled: true,
  bkashNumber: "",
  nagadNumber: "",
  instagramUrl: "",
  facebookUrl: "",
};

function int(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
}

export async function getSettings(): Promise<StoreSettings> {
  let rows: Array<{ key: string; value: string }> = [];
  try {
    rows = await prisma.setting.findMany();
  } catch {
    // Database unavailable (e.g. build time without PostgreSQL).
    // Return default settings.
    return DEFAULTS;
  }
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    storeName: map.get("storeName") || DEFAULTS.storeName,
    storeEmail: map.get("storeEmail") || DEFAULTS.storeEmail,
    storePhone: map.get("storePhone") || DEFAULTS.storePhone,
    whatsappNumber: map.get("whatsappNumber") || DEFAULTS.whatsappNumber,
    storeAddress: map.get("storeAddress") || DEFAULTS.storeAddress,
    currency: map.get("currency") || DEFAULTS.currency,
    vatRatePercent: int(map.get("vatRatePercent"), DEFAULTS.vatRatePercent),
    insideDhakaStandardCents: int(map.get("insideDhakaStandardCents"), DEFAULTS.insideDhakaStandardCents),
    insideDhakaExpressCents: int(map.get("insideDhakaExpressCents"), DEFAULTS.insideDhakaExpressCents),
    outsideDhakaStandardCents: int(map.get("outsideDhakaStandardCents"), DEFAULTS.outsideDhakaStandardCents),
    outsideDhakaExpressCents: int(map.get("outsideDhakaExpressCents"), DEFAULTS.outsideDhakaExpressCents),
    freeShippingThresholdCents: int(map.get("freeShippingThresholdCents"), DEFAULTS.freeShippingThresholdCents),
    shippingEnabled: (map.get("shippingEnabled") ?? "true") !== "false",
    codEnabled: (map.get("codEnabled") ?? "true") !== "false",
    bkashNumber: map.get("bkashNumber") || "",
    nagadNumber: map.get("nagadNumber") || "",
    instagramUrl: map.get("instagramUrl") || "",
    facebookUrl: map.get("facebookUrl") || "",
  };
}

// BDT uses poisha in storage (100 poisha = ৳1) but in practice jewelry prices
// are whole taka. Format without trailing decimals when the amount is whole.
export function formatMoney(cents: number, currency = "BDT"): string {
  const taka = cents / 100;
  const hasFraction = Math.round(cents) !== cents;
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(taka);
  return currency === "BDT" ? `৳${formatted}` : `${formatted} ${currency}`;
}

export function whatsappLink(number: string, text: string): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
