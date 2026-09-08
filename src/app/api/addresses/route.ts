import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth";
import { addressSchema } from "@/lib/validation";
import { jsonError, jsonOk, handleApiError, parseBody } from "@/lib/api";

export async function GET() {
  try {
    const customer = await requireCustomer();
    const addresses = await prisma.address.findMany({
      where: { customerId: customer.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return jsonOk({ addresses });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const customer = await requireCustomer();
    const input = await parseBody(request, addressSchema);

    const count = await prisma.address.count({ where: { customerId: customer.id } });
    await prisma.address.create({
      data: {
        customerId: customer.id,
        fullName: input.fullName,
        line1: input.line1,
        line2: input.line2 || null,
        city: input.city,
        region: input.region,
        postalCode: input.postalCode,
        country: input.country,
        phone: input.phone || null,
        isDefault: count === 0,
      },
    });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const customer = await requireCustomer();
    const body = await request.json().catch(() => null);
    const id = typeof body?.id === "string" ? body.id : null;
    if (!id) return jsonError("id is required.", 400);

    const address = await prisma.address.findUnique({ where: { id } });
    if (!address || address.customerId !== customer.id) return jsonError("Address not found.", 404);

    await prisma.$transaction([
      prisma.address.updateMany({ where: { customerId: customer.id }, data: { isDefault: false } }),
      prisma.address.update({ where: { id }, data: { isDefault: true } }),
    ]);
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const customer = await requireCustomer();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return jsonError("id is required.", 400);

    const address = await prisma.address.findUnique({ where: { id } });
    if (!address || address.customerId !== customer.id) return jsonError("Address not found.", 404);

    await prisma.address.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
