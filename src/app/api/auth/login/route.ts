import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { jsonError, jsonOk, handleApiError, parseBody } from "@/lib/api";
import { rateLimit, maybeCleanup } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    maybeCleanup();
    const ip = request.headers.get("x-forwarded-for") ?? "anon";
    const rl = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
    if (!rl.ok) return jsonError("Too many attempts. Please try again later.", 429);

    const input = await parseBody(request, loginSchema);

    const customer = await prisma.customer.findUnique({ where: { email: input.email } });
    const valid = customer ? await verifyPassword(input.password, customer.passwordHash) : false;

    // Generic error: never reveal whether the email exists.
    if (!customer || !valid) return jsonError("Incorrect email or password.", 401);

    await createSession(customer.id);
    return jsonOk({ ok: true, email: customer.email, name: customer.name, role: customer.role });
  } catch (error) {
    return handleApiError(error);
  }
}
