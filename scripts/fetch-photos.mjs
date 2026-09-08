// One-time asset pipeline: downloads real jewelry photography (Unsplash License —
// free for commercial use, no attribution required) into public/img so the
// storefront uses actual product-style photography instead of generated SVGs.
//
// Usage: node scripts/fetch-photos.mjs
//
// Every slot defines search terms plus "must/any/ban" keyword rules that are
// scored against Unsplash's own alt text so a ring slot never receives a photo
// of earrings. Chosen photo IDs are printed for review and reused verbatim on
// re-runs (stable CDN URLs, downloaded locally so nothing depends on Unsplash
// at runtime).

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.resolve("public/img");

// name → { file, w, h, query, must: all terms required, any: at least one, ban: none may appear }
const SLOTS = [
  // ---- products (main shot + secondary detail shot; 4:5 crop) ----
  { file: "aurum-solitaire-ring", w: 1400, h: 1750, query: "diamond solitaire ring", must: ["ring"], any: ["diamond", "engagement", "solitaire"], ban: ["hands", "couple"] },
  { file: "aurum-solitaire-ring-2", w: 1400, h: 1750, query: "diamond ring macro", must: ["ring"], any: ["diamond", "macro", "closeup", "stone"], ban: ["hands", "couple"] },
  { file: "meridian-band", w: 1400, h: 1750, query: "gold wedding band ring", must: ["ring"], any: ["gold", "band", "wedding"], ban: ["hands", "couple"] },
  { file: "meridian-band-2", w: 1400, h: 1750, query: "gold ring jewelry", must: ["ring"], any: ["gold"], ban: ["hands"] },
  { file: "elin-stacking-ring", w: 1400, h: 1750, query: "silver rings stack jewelry", must: ["ring"], any: ["silver", "stack", "stacked"], ban: ["hands"] },
  { file: "elin-stacking-ring-2", w: 1400, h: 1750, query: "minimal silver ring", must: ["ring"], any: ["silver", "minimal", "sterling"], ban: ["hands"] },
  { file: "amara-pearl-ring", w: 1400, h: 1750, query: "pearl ring jewelry", must: ["pearl"], any: ["ring", "jewelry"], ban: ["hands"] },
  { file: "amara-pearl-ring-2", w: 1400, h: 1750, query: "pearl jewelry closeup", must: ["pearl"], any: ["ring", "macro", "closeup", "jewelry"], ban: ["hands"] },
  { file: "noor-pendant-necklace", w: 1400, h: 1750, query: "gold pendant necklace", must: ["necklace"], any: ["pendant", "gold", "chain"], ban: [] },
  { file: "noor-pendant-necklace-2", w: 1400, h: 1750, query: "gold necklace woman neck", must: ["necklace"], any: ["gold", "neck", "wearing", "woman"], ban: [] },
  { file: "sable-chain-necklace", w: 1400, h: 1750, query: "gold chain necklace jewelry", must: ["necklace"], any: ["gold", "chain"], ban: [] },
  { file: "sable-chain-necklace-2", w: 1400, h: 1750, query: "gold chain jewelry closeup", must: ["chain"], any: ["gold", "link", "closeup"], ban: [] },
  { file: "ila-bar-pendant", w: 1400, h: 1750, query: "silver pendant necklace", must: ["necklace"], any: ["silver", "pendant"], ban: [] },
  { file: "ila-bar-pendant-2", w: 1400, h: 1750, query: "minimal silver necklace jewelry", must: ["necklace"], any: ["silver", "minimal"], ban: [] },
  { file: "rhea-drop-necklace", w: 1400, h: 1750, query: "diamond pendant necklace woman", must: ["necklace"], any: ["diamond", "pendant", "drop"], ban: [] },
  { file: "rhea-drop-necklace-2", w: 1400, h: 1750, query: "diamond necklace elegant", must: ["necklace"], any: ["diamond", "elegant", "luxury"], ban: [] },
  { file: "tamra-cuff-bangle", w: 1400, h: 1750, query: "gold cuff bracelet", must: ["bracelet"], any: ["gold", "cuff", "bangle"], ban: [] },
  { file: "tamra-cuff-bangle-2", w: 1400, h: 1750, query: "gold bangle bracelets", must: ["bangle"], any: ["gold", "bracelet"], ban: [] },
  { file: "vega-tennis-bracelet", w: 1400, h: 1750, query: "diamond bracelet jewelry", must: ["bracelet"], any: ["diamond", "tennis"], ban: [] },
  { file: "vega-tennis-bracelet-2", w: 1400, h: 1750, query: "diamond bracelet wrist", must: ["bracelet"], any: ["diamond", "wrist", "wearing"], ban: [] },
  { file: "wren-chain-bracelet", w: 1400, h: 1750, query: "silver chain bracelet", must: ["bracelet"], any: ["silver", "chain"], ban: [] },
  { file: "wren-chain-bracelet-2", w: 1400, h: 1750, query: "silver bracelet wrist jewelry", must: ["bracelet"], any: ["silver", "wrist"], ban: [] },
  { file: "nadia-hoop-earrings", w: 1400, h: 1750, query: "gold hoop earrings", must: ["earring"], any: ["gold", "hoop"], ban: [] },
  { file: "nadia-hoop-earrings-2", w: 1400, h: 1750, query: "hoop earrings woman", must: ["earring"], any: ["hoop", "wearing", "woman"], ban: [] },
  { file: "petra-stud-earrings", w: 1400, h: 1750, query: "diamond stud earrings", must: ["earring"], any: ["diamond", "stud"], ban: [] },
  { file: "petra-stud-earrings-2", w: 1400, h: 1750, query: "earrings ear jewelry closeup", must: ["earring"], any: ["stud", "ear", "closeup"], ban: [] },
  { file: "suri-pearl-drops", w: 1400, h: 1750, query: "pearl earrings", must: ["pearl"], any: ["earring", "drop"], ban: [] },
  { file: "suri-pearl-drops-2", w: 1400, h: 1750, query: "pearl drop earrings woman", must: ["earring"], any: ["pearl", "drop", "wearing"], ban: [] },

  // ---- site artwork ----
  { file: "hero-editorial", w: 2000, h: 1400, query: "gold jewelry flat lay luxury", must: ["jewelry"], any: ["gold", "flatlay", "luxury"], ban: [] },
  { file: "category-rings", w: 1200, h: 1500, query: "gold rings jewelry elegant", must: ["ring"], any: ["gold", "jewelry", "elegant"], ban: ["hands"] },
  { file: "category-necklaces", w: 1200, h: 1500, query: "gold necklace jewelry elegant", must: ["necklace"], any: ["gold", "jewelry", "elegant"], ban: [] },
  { file: "category-bracelets", w: 1200, h: 1500, query: "gold bracelet jewelry elegant", must: ["bracelet"], any: ["gold", "jewelry", "bangle"], ban: [] },
  { file: "category-earrings", w: 1200, h: 1500, query: "gold earrings jewelry elegant", must: ["earring"], any: ["gold", "jewelry", "elegant"], ban: [] },
  { file: "story-atelier", w: 1600, h: 1200, query: "jeweler workshop hands crafting", must: [], any: ["jewel", "goldsmith", "workshop", "craft", "bench"], ban: [] },
  { file: "gallery-1", w: 1000, h: 1000, query: "woman wearing gold necklace portrait", must: ["necklace"], any: ["wearing", "woman", "neck"], ban: [] },
  { file: "gallery-2", w: 1000, h: 1000, query: "woman wearing earrings portrait", must: ["earring"], any: ["wearing", "woman"], ban: [] },
  { file: "gallery-3", w: 1000, h: 1000, query: "hand wearing gold rings", must: ["ring"], any: ["hand", "wearing"], ban: [] },
  { file: "gallery-4", w: 1000, h: 1000, query: "woman gold jewelry style", must: ["jewelry"], any: ["woman", "gold", "style"], ban: [] },

  // ---- collection covers ----
  { file: "collection-aurum", w: 1600, h: 1100, query: "22k gold jewelry", must: ["jewelry"], any: ["gold"], ban: [] },
  { file: "collection-solitaire", w: 1600, h: 1100, query: "diamond ring luxury jewelry", must: ["ring"], any: ["diamond", "luxury"], ban: ["hands"] },
  { file: "collection-sterling", w: 1600, h: 1100, query: "silver jewelry minimal elegant", must: ["jewelry"], any: ["silver", "minimal"], ban: [] },
];

