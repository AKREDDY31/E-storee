import { connectToDatabase } from "@/lib/db/connect";
import { OrderModel, RefundModel } from "@/lib/db/models";

export default async function AdminRefundsPage() {
  let refunds: any[] = [];
  let orderMap: Record<string, string> = {};
  try {
    await connectToDatabase();
    refunds = JSON.parse(JSON.stringify(await RefundModel.find().sort({ createdAt: -1 }).lean()));
    const orderIds = refunds.map((refund) => refund.orderId).filter(Boolean);
    if (orderIds.length > 0) {
      const orders = JSON.parse(JSON.stringify(await OrderModel.find({ _id: { $in: orderIds } }).select({ _id: 1, orderNumber: 1 }).lean()));
      orderMap = Object.fromEntries(orders.map((order: any) => [String(order._id), order.orderNumber]));
    }
  } catch {
    refunds = [];
    orderMap = {};
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <h1 style={{ margin: 0 }}>Refund requests</h1>
      <div className="card" style={{ padding: 24, display: "grid", gap: 14 }}>
        {refunds.length === 0 ? (
          <span style={{ color: "var(--muted)" }}>No refund requests yet.</span>
        ) : (
          refunds.map((refund: any) => (
            <div key={refund._id} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 14 }}>
              <strong>{refund.status}</strong>
              <div style={{ color: "var(--muted)" }}>
                {refund.requestType || "return"} · {refund.pickupStatus || "awaiting_pickup"}
              </div>
              <div style={{ color: "var(--muted)" }}>
                Order: {orderMap[String(refund.orderId)] || "Unknown"}
              </div>
              <div style={{ color: "var(--muted)" }}>{refund.reason}</div>
              <div style={{ color: "var(--muted)" }}>{refund.details}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
