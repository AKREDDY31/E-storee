"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { AdminImageUploadField } from "./admin-image-upload-field";
import { type StoreSettings } from "@/types";

export function AdminSettingsClient({
  initialSettings
}: {
  initialSettings: StoreSettings;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploadingQr, setUploadingQr] = useState(false);
  const [qrStatus, setQrStatus] = useState("");
  const [siteLogoUrl, setSiteLogoUrl] = useState(initialSettings.siteLogoUrl);
  const [qrImageUrl, setQrImageUrl] = useState(initialSettings.qrImageUrl);

  async function handleSettingsSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to save settings");
      return;
    }
    setSettings(data.settings);
    setMessage("Store settings updated.");
  }

  async function handleSecretSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const formData = new FormData(event.currentTarget);
    const payload = {
      currentSecretCode: String(formData.get("currentSecretCode")),
      newSecretCode: String(formData.get("newSecretCode"))
    };
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to update secret code");
      return;
    }
    setMessage("Admin secret code updated.");
    event.currentTarget.reset();
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <h1 style={{ margin: 0 }}>Store settings</h1>
      <form className="card" onSubmit={handleSettingsSave} style={{ padding: 24, display: "grid", gap: 12 }}>
        <strong>Business and payment details</strong>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <AdminImageUploadField
            id="admin-site-logo-url"
            name="siteLogoUrl"
            label="Site logo image URL"
            value={siteLogoUrl}
            onValueChange={(value) => {
              setSiteLogoUrl(value);
              setSettings((current) => ({ ...current, siteLogoUrl: value }));
            }}
            placeholder="Site logo image URL"
            previewAlt="Current site logo"
            helpText="Upload a logo instantly. JPG, JPEG, PNG, or WEBP are supported."
          />
          <input defaultValue={settings.brandName} name="brandName" placeholder="Brand name" style={fieldStyle} />
          <input defaultValue={settings.tagline} name="tagline" placeholder="Tagline" style={fieldStyle} />
          <input defaultValue={settings.announcementText} name="announcementText" placeholder="Top scrolling website update" style={fieldStyle} />
          <input defaultValue={settings.supportPhone} name="supportPhone" placeholder="Support phone" style={fieldStyle} />
          <input defaultValue={settings.supportEmail} name="supportEmail" placeholder="Support email" style={fieldStyle} />
          <input defaultValue={settings.whatsappNumber} name="whatsappNumber" placeholder="WhatsApp number" style={fieldStyle} />
          <input defaultValue={settings.upiId} name="upiId" placeholder="UPI ID" style={fieldStyle} />
          <AdminImageUploadField
            id="admin-qr-image-url"
            name="qrImageUrl"
            label="QR image URL"
            value={qrImageUrl}
            onValueChange={(value) => {
              setQrImageUrl(value);
              setSettings((current) => ({ ...current, qrImageUrl: value }));
            }}
            placeholder="QR image URL"
            previewAlt="Current payment QR"
            helpText="Upload the payment QR directly without any extra conversion step."
          />
          <input defaultValue={settings.subscriptionDiscountPercent} name="subscriptionDiscountPercent" type="number" min="0" max="100" placeholder="Subscription discount %" style={fieldStyle} />
        </div>
        <textarea defaultValue={settings.businessAddress} name="businessAddress" placeholder="Business address" style={{ ...fieldStyle, height: 96, paddingTop: 12 }} />
        <textarea defaultValue={settings.courierDetails} name="courierDetails" placeholder="Courier details" style={{ ...fieldStyle, height: 96, paddingTop: 12 }} />
        <textarea
          defaultValue={(settings.subscriptionBenefits || []).join("\n")}
          name="subscriptionBenefits"
          placeholder={"Subscription benefits, one per line"}
          style={{ ...fieldStyle, minHeight: 110, height: "auto", padding: 12 }}
        />
        <textarea defaultValue={settings.refundPolicyText} name="refundPolicyText" placeholder="Refund policy (shown to users)" style={{ ...fieldStyle, minHeight: 110, height: "auto", padding: 12 }} />
        <textarea defaultValue={settings.refundPolicyNorms} name="refundPolicyNorms" placeholder="Refund norms/conditions" style={{ ...fieldStyle, minHeight: 110, height: "auto", padding: 12 }} />
        {error ? <div style={{ color: "var(--danger)" }}>{error}</div> : null}
        {message ? <div style={{ color: "var(--success)" }}>{message}</div> : null}
        <button className="button" type="submit">Save store settings</button>
      </form>

      <form className="card" onSubmit={handleSecretSave} style={{ padding: 24, display: "grid", gap: 12 }}>
        <strong>Change admin secret code</strong>
        <input required name="currentSecretCode" placeholder="Current secret code" style={fieldStyle} />
        <input required name="newSecretCode" placeholder="New secret code" style={fieldStyle} />
        <button className="button gold" type="submit">Update secret code</button>
      </form>
    </div>
  );
}

const fieldStyle: CSSProperties = {
  height: 48,
  borderRadius: 14,
  border: "1px solid var(--border)",
  padding: "0 14px"
};
