"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

const statuses = ["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "refund_requested", "refunded"];
const paymentStatuses = ["pending", "awaiting_verification", "paid", "failed", "refunded"];

export function AdminOrdersClient({ initialOrders }: { initialOrders: any[] }) {
  const [savingId, setSavingId] = useState("");
  const [filter, setFilter] = useState<"active" | "cancelled" | "all">("active");

  const filteredOrders =
    filter === "all"
      ? initialOrders
      : filter === "cancelled"
        ? initialOrders.filter((order) => order.orderStatus === "cancelled")
        : initialOrders.filter((order) => !["cancelled", "refunded"].includes(order.orderStatus));

  async function updateOrder(orderId: string, payload: Record<string, string>) {
    setSavingId(orderId);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setSavingId("");
    window.location.reload();
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <h1 style={{ margin: 0 }}>Order management</h1>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ color: "var(--muted)", fontWeight: 700 }}>View</span>
        {[
          { key: "active" as const, label: `Active (${initialOrders.filter((order) => !["cancelled", "refunded"].includes(order.orderStatus)).length})` },
          { key: "cancelled" as const, label: `Cancelled (${initialOrders.filter((order) => order.orderStatus === "cancelled").length})` },
          { key: "all" as const, label: `All (${initialOrders.length})` }
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            className={`button secondary${filter === item.key ? " active" : ""}`}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="card" style={{ padding: 24, display: "grid", gap: 14 }}>
        {filteredOrders.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>No orders in this section.</div>
        ) : null}
        {filteredOrders.map((order) => (
          <div key={order._id} style={{ display: "grid", gap: 10, borderBottom: "1px solid var(--border)", paddingBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <strong>{order.orderNumber}</strong>
                <div style={{ color: "var(--muted)" }}>{order.customer.name} | {order.customer.phone}</div>
                <div style={{ color: "var(--muted)" }}>{order.customer.email}</div>
              </div>
              <strong>{formatCurrency(order.total)}</strong>
            </div>
            <div style={{ color: "var(--muted)" }}>
              {order.paymentMethod} | {order.paymentStatus} | ETA: {order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toLocaleDateString("en-IN") : "Not set"}
            </div>
            <div style={{ color: "var(--muted)", lineHeight: 1.6 }}>
              {order.shippingAddress?.line1}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
            </div>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <select defaultValue={order.orderStatus} onChange={(event) => updateOrder(order._id, { orderStatus: event.target.value })} style={{ width: "100%", height: 44, borderRadius: 12, border: "1px solid var(--border)", padding: "0 12px" }}>
              {statuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
              </select>
              <select defaultValue={order.paymentStatus} onChange={(event) => updateOrder(order._id, { paymentStatus: event.target.value })} style={{ width: "100%", height: 44, borderRadius: 12, border: "1px solid var(--border)", padding: "0 12px" }}>
                {paymentStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <input
                type="date"
                defaultValue={order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toISOString().slice(0, 10) : ""}
                onBlur={(event) => event.target.value ? updateOrder(order._id, { estimatedDeliveryDate: new Date(event.target.value).toISOString() }) : undefined}
                style={{ width: "100%", height: 44, borderRadius: 12, border: "1px solid var(--border)", padding: "0 12px" }}
              />
            </div>
            <textarea
              defaultValue={order.adminNotes || ""}
              onBlur={(event) => updateOrder(order._id, { adminNotes: event.target.value })}
              placeholder="Admin note / message for this order"
              style={{ width: "100%", minHeight: 82, borderRadius: 12, border: "1px solid var(--border)", padding: 12 }}
            />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a className="button secondary" href={`tel:${order.customer.phone}`}>Call User</a>
              <a className="button secondary" href={`mailto:${order.customer.email}`}>Email User</a>
              <a className="button secondary" href={`https://wa.me/${order.customer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${order.customer.name}, your order ${order.orderNumber} is currently ${order.orderStatus}.`)}`}>WhatsApp User</a>
            </div>
            {savingId === order._id ? <div style={{ color: "var(--muted)" }}>Saving update...</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
