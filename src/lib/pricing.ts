import { prisma } from "./prisma";
import { getSettings, formatMoney } from "./settings";

// ---------------------------------------------------------------------------
// Pricing. Every monetary value is computed server-side from database state.
// Client-supplied prices are never trusted.
// ---------------------------------------------------------------------------

export type PricedLine = {
  itemId: string;
  variantId: string;
  productId: string;
  name: string;
  variantName: string;
  sku: string;
  slug: string;
  imageUrl: string | null;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  stock: number;
  active: boolean;
  allowBackorder: boolean;
  madeToOrder: boolean;
  available: boolean; // quantity <= stock or backorder/made-to-order allowed
};

export type PricedCart = {
  lines: PricedLine[];
  itemCount: number;
  subtotalCents: number;
  currency: string;
};

export async function priceCartByToken(token: string | null): Promise<PricedCart> {
  if (!token) return emptyCart();
  const cart = await prisma.cart.findUnique({
    where: { token },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: { images: { orderBy: { position: "asc" } } },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!cart) return emptyCart();
  return priceCartItems(cart.items);
}

type CartItemWithVariant = {
  id: string;
  quantity: number;
  variant: {
    id: string;
    sku: string;
    optionName: string;
    priceDeltaCents: number;
    stock: number;
    active: boolean;
    product: {
      id: string;
      name: string;
      slug: string;
      priceCents: number;
      active: boolean;
      allowBackorder: boolean;
      madeToOrder: boolean;
      images: { url: string; alt: string; position: number }[];
    };
  };
};

export function priceCartItems(items: CartItemWithVariant[]): PricedCart {
  const lines: PricedLine[] = items.map((item) => {
    const v = item.variant;
    const p = v.product;
    const unit = p.priceCents + v.priceDeltaCents;
    const fulfillable = v.active && p.active;
    const coveredByStock = v.stock >= item.quantity;
    const canFulfill = fulfillable && (coveredByStock || p.allowBackorder || p.madeToOrder);
    return {
      itemId: item.id,
      variantId: v.id,
      productId: p.id,
      name: p.name,
      variantName: v.optionName,
      sku: v.sku,
      slug: p.slug,
      imageUrl: p.images[0]?.url ?? null,
      unitPriceCents: unit,
      quantity: item.quantity,
      lineTotalCents: unit * item.quantity,
      stock: v.stock,
      active: fulfillable,
      allowBackorder: p.allowBackorder,
      madeToOrder: p.madeToOrder,
      available: canFulfill,
    };
  });
  const subtotalCents = lines.reduce((sum, l) => sum + l.lineTotalCents, 0);
  return {
    lines,
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
    subtotalCents,
    currency: "BDT",
  };
}

export async function priceCartForCustomer(token: string | null, customerId: string | null): Promise<PricedCart> {
  return priceCartByToken(token);
}

function emptyCart(): PricedCart {
  return { lines: [], itemCount: 0, subtotalCents: 0, currency: "BDT" };
}

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

export type CouponCheck =
  | { ok: true; coupon: { code: string; type: string; value: number }; discountCents: number }
  | { ok: false; reason: string };

export async function checkCoupon(code: string, subtotalCents: number): Promise<CouponCheck> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, reason: "Enter a code." };
  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });
  if (!coupon || !coupon.active) return { ok: false, reason: "This code is not valid." };
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) return { ok: false, reason: "This code has expired." };
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
    return { ok: false, reason: "This code has reached its usage limit." };
  if (subtotalCents < coupon.minSubtotalCents)
    return { ok: false, reason: `This code requires a minimum order of ${formatMoney(coupon.minSubtotalCents)}.` };

  let discountCents =
    coupon.type === "PERCENT" ? Math.floor((subtotalCents * coupon.value) / 100) : Math.min(coupon.value, subtotalCents);
  discountCents = Math.max(0, Math.min(discountCents, subtotalCents));
  return { ok: true, coupon: { code: coupon.code, type: coupon.type, value: coupon.value }, discountCents };
}

// ---------------------------------------------------------------------------
// Order totals. Delivery cost depends on the Bangladesh zone; VAT is included
// in listed prices and reported as the portion contained in the total.
// ---------------------------------------------------------------------------

export type DeliveryZone = "INSIDE_DHAKA" | "OUTSIDE_DHAKA";

export type OrderTotals = {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  taxCents: number;
  couponCode: string | null;
};

export async function computeTotals(
  subtotalCents: number,
  deliveryZone: DeliveryZone,
  shippingMethod: "STANDARD" | "EXPRESS",
  couponCode: string | null,
): Promise<OrderTotals> {
  const settings = await getSettings();

  let discountCents = 0;
  let appliedCode: string | null = null;
  if (couponCode) {
    const check = await checkCoupon(couponCode, subtotalCents);
    if (check.ok) {
      discountCents = check.discountCents;
      appliedCode = check.coupon.code;
    }
    // An invalid coupon at checkout is reported by the caller; totals are
    // computed without it rather than blocking the order.
  }

  const afterDiscount = Math.max(0, subtotalCents - discountCents);

  let shippingCents = 0;
  if (settings.shippingEnabled) {
    if (deliveryZone === "INSIDE_DHAKA") {
      shippingCents = shippingMethod === "EXPRESS" ? settings.insideDhakaExpressCents : settings.insideDhakaStandardCents;
    } else {
      shippingCents = shippingMethod === "EXPRESS" ? settings.outsideDhakaExpressCents : settings.outsideDhakaStandardCents;
    }
    // Free standard delivery inside Dhaka above the threshold.
    if (deliveryZone === "INSIDE_DHAKA" && shippingMethod === "STANDARD" && afterDiscount >= settings.freeShippingThresholdCents) {
      shippingCents = 0;
    }
  }

  const totalCents = afterDiscount + shippingCents;
  const taxCents = Math.round((totalCents * settings.vatRatePercent) / (100 + settings.vatRatePercent));

  return {
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents,
    taxCents,
    couponCode: appliedCode,
  };
}

export { formatMoney };
