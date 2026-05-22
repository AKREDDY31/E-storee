"use client";

import { useState, type CSSProperties, type ChangeEvent, type FormEvent } from "react";
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
  const [qrPreview, setQrPreview] = useState(initialSettings.qrImageUrl);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoStatus, setLogoStatus] = useState("");
  const [logoPreview, setLogoPreview] = useState(initialSettings.siteLogoUrl);

  async function compressImage(file: File) {
    if (file.type === "image/webp" && file.size <= 1024 * 1024) {
      return file;
    }

    const bitmap = await createImageBitmap(file);
    const maxSize = 1280;
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      return file;
    }

    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
    if (!blob) {
      return file;
    }

    return new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" });
  }

  async function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setLogoStatus("");
    setLogoPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append("file", await compressImage(file));

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      credentials: "include"
    });
    const data = await response.json();
    setUploadingLogo(false);

    if (!response.ok) {
      setLogoStatus(data.error || "Logo upload failed");
      return;
    }

    const logoField = document.getElementById("admin-site-logo-url") as HTMLInputElement | null;
    if (logoField) {
      logoField.value = data.url;
    }

    setSettings((current) => ({
      ...current,
      siteLogoUrl: data.url
    }));
    setLogoStatus("Logo uploaded successfully. Save settings to publish it.");
  }

  async function handleQrUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingQr(true);
    setQrStatus("");
    setQrPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append("file", await compressImage(file));

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      credentials: "include"
    });
    const data = await response.json();
    setUploadingQr(false);

    if (!response.ok) {
      setQrStatus(data.error || "QR upload failed");
      return;
    }

    const qrField = document.getElementById("admin-qr-image-url") as HTMLInputElement | null;
    if (qrField) {
      qrField.value = data.url;
    }

    setSettings((current) => ({
      ...current,
      qrImageUrl: data.url
    }));
    setQrStatus("QR uploaded successfully. Save settings to publish it.");
  }

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
          <input id="admin-site-logo-url" defaultValue={settings.siteLogoUrl} name="siteLogoUrl" placeholder="Site logo image URL" style={fieldStyle} />
          <input defaultValue={settings.brandName} name="brandName" placeholder="Brand name" style={fieldStyle} />
          <input defaultValue={settings.tagline} name="tagline" placeholder="Tagline" style={fieldStyle} />
          <input defaultValue={settings.announcementText} name="announcementText" placeholder="Top scrolling website update" style={fieldStyle} />
          <input defaultValue={settings.supportPhone} name="supportPhone" placeholder="Support phone" style={fieldStyle} />
          <input defaultValue={settings.supportEmail} name="supportEmail" placeholder="Support email" style={fieldStyle} />
          <input defaultValue={settings.whatsappNumber} name="whatsappNumber" placeholder="WhatsApp number" style={fieldStyle} />
          <input defaultValue={settings.upiId} name="upiId" placeholder="UPI ID" style={fieldStyle} />
          <input id="admin-qr-image-url" defaultValue={settings.qrImageUrl} name="qrImageUrl" placeholder="QR image URL" style={fieldStyle} />
          <input defaultValue={settings.subscriptionDiscountPercent} name="subscriptionDiscountPercent" type="number" min="0" max="100" placeholder="Subscription discount %" style={fieldStyle} />
        </div>
        <div className="card" style={{ padding: 18, display: "grid", gap: 12, background: "var(--surface-alt)" }}>
          <strong>Site logo</strong>
          <input type="file" accept=".jpg,.jpeg,.png,.webp,.svg" onChange={handleLogoUpload} />
          {uploadingLogo ? <span style={{ color: "var(--muted)" }}>Uploading site logo...</span> : null}
          {logoStatus ? (
            <span style={{ color: logoStatus.includes("successfully") ? "var(--success)" : "var(--danger)" }}>{logoStatus}</span>
          ) : null}
          {logoPreview ? (
            <div style={{ width: 180, borderRadius: 20, overflow: "hidden", border: "1px solid var(--border)", background: "white" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoPreview} alt="Current site logo" style={{ width: "100%", height: "auto", objectFit: "cover", display: "block" }} />
            </div>
          ) : (
            <span style={{ color: "var(--muted)" }}>No site logo uploaded yet.</span>
          )}
        </div>
        <div className="card" style={{ padding: 18, display: "grid", gap: 12, background: "var(--surface-alt)" }}>
          <strong>Payment QR</strong>
          <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleQrUpload} />
          {uploadingQr ? <span style={{ color: "var(--muted)" }}>Uploading payment QR...</span> : null}
          {qrStatus ? (
            <span style={{ color: qrStatus.includes("successfully") ? "var(--success)" : "var(--danger)" }}>
              {qrStatus}
            </span>
          ) : null}
          {qrPreview ? (
            <div style={{ width: 180, borderRadius: 20, overflow: "hidden", border: "1px solid var(--border)", background: "white" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrPreview} alt="Current payment QR" style={{ width: "100%", height: "auto", objectFit: "cover", display: "block" }} />
            </div>
          ) : (
            <span style={{ color: "var(--muted)" }}>No QR uploaded yet.</span>
          )}
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
