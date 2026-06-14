"use client";

import { useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers/cart-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { formatCurrency, getProductPricing, normalizePhoneNumber, SUBSCRIBER_MIN_DISCOUNT_PERCENT } from "@/lib/utils";
import { type StoreSettings } from "@/types";

const formStyle: CSSProperties = {
  height: 48,
  borderRadius: 14,
  border: "1px solid var(--border)",
  padding: "0 14px",
  background: "white"
};

function buildUpiPaymentLink(settings: StoreSettings, amount: number) {
  if (!settings.upiId) return "";
  const payeeName = "Vedics.online";

  const params = new URLSearchParams({
    pa: settings.upiId,
    pn: payeeName,
    am: amount.toFixed(2),
    cu: "INR",
    tn: `Checkout payment for ${payeeName}`
  });

  return `upi://pay?${params.toString()}`;
}

export function CheckoutClient({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const { session } = useAuth();
  const { items, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">("COD");
  const [subscriptionChoice, setSubscriptionChoice] = useState<"no" | "yes">(
    session?.subscriptionStatus === "verified" ? "yes" : "no"
  );
  const [subscriptionPhone, setSubscriptionPhone] = useState(session?.subscriptionPhone || session?.phone || "");
  const [submitting, setSubmitting] = useState(false);

  const normalizedSubscriptionPhone = useMemo(() => normalizePhoneNumber(subscriptionPhone), [subscriptionPhone]);
  const normalizedSessionPhone = normalizePhoneNumber(session?.subscriptionPhone || session?.phone || "");
  const hasMatchingSubscription =
    subscriptionChoice === "yes" &&
    session?.subscriptionStatus === "verified" &&
    normalizedSubscriptionPhone.length > 0 &&
    normalizedSubscriptionPhone === normalizedSessionPhone;
  const pricedItems = items.map((item) => ({
    ...item,
    pricing: getProductPricing(item, hasMatchingSubscription)
  }));
  const normalSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotal = pricedItems.reduce((sum, item) => sum + item.pricing.price * item.quantity, 0);
  const shipping = items.some((item) => Number(item.deliveryPrice || 0) > 0) ? 60 : 0;
  const subscriptionDiscount = Math.max(0, normalSubtotal - subtotal);
  const grandTotal = Math.max(0, subtotal + shipping);
  const upiPaymentLink = buildUpiPaymentLink(settings, grandTotal);
  const upiQrImageUrl = upiPaymentLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiPaymentLink)}`
    : "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (paymentMethod !== "COD") return;

    const formData = new FormData(event.currentTarget);
    setSubmitting(true);

    const payload = {
      customer: {
        name: String(formData.get("name")),
        email: String(formData.get("email")),
        phone: String(formData.get("phone"))
      },
      shippingAddress: {
        fullName: String(formData.get("name")),
        phone: String(formData.get("phone")),
        line1: String(formData.get("line1")),
        line2: String(formData.get("line2") || ""),
        city: String(formData.get("city")),
        state: String(formData.get("state")),
        postalCode: String(formData.get("postalCode")),
        landmark: String(formData.get("landmark") || "")
      },
      items: pricedItems.map(({ pricing, ...item }) => ({
        ...item,
        price: pricing.price,
        discountPercent: pricing.discountPercent
      })),
      paymentMethod: "COD",
      paymentReference: "",
      subscriptionEligible: hasMatchingSubscription,
      subscriptionPhone: hasMatchingSubscription ? normalizedSubscriptionPhone : "",
      discountAmount: subscriptionDiscount
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      setSubmitting(false);

      if (response.ok) {
        clearCart();
        router.push(`/track-order?orderNumber=${data.order.orderNumber}`);
      } else {
        alert(data?.error || "Unable to place order");
      }
    } catch {
      setSubmitting(false);
      alert("Unable to place order, please try again later.");
    }
  }

  async function handleOnlinePay() {
    if (!upiPaymentLink) return;

    const nameVal = String((document.querySelector('input[name="name"]') as HTMLInputElement)?.value || "").trim();
    const emailVal = String((document.querySelector('input[name="email"]') as HTMLInputElement)?.value || "").trim();
    const phoneVal = String((document.querySelector('input[name="phone"]') as HTMLInputElement)?.value || "").trim();
    const line1Val = String((document.querySelector('input[name="line1"]') as HTMLInputElement)?.value || "").trim();
    const cityVal = String((document.querySelector('input[name="city"]') as HTMLInputElement)?.value || "").trim();
    const stateVal = String((document.querySelector('input[name="state"]') as HTMLInputElement)?.value || "").trim();
    const postalVal = String((document.querySelector('input[name="postalCode"]') as HTMLInputElement)?.value || "").trim();

    if (!nameVal || !emailVal || !phoneVal || !line1Val || !cityVal || !stateVal || !postalVal) {
      alert("Please fill all required delivery fields before proceeding to payment.");
      return;
    }

    setSubmitting(true);
    const payload = {
      customer: {
        name: nameVal,
        email: emailVal,
        phone: phoneVal
      },
      shippingAddress: {
        fullName: nameVal,
        phone: phoneVal,
        line1: line1Val,
        line2: String((document.querySelector('input[name="line2"]') as HTMLInputElement)?.value || ""),
        city: cityVal,
        state: stateVal,
        postalCode: postalVal,
        landmark: String((document.querySelector('input[name="landmark"]') as HTMLInputElement)?.value || "")
      },
      items: pricedItems.map(({ pricing, ...item }) => ({
        ...item,
        price: pricing.price,
        discountPercent: pricing.discountPercent
      })),
      paymentMethod: "ONLINE",
      paymentReference: "",
      subscriptionEligible: hasMatchingSubscription,
      subscriptionPhone: hasMatchingSubscription ? normalizedSubscriptionPhone : "",
      discountAmount: subscriptionDiscount
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      setSubmitting(false);

      if (response.ok) {
        clearCart();
        try {
          window.open(upiPaymentLink, "_blank");
        } catch {
          window.location.href = upiPaymentLink;
        }
        router.push(`/track-order?orderNumber=${data.order.orderNumber}&pay=1`);
      } else {
        alert(data?.error || "Unable to create online order");
      }
    } catch {
      setSubmitting(false);
      alert("Unable to create online order, please try again later.");
    }
  }

  return (
    <div className="container section" style={{ display: "grid", gap: 24 }}>
      <div
        className="card"
        style={{
          padding: 26,
          display: "grid",
          gap: 10,
          background: "linear-gradient(135deg, rgba(13,79,60,0.94), rgba(27,94,32,0.88))",
          color: "white"
        }}
      >
        <span className="eyebrow" style={{ color: "rgba(255,255,255,0.74)" }}>Checkout</span>
        <h1 className="section-title" style={{ margin: 0, fontSize: "clamp(2rem, 3.2vw, 3rem)" }}>Complete your order</h1>
        <div style={{ color: "rgba(255,255,255,0.82)" }}>Enter delivery details, choose payment and review the final amount before placing the order.</div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1.2fr) minmax(300px, 0.8fr)", alignItems: "start" }}>
        <form className="card" onSubmit={handleSubmit} style={{ padding: 24, display: "grid", gap: 16 }}>
          <strong>Delivery information</strong>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <input required name="name" placeholder="Full name" style={formStyle} />
            <input required type="email" name="email" placeholder="Email address" style={formStyle} />
            <input required name="phone" placeholder="Phone number" style={formStyle} />
            <input required name="postalCode" placeholder="Postal code" style={formStyle} />
          </div>
          <input required name="line1" placeholder="Address line 1" style={formStyle} />
          <input name="line2" placeholder="Address line 2" style={formStyle} />
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <input required name="city" placeholder="City" style={formStyle} />
            <input required name="state" placeholder="State" style={formStyle} />
            <input name="landmark" placeholder="Landmark" style={formStyle} />
          </div>

          <div className="card" style={{ padding: 18, background: "var(--surface-alt)", display: "grid", gap: 12 }}>
            <strong>Subscription benefit</strong>
            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="radio" checked={subscriptionChoice === "no"} onChange={() => setSubscriptionChoice("no")} />
              I do not have a subscription
            </label>
            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="radio" checked={subscriptionChoice === "yes"} onChange={() => setSubscriptionChoice("yes")} />
              I have a subscription
            </label>
            {subscriptionChoice === "yes" ? (
              <div style={{ display: "grid", gap: 10 }}>
                <input
                  value={subscriptionPhone}
                  onChange={(event) => setSubscriptionPhone(event.target.value)}
                  placeholder="Registered subscription phone number"
                  style={formStyle}
                />
                <div style={{ color: hasMatchingSubscription ? "var(--success)" : "var(--muted)", fontSize: 13 }}>
                  {hasMatchingSubscription
                    ? `Subscription matched. Product prices now use at least ${SUBSCRIBER_MIN_DISCOUNT_PERCENT}% off.`
                    : "Enter the phone number used for your active subscription to unlock the discount."}
                </div>
              </div>
            ) : null}
          </div>

          <div className="card" style={{ padding: 18, display: "grid", gap: 12, background: "var(--surface-alt)" }}>
            <strong>Payment method</strong>
            <label style={{ display: "flex", gap: 10 }}>
              <input
                type="radio"
                checked={paymentMethod === "COD"}
                onChange={() => {
                  setPaymentMethod("COD");
                }}
              />
              Cash on Delivery
            </label>
            <label style={{ display: "flex", gap: 10 }}>
              <input
                type="radio"
                checked={paymentMethod === "ONLINE"}
                onChange={() => {
                  setPaymentMethod("ONLINE");
                }}
              />
              Online Payment
            </label>

            {paymentMethod === "ONLINE" ? (
              <div style={{ display: "grid", gap: 14 }}>
                <div className="card" style={{ padding: 18, background: "white", display: "grid", gap: 10, borderRadius: 22 }}>
                  <strong>Pay the fixed amount</strong>
                  <span style={{ color: "var(--muted)", fontWeight: 700 }}>Payable amount: {formatCurrency(grandTotal)}</span>
                  {upiQrImageUrl ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      <img
                        src={upiQrImageUrl}
                        alt="UPI payment QR"
                        style={{ width: 240, maxWidth: "100%", borderRadius: 18, border: "1px solid var(--border)", background: "#fff" }}
                      />
                      <div style={{ color: "var(--muted)", fontWeight: 700 }}>Store: {settings.brandName}</div>
                    </div>
                  ) : (
                    <span style={{ color: "var(--muted)" }}>Configure a UPI ID in admin to show QR.</span>
                  )}
                  <div style={{ display: "grid", gap: 10, marginTop: 6 }}>
                    <button
                      type="button"
                      className="button"
                      disabled={!upiPaymentLink || submitting}
                      onClick={handleOnlinePay}
                      style={{ width: "fit-content" }}
                    >
                      {submitting ? "Processing..." : "Pay now in UPI app"}
                    </button>
                    {upiPaymentLink ? (
                      <button
                        type="button"
                        className="button secondary"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(upiPaymentLink);
                          } catch {
                            // ignore
                          }
                        }}
                        style={{ width: "fit-content" }}
                      >
                        Copy UPI link
                      </button>
                    ) : null}
                    <div style={{ color: "var(--muted)", fontSize: 13 }}>
                      Clicking "Pay now" will create your order and open the UPI app. After payment, confirm the payment reference on the order tracker.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                Cash on Delivery selected. The customer will pay {formatCurrency(grandTotal)} at delivery.
              </div>
            )}
          </div>

          {paymentMethod === "COD" ? (
            <button className="button" disabled={submitting || items.length === 0} type="submit">
              {submitting ? "Placing order..." : `Place order for ${formatCurrency(grandTotal)}`}
            </button>
          ) : null}
        </form>

        <div className="card" style={{ padding: 24, display: "grid", gap: 16, position: "sticky", top: 20 }}>
          <strong>Order summary</strong>
          {pricedItems.map((item) => (
            <div key={item.slug} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span>{item.name} x {item.quantity}</span>
              <strong>{formatCurrency(item.pricing.price * item.quantity)}</strong>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Subtotal</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Shipping</span>
            <strong>{formatCurrency(shipping)}</strong>
          </div>
          {subscriptionDiscount > 0 ? (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Subscription discount</span>
              <strong>-{formatCurrency(subscriptionDiscount)}</strong>
            </div>
          ) : null}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, alignItems: 'center' }}>
            <div>
              <div>Total payable</div>
              {subscriptionDiscount > 0 ? (
                <div style={{ color: "var(--success)", fontSize: 13 }}>Subscriber price benefit: -{formatCurrency(subscriptionDiscount)}</div>
              ) : null}
            </div>
            <strong>{formatCurrency(grandTotal)}</strong>
          </div>
          <div style={{ color: "var(--muted)", lineHeight: 1.6 }}>
            Courier: {settings.courierDetails}
          </div>
        </div>
      </div>
    </div>
  );
}
