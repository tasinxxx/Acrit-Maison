// Shared jewelry-domain constants used by storefront pages, forms and the
// admin dashboard. Keeping them in one place keeps copy consistent.

export const JEWELRY_CATEGORIES = ["Rings", "Necklaces", "Bracelets", "Earrings"] as const;

export const RING_SIZES = ["12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24"] as const;

export const CHAIN_LENGTHS = ["40 cm", "42 cm", "45 cm", "50 cm", "55 cm"] as const;

export const BANGLE_SIZES = ["2.2", "2.4", "2.6", "2.8", "3.0"] as const;

export const METAL_TONES = ["Yellow Gold", "White Gold", "Rose Gold", "Silver", "Gold Vermeil"] as const;

export type RingSizeRow = { size: string; diameterMm: number; circumferenceMm: number };

// Standard South Asian/US-linked ring size chart (diameter in mm).
export const RING_SIZE_CHART: RingSizeRow[] = [
  { size: "12", diameterMm: 16.5, circumferenceMm: 51.9 },
  { size: "13", diameterMm: 16.9, circumferenceMm: 53.1 },
  { size: "14", diameterMm: 17.3, circumferenceMm: 54.4 },
  { size: "15", diameterMm: 17.7, circumferenceMm: 55.7 },
  { size: "16", diameterMm: 18.2, circumferenceMm: 57.0 },
  { size: "17", diameterMm: 18.6, circumferenceMm: 58.3 },
  { size: "18", diameterMm: 19.0, circumferenceMm: 59.5 },
  { size: "19", diameterMm: 19.4, circumferenceMm: 60.8 },
  { size: "20", diameterMm: 19.8, circumferenceMm: 62.1 },
  { size: "21", diameterMm: 20.2, circumferenceMm: 63.4 },
  { size: "22", diameterMm: 20.6, circumferenceMm: 64.6 },
  { size: "23", diameterMm: 21.0, circumferenceMm: 65.9 },
  { size: "24", diameterMm: 21.4, circumferenceMm: 67.2 },
];

export const BRACELET_SIZE_GUIDE = [
  { size: "2.2", wristCm: "14.0 – 14.9", note: "Snug fit" },
  { size: "2.4", wristCm: "15.0 – 15.9", note: "Most common" },
  { size: "2.6", wristCm: "16.0 – 16.9", note: "Comfortable" },
  { size: "2.8", wristCm: "17.0 – 17.9", note: "Relaxed" },
  { size: "3.0", wristCm: "18.0 – 19.0", note: "Loose fit" },
];

export const NECKLACE_LENGTH_GUIDE = [
  { length: "40 cm", note: "Sits at the collarbone — choker feel" },
  { length: "42 cm", note: "Just below the collarbone — classic" },
  { length: "45 cm", note: "At the neckline — most versatile" },
  { length: "50 cm", note: "Below the neckline — pendant-friendly" },
  { length: "55 cm", note: "Lower drape — layered looks" },
];

export const BESPOKE_BUDGETS = [
  "Under ৳25,000",
  "৳25,000 – ৳50,000",
  "৳50,000 – ৳100,000",
  "৳100,000 – ৳250,000",
  "Above ৳250,000",
] as const;

export const BESPOKE_TIMELINES = [
  "Within 2 weeks",
  "2 – 4 weeks",
  "1 – 2 months",
  "Flexible",
] as const;

export const JEWELRY_CARE_TIPS = [
  "Put jewelry on last — after perfume, lotion and dressing.",
  "Wipe pieces with the enclosed soft cloth after each wear.",
  "Store each piece separately in its pouch to prevent scratching.",
  "Remove before swimming, bathing or household cleaning.",
  "Gold vermeil and silver polish best with a dedicated jewelry cloth.",
];

export function isRingSize(value: string | null | undefined): boolean {
  return !!value && (RING_SIZES as readonly string[]).includes(value);
}
