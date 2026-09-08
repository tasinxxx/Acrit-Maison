import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { settingsInputSchema } from "@/lib/validation";
import { jsonOk, handleApiError, parseBody } from "@/lib/api";

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const input = await parseBody(request, settingsInputSchema);

    const entries: Array<[string, string]> = [
      ["storeName", input.storeName],
      ["storeEmail", input.storeEmail],
      ["storePhone", input.storePhone],
      ["whatsappNumber", input.whatsappNumber],
      ["storeAddress", input.storeAddress],
      ["vatRatePercent", String(input.vatRatePercent)],
      ["insideDhakaStandardCents", String(input.insideDhakaStandardCents)],
      ["insideDhakaExpressCents", String(input.insideDhakaExpressCents)],
      ["outsideDhakaStandardCents", String(input.outsideDhakaStandardCents)],
      ["outsideDhakaExpressCents", String(input.outsideDhakaExpressCents)],
      ["freeShippingThresholdCents", String(input.freeShippingThresholdCents)],
      ["shippingEnabled", String(input.shippingEnabled)],
      ["codEnabled", String(input.codEnabled)],
      ["bkashNumber", input.bkashNumber],
      ["nagadNumber", input.nagadNumber],
      ["instagramUrl", input.instagramUrl],
      ["facebookUrl", input.facebookUrl],
    ];

    for (const [key, value] of entries) {
      await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
    }

    // Pages that render settings at build/request time must refresh.
    revalidatePath("/delivery-returns");
    revalidatePath("/");

    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
