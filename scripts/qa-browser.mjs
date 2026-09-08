// Browser QA pass: real Chromium against the running production server.
// Checks every key route at mobile / tablet / desktop for:
//   console + page errors, failed requests (broken images/links),
//   horizontal overflow, unloaded images, unlabeled controls,
//   and axe-core accessibility violations (critical/serious only).
//
// Usage:
//   1. npm run build && npm run start   (server on :3000)
//   2. node scripts/qa-browser.mjs [baseUrl]
//
// Optional: ADMIN_EMAIL + ADMIN_PASSWORD env vars to also QA /admin pages.

import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";
import path from "node:path";

const BASE = process.argv[2] || "http://localhost:3000";
const AXE_SRC = readFileSync(path.resolve("node_modules/axe-core/axe.min.js"), "utf8");

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844, dpr: 2 },
  { name: "tablet", width: 768, height: 1024, dpr: 2 },
  { name: "desktop", width: 1440, height: 900, dpr: 1 },
];

const PUBLIC_ROUTES = [
  "/",
  "/shop",
  "/shop?category=rings",
  "/collections",
  "/collections/aurum-heritage",
  "/best-sellers",
  "/new-arrivals",
  "/search?q=ring",
  "/products/aurum-solitaire-ring",
  "/products/nadia-hoop-earrings",
  "/cart",
  "/checkout",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password?token=test",
  "/wishlist",
  "/account",
  "/about",
  "/bespoke",
  "/journal",
  "/journal/how-to-care-for-22k-gold",
  "/delivery-returns",
  "/care-guide",
  "/contact",
  "/order-tracking",
  "/order-tracking?number=AM-00-000000",
  "/nonexistent-page-404-check",
];

const ADMIN_ROUTES = [
  "/admin",
  "/admin/products",
  "/admin/orders",
  "/admin/customers",
  "/admin/categories",
  "/admin/coupons",
  "/admin/journal",
  "/admin/reviews",
  "/admin/bespoke",
  "/admin/settings",
];

const issues = [];
const seen = new Set();

function report(route, viewport, kind, detail) {
  const key = `${kind}|${detail}`;
  const dedupe = seen.has(key) ? " (repeats elsewhere)" : "";
  seen.add(key);
  issues.push({ route, viewport, kind, detail: detail + dedupe });
}

