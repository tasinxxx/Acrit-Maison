import { jsonOk, handleApiError } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

// Analytics event sink. Stores nothing sensitive; logs server-side for
// observability until a real provider is configured. Wire GA4 / Meta Pixel
// server-side credentials here later — never expose them to the client.
const ALLOWED = new Set([
  "page_view",
  "product_view",
  "search",
  "add_to_cart",
  "remove_from_cart",
  "wishlist_add",
  "wishlist_remove",
  "begin_checkout",
  "payment_selection",
  "purchase",
  "coupon_use",
  "sign_up",
  "login",
]);

export async function POST(request: Request) {
  try {
    const rl = rateLimit(`analytics:${request.headers.get("x-forwarded-for") ?? "anon"}`, 240, 60 * 1000);
    if (!rl.ok) return jsonOk({ ok: true, dropped: true });

    const body = (await request.json().catch(() => null)) as { events?: unknown } | null;
    const events = Array.isArray(body?.events) ? body!.events : [];
    for (const e of events.slice(0, 50)) {
      if (e && typeof e === "object" && ALLOWED.has((e as { event?: string }).event ?? "")) {
        console.log("[analytics]", JSON.stringify(e));
      }
    }
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
