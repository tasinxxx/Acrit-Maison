// Lightweight analytics event bus. Events are queued client-side and sent to
// /api/analytics in the background; the endpoint is a no-op sink until a real
// provider (GA4, Meta Pixel, etc.) is configured. No credentials are stored
// client-side — wire a provider inside the API route, never here.

export type AnalyticsEvent =
  | "page_view"
  | "product_view"
  | "search"
  | "add_to_cart"
  | "remove_from_cart"
  | "wishlist_add"
  | "wishlist_remove"
  | "begin_checkout"
  | "payment_selection"
  | "purchase"
  | "coupon_use"
  | "sign_up"
  | "login";

type EventPayload = {
  event: AnalyticsEvent;
  [key: string]: string | number | boolean | null | undefined;
};

type QueuedEvent = EventPayload & { ts: number };

const BUFFER: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, 800);
}

export async function flush(): Promise<void> {
  if (BUFFER.length === 0) return;
  const batch = BUFFER.splice(0, BUFFER.length);
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    });
  } catch {
    // Analytics must never break the user experience.
  }
}

export function track(event: AnalyticsEvent, payload: Omit<EventPayload, "event"> = {}): void {
  if (typeof window === "undefined") return;
  BUFFER.push({ event, ...payload, ts: Date.now() });
  scheduleFlush();
}

// Fire-and-forget server-side helper (used in route handlers where useful).
export function trackServer(event: AnalyticsEvent, payload: Omit<EventPayload, "event"> = {}): void {
  console.log(`[analytics] ${event}`, payload);
}
