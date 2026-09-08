// Re-fetch a subset of slots with tightened keyword rules.
// Usage: node scripts/refetch-photos.mjs
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.resolve("public/img");

const SLOTS = [
  { file: "elin-stacking-ring", w: 1400, h: 1750, query: "stacking rings jewelry", must: ["ring"], any: ["stack", "stacked", "jewelry", "gold", "silver"], ban: ["faucet", "hand", "couple", "wedding"] },
  { file: "amara-pearl-ring", w: 1400, h: 1750, query: "pearl ring", must: ["pearl"], any: ["ring", "gold", "silver"], ban: ["necklace", "earring", "woman"] },
  { file: "amara-pearl-ring-2", w: 1400, h: 1750, query: "pearl ring jewelry", must: ["pearl"], any: ["ring", "jewelry", "closeup"], ban: ["necklace", "earring", "woman"] },
  { file: "sable-chain-necklace-2", w: 1400, h: 1750, query: "gold chain necklace closeup", must: ["chain"], any: ["gold", "necklace", "link", "closeup"], ban: ["fence", "fence-link"] },
  { file: "petra-stud-earrings-2", w: 1400, h: 1750, query: "diamond earrings closeup", must: ["earring"], any: ["diamond", "stud", "closeup"], ban: ["ring"] },
  { file: "collection-sterling", w: 1600, h: 1100, query: "silver jewelry elegant", must: ["silver"], any: ["jewelry", "ring", "necklace", "bracelet", "earring"], ban: ["black and white"] },
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
  const w = photo.width ?? 0;
  const h = photo.height ?? 0;
  if (w >= 1500 && h >= 1500) s += 1;
  if (w >= 2500) s += 1;
  const ratio = h / Math.max(1, w);
  if (ratio >= 0.9 && ratio <= 1.6) s += 1;
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
      const raw = pick.urls.raw.split("&")[0];
      const cdnUrl = `${raw}&w=${slot.w}&h=${slot.h}&fit=crop&crop=entropy&q=80&fm=jpg`;
      const bytes = await download(cdnUrl, slot.file);
      seenIds.add(pick.id);
      downloaded += 1;
      console.log(`ok  ${slot.file.padEnd(28)} ${String(Math.round(bytes / 1024)).padStart(4)} KB  photo=${pick.id}  alt="${(pick.alt_description ?? "").slice(0, 90)}"`);
    } catch (err) {
      failed += 1;
      console.error(`ERR ${slot.file}: ${err.message}`);
    }
  }
  console.log(`\nDone: ${downloaded} downloaded, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main();
