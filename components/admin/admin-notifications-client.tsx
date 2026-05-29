"use client";

import { useState, type FormEvent, type CSSProperties } from "react";

export function AdminNotificationsClient() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<{ type: "idle" | "ok" | "error"; text: string }>({ type: "idle", text: "" });
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setStatus({ type: "idle", text: "" });

    const response = await fetch("/api/admin/notifications/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ subject, message })
    });

    const data = await response.json().catch(() => ({}));
    setSending(false);

    if (!response.ok) {
      setStatus({ type: "error", text: data?.error || "Unable to send notifications" });
      return;
    }

    setStatus({ type: "ok", text: `Sent to ${data?.sentTo || 0} users.` });
    setSubject("");
    setMessage("");
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <h1 style={{ margin: 0 }}>Notifications</h1>
      <div className="card" style={{ padding: 22, display: "grid", gap: 14, borderRadius: 28 }}>
        <strong>Send update to all verified users</strong>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Subject"
            required
            style={fieldStyle}
          />
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Message"
            required
            style={{ ...fieldStyle, height: 120, paddingTop: 12 }}
          />
          <button className="button" disabled={sending} type="submit">
            {sending ? "Sending..." : "Send"}
          </button>
          {status.type === "error" ? <div style={{ color: "var(--danger)", fontWeight: 700 }}>{status.text}</div> : null}
          {status.type === "ok" ? <div style={{ color: "var(--success)", fontWeight: 700 }}>{status.text}</div> : null}
        </form>
        <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
          Messages go to users who have verified both phone and email. WhatsApp and email delivery requires MSG91 credentials and templates.
        </div>
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
