import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { couponInputSchema } from "@/lib/validation";
import { jsonOk, handleApiError, parseBody } from "@/lib/api";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const input = await parseBody(request, couponInputSchema);

    if (input.type === "PERCENT" && input.value > 100) {
      return jsonOk({ error: "Percent coupons cannot exceed 100." }, 422);
    }

    const taken = await prisma.coupon.findUnique({ where: { code: input.code } });
    if (taken) return jsonOk({ error: "A coupon with this code already exists." }, 409);

    await prisma.coupon.create({
      data: {
        code: input.code,
        type: input.type,
        value: input.value,
        minSubtotalCents: input.minSubtotalCents,
        active: input.active,
        usageLimit: input.usageLimit ?? null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
