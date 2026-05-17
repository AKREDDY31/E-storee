"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";

const REASONS = [
  "Ordered by mistake",
  "Delivery is taking too long",
  "Found a better alternative",
  "Product issue after delivery",
  "Wrong item delivered",
  "Other"
];

export function MyOrdersPanel({
  orders,
  refundPolicyText,
  refundPolicyNorms
}: {
  orders: any[];
  refundPolicyText: string;
  refundPolicyNorms: string;
}) {
  const [loadingOrderId, setLoadingOrderId] = useState("");
  const [statusMessage, setStatusMessage] = useState<Record<string, string>>({});
  const [reasonByOrder, setReasonByOrder] = useState<Record<string, string>>({});
  const [detailsByOrder, setDetailsByOrder] = useState<Record<string, string>>({});
  const [orderList, setOrderList] = useState(orders);

  const reasonOptions = useMemo(() => REASONS, []);

  async function requestOrderAction(order: any, action: "cancel" | "return") {
    const reason = reasonByOrder[order._id]?.trim();
    if (!reason) {
      setStatusMessage((current) => ({
        ...current,
        [order._id]: "Please choose a reason before submitting the request."
      }));
      return;
    }

    setLoadingOrderId(order._id);
    setStatusMessage((current) => ({ ...current, [order._id]: "" }));

    const response = await fetch(`/api/orders/${order._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        action,
        reason,
        details: detailsByOrder[order._id] || ""
      })
    });

    const data = await response.json();
    setLoadingOrderId("");

    if (!response.ok) {
      setStatusMessage((current) => ({
        ...current,
        [order._id]: data.error || "Unable to submit request"
      }));
      return;
    }

    setStatusMessage((current) => ({
      ...current,
      [order._id]: data.message || "Request submitted"
    }));

    setOrderList((current) =>
      current.map((item) => (item._id === order._id ? { ...item, ...data.order } : item))
    );
  }

  return (
    <section className="card" style={{ padding: 24, display: "grid", gap: 16 }}>
      <div>
        <h2 style={{ margin: 0 }}>My orders</h2>
        <div className="muted" style={{ marginTop: 6 }}>Your recent purchases, status updates and tracking links.</div>
      </div>

      <div className="panel surface-soft" style={{ padding: 16, display: "grid", gap: 8 }}>
        <strong>Refund and return policy</strong>
        <div className="subtitle" style={{ margin: 0 }}>{refundPolicyText}</div>
        <div className="subtitle" style={{ margin: 0 }}>{refundPolicyNorms}</div>
      </div>

      {orderList.length ? (
        <div className="stack" style={{ gap: 12 }}>
          {orderList.map((order) => (
            <article key={order._id} style={{ border: "1px solid var(--border)", borderRadius: 18, padding: 16, display: "grid", gap: 10, background: "rgba(255,255,255,0.9)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <strong>{order.orderNumber}</strong>
                <span className="pill" style={{ padding: "6px 12px" }}>
                  {order.paymentMethod === "ONLINE" && order.paymentStatus === "awaiting_verification"
                    ? "payment_pending"
                    : order.orderStatus}
                </span>
              </div>
              <div className="muted">{order.items?.length || 0} items · {formatCurrency(order.total || 0)}</div>
              <div className="muted">Payment: {order.paymentMethod} · {order.paymentStatus}</div>
              <div className="muted">Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "recently"}</div>
              {order.adminNotes ? (
                <div className="panel surface-soft" style={{ padding: 12, color: "var(--muted)" }}>
                  {order.adminNotes}
                </div>
              ) : null}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link className="button secondary" href={`/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}`}>Track order</Link>
                {order.paymentMethod === "ONLINE" && order.paymentStatus === "awaiting_verification" ? (
                  <Link className="button" href={`/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}&pay=1`}>
                    Pay now
                  </Link>
                ) : null}
              </div>

              {(["placed", "confirmed", "packed", "delivered"].includes(order.orderStatus) && !["cancelled", "refunded"].includes(order.orderStatus)) ? (
                <div style={{ display: "grid", gap: 10, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                  <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                    <select
                      value={reasonByOrder[order._id] || ""}
                      onChange={(event) =>
                        setReasonByOrder((current) => ({ ...current, [order._id]: event.target.value }))
                      }
                      style={{ width: "100%", height: 44, borderRadius: 12, border: "1px solid var(--border)", padding: "0 12px" }}
                    >
                      <option value="">Choose reason</option>
                      {reasonOptions.map((reason) => (
                        <option key={reason} value={reason}>{reason}</option>
                      ))}
                    </select>
                    <input
                      value={detailsByOrder[order._id] || ""}
                      onChange={(event) =>
                        setDetailsByOrder((current) => ({ ...current, [order._id]: event.target.value }))
                      }
                      placeholder="Additional details (optional)"
                      style={{ height: 44, borderRadius: 12, border: "1px solid var(--border)", padding: "0 12px" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {["placed", "confirmed", "packed"].includes(order.orderStatus) ? (
                      <button
                        type="button"
                        className="button secondary"
                        disabled={loadingOrderId === order._id}
                        onClick={() => requestOrderAction(order, "cancel")}
                      >
                        {loadingOrderId === order._id ? "Submitting..." : "Cancel order"}
                      </button>
                    ) : null}
                    {order.orderStatus === "delivered" ? (
                      <button
                        type="button"
                        className="button secondary"
                        disabled={loadingOrderId === order._id}
                        onClick={() => requestOrderAction(order, "return")}
                      >
                        {loadingOrderId === order._id ? "Submitting..." : "Return product"}
                      </button>
                    ) : null}
                  </div>
                  {statusMessage[order._id] ? (
                    <div style={{ color: statusMessage[order._id].toLowerCase().includes("unable") || statusMessage[order._id].toLowerCase().includes("please") ? "var(--danger)" : "var(--success)" }}>
                      {statusMessage[order._id]}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="muted">You have not placed any orders yet.</div>
      )}
    </section>
  );
}
