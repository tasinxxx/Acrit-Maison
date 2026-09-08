// Final targeted re-fetch with strict dedupe (no duplicate fallback).
import { writeFile } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.resolve("public/img");
const USED = new Set([
  "NhrcL_C0sFA","oXQXxFM2MKw","-GH0bvtecE0","jUgpnaa_MvE","R-Us1TGFioQ","pXYaQEgVfxE",
  "w207NX8kZDs","y2ErhoE92KA","Ks6wd1Zyf1o","QwRwbZe6dWc","u1Hv_erOQH0","ceSCZzjTReg",
  "lbqW0O09RAM","m49PTtW1m-Y","JhmkJzb_oH8","8angSQtYgKc","yc8hHj3KqXA","Ntbbj7eOxJg",
  "JRmm5RIg1xE","IiIF51WJYbM","wifwsvCe43k","RrLBLpOHdIk","n6bbbc3Oc-w","3ai_aJpH9hA",
  "P6NiFTyI294","x63UXjje16o","s9al8aIiVNU","x5LH4df5cCk","itriu-lCKzs","vfgCzz5PFs0",
  "EIDsCqbWYlQ","wMpwmc0PdNE","NBt3j_IAJJ4","7ptOMCNaAZ0","uf_IDewI6iQ","aldDZePniqg",
  "8s5D-lj9MhE","6IYjFLJSE-k",
]);

const SLOTS = [
  { file: "amara-pearl-ring-2", w: 1400, h: 1750, query: "pearl jewelry macro", must: ["pearl"], any: ["ring", "jewelry", "macro", "closeup"], ban: ["necklace", "earring", "woman"] },
  { file: "petra-stud-earrings-2", w: 1400, h: 1750, query: "earrings ear closeup", must: ["earring"], any: ["stud", "diamond", "ear", "closeup"], ban: ["ring", "necklace"] },
];

async function main() {
  for (const slot of SLOTS) {
    const queries = [slot.query, ...slot.any.map((t) => `${t} ${slot.must.join(" ")}`)];
    let picked = null;
    for (const q of queries) {
      if (picked) break;
      const res = await fetch(`https://unsplash.com/napi/search/photos?query=${encodeURIComponent(q)}&per_page=15`, { headers: { accept: "application/json" } });
      const data = await res.json();
      for (const p of data.results ?? []) {
        const text = `${p.alt_description ?? ""} ${p.description ?? ""}`.toLowerCase();
        if (!text.trim()) continue;
        if (slot.must.some((t) => !text.includes(t))) continue;
        if (slot.ban.some((t) => text.includes(t))) continue;
        if (USED.has(p.id)) continue;
        picked = { p, via: q };
        break;
      }
    }
    if (!picked) { console.error(`ERR ${slot.file}: no fresh match`); process.exitCode = 1; continue; }
    const raw = picked.p.urls.raw.split("&")[0];
    const cdnUrl = `${raw}&w=${slot.w}&h=${slot.h}&fit=crop&crop=entropy&q=80&fm=jpg`;
    const dl = await fetch(cdnUrl);
    if (!dl.ok) { console.error(`ERR ${slot.file}: download ${dl.status}`); process.exitCode = 1; continue; }
    const buf = Buffer.from(await dl.arrayBuffer());
    await writeFile(path.join(OUT_DIR, `${slot.file}.jpg`), buf);
    USED.add(picked.p.id);
    console.log(`ok  ${slot.file}  ${Math.round(buf.length / 1024)} KB  photo=${picked.p.id} via="${picked.via}"  alt="${(picked.p.alt_description ?? "").slice(0, 90)}"`);
  }
}
main();
