import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(200);

// Bangladesh mobile numbers: 01XXXXXXXXX (11 digits) or +8801XXXXXXXXX.
export function isValidBdPhone(raw: string): boolean {
  const digits = raw.replace(/[\s-]/g, "");
  return /^(?:\+?880|0)1[3-9]\d{8}$/.test(digits);
}

export const bdPhoneSchema = z
  .string()
  .trim()
  .refine(isValidBdPhone, "Enter a valid Bangladeshi mobile number (e.g. 01712 345678).");

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: emailSchema,
  phone: bdPhoneSchema.optional().or(z.literal("")),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(200),
});

export const addToCartSchema = z.object({
  variantId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(20).default(1),
});

export const updateCartItemSchema = z.object({
  itemId: z.string().min(1).max(64),
  quantity: z.number().int().min(0).max(20),
});

const addressShape = {
  fullName: z.string().trim().min(1).max(120),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  area: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(1).max(100),
  region: z.string().trim().min(1).max(100), // division, e.g. Dhaka
  postalCode: z.string().trim().min(1).max(20),
  country: z.string().trim().length(2).toUpperCase(),
  phone: bdPhoneSchema,
};

export const addressSchema = z.object(addressShape);

export const deliveryZoneSchema = z.enum(["INSIDE_DHAKA", "OUTSIDE_DHAKA"]);

export const paymentMethodSchema = z.enum(["COD", "BKASH", "NAGAD", "CARD", "BANK_TRANSFER"]);

export const checkoutSchema = z.object({
  email: emailSchema,
  deliveryZone: deliveryZoneSchema,
  shippingMethod: z.enum(["STANDARD", "EXPRESS"]),
  paymentMethod: paymentMethodSchema,
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
  customerNote: z.string().trim().max(1000).optional().or(z.literal("")),
  // Optional mobile-money transaction ID (bKash/Nagad). Captured at checkout so
  // the store can verify the transfer; stored server-side with the order.
  paymentTxnId: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Za-z0-9-]*$/, "Transaction ID: letters, numbers and dashes only")
    .optional()
    .or(z.literal("")),
  shipping: addressSchema,
  saveAddress: z.boolean().optional().default(false),
});

export const reviewSchema = z.object({
  productId: z.string().min(1).max(64),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(10).max(2000),
});

export const newsletterSchema = z.object({
  email: emailSchema,
  source: z.string().trim().max(40).optional(),
});

export const bespokeSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: emailSchema,
  phone: bdPhoneSchema,
  jewelryType: z.enum(["Ring", "Necklace", "Bracelet", "Earrings", "Other"]),
  budget: z.string().trim().min(1).max(60),
  timeline: z.string().trim().min(1).max(60),
  description: z.string().trim().min(20).max(4000),
  referenceUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: bdPhoneSchema.optional().or(z.literal("")),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: passwordSchema,
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().min(10).max(200),
  password: passwordSchema,
});

// Product images are stored as URLs (remote or /img/... paths). The admin
// pastes URLs; uploads are out of scope until object storage is wired.
const imageUrl = z.string().trim().max(1000).refine(
  (v) => v === "" || /^https?:\/\//.test(v) || v.startsWith("/"),
  "Image URL must be an https:// URL or a /path.",
);

export const productInputSchema = z.object({
  name: z.string().trim().min(1).max(140),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
  shortDescription: z.string().trim().max(300).default(""),
  description: z.string().trim().max(8000).default(""),
  priceCents: z.number().int().min(1).max(10_000_000_00), // up to ৳10,000,000
  compareAtCents: z.number().int().min(1).max(10_000_000_00).nullable().optional(),
  material: z.string().trim().max(300).default(""),
  purity: z.string().trim().max(60).default(""),
  gemstone: z.string().trim().max(300).default(""),
  dimensions: z.string().trim().max(300).default(""),
  careInstructions: z.string().trim().max(2000).default(""),
  weightGrams: z.number().positive().max(5000).nullable().optional(),
  featured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  madeToOrder: z.boolean().default(false),
  active: z.boolean().default(true),
  allowBackorder: z.boolean().default(false),
  seoTitle: z.string().trim().max(200).nullable().optional(),
  seoDescription: z.string().trim().max(400).nullable().optional(),
  categoryId: z.string().max(64).nullable().optional(),
  collectionId: z.string().max(64).nullable().optional(),
  images: z.array(z.object({ url: imageUrl, alt: z.string().trim().max(200).default("") })).max(12).default([]),
});

