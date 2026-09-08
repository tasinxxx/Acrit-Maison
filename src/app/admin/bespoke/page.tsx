import { prisma } from "@/lib/prisma";
import { BespokeManager } from "@/components/admin/bespoke-manager";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  NEW: "badge bg-yellow-100 text-yellow-900",
  IN_REVIEW: "badge bg-blue-100 text-blue-900",
  QUOTED: "badge bg-purple-100 text-purple-900",
  ACCEPTED: "badge bg-green-100 text-green-900",
  DECLINED: "badge bg-red-100 text-red-900",
  CLOSED: "badge badge-neutral",
};

export default async function AdminBespokePage() {
  const requests = await prisma.bespokeRequest.findMany({ orderBy: { createdAt: "desc" } });

  const counts = requests.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h1 className="font-display text-2xl mb-2">Bespoke requests</h1>
      <p className="text-muted text-sm mb-6">
        Consultation requests from the bespoke page. Reply personally by email or WhatsApp; move the status as
        the conversation progresses.
      </p>
      <p className="text-xs text-muted mb-6">
        {requests.length} total
        {Object.entries(counts).map(([status, n]) => ` · ${n} ${status.toLowerCase().replace("_", " ")}`).join("")}
      </p>
      <BespokeManager
        requests={requests.map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          phone: r.phone,
          jewelryType: r.jewelryType,
          budget: r.budget,
          timeline: r.timeline,
          description: r.description,
          referenceUrl: r.referenceUrl,
          status: r.status,
          adminNotes: r.adminNotes,
          createdAt: r.createdAt.toISOString(),
        }))}
        statusStyles={STATUS_STYLES}
      />
    </div>
  );
}
