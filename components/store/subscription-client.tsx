"use client";

import { useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { formatCurrency, normalizePhoneNumber } from "@/lib/utils";
import { type StoreSettings } from "@/types";

const fieldStyle: CSSProperties = {
  height: 48,
  borderRadius: 14,
  border: "1px solid var(--border)",
  padding: "0 14px",
  background: "white"
};

function buildSubscriptionUpiLink(settings: StoreSettings, amount: number) {
  if (!settings.upiId) return "";
  const payeeName = "Vedics.online";

  const params = new URLSearchParams({
    pa: settings.upiId,
    pn: payeeName,
    am: amount.toFixed(2),
    cu: "INR",
    tn: `Subscription payment for ${payeeName}`
  });

  return `upi://pay?${params.toString()}`;
}

export function SubscriptionClient({ settings, amount = 500 }: { settings: StoreSettings; amount?: number }) {
  const router = useRouter();
  const { session, setSession } = useAuth();
  const [paymentReference, setPaymentReference] = useState("");
  const [subscriptionPhone, setSubscriptionPhone] = useState(session?.phone || session?.subscriptionPhone || "");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const normalizedPhone = useMemo(() => normalizePhoneNumber(subscriptionPhone), [subscriptionPhone]);
  const upiLink = buildSubscriptionUpiLink(settings, amount);
  const qrUrl = upiLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiLink)}`
    : "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/profile/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        paymentReference,
        subscriptionPhone: normalizedPhone
      })
    });

    const data = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setError(data.error || "Unable to activate subscription");
      return;
    }

    setSession(data.user);
    setMessage("Subscription activated successfully.");
    router.push("/account");
  }

  return (
    <div className="container section" style={{ display: "grid", gap: 24 }}>
      <div className="card" style={{ padding: 26, display: "grid", gap: 10, background: "linear-gradient(135deg, rgba(13,79,60,0.94), rgba(27,94,32,0.88))", color: "white" }}>
        <span className="eyebrow" style={{ color: "rgba(255,255,255,0.74)" }}>Subscription</span>
        <h1 className="section-title" style={{ margin: 0, fontSize: "clamp(2rem, 3.2vw, 3rem)" }}>Unlock subscriber pricing</h1>
        <div style={{ color: "rgba(255,255,255,0.82)" }}>Pay the subscription fee through UPI, then enter the payment reference to activate your benefits.</div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1.2fr) minmax(300px, 0.8fr)", alignItems: "start" }}>
        <form className="card" onSubmit={handleSubmit} style={{ padding: 24, display: "grid", gap: 16 }}>
          <strong>Subscription payment</strong>
          <div className="card" style={{ padding: 18, background: "var(--surface-alt)", display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <span>Subscription amount</span>
              <strong>{formatCurrency(amount)}</strong>
            </div>
            <div style={{ color: "var(--muted)", lineHeight: 1.6 }}>Benefits update automatically when the admin changes the discount or benefit list.</div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <input required value={subscriptionPhone} onChange={(event) => setSubscriptionPhone(event.target.value)} placeholder="Registered phone number" style={fieldStyle} />
              <input required value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="UPI payment reference" style={fieldStyle} />
            </div>
          </div>

          <button className="button" type="submit" disabled={submitting || !upiLink}>
            {submitting ? "Activating..." : "Activate after payment"}
          </button>
          {error ? <div style={{ color: "var(--danger)" }}>{error}</div> : null}
          {message ? <div style={{ color: "var(--success)" }}>{message}</div> : null}
        </form>

        <div className="card" style={{ padding: 24, display: "grid", gap: 16, position: "sticky", top: 20 }}>
          <strong>Pay by UPI</strong>
          <div style={{ color: "var(--muted)" }}>Use your UPI app to pay the subscription amount, then submit the reference here.</div>
          {qrUrl ? (
            <div style={{ display: "grid", gap: 10 }}>
              <img src={qrUrl} alt="Subscription UPI QR" style={{ width: 240, maxWidth: "100%", borderRadius: 18, border: "1px solid var(--border)" }} />
              <div style={{ color: "var(--muted)", fontWeight: 700 }}>Store: {settings.brandName}</div>
            </div>
          ) : (
            <div style={{ color: "var(--muted)" }}>Configure a UPI ID in admin to enable subscription payment.</div>
          )}
          <button
            type="button"
            className="button secondary"
            disabled={!upiLink}
            onClick={() => {
              if (!upiLink) return;
              window.location.href = upiLink;
            }}
          >
            Pay now in UPI app
          </button>
          {upiLink ? (
            <button
              type="button"
              className="button secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(upiLink);
                } catch {
                  // ignore
                }
              }}
            >
              Copy UPI link
            </button>
          ) : null}
          <div className="card" style={{ padding: 18, background: "var(--surface-alt)", display: "grid", gap: 10 }}>
            <strong>Subscription benefits</strong>
            {(settings.subscriptionBenefits || []).map((benefit) => (
              <div key={benefit} style={{ color: "var(--muted)" }}>{benefit}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}