export const variantInputSchema = z.object({
  sku: z.string().trim().min(1).max(60).regex(/^[A-Za-z0-9-]+$/, "SKU: letters, numbers, dashes only"),
  optionName: z.string().trim().min(1).max(120),
  color: z.string().trim().max(60).nullable().optional(),
  size: z.string().trim().max(60).nullable().optional(),
  priceDeltaCents: z.number().int().min(-10_000_000_00).max(10_000_000_00).default(0),
  stock: z.number().int().min(0).max(100000).default(0),
  active: z.boolean().default(true),
});

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
  description: z.string().trim().max(500).default(""),
  position: z.number().int().min(0).max(1000).default(0),
});

export const collectionInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
  tagline: z.string().trim().max(200).default(""),
  description: z.string().trim().max(2000).default(""),
  imageUrl: imageUrl.optional().or(z.literal("")),
  position: z.number().int().min(0).max(1000).default(0),
  active: z.boolean().default(true),
});

export const couponInputSchema = z.object({
  code: z.string().trim().min(2).max(40).toUpperCase(),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().int().min(1).max(10_000_000_00),
  minSubtotalCents: z.number().int().min(0).max(10_000_000_00).default(0),
  active: z.boolean().default(true),
  usageLimit: z.number().int().min(1).max(100000).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export const orderUpdateSchema = z.object({
  action: z.enum([
    "markPaid",
    "process",
    "pack",
    "ship",
    "outForDelivery",
    "deliver",
    "cancel",
    "refund",
    "requestReturn",
    "markReturned",
    "markFailed",
  ]),
  carrier: z.string().trim().max(80).optional(),
  trackingNumber: z.string().trim().max(80).optional(),
});

export const settingsInputSchema = z.object({
  storeName: z.string().trim().min(1).max(100),
  storeEmail: emailSchema,
  storePhone: z.string().trim().max(40),
  whatsappNumber: z.string().trim().max(20),
  storeAddress: z.string().trim().max(300),
  vatRatePercent: z.number().int().min(0).max(100),
  insideDhakaStandardCents: z.number().int().min(0).max(1_000_000_00),
  insideDhakaExpressCents: z.number().int().min(0).max(1_000_000_00),
  outsideDhakaStandardCents: z.number().int().min(0).max(1_000_000_00),
  outsideDhakaExpressCents: z.number().int().min(0).max(1_000_000_00),
  freeShippingThresholdCents: z.number().int().min(0).max(100_000_000_00),
  shippingEnabled: z.boolean(),
  codEnabled: z.boolean(),
  bkashNumber: z.string().trim().max(20),
  nagadNumber: z.string().trim().max(20),
  instagramUrl: z.string().trim().max(300),
  facebookUrl: z.string().trim().max(300),
});

export const journalInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
  excerpt: z.string().trim().max(400).default(""),
  body: z.string().trim().max(50000).default(""),
  category: z.enum(["Care", "Styling", "Materials", "Craftsmanship", "Journal"]).default("Journal"),
  coverImage: imageUrl.optional().or(z.literal("")),
  readMinutes: z.number().int().min(1).max(120).default(4),
  published: z.boolean().default(false),
  seoTitle: z.string().trim().max(200).nullable().optional(),
  seoDescription: z.string().trim().max(400).nullable().optional(),
});

export const bespokeStatusSchema = z.object({
  status: z.enum(["NEW", "IN_REVIEW", "QUOTED", "ACCEPTED", "DECLINED", "CLOSED"]),
  adminNotes: z.string().trim().max(2000).optional(),
});

export const journalPostInputSchema = journalInputSchema;
