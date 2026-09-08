import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validation";
import { jsonOk, handleApiError, parseBody } from "@/lib/api";
import { rateLimit, maybeCleanup } from "@/lib/rate-limit";
import { sendMail } from "@/lib/mail";

export async function POST(request: Request) {
  try {
    maybeCleanup();
    const ip = request.headers.get("x-forwarded-for") ?? "anon";
    const rl = rateLimit(`forgot:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.ok) return jsonOk({ ok: true }); // do not reveal rate limiting either

    const input = await parseBody(request, forgotPasswordSchema);

    // Always answer the same way whether or not the account exists — no
    // account enumeration.
    const customer = await prisma.customer.findUnique({ where: { email: input.email } });
    if (customer) {
      // Invalidate any previous unused tokens for this customer.
      await prisma.passwordResetToken.deleteMany({
        where: { customerId: customer.id, usedAt: null },
      });

      const rawToken = randomBytes(32).toString("base64url");
      await prisma.passwordResetToken.create({
        data: {
          customerId: customer.id,
          tokenHash: createHash("sha256").update(rawToken).digest("hex"),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      await sendMail({
        to: customer.email,
        subject: `Reset your password · Acrit Maison`,
        text: [
          `We received a request to reset the password for your Acrit Maison account.`,
          `This link is valid for 1 hour and can be used once:`,
          `${siteUrl}/reset-password?token=${rawToken}`,
          ``,
          `If you did not request this, you can ignore this email — your password is unchanged.`,
        ].join("\n"),
      });
    }

    return jsonOk({ ok: true, message: "If an account exists for that email, a reset link is on its way. The link expires in 1 hour." });
  } catch (error) {
    return handleApiError(error);
  }
}
