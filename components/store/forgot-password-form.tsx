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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const payload = {
      role,
      email: String(formData.get("email")),
      phone: role === "user" ? String(formData.get("phone")) : undefined,
      secretCode: role === "admin" ? String(formData.get("secretCode")) : undefined,
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
          <input required name="phone" placeholder="Registered phone number" style={fieldStyle} pattern="\d{10}" title="Phone number must be 10 digits" />
        ) : (
          <input required name="secretCode" placeholder="Current admin secret code" style={fieldStyle} />
        )}
        <input required type="password" minLength={8} name="newPassword" placeholder="New password" style={fieldStyle} />
        <span style={{ color: "var(--muted)", fontSize: 13 }}>
          Password must be at least 8 characters and include uppercase, lowercase, and a number.
        </span>
        {error ? <div style={{ color: "var(--danger)" }}>{error}</div> : null}
        {message ? <div style={{ color: "var(--success)" }}>{message}</div> : null}
        <button className="button" disabled={loading} type="submit">
          {loading ? "Updating..." : "Reset password"}
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
