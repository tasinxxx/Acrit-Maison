import { destroySession } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

export async function POST() {
  try {
    await destroySession();
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
