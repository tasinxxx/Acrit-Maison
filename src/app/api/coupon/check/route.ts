import { checkCoupon } from "@/lib/pricing";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";
import { rateLimit, maybeCleanup } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    maybeCleanup();
    const ip = request.headers.get("x-forwarded-for") ?? "anon";
    const rl = rateLimit(`coupon:${ip}`, 20, 60 * 1000);
    if (!rl.ok) return jsonError("Too many attempts. Please wait a minute.", 429);

    const body = await request.json().catch(() => null);
    const code = typeof body?.code === "string" ? body.code : "";
    const subtotalCents = Number(body?.subtotalCents);
    if (!Number.isFinite(subtotalCents) || subtotalCents < 0) return jsonError("Invalid subtotal.", 400);

    const result = await checkCoupon(code, Math.round(subtotalCents));
    if (!result.ok) return jsonOk({ ok: false, reason: result.reason });
    return jsonOk({ ok: true, code: result.coupon.code, discountCents: result.discountCents });
  } catch (error) {
    return handleApiError(error);
  }
}
