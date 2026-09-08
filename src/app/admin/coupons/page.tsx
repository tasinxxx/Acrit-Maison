import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/settings";
import { CouponManager } from "@/components/admin/coupon-manager";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { code: "asc" } });

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Coupons</h1>
      <CouponManager
        coupons={coupons.map((c) => ({
          id: c.id,
          code: c.code,
          type: c.type,
          value: c.value,
          minSubtotalCents: c.minSubtotalCents,
          active: c.active,
          usageLimit: c.usageLimit,
          usedCount: c.usedCount,
          expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
        }))}
      />
    </div>
  );
}
