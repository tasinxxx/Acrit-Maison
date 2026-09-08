import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function jsonOk<T extends Record<string, unknown>>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export async function parseBody<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new BodyError("Request body must be valid JSON.");
  }
  return schema.parse(raw);
}

export class BodyError extends Error {}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof BodyError) {
    return jsonError(error.message, 400);
  }
  if (error instanceof ZodError) {
    const first = error.issues[0];
    return jsonError(first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input.", 422);
  }
  if (error instanceof Error) {
    if (error.message === "UNAUTHENTICATED") return jsonError("You must be signed in.", 401);
    if (error.message === "FORBIDDEN") return jsonError("Admin access required.", 403);
  }
  console.error("[api] unhandled error:", error);
  return jsonError("Something went wrong.", 500);
}
