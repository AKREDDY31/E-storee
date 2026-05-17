"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useAuth } from "@/components/providers/auth-provider";

export function AuthForm({
  mode,
  role,
  title
}: {
  mode: "login" | "register";
  role: "user" | "admin";
  title: string;
}) {
  const router = useRouter();
  const { setSession } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(event.currentTarget);

    const endpoint =
      mode === "register"
        ? role === "admin"
          ? "/api/auth/admin-register"
          : "/api/auth/register"
        : "/api/auth/login";
    const body =
      mode === "register"
        ? {
            name: String(formData.get("name")),
            email: String(formData.get("email")),
            phone: String(formData.get("phone")),
            password: String(formData.get("password")),
            ...(role === "admin" ? { secretCode: String(formData.get("secretCode")) } : {})
          }
        : {
            email: String(formData.get("email")),
            password: String(formData.get("password")),
            role
          };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });

      const data = (await response.json().catch(() => null)) as { user?: unknown; error?: string } | null;

      if (!response.ok) {
        setError(data?.error || "Authentication failed");
        return;
      }

      setSession((data?.user as any) ?? null);
      router.push(role === "admin" ? "/admin/dashboard" : "/shop");
    } catch {
      setError("Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container section" style={{ display: "grid", placeItems: "center" }}>
      <div className="panel" style={{ width: "min(100%, 920px)", overflow: "hidden", display: "grid", gridTemplateColumns: "1fr minmax(320px, 420px)" }}>
        <div style={{ padding: 30, background: "linear-gradient(135deg, rgba(13,79,60,0.96), rgba(27,94,32,0.9))", color: "white", display: "grid", gap: 16 }}>
          <span className="pill" style={{ width: "fit-content", background: "rgba(255,255,255,0.12)", color: "white" }}>Secure access</span>
          <h1 className="section-title" style={{ margin: 0, fontSize: "clamp(2rem, 3.2vw, 3rem)" }}>{title}</h1>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.84)", lineHeight: 1.7 }}>
            Sign in to save your cart, view your orders, and keep your delivery details ready for a faster checkout.
          </p>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
            {[
              role === "admin" ? "Catalog control" : "Order tracking",
              role === "admin" ? "Stock updates" : "Saved profile",
              role === "admin" ? "Private dashboard" : "Faster checkout"
            ].map((item) => (
              <div key={item} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 18, padding: 14 }}>
                {item}
              </div>
            ))}
          </div>
        </div>
        <form className="card" onSubmit={handleSubmit} style={{ width: "100%", padding: 28, display: "grid", gap: 16, borderRadius: 0, boxShadow: "none", border: "none" }}>
        <h1 style={{ margin: 0 }}>{title}</h1>
        {mode === "register" ? <input required minLength={2} name="name" placeholder="Full name" style={fieldStyle} /> : null}
        <input required type="email" name="email" placeholder="Email" style={fieldStyle} />
        {mode === "register" ? <input required name="phone" placeholder="Phone" style={fieldStyle} pattern="\d{10}" title="Phone number must be 10 digits" /> : null}
        {mode === "register" && role === "admin" ? (
          <input required name="secretCode" placeholder="Admin secret code" style={fieldStyle} />
        ) : null}
        <input required type="password" minLength={8} name="password" placeholder="Password" style={fieldStyle} />
        {mode === "register" ? (
          <span style={{ color: "var(--muted)", fontSize: 13 }}>
            Use at least 8 characters with uppercase, lowercase, and a number.
          </span>
        ) : null}
        {error ? <div style={{ color: "var(--danger)" }}>{error}</div> : null}
        <button className="button" disabled={loading} type="submit">
          {loading ? "Please wait..." : title}
        </button>
        {role === "user" ? (
          <div style={{ color: "var(--muted)" }}>
            {mode === "login" ? (
              <div style={{ display: "grid", gap: 8 }}>
                <Link href="/register">New user? Create account</Link>
                <Link href="/forgot-password">Forgot password?</Link>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                <Link href="/login">Already have an account? Login</Link>
                <Link href="/forgot-password">Forgot password?</Link>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: "var(--muted)", display: "grid", gap: 8 }}>
            {mode === "login" ? (
              <Link href="/admin/register">Create admin account</Link>
            ) : (
              <Link href="/admin/login">Already have an admin account? Login</Link>
            )}
            <Link href="/admin/forgot-password">Forgot admin password?</Link>
          </div>
        )}
        <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
          {role === "admin"
            ? "Admin accounts are restricted to the store team. Use the secret code to register a new admin account."
            : "User accounts store delivery and order details for faster checkout and tracking."}
        </div>
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
