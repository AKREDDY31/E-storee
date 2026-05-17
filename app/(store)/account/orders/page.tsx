import { MyOrdersPanel } from "@/components/store/my-orders-panel";
import { getCurrentSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { OrderModel } from "@/lib/db/models";
import { getStoreSettings } from "@/lib/queries";
import { redirect } from "next/navigation";

export default async function AccountOrdersPage() {
  const session = await getCurrentSession();
  if (!session || session.role !== "user") {
    redirect(session?.role === "admin" ? "/admin/dashboard" : "/");
  }
  const settings = await getStoreSettings();
  let orders: any[] = [];

  try {
    await connectToDatabase();
    orders = JSON.parse(JSON.stringify(await OrderModel.find({ userId: session.id }).sort({ createdAt: -1 }).lean()));
  } catch {
    orders = [];
  }

  return (
    <div className="container section" style={{ display: "grid", gap: 20 }}>
      <div className="card" style={{ padding: 24, background: "linear-gradient(135deg, rgba(13,79,60,0.95), rgba(27,94,32,0.88))", color: "white" }}>
        <span className="eyebrow" style={{ color: "rgba(255,255,255,0.75)" }}>My account</span>
        <h1 style={{ margin: "10px 0 0" }}>Orders and tracking</h1>
        <p style={{ margin: "10px 0 0", color: "rgba(255,255,255,0.82)" }}>Review your purchase history, check shipping status and jump to tracking when needed.</p>
      </div>
      <MyOrdersPanel
        orders={orders}
        refundPolicyText={settings.refundPolicyText}
        refundPolicyNorms={settings.refundPolicyNorms}
      />
    </div>
  );
}