const seenIds = new Set();

async function search(query) {
  const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=12`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`search failed (${res.status}) for "${query}"`);
  const data = await res.json();
  return data.results ?? [];
}

function score(photo, slot) {
  const text = `${photo.alt_description ?? ""} ${photo.description ?? ""}`.toLowerCase();
  if (!text.trim()) return -1;
  if (slot.must.some((t) => !text.includes(t))) return -1;
  if (slot.ban.some((t) => text.includes(t))) return -1;
  let s = 0;
  for (const t of slot.any) if (text.includes(t)) s += 2;
  // Prefer purposeful close-ups: square-ish to portrait, decent resolution.
  const w = photo.width ?? 0;
  const h = photo.height ?? 0;
  if (w >= 1500 && h >= 1500) s += 1;
  if (w >= 2500) s += 1;
  const ratio = h / Math.max(1, w);
  if (ratio >= 0.9 && ratio <= 1.6) s += 1;
  // Prefer photos whose alt text also echoes the query.
  for (const t of slot.query.toLowerCase().split(/\s+/)) {
    if (t.length > 3 && text.includes(t)) s += 1;
  }
  return s;
}

async function download(url, file) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed (${res.status}) for ${file}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 15_000) throw new Error(`suspiciously small file for ${file} (${buf.length} bytes)`);
  await writeFile(path.join(OUT_DIR, `${file}.jpg`), buf);
  return buf.length;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  let downloaded = 0;
  let failed = 0;

  for (const slot of SLOTS) {
    try {
      const results = await search(slot.query);
      const ranked = results
        .map((p) => ({ p, s: score(p, slot) }))
        .filter((r) => r.s >= 0)
        .sort((a, b) => b.s - a.s);
      const pick = ranked.find((r) => !seenIds.has(r.p.id))?.p ?? ranked[0]?.p;
      if (!pick) throw new Error(`no acceptable result for "${slot.query}"`);

      const raw = pick.urls.raw.split("&")[0]; // keep base ixid param only
      const cdnUrl = `${raw}&w=${slot.w}&h=${slot.h}&fit=crop&crop=entropy&q=80&fm=jpg`;
      const bytes = await download(cdnUrl, slot.file);
      seenIds.add(pick.id);
      downloaded += 1;
      console.log(
        `ok  ${slot.file.padEnd(28)} ${String(Math.round(bytes / 1024)).padStart(4)} KB  photo=${pick.id}  alt="${(pick.alt_description ?? "").slice(0, 90)}"`,
      );
    } catch (err) {
      failed += 1;
      console.error(`ERR ${slot.file}: ${err.message}`);
    }
  }

  console.log(`\nDone: ${downloaded} downloaded, ${failed} failed, out → ${OUT_DIR}`);
  if (failed > 0) process.exitCode = 1;
}

main();
