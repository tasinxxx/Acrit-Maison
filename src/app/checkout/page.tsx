import Link from "next/link";
import { redirect } from "next/navigation";
import { readCartToken, getCurrentCustomer } from "@/lib/auth";
import { priceCartByToken } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { cardPaymentsEnabled } from "@/lib/stripe";
import { CheckoutForm } from "@/components/checkout-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const token = await readCartToken();
  const cart = await priceCartByToken(token);

  if (cart.lines.length === 0) redirect("/cart");

  const settings = await getSettings();
  const customer = await getCurrentCustomer();
  const stripeReady = cardPaymentsEnabled();

  const addresses = customer
    ? await prisma.address.findMany({ where: { customerId: customer.id }, orderBy: { isDefault: "desc" } })
    : [];

  const blockedReader =
    cart.lines.find((l) => !l.active) ??
    cart.lines.find((l) => l.active && !l.available);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <h1 className="font-display text-3xl sm:text-4xl mb-8">Checkout</h1>

      {blockedReader && (
        <div className="card border-danger p-4 mb-6 text-sm">
          <p className="font-semibold text-danger">Some items need attention</p>
          <p className="text-muted mt-1">
            {blockedReader.active
              ? `${blockedReader.name} (${blockedReader.variantName}) only has ${blockedReader.stock} in stock — please update the quantity in your cart.`
              : `${blockedReader.name} is no longer available — please remove it in your cart.`}
          </p>
          <Link href="/cart" className="underline">
            Review cart
          </Link>
        </div>
      )}

      <CheckoutForm
        lines={cart.lines}
        subtotalCents={cart.subtotalCents}
        currency={settings.currency}
        shippingEnabled={settings.shippingEnabled}
        insideDhakaStandardCents={settings.insideDhakaStandardCents}
        insideDhakaExpressCents={settings.insideDhakaExpressCents}
        outsideDhakaStandardCents={settings.outsideDhakaStandardCents}
        outsideDhakaExpressCents={settings.outsideDhakaExpressCents}
        freeThresholdCents={settings.freeShippingThresholdCents}
        stripeReady={stripeReady}
        codEnabled={settings.codEnabled}
        bkashNumber={settings.bkashNumber}
        nagadNumber={settings.nagadNumber}
        defaultEmail={customer?.email ?? ""}
        savedAddresses={addresses.map((a) => ({
          id: a.id,
          fullName: a.fullName,
          line1: a.line1,
          line2: a.line2 ?? "",
          area: a.area ?? "",
          city: a.city,
          region: a.region,
          postalCode: a.postalCode,
          country: a.country,
          phone: a.phone ?? "",
        }))}
      />
    </div>
  );
}
