const styles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-900",
  PAYMENT_PENDING: "bg-yellow-100 text-yellow-900",
  PAID: "bg-green-100 text-green-900",
  PROCESSING: "bg-blue-100 text-blue-900",
  PACKED: "bg-blue-100 text-blue-900",
  SHIPPED: "bg-blue-100 text-blue-900",
  OUT_FOR_DELIVERY: "bg-blue-100 text-blue-900",
  DELIVERED: "bg-green-100 text-green-900",
  CANCELLED: "bg-red-100 text-red-900",
  RETURN_REQUESTED: "bg-yellow-100 text-yellow-900",
  RETURNED: "bg-gray-200 text-gray-800",
  REFUNDED: "bg-gray-200 text-gray-800",
  FAILED: "bg-red-100 text-red-900",
};

export default function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${styles[status] ?? "bg-gray-100 text-gray-800"}`}>
      {status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}
