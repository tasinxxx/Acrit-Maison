"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { formatMoney } from "@/lib/settings";
import { isValidBdPhone } from "@/lib/validation";
import { track } from "@/lib/analytics";
import type { PricedLine } from "@/lib/pricing";

type Address = {
  id: string;
  fullName: string;
  line1: string;
  line2: string;
  area: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
};

type Props = {
  lines: PricedLine[];
  subtotalCents: number;
  currency: string;
  shippingEnabled: boolean;
  insideDhakaStandardCents: number;
  insideDhakaExpressCents: number;
  outsideDhakaStandardCents: number;
  outsideDhakaExpressCents: number;
  freeThresholdCents: number;
  stripeReady: boolean;
  codEnabled: boolean;
  bkashNumber: string;
  nagadNumber: string;
  defaultEmail: string;
  savedAddresses: Address[];
};

type PaymentMethod = "COD" | "BKASH" | "NAGAD" | "CARD";

export function CheckoutForm({
  lines,
  subtotalCents,
  currency,
  shippingEnabled,
  insideDhakaStandardCents,
  insideDhakaExpressCents,
  outsideDhakaStandardCents,
  outsideDhakaExpressCents,
  freeThresholdCents,
  stripeReady,
  codEnabled,
  bkashNumber,
  nagadNumber,
  defaultEmail,
  savedAddresses,
}: Props) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [deliveryZone, setDeliveryZone] = useState<"INSIDE_DHAKA" | "OUTSIDE_DHAKA">("INSIDE_DHAKA");
  const [shippingMethod, setShippingMethod] = useState<"STANDARD" | "EXPRESS">("STANDARD");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    stripeReady ? "CARD" : codEnabled ? "COD" : "BKASH",
  );
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discountCents: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useSaved, setUseSaved] = useState<number | null>(savedAddresses.length > 0 ? 0 : null);
  const [phoneValid, setPhoneValid] = useState(true);

  const discountCents = coupon?.discountCents ?? 0;
  const afterDiscount = Math.max(0, subtotalCents - discountCents);

  const shippingCents = useMemo(() => {
    if (!shippingEnabled) return 0;
    if (deliveryZone === "INSIDE_DHAKA") {
      if (shippingMethod === "STANDARD" && afterDiscount >= freeThresholdCents) return 0;
      return shippingMethod === "EXPRESS" ? insideDhakaExpressCents : insideDhakaStandardCents;
    }
    return shippingMethod === "EXPRESS" ? outsideDhakaExpressCents : outsideDhakaStandardCents;
  }, [shippingEnabled, deliveryZone, shippingMethod, afterDiscount, freeThresholdCents, insideDhakaExpressCents, insideDhakaStandardCents, outsideDhakaExpressCents, outsideDhakaStandardCents]);

  const totalCents = afterDiscount + shippingCents;

  const paymentOptions = useMemo(() => {
    const options: { id: PaymentMethod; title: string; note: string; available: boolean }[] = [
      {
        id: "COD",
        title: "Cash on Delivery",
        note: "Pay in cash when your piece arrives. Available across Bangladesh.",
        available: codEnabled,
      },
      {
        id: "BKASH",
        title: "bKash",
        note: bkashNumber
          ? `Send payment to ${bkashNumber}, then enter your transaction ID below.`
          : "Not active yet — the store owner has not set a bKash number.",
        available: Boolean(bkashNumber),
      },
      {
        id: "NAGAD",
        title: "Nagad",
        note: nagadNumber
          ? `Send payment to ${nagadNumber}, then enter your transaction ID below.`
          : "Not active yet — the store owner has not set a Nagad number.",
        available: Boolean(nagadNumber),
      },
      {
        id: "CARD",
        title: "Card — via Stripe",
        note: "Visa, Mastercard and Amex through Stripe's secure checkout.",
        available: stripeReady,
      },
    ];
    return options;
  }, [codEnabled, bkashNumber, nagadNumber, stripeReady]);

  async function applyCoupon() {
    setCouponError(null);
    if (!couponInput.trim()) {
      setCoupon(null);
      return;
    }
    try {
      track("coupon_use", { code: couponInput.trim().toUpperCase() });
      const res = await fetch("/api/coupon/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, subtotalCents }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setCoupon(null);
        setCouponError(data.reason || data.error || "This code is not valid.");
      } else {
        setCoupon({ code: data.code, discountCents: data.discountCents });
      }
    } catch {
      setCouponError("Network error. Please try again.");
    }
  }

  async function submit(formData: FormData) {
    setSubmitting(true);
    setError(null);

    const phone = String(formData.get("phone") ?? "").trim();
    if (!isValidBdPhone(phone)) {
      setPhoneValid(false);
      setSubmitting(false);
      setError("Enter a valid Bangladeshi mobile number (e.g. 01712 345678).");
      return;
    }
    setPhoneValid(true);

    track("begin_checkout", { value: totalCents, paymentMethod });
    track("payment_selection", { paymentMethod });

    const address = {
      fullName: String(formData.get("fullName") ?? ""),
      line1: String(formData.get("line1") ?? ""),
      line2: String(formData.get("line2") ?? ""),
      area: String(formData.get("area") ?? ""),
      city: String(formData.get("city") ?? ""),
      region: String(formData.get("region") ?? "Dhaka"),
      postalCode: String(formData.get("postalCode") ?? ""),
      country: "BD",
      phone,
    };
    const payload = {
      email: String(formData.get("email") ?? ""),
      deliveryZone,
      shippingMethod,
      paymentMethod,
      couponCode: coupon?.code ?? "",
      customerNote: String(formData.get("customerNote") ?? ""),
      paymentTxnId: String(formData.get("paymentTxnId") ?? "").trim(),
      shipping: address,
      saveAddress: formData.get("saveAddress") === "on",
    };
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Checkout failed. Please review your details.");
        setSubmitting(false);
        return;
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      router.push(`/order/${data.orderNumber}?token=${data.token}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const addr = savedAddresses.length > 0 && useSaved !== null ? savedAddresses[useSaved] : null;
  const sectionAnim = reduce
    ? {}
    : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } };

  return (
    <form action={submit} className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        {/* Contact */}
        <motion.section className="card p-6" {...sectionAnim}>
          <h2 className="font-display text-xl mb-4">1 · Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input id="email" name="email" type="email" required defaultValue={defaultEmail} className="input" autoComplete="email" />
              <p className="text-xs text-muted mt-1.5">Order updates go to this address.</p>
            </div>
            <div>
              <label className="label" htmlFor="phone">
                Mobile number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="01712 345678"
                className={`input ${!phoneValid ? "!border-danger" : ""}`}
                autoComplete="tel"
                inputMode="tel"
                aria-invalid={!phoneValid}
              />
              {!phoneValid && <p className="text-xs text-danger mt-1">Enter a valid BD mobile number.</p>}
            </div>
          </div>
        </motion.section>

        {/* Delivery */}
        <motion.section className="card p-6" {...sectionAnim}>
          <h2 className="font-display text-xl mb-4">2 · Delivery</h2>

          <fieldset>
            <legend className="label mb-2">Delivery zone</legend>
            <div className="grid sm:grid-cols-2 gap-2">
              {(
                [
                  { id: "INSIDE_DHAKA", title: "Inside Dhaka", note: "1–2 working days (standard)" },
                  { id: "OUTSIDE_DHAKA", title: "Outside Dhaka", note: "2–4 working days (standard)" },
                ] as const
              ).map((z) => (
                <label
                  key={z.id}
                  className={`flex items-start gap-3 border p-4 cursor-pointer transition-colors ${
                    deliveryZone === z.id ? "border-accent bg-accent-soft/40" : "border-line-strong hover:border-ink"
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryZone"
                    className="sr-only"
                    checked={deliveryZone === z.id}
                    onChange={() => {
                      setDeliveryZone(z.id);
                      track("payment_selection", { deliveryZone: z.id });
                    }}
                  />
                  <span className="flex-1">
                    <span className="font-medium text-sm block">{z.title}</span>
                    <span className="text-muted text-xs">{z.note}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {shippingEnabled && (
            <fieldset className="mt-5">
              <legend className="label mb-2">Speed</legend>
              <div className="grid sm:grid-cols-2 gap-2">
                {(
                  [
                    {
                      id: "STANDARD",
                      title: "Standard · insured",
                      price:
                        deliveryZone === "INSIDE_DHAKA"
                          ? afterDiscount >= freeThresholdCents
                            ? "Free"
                            : formatMoney(insideDhakaStandardCents, currency)
                          : formatMoney(outsideDhakaStandardCents, currency),
                      note: deliveryZone === "INSIDE_DHAKA" ? "1–2 working days" : "2–4 working days",
                    },
                    {
                      id: "EXPRESS",
                      title: "Express",
                      price: deliveryZone === "INSIDE_DHAKA" ? formatMoney(insideDhakaExpressCents, currency) : formatMoney(outsideDhakaExpressCents, currency),
                      note: deliveryZone === "INSIDE_DHAKA" ? "Same / next day" : "Fastest available",
                    },
                  ] as const
                ).map((s) => (
                  <label
                    key={s.id}
                    className={`flex items-start gap-3 border p-4 cursor-pointer transition-colors ${
                      shippingMethod === s.id ? "border-accent bg-accent-soft/40" : "border-line-strong hover:border-ink"
                    }`}
                  >
                    <input
                      type="radio"
                      name="shippingMethod"
                      className="sr-only"
                      checked={shippingMethod === s.id}
                      onChange={() => setShippingMethod(s.id)}
                    />
                    <span className="flex-1">
                      <span className="font-medium text-sm flex justify-between gap-2">
                        {s.title}
                        <span>{s.price}</span>
                      </span>
                      <span className="text-muted text-xs">{s.note}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-5">
            {addr ? (
              <div>
                <div className="card p-4 text-sm bg-bg-deep/50">
                  <p className="font-medium">{addr.fullName}</p>
                  <p className="text-muted mt-1">
                    {addr.line1}
                    {addr.line2 ? `, ${addr.line2}` : ""}
                    {addr.area ? `, ${addr.area}` : ""}, {addr.city} {addr.postalCode}, {addr.region}, {addr.country} · {addr.phone}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm mt-3 cursor-pointer">
                  <input type="radio" name="savedAddress" checked={useSaved === null} onChange={() => setUseSaved(null)} />
                  Use a different address
                </label>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="fullName">Full name</label>
                  <input id="fullName" name="fullName" required className="input" autoComplete="name" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="line1">Address</label>
                  <input id="line1" name="line1" required className="input" autoComplete="address-line1" placeholder="House / road / flat" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="line2">Address line 2 (optional)</label>
                  <input id="line2" name="line2" className="input" autoComplete="address-line2" />
                </div>
                <div>
                  <label className="label" htmlFor="area">Area (e.g. Gulshan)</label>
                  <input id="area" name="area" className="input" autoComplete="address-level3" />
                </div>
                <div>
                  <label className="label" htmlFor="city">City</label>
                  <input id="city" name="city" required defaultValue={deliveryZone === "INSIDE_DHAKA" ? "Dhaka" : ""} className="input" autoComplete="address-level2" />
                </div>
                <div>
                  <label className="label" htmlFor="region">Division</label>
                  <select id="region" name="region" className="input" defaultValue="Dhaka" autoComplete="address-level1">
                    {["Dhaka", "Chattogram", "Khulna", "Rajshahi", "Sylhet", "Barishal", "Rangpur", "Mymensingh"].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="postalCode">Postal code</label>
                  <input id="postalCode" name="postalCode" required className="input" autoComplete="postal-code" inputMode="numeric" />
                </div>
                <label className="flex items-center gap-2 text-sm sm:col-span-2 cursor-pointer">
                  <input type="checkbox" name="saveAddress" />
                  Save this address to my account
                </label>
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className="label" htmlFor="customerNote">Order note (optional)</label>
            <textarea
              id="customerNote"
              name="customerNote"
              rows={2}
              maxLength={1000}
              className="input"
              placeholder="Gift wrapping, delivery timing, anything we should know…"
            />
          </div>
        </motion.section>

        {/* Payment */}
        <motion.section className="card p-6" {...sectionAnim}>
          <h2 className="font-display text-xl mb-4">3 · Payment</h2>
          <div className="space-y-2">
            {paymentOptions.map((o) => (
              <label
                key={o.id}
                className={`flex items-start gap-3 border p-4 transition-colors ${
                  paymentMethod === o.id ? "border-accent bg-accent-soft/40" : "border-line-strong"
                } ${o.available ? "cursor-pointer hover:border-ink" : "opacity-50 cursor-not-allowed"}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  className="sr-only"
                  disabled={!o.available}
                  checked={paymentMethod === o.id}
                  onChange={() => {
                    setPaymentMethod(o.id);
                    track("payment_selection", { method: o.id });
                  }}
                />
                <span className="flex-1">
                  <span className="font-medium text-sm block">{o.title}</span>
                  <span className="text-muted text-xs block mt-0.5">{o.note}</span>
                </span>
                {!o.available && <span className="badge badge-neutral shrink-0">Unavailable</span>}
              </label>
            ))}
          </div>
          {(paymentMethod === "BKASH" || paymentMethod === "NAGAD") && (
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="overflow-hidden"
            >
              <div className="mt-4 bg-bg-deep/60 border border-line p-4 text-sm text-muted">
                <p className="font-medium text-ink">How it works</p>
                <ol className="list-decimal ml-4 mt-2 space-y-1 text-xs leading-relaxed">
                  <li>Place your order — we hold it for 24 hours.</li>
                  <li>
                    Send the total to{" "}
                    <strong className="text-ink">
                      {paymentMethod === "BKASH" ? bkashNumber || "our bKash number (shown next)" : nagadNumber || "our Nagad number (shown next)"}
                    </strong>
                    .
                  </li>
                  <li>
                    Enter the transaction ID below — we verify it before your order moves to preparation.
                  </li>
                  <li>Once verified, your order moves to preparation.</li>
                </ol>
                <div className="mt-3">
                  <label className="label" htmlFor="paymentTxnId">
                    {paymentMethod === "BKASH" ? "bKash" : "Nagad"} transaction ID (optional)
                  </label>
                  <input
                    id="paymentTxnId"
                    name="paymentTxnId"
                    className="input"
                    maxLength={40}
                    placeholder="e.g. 8N7D2K9QX1"
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted mt-1.5">You can also send it later on WhatsApp.</p>
                </div>
              </div>
            </motion.div>
          )}
          {!stripeReady && (
            <p className="text-xs text-muted mt-4">
              Card payments activate automatically once Stripe keys are configured by the store owner.
            </p>
          )}
        </motion.section>
      </div>

      {/* Summary */}
      <aside className="card p-6 h-fit lg:sticky lg:top-24">
        <h2 className="font-display text-xl mb-4">Order summary</h2>
        <ul className="space-y-3 text-sm mb-4 max-h-56 overflow-auto slim-scroll">
          {lines.map((l) => (
            <li key={l.itemId} className="flex justify-between gap-2">
              <span className="min-w-0">
                <span className="font-medium block truncate">{l.name}</span>
                <span className="text-muted text-xs">
                  {l.variantName} × {l.quantity}
                </span>
              </span>
              <span className="whitespace-nowrap">{formatMoney(l.lineTotalCents, currency)}</span>
            </li>
          ))}
        </ul>

        <div className="border-t border-line pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span>{formatMoney(subtotalCents, currency)}</span>
          </div>
          {coupon && (
            <div className="flex justify-between text-success">
              <span>Discount ({coupon.code})</span>
              <span>−{formatMoney(discountCents, currency)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted">Delivery</span>
            <span>{shippingCents === 0 ? "Free" : formatMoney(shippingCents, currency)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base border-t border-line pt-2">
            <span>Total</span>
            <span>{formatMoney(totalCents, currency)}</span>
          </div>
          <p className="text-xs text-muted">All prices include applicable taxes.</p>
        </div>

        <div className="mt-5">
          <label className="label" htmlFor="coupon">Discount code</label>
          <div className="flex gap-2">
            <input
              id="coupon"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              className="input"
              placeholder="e.g. WELCOME10"
              autoComplete="off"
            />
            <button type="button" onClick={applyCoupon} className="btn btn-quiet shrink-0 !px-4">
              Apply
            </button>
          </div>
          {couponError && <p className="text-danger text-xs mt-1.5" role="alert">{couponError}</p>}
          {coupon && <p className="text-success text-xs mt-1.5">Code {coupon.code} applied.</p>}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-danger text-sm mt-4"
            role="alert"
          >
            {error}
          </motion.p>
        )}

        <button type="submit" disabled={submitting} className="btn btn-primary w-full mt-5">
          {submitting
            ? "Placing order…"
            : paymentMethod === "CARD"
              ? "Continue to payment"
              : "Place order"}
        </button>
        <p className="text-xs text-muted mt-3 leading-relaxed">
          By placing this order you accept our terms of sale. Orders are held 24 hours for mobile-money payments.
        </p>
      </aside>
    </form>
  );
}
