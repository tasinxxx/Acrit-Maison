import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import * as fs from "node:fs/promises";

const scrypt = promisify(_scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${buf.toString("hex")}`;
}

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@acritmaison.example").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "change-me-immediately";

  await prisma.customer.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Store Admin",
      passwordHash: await hashPassword(adminPassword),
      role: "ADMIN",
    },
  });

  // ---------------------------------------------------------------------------
  // Store settings — Bangladesh-first defaults. Amounts are poisha (100 = ৳1).
  // ---------------------------------------------------------------------------
  const settings: Array<[string, string]> = [
    ["storeName", "Acrit Maison"],
    ["storeEmail", "care@acritmaison.example"],
    ["storePhone", "+880 1000-000000"],
    ["whatsappNumber", "8801000000000"],
    ["storeAddress", "Dhaka, Bangladesh"],
    ["currency", "BDT"],
    ["vatRatePercent", "0"],
    ["insideDhakaStandardCents", "8000"], // ৳80
    ["insideDhakaExpressCents", "15000"], // ৳150
    ["outsideDhakaStandardCents", "15000"], // ৳150
    ["outsideDhakaExpressCents", "30000"], // ৳300
    ["freeShippingThresholdCents", "2000000"], // ৳20,000
    ["shippingEnabled", "true"],
    ["codEnabled", "true"],
    ["bkashNumber", ""], // set in Admin → Settings when ready
    ["nagadNumber", ""],
    ["instagramUrl", ""],
    ["facebookUrl", ""],
  ];
  for (const [key, value] of settings) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  // ---------------------------------------------------------------------------
  // Categories — jewelry only.
  // ---------------------------------------------------------------------------
  const rings = await prisma.category.upsert({
    where: { slug: "rings" },
    update: { name: "Rings", description: "Solitaires, bands and statement rings." },
    create: { name: "Rings", slug: "rings", description: "Solitaires, bands and statement rings.", position: 1 },
  });
  const necklaces = await prisma.category.upsert({
    where: { slug: "necklaces" },
    update: { name: "Necklaces", description: "Chains, pendants and layered pieces." },
    create: { name: "Necklaces", slug: "necklaces", description: "Chains, pendants and layered pieces.", position: 2 },
  });
  const bracelets = await prisma.category.upsert({
    where: { slug: "bracelets" },
    update: { name: "Bracelets", description: "Bangles, cuffs and fine chains." },
    create: { name: "Bracelets", slug: "bracelets", description: "Bangles, cuffs and fine chains.", position: 3 },
  });
  const earrings = await prisma.category.upsert({
    where: { slug: "earrings" },
    update: { name: "Earrings", description: "Studs, hoops and drops." },
    create: { name: "Earrings", slug: "earrings", description: "Studs, hoops and drops.", position: 4 },
  });

  // ---------------------------------------------------------------------------
  // Editorial collections.
  // ---------------------------------------------------------------------------
  const aurum = await prisma.collection.upsert({
    where: { slug: "aurum-heritage" },
    update: { imageUrl: "/img/collection-aurum.jpg" },
    create: {
      name: "Aurum Heritage",
      slug: "aurum-heritage",
      tagline: "Solid gold, quietly worn.",
      description:
        "The house's founding collection: solid 22K gold pieces with hand-finished surfaces, designed to be worn every day and kept for generations.",
      imageUrl: "/img/collection-aurum.jpg",
      position: 1,
    },
  });
  const solitaire = await prisma.collection.upsert({
    where: { slug: "solitaire-edit" },
    update: { imageUrl: "/img/collection-solitaire.jpg" },
    create: {
      name: "Solitaire Edit",
      slug: "solitaire-edit",
      tagline: "One stone. Nothing else.",
      description:
        "A study in restraint — a single stone, set by hand, on bands of quiet proportion. For engagements and for no occasion at all.",
      imageUrl: "/img/collection-solitaire.jpg",
      position: 2,
    },
  });
  const sterling = await prisma.collection.upsert({
    where: { slug: "sterling-daily" },
    update: { imageUrl: "/img/collection-sterling.jpg" },
    create: {
      name: "Sterling Daily",
      slug: "sterling-daily",
      tagline: "Silver for every day.",
      description:
        "925 sterling silver pieces made to be lived in — rhodium-finished to resist tarnish, priced to be worn without worry.",
      imageUrl: "/img/collection-sterling.jpg",
      position: 3,
    },
  });

  type SeedVariant = { name: string; color?: string; size?: string; delta?: number; stock: number };
  type SeedProduct = {
    name: string;
    slug: string;
    category: typeof rings;
    collection?: typeof aurum;
    price: number; // poisha
    compareAt?: number;
    short: string;
    description: string;
    material: string;
    purity: string;
    gemstone: string;
    dimensions: string;
    care: string;
    weightGrams?: number;
    featured?: boolean;
    isNew?: boolean;
    isBestSeller?: boolean;
    madeToOrder?: boolean;
    seoTitle?: string;
    seoDescription?: string;
    variants: SeedVariant[];
  };

  // All figures below are demo/seed data for development and clearly internal —
  // no reviews, certifications, awards or business history are fabricated.
  const products: SeedProduct[] = [
    {
      name: "Aurum Solitaire Ring",
      slug: "aurum-solitaire-ring",
      category: rings,
      collection: solitaire,
      price: 18500000, // ৳185,000
      short: "A single lab-grown diamond on a hand-finished 18K gold band.",
      description:
        "One stone, one band, nothing else. The Aurum solitaire is set by hand with a four-claw setting lifted slightly off the finger so light reaches the pavilion. The band is drawn from solid 18K gold and polished to a soft, quiet lustre.\n\nEach ring is made to order in your size and arrives with its stone disclosure card.",
      material: "Solid 18K gold, lab-grown diamond",
      purity: "18K",
      gemstone: "Lab-grown diamond (VS1, F colour)",
      dimensions: "Band width 1.8 mm, stone 0.50 ct",
      care: "Store in the enclosed pouch. Clean with mild soap and a soft brush; avoid ultrasonic cleaners.",
      weightGrams: 2.4,
      featured: true,
      madeToOrder: true,
      seoTitle: "Aurum Solitaire Ring — 18K Gold & Lab-Grown Diamond",
      seoDescription: "A hand-set lab-grown diamond solitaire in solid 18K gold, made to order by Acrit Maison.",
      variants: [
        { name: "Yellow Gold · Size 14", color: "Yellow Gold", size: "14", stock: 0 },
        { name: "Yellow Gold · Size 15", color: "Yellow Gold", size: "15", stock: 0 },
        { name: "Yellow Gold · Size 16", color: "Yellow Gold", size: "16", stock: 0 },
        { name: "Yellow Gold · Size 17", color: "Yellow Gold", size: "17", stock: 0 },
        { name: "Yellow Gold · Size 18", color: "Yellow Gold", size: "18", stock: 0 },
        { name: "Rose Gold · Size 16", color: "Rose Gold", size: "16", delta: 250000, stock: 0 },
        { name: "Rose Gold · Size 17", color: "Rose Gold", size: "17", delta: 250000, stock: 0 },
      ],
    },
    {
      name: "Meridian Band",
      slug: "meridian-band",
      category: rings,
      collection: aurum,
      price: 9800000, // ৳98,000
      short: "A comfort-fit 22K band with a softly domed profile.",
      description:
        "The Meridian band is drawn from solid 22K gold and finished with a satin brush that catches light without shine. Its domed profile sits comfortably against neighbouring rings, and the interior is rounded for all-day wear.",
      material: "Solid 22K gold",
      purity: "22K",
      gemstone: "None",
      dimensions: "Band width 3.5 mm",
      care: "Polish with the enclosed jewellery cloth. Remove before swimming or heavy work.",
      weightGrams: 4.1,
      featured: true,
      isBestSeller: true,
      variants: [
        { name: "Yellow Gold · Size 12", color: "Yellow Gold", size: "12", stock: 4 },
        { name: "Yellow Gold · Size 14", color: "Yellow Gold", size: "14", stock: 6 },
        { name: "Yellow Gold · Size 16", color: "Yellow Gold", size: "16", stock: 7 },
        { name: "Yellow Gold · Size 18", color: "Yellow Gold", size: "18", stock: 5 },
        { name: "Yellow Gold · Size 20", color: "Yellow Gold", size: "20", stock: 3 },
        { name: "Yellow Gold · Size 22", color: "Yellow Gold", size: "22", stock: 2 },
      ],
    },
    {
      name: "Elin Stacking Ring",
      slug: "elin-stacking-ring",
      category: rings,
      collection: sterling,
      price: 680000, // ৳6,800
      short: "A slim 925 silver ring made to be layered.",
      description:
        "Elin is a hairline of sterling silver — 1.4 mm wide, rhodium-finished to resist tarnish. Wear one, or wear five. The seam is polished away by hand so nothing catches.",
      material: "925 sterling silver, rhodium finish",
      purity: "925",
      gemstone: "None",
      dimensions: "Band width 1.4 mm",
      care: "Wipe after wear and store in the pouch. Polish with a silver cloth when needed.",
      weightGrams: 1.1,
      isNew: true,
      variants: [
        { name: "Silver · Size 13", color: "Silver", size: "13", stock: 10 },
        { name: "Silver · Size 15", color: "Silver", size: "15", stock: 14 },
        { name: "Silver · Size 17", color: "Silver", size: "17", stock: 12 },
        { name: "Silver · Size 19", color: "Silver", size: "19", stock: 8 },
      ],
    },
    {
      name: "Amara Pearl Ring",
      slug: "amara-pearl-ring",
      category: rings,
      collection: sterling,
      price: 1450000, // ৳14,500
      short: "A freshwater pearl held in a silver petal setting.",
      description:
        "A single 7 mm freshwater pearl sits in a hand-formed sterling silver petal. The band tapers towards the back for comfort. Pearls are natural and will vary slightly in lustre — this is the material, not a flaw.",
      material: "925 sterling silver, freshwater pearl",
      purity: "925",
      gemstone: "Freshwater pearl (7 mm)",
      dimensions: "Band width 2 mm tapering to 1.2 mm",
      care: "Pearls are soft: apply perfume before wearing, wipe with a dry soft cloth after, never ultrasonic-clean.",
      weightGrams: 2.0,
      isNew: true,
      variants: [
        { name: "Silver · Size 14", color: "Silver", size: "14", stock: 5 },
        { name: "Silver · Size 16", color: "Silver", size: "16", stock: 6 },
        { name: "Silver · Size 18", color: "Silver", size: "18", stock: 4 },
      ],
    },
    {
      name: "Noor Pendant Necklace",
      slug: "noor-pendant-necklace",
      category: necklaces,
      collection: aurum,
      price: 7600000, // ৳76,000
      short: "A brushed 22K gold disc on a fine cable chain.",
      description:
        "The Noor pendant is a 10 mm disc of solid 22K gold, brushed by hand so it glows rather than glitters. It moves on a 1 mm cable chain with a 2 cm extender, closing with a ring clasp.",
      material: "Solid 22K gold pendant, 22K gold chain",
      purity: "22K",
      gemstone: "None",
      dimensions: "Pendant Ø 10 mm; chain 42 cm + 2 cm extender",
      care: "Polish gently with the enclosed cloth. Remove before sleeping to protect the chain.",
      weightGrams: 2.8,
      featured: true,
      isBestSeller: true,
      variants: [
        { name: "Yellow Gold · 42 cm", color: "Yellow Gold", size: "42 cm", stock: 5 },
        { name: "Yellow Gold · 45 cm", color: "Yellow Gold", size: "45 cm", stock: 6 },
        { name: "Yellow Gold · 50 cm", color: "Yellow Gold", size: "50 cm", stock: 3 },
      ],
    },
    {
      name: "Sable Chain Necklace",
      slug: "sable-chain-necklace",
      category: necklaces,
      collection: aurum,
      price: 12400000, // ৳124,000
      short: "A hand-assembled 22K gold rope chain.",
      description:
        "Every link of the Sable chain is formed, cut and soldered by hand — a rope pattern that reads solid from across the room. It closes with a heavy trigger clasp and a maker's tab.",
      material: "Solid 22K gold",
      purity: "22K",
      gemstone: "None",
      dimensions: "Chain width 2.5 mm; lengths 45 / 50 / 55 cm",
      care: "Store flat in the pouch to prevent kinks. Professional cleaning recommended annually.",
      weightGrams: 9.6,
      madeToOrder: true,
      variants: [
        { name: "Yellow Gold · 45 cm", color: "Yellow Gold", size: "45 cm", stock: 0 },
        { name: "Yellow Gold · 50 cm", color: "Yellow Gold", size: "50 cm", stock: 0 },
        { name: "Yellow Gold · 55 cm", color: "Yellow Gold", size: "55 cm", stock: 0 },
      ],
    },
    {
      name: "Ila Bar Pendant",
      slug: "ila-bar-pendant",
      category: necklaces,
      collection: sterling,
      price: 890000, // ৳8,900
      short: "A horizontal silver bar on a whisper-fine chain.",
      description:
        "The Ila pendant is a 20 mm bar of sterling silver with softly rounded ends, hung horizontally on a 0.8 mm chain. A quiet piece that layers well with shorter chains.",
      material: "925 sterling silver, rhodium finish",
      purity: "925",
      gemstone: "None",
      dimensions: "Bar 20 × 2.5 mm; chain 45 cm",
      care: "Wipe after wear. Store flat in the pouch.",
      weightGrams: 2.2,
      isNew: true,
      variants: [
        { name: "Silver · 40 cm", color: "Silver", size: "40 cm", stock: 8 },
        { name: "Silver · 45 cm", color: "Silver", size: "45 cm", stock: 11 },
        { name: "Silver · 50 cm", color: "Silver", size: "50 cm", stock: 6 },
      ],
    },
    {
      name: "Rhea Drop Necklace",
      slug: "rhea-drop-necklace",
      category: necklaces,
      collection: solitaire,
      price: 21800000, // ৳218,000
      short: "A 0.75 ct lab-grown diamond suspended on an 18K gold chain.",
      description:
        "A single lab-grown diamond in a four-claw drop setting, suspended from an 18K gold trace chain. The bail is hinged so the stone sits flat against the collarbone and never twists.",
      material: "Solid 18K gold, lab-grown diamond",
      purity: "18K",
      gemstone: "Lab-grown diamond (VS1, F colour, 0.75 ct)",
      dimensions: "Stone 0.75 ct; chain 42 cm + 2 cm extender",
      care: "Clean with mild soap and a soft brush. Store separately in the enclosed pouch.",
      weightGrams: 3.1,
      featured: true,
      madeToOrder: true,
      variants: [
        { name: "Yellow Gold · 42 cm", color: "Yellow Gold", size: "42 cm", stock: 0 },
        { name: "White Gold · 42 cm", color: "White Gold", size: "42 cm", delta: 150000, stock: 0 },
        { name: "Yellow Gold · 45 cm", color: "Yellow Gold", size: "45 cm", stock: 0 },
      ],
    },
    {
      name: "Tamra Cuff Bangle",
      slug: "tamra-cuff-bangle",
      category: bracelets,
      collection: aurum,
      price: 15200000, // ৳152,000
      short: "A sculpted 22K gold cuff with a brushed face.",
      description:
        "The Tamra cuff is formed from solid 22K gold stock, hammered lightly along the outer face and polished inside so it slips over the hand cleanly. Its opening is sized to the wrist, not the hand — measure before ordering.",
      material: "Solid 22K gold",
      purity: "22K",
      gemstone: "None",
      dimensions: "Cuff width 6 mm; bangle sizes 2.4 – 2.8",
      care: "Wipe with the enclosed cloth after wear. Store closed side up to hold its shape.",
      weightGrams: 12.5,
      featured: true,
      isBestSeller: true,
      variants: [
        { name: "Yellow Gold · 2.4", color: "Yellow Gold", size: "2.4", stock: 3 },
        { name: "Yellow Gold · 2.6", color: "Yellow Gold", size: "2.6", stock: 4 },
        { name: "Yellow Gold · 2.8", color: "Yellow Gold", size: "2.8", stock: 2 },
      ],
    },
    {
      name: "Vega Tennis Bracelet",
      slug: "vega-tennis-bracelet",
      category: bracelets,
      collection: solitaire,
      price: 28500000, // ৳285,000
      short: "A line of lab-grown diamonds in an 18K gold setting.",
      description:
        "Forty-two lab-grown diamonds, each 2.5 mm, set in individual four-claw baskets along an 18K gold line. The clasp is a concealed box with a double safety catch. Made to order in 16 or 18 cm.",
      material: "Solid 18K gold, lab-grown diamonds",
      purity: "18K",
      gemstone: "Lab-grown diamonds (VS1, F colour, 2.4 ct total)",
      dimensions: "Line width 3.2 mm; lengths 16 / 18 cm",
      care: "Clean with mild soap and a soft brush. Check the clasp closes fully before each wear.",
      weightGrams: 8.9,
      madeToOrder: true,
      variants: [
        { name: "Yellow Gold · 16 cm", color: "Yellow Gold", size: "16 cm", stock: 0 },
        { name: "Yellow Gold · 18 cm", color: "Yellow Gold", size: "18 cm", stock: 0 },
        { name: "White Gold · 16 cm", color: "White Gold", size: "16 cm", delta: 300000, stock: 0 },
        { name: "White Gold · 18 cm", color: "White Gold", size: "18 cm", delta: 300000, stock: 0 },
      ],
    },
    {
      name: "Wren Chain Bracelet",
      slug: "wren-chain-bracelet",
      category: bracelets,
      collection: sterling,
      price: 740000, // ৳7,400
      short: "A fine sterling silver curb chain with a ring clasp.",
      description:
        "The Wren bracelet is a 2 mm curb chain in rhodium-finished sterling silver, sized with a 2 cm extender so it sits right on the wrist. Designed to stack with the Tamra cuff or wear alone.",
      material: "925 sterling silver, rhodium finish",
      purity: "925",
      gemstone: "None",
      dimensions: "Chain width 2 mm; 16 cm + 2 cm extender",
      care: "Wipe after wear and store in the pouch.",
      weightGrams: 2.6,
      isNew: true,
      variants: [
        { name: "Silver · 16 cm", color: "Silver", size: "16 cm", stock: 9 },
        { name: "Silver · 18 cm", color: "Silver", size: "18 cm", stock: 9 },
      ],
    },
    {
      name: "Nadia Hoop Earrings",
      slug: "nadia-hoop-earrings",
      category: earrings,
      collection: aurum,
      price: 6400000, // ৳64,000
      short: "Everyday 22K gold hoops with a hinged post.",
      description:
        "The Nadia hoops are drawn 22K gold tube, 14 mm across, with a hinged post that clicks shut with a satisfying close. Light enough to sleep in; we still recommend taking them off.",
      material: "Solid 22K gold",
      purity: "22K",
      gemstone: "None",
      dimensions: "Ø 14 mm, tube 1.5 mm",
      care: "Wipe with the enclosed cloth. Keep the hinge free of lotion and dust.",
      weightGrams: 1.9,
      featured: true,
      isBestSeller: true,
      variants: [
        { name: "Yellow Gold · 14 mm", color: "Yellow Gold", size: "14 mm", stock: 6 },
        { name: "Yellow Gold · 20 mm", color: "Yellow Gold", size: "20 mm", delta: 900000, stock: 4 },
      ],
    },
    {
      name: "Petra Stud Earrings",
      slug: "petra-stud-earrings",
      category: earrings,
      collection: solitaire,
      price: 9200000, // ৳92,000
      short: "A pair of 0.25 ct lab-grown diamond studs in 18K gold.",
      description:
        "Two lab-grown diamonds, matched for colour and clarity within a grade, in four-claw 18K gold baskets. Butterfly backs with a low profile so they sit close to the lobe.",
      material: "Solid 18K gold, lab-grown diamonds",
      purity: "18K",
      gemstone: "Lab-grown diamonds (VS1, F colour, 0.50 ct total pair)",
      dimensions: "Stone Ø 4 mm each",
      care: "Clean with mild soap and a soft brush. Store in the enclosed pouch, not loose in a box.",
      weightGrams: 1.2,
      featured: true,
      variants: [
        { name: "Yellow Gold", color: "Yellow Gold", stock: 5 },
        { name: "White Gold", color: "White Gold", delta: 100000, stock: 3 },
      ],
    },
    {
      name: "Suri Pearl Drops",
      slug: "suri-pearl-drops",
      category: earrings,
      collection: sterling,
      price: 1150000, // ৳11,500
      short: "Freshwater pearl drops on silver threads.",
      description:
        "Two 8 mm freshwater pearls hang from hand-formed sterling silver hooks. The drop is 24 mm in total — enough movement to catch light, quiet enough for every day.",
      material: "925 sterling silver, freshwater pearl",
      purity: "925",
      gemstone: "Freshwater pearls (8 mm)",
      dimensions: "Drop 24 mm",
      care: "Apply perfume before wearing. Wipe pearls with a dry soft cloth and store flat.",
      weightGrams: 2.4,
      isNew: true,
      variants: [
        { name: "Silver", color: "Silver", stock: 7 },
        { name: "Gold Vermeil", color: "Gold Vermeil", delta: 200000, stock: 5 },
      ],
    },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        shortDescription: p.short,
        description: p.description,
        priceCents: p.price,
        compareAtCents: p.compareAt ?? null,
        material: p.material,
        purity: p.purity,
        gemstone: p.gemstone,
        dimensions: p.dimensions,
        careInstructions: p.care,
        weightGrams: p.weightGrams ?? null,
        featured: p.featured ?? false,
        isNewArrival: p.isNew ?? false,
        isBestSeller: p.isBestSeller ?? false,
        madeToOrder: p.madeToOrder ?? false,
        seoTitle: p.seoTitle ?? null,
        seoDescription: p.seoDescription ?? null,
        categoryId: p.category.id,
        collectionId: p.collection?.id ?? null,
      },
    });

    let i = 0;
    for (const v of p.variants) {
      i += 1;
      const sku = `${p.slug.split("-").map((w) => w.slice(0, 3).toUpperCase()).join("-")}-${String(i).padStart(2, "0")}`;
      await prisma.variant.upsert({
        where: { sku },
        update: { stock: v.stock },
        create: {
          productId: product.id,
          sku,
          optionName: v.name,
          color: v.color ?? null,
          size: v.size ?? null,
          priceDeltaCents: v.delta ?? 0,
          stock: v.stock,
        },
      });
    }

    // Real product photography lives in public/img (see scripts/fetch-photos.mjs).
    // Two shots per product: primary + secondary, which powers card hover and
    // the gallery's second thumbnail. Falls back to a generated SVG only when
    // the photography has not been fetched (e.g. a bare fresh clone).
    await fs.mkdir("public/img", { recursive: true });
    const mainUrl = (await fs.access(`public/img/${p.slug}.jpg`).then(() => true, () => false))
      ? `/img/${p.slug}.jpg`
      : `/img/${p.slug}.svg`;
    await prisma.productImage.upsert({
      where: { id: `${product.id}-img0` },
      update: { url: mainUrl, alt: p.name },
      create: { id: `${product.id}-img0`, productId: product.id, url: mainUrl, alt: p.name, position: 0 },
    });
    if (mainUrl.endsWith(".svg")) {
      await fs.writeFile(`public/img/${p.slug}.svg`, productSvg(p.name), "utf8");
    }
    if (await fs.access(`public/img/${p.slug}-2.jpg`).then(() => true, () => false)) {
      await prisma.productImage.upsert({
        where: { id: `${product.id}-img1` },
        update: { url: `/img/${p.slug}-2.jpg`, alt: `${p.name} — detail` },
        create: { id: `${product.id}-img1`, productId: product.id, url: `/img/${p.slug}-2.jpg`, alt: `${p.name} — detail`, position: 1 },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Journal seed posts — clearly marked demo content, published so the public
  // pages and admin screens have something real to render.
  // ---------------------------------------------------------------------------
  const posts = [
    {
      title: "How to Care for 22K Gold",
      slug: "how-to-care-for-22k-gold",
      excerpt: "High-karat gold is soft by nature. A few habits keep it looking the way it left the bench.",
      category: "Care",
      readMinutes: 4,
      published: true,
      body: `22K gold is 91.6% pure gold, which is why it has that deep warm colour — and also why it is softer than 14K or 18K alloys. Softness is not a flaw; it is chemistry. It only means the piece needs slightly different habits.

Everyday care
Put your jewelry on last, after perfume, lotion and dressing. Take it off first, before exercise, swimming or housework. Chlorine and perspiration are the two things that dull high-karat gold fastest.

Cleaning
Warm water, two drops of mild dish soap, ten minutes, a soft baby toothbrush along the underside of the piece, pat dry on a lint-free cloth. That is the whole routine. Skip ultrasonic cleaners unless a jeweller has inspected the piece — they can loosen hand-set stones.

Storage
Store each piece in its own pouch. Gold scratches gold; a soft pouch prevents most of it. Keep chains flat and fastened so they cannot knot.

When to bring it in
If a claw looks proud of the stone, if a chain link catches, or if a hinge stops clicking — stop wearing the piece and bring it to us. All Acrit Maison pieces can be returned to the maison for inspection and re-finishing.`,
    },
    {
      title: "Reading a Jewellery Description Honestly",
      slug: "reading-a-jewellery-description-honestly",
      excerpt: "What 'lab-grown', 'vermeil' and '925' actually mean — and what a maison should always disclose.",
      category: "Materials",
      readMinutes: 5,
      published: true,
      body: `A jewellery description should tell you exactly what you are buying and let you decide. Here is the vocabulary we use, and what each term commits us to.

925 sterling silver
92.5% silver by weight, the rest usually copper for hardness. Anything less is not sterling, whatever it is called.

Gold vermeil
A thick gold plating — at least 2.5 microns — over solid sterling silver. It wears like plating wears: eventually, honestly, and re-platable.

18K / 22K gold
18K is 75% gold; 22K is 91.6%. Higher karat means warmer colour and softer metal. We state the karat of every gold piece on its product page.

Lab-grown diamonds
Chemically and optically diamond, grown in a laboratory rather than mined. We disclose lab-grown stones as lab-grown, always, and never use the word "diamond" without the qualifier.

Natural stones
Natural does not mean untreated. Where a stone has been treated — heat, oiling, dye — we say so in the product's material line.

What we refuse to do
No invented heritage. No fake scarcity counters. No invented reviews. If a claim is not on the product page, we did not make it.`,
    },
    {
      title: "Choosing a Ring Size at Home",
      slug: "choosing-a-ring-size-at-home",
      excerpt: "Three reliable ways to measure, and when to size up instead of down.",
      category: "Styling",
      readMinutes: 3,
      published: true,
      body: `The most reliable method: borrow a ring that already fits the finger, measure its inner diameter in millimetres, and match it to our size chart on the product page.

The string method, done properly
Cut a strip of paper about 5 mm wide — string stretches and lies. Wrap it snugly around the base of the finger, mark where it meets, and measure that length in millimetres. That is the circumference; our chart converts it to size.

When to size up
Fingers swell in heat and by evening. If you are between sizes, take the larger one — especially for wide bands like the Meridian, which feel tighter than their number suggests. Bangles must pass over the knuckle, so measure the knuckle, not the wrist.

Still unsure
Message us on WhatsApp with your measurement. A human answers, and resizing a band is a straightforward bench job we are happy to do.`,
    },
  ];
  for (const post of posts) {
    await prisma.journalPost.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        body: post.body,
        category: post.category,
        readMinutes: post.readMinutes,
        published: post.published,
        publishedAt: post.published ? new Date() : null,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Site artwork: hero, category and story photography (see
  // scripts/fetch-photos.mjs). A generated SVG is written only as a fallback
  // when the photography has not been fetched.
  // ---------------------------------------------------------------------------
  await fs.mkdir("public/img", { recursive: true });
  const artwork: Array<[string, string, string, string]> = [
    ["hero-editorial", "Fine jewelry arranged on warm ivory", "#f3efe8", "#b8935f"],
    ["category-rings", "Rings collection", "#f7f3ec", "#9a7a4b"],
    ["category-necklaces", "Necklaces collection", "#f7f3ec", "#9a7a4b"],
    ["category-bracelets", "Bracelets collection", "#f7f3ec", "#9a7a4b"],
    ["category-earrings", "Earrings collection", "#f7f3ec", "#9a7a4b"],
  ];
  for (const [name, label, bg, stroke] of artwork) {
    if (await fs.access(`public/img/${name}.jpg`).then(() => true, () => false)) continue;
    await fs.writeFile(`public/img/${name}.svg`, artworkSvg(label, bg, stroke), "utf8");
  }

  // ---------------------------------------------------------------------------
  // One welcome coupon so the checkout discount flow can be exercised in dev.
  // ---------------------------------------------------------------------------
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      type: "PERCENT",
      value: 10,
      minSubtotalCents: 500000, // ৳5,000
      active: true,
      usageLimit: 100,
    },
  });

  console.log("Seed complete: jewelry catalog, settings, journal posts, admin account, WELCOME10 coupon.");
}

function productSvg(name: string): string {
  const esc = name.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <rect width="800" height="800" fill="#f3efe8"/>
  <rect x="120" y="120" width="560" height="560" fill="none" stroke="#d8d0c2" stroke-width="2"/>
  <text x="400" y="380" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="#6b6255">${esc}</text>
  <text x="400" y="430" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="#a89f8f">Acrit Maison</text>
</svg>
`;
}

function artworkSvg(label: string, bg: string, stroke: string): string {
  const esc = label.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <rect width="1200" height="900" fill="${bg}"/>
  <rect x="90" y="90" width="1020" height="720" fill="none" stroke="#d8d0c2" stroke-width="2"/>
  <g fill="none" stroke="${stroke}" stroke-width="3">
    <circle cx="600" cy="400" r="120"/>
    <circle cx="600" cy="400" r="86"/>
    <path d="M560 320l80 0"/>
    <circle cx="380" cy="560" r="54"/>
    <circle cx="820" cy="560" r="54"/>
    <path d="M600 520l-40 90 80 0z"/>
  </g>
  <text x="600" y="740" text-anchor="middle" font-family="Georgia, serif" font-size="26" fill="#a89f8f" letter-spacing="6">${esc.toUpperCase()}</text>
</svg>
`;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
