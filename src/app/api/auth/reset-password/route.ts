import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validation";
import { jsonError, jsonOk, handleApiError, parseBody } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { rateLimit, maybeCleanup } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    maybeCleanup();
    const ip = request.headers.get("x-forwarded-for") ?? "anon";
    const rl = rateLimit(`reset:${ip}`, 10, 60 * 60 * 1000);
    if (!rl.ok) return jsonError("Too many attempts. Please try again later.", 429);

    const input = await parseBody(request, resetPasswordSchema);

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: createHash("sha256").update(input.token).digest("hex") },
      include: { customer: true },
    });

    if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
      return jsonError("This reset link is invalid or has expired. Request a new one.", 410);
    }

    // Single-use: consume the token, then update the password. Existing
    // sessions are revoked so a stolen session does not survive a reset.
    await prisma.$transaction([
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      prisma.customer.update({
        where: { id: record.customerId },
        data: { passwordHash: await hashPassword(input.password) },
      }),
      prisma.session.deleteMany({ where: { customerId: record.customerId } }),
    ]);

    return jsonOk({ ok: true, message: "Your password has been updated. Sign in with your new password." });
  } catch (error) {
    return handleApiError(error);
  }
}
