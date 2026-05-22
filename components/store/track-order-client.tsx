"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ORDER_STEPS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

export function TrackOrderClient() {
  const params = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(params.get("orderNumber") || "");
  const [result, setResult] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [reference, setReference] = useState("");
  const [savingReference, setSavingReference] = useState(false);
  const autoLoaded = useRef(false);

  async function loadOrder(currentOrderNumber = orderNumber) {
    if (!currentOrderNumber) return;
    const response = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(currentOrderNumber)}`);
    const data = await response.json();
    if (response.ok) {
      setResult(data.order);
      setReference(data.order?.paymentReference || "");

      const wantsPay = params.get("pay") === "1";
      if (wantsPay) {
        try {
          const settingsResponse = await fetch("/api/settings");
          if (settingsResponse.ok) {
            setSettings(await settingsResponse.json());
          }
        } catch {
          setSettings(null);
        }
      }
    }
  }

  async function handleTrack(event: FormEvent) {
    event.preventDefault();
    await loadOrder(orderNumber);
  }

  useEffect(() => {
    if (autoLoaded.current) return;
    const currentOrderNumber = params.get("orderNumber") || "";
    if (!currentOrderNumber) return;
    autoLoaded.current = true;
    setOrderNumber(currentOrderNumber);
    void loadOrder(currentOrderNumber);
  }, [params]);

  const wantsPay = params.get("pay") === "1";
  const upiLink =
    settings?.upiId && result
      ? `upi://pay?${new URLSearchParams({
          pa: settings.upiId,
          pn: "Vedics.online",
          am: String(result.total || 0),
          cu: "INR",
          tn: `Order ${result.orderNumber}`
        }).toString()}`
      : "";
  const qrUrl = settings?.qrImageUrl
    ? settings.qrImageUrl
    : upiLink
      ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiLink)}`
      : "";

  async function savePaymentReference() {
    if (!result?._id) return;
    const trimmed = reference.trim();
    if (trimmed.length < 3) return;

    setSavingReference(true);
    const response = await fetch(`/api/orders/${result._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ paymentReference: trimmed })
    });
    setSavingReference(false);

    if (response.ok) {
      const data = await response.json();
      setResult((current: any) => ({ ...current, ...data.order }));
    }
  }

  return (
    <div className="container section" style={{ display: "grid", gap: 24 }}>
      <div className="card" style={{ padding: 26, display: "grid", gap: 10, background: "linear-gradient(135deg, rgba(13,79,60,0.94), rgba(27,94,32,0.88))", color: "white" }}>
        <span className="eyebrow" style={{ color: "rgba(255,255,255,0.74)" }}>Tracking</span>
        <h1 className="section-title" style={{ margin: 0, fontSize: "clamp(2rem, 3.2vw, 3rem)" }}>Track your order</h1>
        <div style={{ color: "rgba(255,255,255,0.82)" }}>Enter your order number to see the latest shipping status and delivery estimate.</div>
      </div>
      <div className="card" style={{ padding: 24, display: "grid", gap: 16 }}>
        <form onSubmit={handleTrack} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="Enter order number" style={{ flex: "1 1 260px", height: 48, borderRadius: 14, border: "1px solid var(--border)", padding: "0 14px" }} />
          <button className="button" type="submit">Track</button>
        </form>
      </div>

      {result ? (
        <div className="card" style={{ padding: 24, display: "grid", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <strong>{result.orderNumber}</strong>
              <div style={{ color: "var(--muted)" }}>{result.customer.name}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <strong>{formatCurrency(result.total)}</strong>
              <div style={{ color: "var(--muted)" }}>{result.paymentMethod} | {result.paymentStatus}</div>
            </div>
          </div>
          <div style={{ color: "var(--muted)" }}>
            Estimated delivery: {result.estimatedDeliveryDate ? new Date(result.estimatedDeliveryDate).toLocaleDateString("en-IN") : "To be updated by admin"}
          </div>
          {result.paymentMethod === "ONLINE" && result.paymentStatus === "awaiting_verification" ? (
            <div className="card" style={{ padding: 16, background: "var(--surface-alt)", display: "grid", gap: 12 }}>
              <strong>Online payment pending</strong>
              <div style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                Pay using the button/QR and then paste the UPI reference (transaction id). The admin will verify and confirm your payment.
              </div>
              <Link
                className="button"
                href={`/track-order?orderNumber=${encodeURIComponent(result.orderNumber)}&pay=1`}
                style={{ width: "fit-content" }}
              >
                Pay now
              </Link>
              {wantsPay && (upiLink || qrUrl) ? (
                <div style={{ display: "grid", gap: 12, alignItems: "start" }}>
                  {qrUrl ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      <img
                        src={qrUrl}
                        alt="UPI payment QR"
                        style={{ width: 240, maxWidth: "100%", borderRadius: 18, border: "1px solid var(--border)", background: "#fff" }}
                      />
                      <div style={{ color: "var(--muted)", fontWeight: 700 }}>Store: {settings.brandName || "Vedics.online"}</div>
                    </div>
                  ) : null}
                  <a
                    className="button"
                    href={upiLink || "#"}
                    style={{ width: "fit-content", pointerEvents: upiLink ? "auto" : "none", opacity: upiLink ? 1 : 0.6 }}
                  >
                    Pay now in UPI app
                  </a>
                </div>
              ) : null}
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "center" }}>
                <input
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="UPI Transaction ID / Reference"
                  style={{ height: 46, borderRadius: 14, border: "1px solid var(--border)", padding: "0 14px", background: "white" }}
                />
                <button
                  type="button"
                  className="button secondary"
                  disabled={savingReference || reference.trim().length < 3}
                  onClick={savePaymentReference}
                >
                  {savingReference ? "Saving..." : "Submit"}
                </button>
              </div>
            </div>
          ) : null}
          {result.adminNotes ? <div className="card" style={{ padding: 16, background: "var(--surface-alt)" }}>{result.adminNotes}</div> : null}
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
            {ORDER_STEPS.map((step, index) => {
              const stepIndex = ORDER_STEPS.findIndex((item) => item.key === result.orderStatus);
              const active = index <= stepIndex;
              return (
                <div key={step.key} style={{ padding: 16, borderRadius: 18, background: active ? "rgba(27,94,32,0.12)" : "rgba(221,211,196,0.3)", color: active ? "var(--brand-deep)" : "var(--muted)", fontWeight: 700 }}>
                  {step.label}
                </div>
              );
            })}
          </div>
          <div className="card" style={{ padding: 18, background: "var(--surface-alt)" }}>
            <strong style={{ display: "block", marginBottom: 8 }}>Order items</strong>
            <div style={{ display: "grid", gap: 10 }}>
              {result.items?.map((item: any) => (
                <div key={item.itemCode} style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <span>{item.name} x {item.quantity}</span>
                  <strong>{formatCurrency(item.price * item.quantity)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 24, color: "var(--muted)" }}>Use the order number from your confirmation screen or WhatsApp message to look up the shipment.</div>
      )}
    </div>
  );
}
