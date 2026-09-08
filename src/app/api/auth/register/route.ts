import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { jsonError, jsonOk, handleApiError, parseBody } from "@/lib/api";
import { rateLimit, maybeCleanup } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    maybeCleanup();
    const ip = request.headers.get("x-forwarded-for") ?? "anon";
    const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.ok) return jsonError("Too many attempts. Please try again later.", 429);

    const input = await parseBody(request, registerSchema);

    const existing = await prisma.customer.findUnique({ where: { email: input.email } });
    if (existing) return jsonError("An account with this email already exists.", 409);

    const customer = await prisma.customer.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash: await hashPassword(input.password),
      },
    });

    await createSession(customer.id);
    return jsonOk({ ok: true, email: customer.email, name: customer.name });
  } catch (error) {
    return handleApiError(error);
  }
}
