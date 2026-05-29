"use client";

import { useState, type CSSProperties, type FormEvent } from "react";

export function ForgotPasswordForm({
  role,
  title
}: {
  role: "user" | "admin";
  title: string;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpChannel, setOtpChannel] = useState<"sms" | "whatsapp">("sms");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const formData = new FormData(event.currentTarget);

    if (role === "admin") {
      const payload = {
        role,
        email: String(formData.get("email")),
        secretCode: String(formData.get("secretCode")),
        newPassword: String(formData.get("newPassword"))
      };

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        setError(data.error || "Reset failed");
        return;
      }

      setMessage("Password updated successfully. You can now log in.");
      event.currentTarget.reset();
      return;
    }

    const email = String(formData.get("email"));
    const phone = String(formData.get("phone"));

    if (!otpSent) {
      const response = await fetch("/api/auth/password-reset/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, otpChannel })
      });
      const data = await response.json();
      setLoading(false);
      if (!response.ok) {
        setError(data.error || "Unable to send OTP");
        return;
      }
      setOtpSent(true);
      setMessage("OTP sent to your phone. Enter it below to reset your password.");
      return;
    }

    const otp = String(formData.get("otp"));
    const newPassword = String(formData.get("newPassword"));
    const confirmPassword = String(formData.get("confirmPassword"));

    if (newPassword !== confirmPassword) {
      setLoading(false);
      setError("Password and confirm password do not match");
      return;
    }

    const response = await fetch("/api/auth/password-reset/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone, otp, newPassword })
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Reset failed");
      return;
    }

    setMessage("Password updated successfully. You can now log in.");
    setOtpSent(false);
    event.currentTarget.reset();
  }

  return (
    <div className="container section" style={{ display: "grid", placeItems: "center" }}>
      <div className="panel" style={{ width: "min(100%, 820px)", overflow: "hidden", display: "grid", gridTemplateColumns: "1fr minmax(320px, 420px)" }}>
        <div style={{ padding: 30, background: "linear-gradient(135deg, rgba(13,79,60,0.96), rgba(27,94,32,0.9))", color: "white", display: "grid", gap: 16 }}>
          <span className="pill" style={{ width: "fit-content", background: "rgba(255,255,255,0.12)", color: "white" }}>Password reset</span>
          <h1 className="section-title" style={{ margin: 0, fontSize: "clamp(2rem, 3.2vw, 3rem)" }}>{title}</h1>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.84)", lineHeight: 1.7 }}>
            Reset access with your registered email and verification details, then continue back to the store.
          </p>
        </div>
        <form className="card" onSubmit={handleSubmit} style={{ width: "100%", padding: 28, display: "grid", gap: 16, borderRadius: 0, boxShadow: "none", border: "none" }}>
        <h1 style={{ margin: 0 }}>{title}</h1>
        <input required type="email" name="email" placeholder="Email" style={fieldStyle} />
        {role === "user" ? (
          <>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 10 }}>
                <input value="+91" readOnly style={{ ...fieldStyle, background: "var(--surface-alt)" }} aria-label="Country code" />
                <input required name="phone" placeholder="Phone number" style={fieldStyle} inputMode="numeric" pattern="\d{10}" title="Phone number must be 10 digits" />
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ color: "var(--muted)", fontSize: 13, fontWeight: 700 }}>Send OTP via</span>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="radio" name="otpChannel" checked={otpChannel === "sms"} onChange={() => setOtpChannel("sms")} />
                  <span>SMS</span>
                </label>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="radio" name="otpChannel" checked={otpChannel === "whatsapp"} onChange={() => setOtpChannel("whatsapp")} />
                  <span>WhatsApp</span>
                </label>
              </div>
            </div>
            {otpSent ? <input required name="otp" placeholder="Enter OTP" style={fieldStyle} inputMode="numeric" pattern="\d{6}" title="OTP must be 6 digits" /> : null}
          </>
        ) : (
          <input required name="secretCode" placeholder="Current admin secret code" style={fieldStyle} />
        )}
        {role === "admin" || otpSent ? (
          <>
            <input required type="password" minLength={8} name="newPassword" placeholder="New password" style={fieldStyle} />
            {role === "user" ? (
              <input required type="password" minLength={8} name="confirmPassword" placeholder="Confirm password" style={fieldStyle} />
            ) : null}
            <span style={{ color: "var(--muted)", fontSize: 13 }}>
              Password must be at least 8 characters and include uppercase, lowercase, and a number.
            </span>
          </>
        ) : null}
        {error ? <div style={{ color: "var(--danger)" }}>{error}</div> : null}
        {message ? <div style={{ color: "var(--success)" }}>{message}</div> : null}
        <button className="button" disabled={loading} type="submit">
          {loading ? "Please wait..." : role === "user" ? (otpSent ? "Reset password" : "Send OTP") : "Reset password"}
        </button>
      </form>
      </div>
    </div>
  );
}

const fieldStyle: CSSProperties = {
  height: 48,
  borderRadius: 14,
  border: "1px solid var(--border)",
  padding: "0 14px"
};
