import { prisma } from "@/lib/prisma";
import { newsletterSchema } from "@/lib/validation";
import { jsonError, jsonOk, handleApiError, parseBody } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const rl = rateLimit(`newsletter:${request.headers.get("x-forwarded-for") ?? "anon"}`, 5, 60 * 60 * 1000);
    if (!rl.ok) return jsonError("Too many attempts. Please try again later.", 429);

    const input = await parseBody(request, newsletterSchema);
    await prisma.newsletterSubscriber.upsert({
      where: { email: input.email },
      update: { source: input.source ?? "footer" },
      create: { email: input.email, source: input.source ?? "footer" },
    });

    // Honest copy: no email provider is wired, so we promise exactly what
    // happens — the address is stored and used when the maison next writes.
    return jsonOk({ ok: true, message: "You are on the list. Welcome." });
  } catch (error) {
    return handleApiError(error);
  }
}
