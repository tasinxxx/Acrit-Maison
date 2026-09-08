import { z } from "zod";
import { emailSchema } from "@/lib/validation";
import { jsonOk, handleApiError, parseBody } from "@/lib/api";
import { rateLimit, maybeCleanup } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { sendMail } from "@/lib/mail";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: emailSchema,
  orderNumber: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(2000),
});

export async function POST(request: Request) {
  try {
    maybeCleanup();
    const ip = request.headers.get("x-forwarded-for") ?? "anon";
    const rl = rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.ok) {
      // Same answer as success; do not confirm throttling.
      return jsonOk({ ok: true, message: "Message received — we will reply soon." });
    }

    const input = await parseBody(request, contactSchema);

    const settings = await getSettings();
    await sendMail({
      to: settings.storeEmail,
      subject: `Contact form — ${input.name}${input.orderNumber ? ` (${input.orderNumber})` : ""}`,
      text: [
        `Name: ${input.name}`,
        `Email: ${input.email}`,
        `Order: ${input.orderNumber || "—"}`,
        ``,
        input.message,
      ].join("\n"),
    });

    return jsonOk({ ok: true, message: "Message received — we will reply soon." });
  } catch (error) {
    return handleApiError(error);
  }
}
