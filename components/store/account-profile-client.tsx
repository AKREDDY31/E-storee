"use client";

import Link from "next/link";
import { useState, type CSSProperties, type FormEvent } from "react";
import { useAuth } from "@/components/providers/auth-provider";

export function AccountProfileClient({
  initialUser
}: {
  initialUser: {
    name: string;
    email: string;
    phone?: string;
    subscriptionStatus?: "inactive" | "pending" | "verified";
    subscriptionActive?: boolean;
    subscriptionPhone?: string;
    subscriptionDiscountPercent?: number;
    subscriptionBenefits?: string[];
    address?: {
      fullName?: string;
      phone?: string;
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      landmark?: string;
    };
  };
}) {
  const { setSession } = useAuth();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    const formData = new FormData(event.currentTarget);

    const payload = {
      name: String(formData.get("name")),
      phone: String(formData.get("phone")),
      address: {
        fullName: String(formData.get("fullName")),
        phone: String(formData.get("deliveryPhone")),
        line1: String(formData.get("line1")),
        line2: String(formData.get("line2") || ""),
        city: String(formData.get("city")),
        state: String(formData.get("state")),
        postalCode: String(formData.get("postalCode")),
        landmark: String(formData.get("landmark") || "")
      }
    };

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(data.error || "Unable to update profile");
      return;
    }

    setSession(data.user);
    setMessage("Profile and delivery address updated successfully.");
  }

  const address = initialUser.address || {};

  return (
    <form className="card" onSubmit={handleSubmit} style={{ padding: 24, display: "grid", gap: 16 }}>
      <h1 style={{ margin: 0 }}>My profile</h1>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <input defaultValue={initialUser.name} name="name" placeholder="Full name" style={fieldStyle} required />
        <input defaultValue={initialUser.email} name="email" placeholder="Email" style={fieldStyle} disabled />
        <input defaultValue={initialUser.phone || ""} name="phone" placeholder="Phone number" style={fieldStyle} required />
      </div>

      <strong>Delivery address</strong>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <input defaultValue={address.fullName || initialUser.name} name="fullName" placeholder="Recipient full name" style={fieldStyle} required />
        <input defaultValue={address.phone || initialUser.phone || ""} name="deliveryPhone" placeholder="Delivery phone" style={fieldStyle} required />
      </div>
      <input defaultValue={address.line1 || ""} name="line1" placeholder="Address line 1" style={fieldStyle} required />
      <input defaultValue={address.line2 || ""} name="line2" placeholder="Address line 2" style={fieldStyle} />
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <input defaultValue={address.city || ""} name="city" placeholder="City" style={fieldStyle} required />
        <input defaultValue={address.state || ""} name="state" placeholder="State" style={fieldStyle} required />
        <input defaultValue={address.postalCode || ""} name="postalCode" placeholder="Postal code" style={fieldStyle} required />
        <input defaultValue={address.landmark || ""} name="landmark" placeholder="Landmark" style={fieldStyle} />
      </div>

      {error ? <div style={{ color: "var(--danger)" }}>{error}</div> : null}
      {message ? <div style={{ color: "var(--success)" }}>{message}</div> : null}
      <button className="button" type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save profile"}
      </button>

      <section className="card" style={{ padding: 18, display: "grid", gap: 12, background: "var(--surface-alt)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <strong>Subscription status</strong>
          {initialUser.subscriptionStatus === "verified" ? (
            <span className="pill">Subscribed</span>
          ) : initialUser.subscriptionStatus === "pending" ? (
            <span className="pill">Pending verification</span>
          ) : (
            <span className="pill">Not subscribed</span>
          )}
        </div>
        {initialUser.subscriptionStatus === "verified" ? (
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ color: "var(--muted)" }}>Registered subscription phone: {initialUser.subscriptionPhone || initialUser.phone || "Not set"}</div>
            <div style={{ display: "grid", gap: 6 }}>
              {(initialUser.subscriptionBenefits || []).map((benefit) => (
                <div key={benefit} style={{ color: "var(--muted)" }}>{benefit}</div>
              ))}
            </div>
          </div>
        ) : initialUser.subscriptionStatus === "pending" ? (
          <div style={{ color: "var(--muted)", lineHeight: 1.6 }}>
            Payment submitted. Your subscription is waiting for admin verification.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ color: "var(--muted)", lineHeight: 1.6 }}>
              Subscribe with UPI payment to unlock the live discount at checkout.
            </div>
            <Link className="button secondary" href="/subscription">Open subscription payment</Link>
          </div>
        )}
      </section>
    </form>
  );
}

const fieldStyle: CSSProperties = {
  height: 48,
  borderRadius: 14,
  border: "1px solid var(--border)",
  padding: "0 14px"
};
