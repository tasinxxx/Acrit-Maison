import { createHash, randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const scrypt = promisify(_scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

const SESSION_COOKIE = "am_session";
const CART_COOKIE = "am_cart";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const CART_TTL_MS = 1000 * 60 * 60 * 24 * 90; // 90 days

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${buf.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hex] = parts;
  const derived = await scrypt(password, salt, 64);
  const expected = Buffer.from(hex, "hex");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export type SafeCustomer = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export async function createSession(customerId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: { id: hashToken(token), customerId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { id: hashToken(token) } });
  }
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentCustomer(): Promise<SafeCustomer | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const session = await prisma.session.findUnique({
      where: { id: hashToken(token) },
      include: { customer: true },
    });
    if (!session) return null;
    if (session.expiresAt.getTime() < Date.now()) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
      return null;
    }
    return {
      id: session.customer.id,
      email: session.customer.email,
      name: session.customer.name,
      role: session.customer.role,
    };
  } catch {
    // Database unavailable (e.g. build time without PostgreSQL).
    return null;
  }
}

export async function requireCustomer(): Promise<SafeCustomer> {
  const customer = await getCurrentCustomer();
  if (!customer) throw new Error("UNAUTHENTICATED");
  return customer;
}

export async function requireAdmin(): Promise<SafeCustomer> {
  const customer = await requireCustomer();
  if (customer.role !== "ADMIN") throw new Error("FORBIDDEN");
  return customer;
}

// ---------------------------------------------------------------------------
// Cart token
// ---------------------------------------------------------------------------

export async function getOrCreateCartToken(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(CART_COOKIE)?.value;
  if (existing && /^[A-Za-z0-9_-]{43}$/.test(existing)) return existing;
  const token = randomBytes(32).toString("base64url");
  jar.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_TTL_MS / 1000,
  });
  return token;
}

export async function readCartToken(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(CART_COOKIE)?.value;
  return token && /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
}