async function inspectPage(page, route, viewportName) {
  const consoleErrors = [];
  const failedRequests = [];
  const onConsole = (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 300));
  };
  const onResponse = (res) => {
    if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url().replace(BASE, "")}`);
  };
  const onRequestFailed = (req) => {
    const failure = req.failure()?.errorText ?? "";
    if (failure.includes("ERR_ABORTED")) return; // client-side nav aborts are normal
    failedRequests.push(`NET ${failure} ${req.url().replace(BASE, "")}`);
  };
  page.on("console", onConsole);
  page.on("response", onResponse);
  page.on("requestfailed", onRequestFailed);

  try {
    // "load" + fixed settle: networkidle stalls on Next.js link prefetching.
    await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500)); // allow hydration/motion settle
  } catch (err) {
    report(route, viewportName, "navigation", String(err.message).slice(0, 200));
    cleanup();
    return;
  }

  // Console + page errors.
  for (const text of consoleErrors) {
    if (text.includes("favicon")) continue;
    report(route, viewportName, "console-error", text);
  }

  // Failed requests (broken images / links / APIs).
  const uniqueFailed = [...new Set(failedRequests)];
  for (const f of uniqueFailed) {
    if (route === "/nonexistent-page-404-check") continue; // expected 404
    report(route, viewportName, "failed-request", f);
  }

  // In-page checks.
  const audit = await page.evaluate(() => {
    const out = { overflowX: false, badImages: [], unlabeledButtons: [], unlabeledInputs: [], smallTargets: [] };
    const doc = document.documentElement;
    out.overflowX = doc.scrollWidth > window.innerWidth + 1;

    for (const img of document.querySelectorAll("img")) {
      if (!img.complete || (img.naturalWidth === 0 && img.src && !img.src.endsWith(".svg"))) {
        out.badImages.push((img.getAttribute("src") || "").slice(0, 120));
      }
    }
    const named = (el) =>
      (el.getAttribute("aria-label") || "").trim() ||
      (el.getAttribute("aria-labelledby") ? document.getElementById(el.getAttribute("aria-labelledby"))?.textContent?.trim() : "") ||
      el.textContent.trim() ||
      (el.querySelector("img[alt]") ? el.querySelector("img[alt]").alt : "") ||
      (el.getAttribute("title") || "").trim();
    for (const b of document.querySelectorAll("button, [role='button'], a[href]")) {
      if (!named(b)) out.unlabeledButtons.push(b.tagName + "." + String(b.className).split(" ")[0]);
    }
    for (const input of document.querySelectorAll("input:not([type='hidden']), select, textarea")) {
      const id = input.id;
      const hasLabel =
        (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) ||
        input.closest("label") ||
        (input.getAttribute("aria-label") || "").trim() ||
        input.getAttribute("aria-labelledby") ||
        (input.getAttribute("title") || "").trim() ||
        ["submit", "button", "reset", "radio", "checkbox"].includes(input.type);
      if (!hasLabel) out.unlabeledInputs.push(input.name || id || input.type);
    }
    // Touch targets on touch viewports: visible buttons/links < 40x40 px.
    if (window.innerWidth < 800) {
      const rect = (el) => el.getBoundingClientRect();
      for (const el of document.querySelectorAll("button, a[href]")) {
        const r = rect(el);
        if (r.width === 0 || r.height === 0) continue;
        const label = el.textContent.trim();
        if ((r.width < 40 || r.height < 40) && label.length <= 2 && !el.getAttribute("aria-label")) {
          out.smallTargets.push(`${el.tagName} ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
      }
    }
    return out;
  });

  if (audit.overflowX) report(route, viewportName, "overflow-x", "document scrolls horizontally");
  for (const s of audit.badImages) report(route, viewportName, "broken-image", s);
  for (const s of audit.unlabeledButtons) report(route, viewportName, "unlabeled-control", s);
  for (const s of audit.unlabeledInputs) report(route, viewportName, "unlabeled-input", s);
  for (const s of audit.smallTargets) report(route, viewportName, "small-touch-target", s);

  // axe-core: critical/serious violations only (desktop pass — layout-
  // independent rules; kept off mobile/tablet to keep the matrix fast).
  if (viewportName === "desktop") {
    try {
    await page.evaluate(AXE_SRC);
    const axeResults = await page.evaluate(async () => {
      const r = await window.axe.run(document, {
        resultTypes: ["violations"],
        rules: { "region": { enabled: false }, "target-size": { enabled: false } },
      });
      return r.violations
        .filter((v) => v.impact === "critical" || v.impact === "serious")
        .map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target?.join(" ") ?? ""}`)
        .slice(0, 8);
    });
    for (const v of axeResults) report(route, viewportName, "axe", v);
    } catch (err) {
      report(route, viewportName, "axe-error", String(err.message).slice(0, 150));
    }
  }

  cleanup();
  function cleanup() {
    page.off("console", onConsole);
    page.off("response", onResponse);
    page.off("requestfailed", onRequestFailed);
  }
}

async function loginViaApi(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = res.headers.get("set-cookie") ?? "";
  const cookie = setCookie.split(";")[0];
  return { status: res.status, cookie };
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--force-prefers-reduced-motion"],
  });

  // One viewport per invocation (env VIEWPORT=mobile|tablet|desktop) so each
  // run is a single-page, low-memory Chrome process.
  const which = process.env.VIEWPORT;
  const viewports = which ? VIEWPORTS.filter((v) => v.name === which) : VIEWPORTS;
  if (viewports.length === 0) {
    console.error(`Unknown VIEWPORT "${which}". Use one of: ${VIEWPORTS.map((v) => v.name).join(", ")}`);
    process.exit(1);
  }
  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.dpr });
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    for (const route of PUBLIC_ROUTES) {
      console.log(`\n>>> ${vp.name} ${route}`);
      await inspectPage(page, route, vp.name);
    }
    await page.close();
  }

  // Admin pages (desktop only) when VIEWPORT=desktop and credentials work.
  if (viewports.some((v) => v.name === "desktop")) {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPassword) {
      const res = await loginViaApi(adminEmail, adminPassword);
      if (res.status === 200 && res.cookie) {
        const page = await browser.newPage();
        await page.setViewport({ width: 1440, height: 900 });
        await page.setCookie(...res.cookie.split("; ").map((c) => {
          const [n, ...rest] = c.split("=");
          return { name: n, value: rest.join("="), domain: "localhost", path: "/" };
        }));
        for (const route of ADMIN_ROUTES) {
          console.log(`\n>>> admin ${route}`);
          await inspectPage(page, route, "admin-desktop");
        }
        await page.close();
      } else {
        issues.push({ route: "/admin*", viewport: "admin", kind: "auth", detail: `admin login failed (${res.status}) — admin pages not QA'd` });
      }
    }
  }

  // Chrome can hang indefinitely on close; don't let that eat the results.
  await Promise.race([browser.close().catch(() => {}), new Promise((r) => setTimeout(r, 3000))]);

  // Summary.
  console.log(`\n=== QA RESULT: ${issues.length} issue(s) ===`);
  const byKind = {};
  for (const i of issues) byKind[i.kind] = (byKind[i.kind] ?? 0) + 1;
  console.log(JSON.stringify(byKind, null, 2));
  for (const i of issues) {
    console.log(`[${i.kind}] ${i.route} @ ${i.viewport}: ${i.detail}`);
  }
  process.exit(0); // Chrome can hang on close; results are already printed.
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
