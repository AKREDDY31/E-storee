import Link from "next/link";
import { AccountProfileClient } from "@/components/store/account-profile-client";
import { MyOrdersPanel } from "@/components/store/my-orders-panel";
import { getCurrentSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { OrderModel, UserModel } from "@/lib/db/models";
import { getStoreSettings } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

export default async function AccountPage() {
  const session = await getCurrentSession();
  const settings = await getStoreSettings();
  let user = null;
  let orders: any[] = [];

  if (session?.id) {
    try {
      await connectToDatabase();
      user = JSON.parse(JSON.stringify(await UserModel.findById(session.id).lean()));
      orders = JSON.parse(JSON.stringify(await OrderModel.find({ userId: session.id }).sort({ createdAt: -1 }).lean()));
    } catch {
      user = null;
      orders = [];
    }
  }

  return (
    <div className="container section" style={{ display: "grid", gap: 24 }}>
      {session && user ? (
        <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)", gap: 24, alignItems: "start" }}>
          <AccountProfileClient
            initialUser={{
              name: user.name,
              email: user.email,
              phone: user.phone,
              subscriptionStatus: user.subscriptionStatus,
              subscriptionActive: user.subscriptionStatus === "verified",
              subscriptionPhone: user.subscriptionPhone,
              subscriptionDiscountPercent: settings.subscriptionDiscountPercent,
              subscriptionBenefits: settings.subscriptionBenefits,
              address: user.address
            }}
          />
          <div style={{ display: "grid", gap: 16 }}>
            <section className="card" style={{ padding: 24, display: "grid", gap: 14 }}>
              <div>
                <h2 style={{ margin: 0 }}>My orders</h2>
                <div className="muted" style={{ marginTop: 6 }}>Open the full order history page to follow status changes.</div>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link className="button" href="/account/orders">Open orders</Link>
                <Link className="button secondary" href="/track-order">Track by number</Link>
              </div>
              <div className="muted">{orders.length} orders found in your account.</div>
            </section>
            <MyOrdersPanel
              orders={orders.slice(0, 3)}
              refundPolicyText={settings.refundPolicyText}
              refundPolicyNorms={settings.refundPolicyNorms}
            />
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 24, display: "grid", gap: 12 }}>
          <h1 style={{ margin: 0 }}>My account</h1>
          <span style={{ color: "var(--muted)" }}>Please log in to access your account.</span>
        </div>
      )}
    </div>
  );
}
