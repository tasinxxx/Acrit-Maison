import { prisma } from "@/lib/prisma";
import { bespokeSchema } from "@/lib/validation";
import { jsonOk, handleApiError, parseBody } from "@/lib/api";
import { rateLimit, maybeCleanup } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { sendMail } from "@/lib/mail";

export async function POST(request: Request) {
  try {
    maybeCleanup();
    const ip = request.headers.get("x-forwarded-for") ?? "anon";
    const rl = rateLimit(`bespoke:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.ok) {
      return jsonOk({
        ok: true,
        message: "Thank you — your request is with the atelier.",
      }); // same answer as success; do not confirm rate limiting
    }

    const input = await parseBody(request, bespokeSchema);

    const record = await prisma.bespokeRequest.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        jewelryType: input.jewelryType,
        budget: input.budget,
        timeline: input.timeline,
        description: input.description,
        referenceUrl: input.referenceUrl || null,
      },
    });

    // Notify the atelier. When no mail provider is configured the content is
    // written to the server log by sendMail; the request is still stored.
    const settings = await getSettings();
    await sendMail({
      to: settings.storeEmail,
      subject: `Bespoke request ${record.id} — ${input.jewelryType} (${input.name})`,
      text: [
        `Name: ${input.name}`,
        `Email: ${input.email}`,
        `Phone: ${input.phone}`,
        `Piece: ${input.jewelryType}`,
        `Budget: ${input.budget}`,
        `Timeline: ${input.timeline}`,
        `Reference: ${input.referenceUrl || "—"}`,
        ``,
        input.description,
      ].join("\n"),
    });

    return jsonOk({
      ok: true,
      message: "Thank you — your request is with the atelier.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
