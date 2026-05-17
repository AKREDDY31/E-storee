import { getDashboardMetrics } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics();

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div className="card" style={{ padding: 24, display: "grid", gap: 10, background: "linear-gradient(135deg, rgba(13,79,60,0.95), rgba(27,94,32,0.88))", color: "white" }}>
        <span className="eyebrow" style={{ color: "rgba(255,255,255,0.75)" }}>Admin overview</span>
        <h1 style={{ margin: 0 }}>Dashboard overview</h1>
        <p style={{ margin: 0, maxWidth: 720, color: "rgba(255,255,255,0.82)" }}>Monitor the store at a glance and jump into catalog, orders, refunds, users and configuration from one place.</p>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {[
          { label: "Products", value: metrics.productCount },
          { label: "Orders (active)", value: metrics.activeOrderCount },
          { label: "Cancelled orders", value: metrics.cancelledOrderCount },
          { label: "Refund requests", value: metrics.refundCount },
          { label: "Revenue in pipeline", value: formatCurrency(metrics.revenue) }
        ].map((item) => (
          <div key={item.label} className="panel surface-soft" style={{ padding: 20, display: "grid", gap: 10 }}>
            <span style={{ color: "var(--muted)" }}>{item.label}</span>
            <strong style={{ fontSize: 30 }}>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
