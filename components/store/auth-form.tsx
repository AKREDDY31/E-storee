"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useAuth } from "@/components/providers/auth-provider";

export function AuthForm({
  mode,
  role,
  title,
  variant = "default",
  redirectPath,
  initialEmail
}: {
  mode: "login" | "register";
  role: "user" | "admin";
  title: string;
  variant?: "default" | "admin";
  redirectPath?: string;
  initialEmail?: string;
}) {
  const router = useRouter();
  const { setSession } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // User registration state.
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  useEffect(() => {

  useEffect(() => {
    if (mode !== "register" || role !== "user") return;

    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [mode, role, initialEmail]);
    }
  }, [mode, role, initialEmail, initialEmailVerified, initialVerificationError]);

  if (!mounted) {
    return null;
  }

  const isUserRegister = mode === "register" && role === "user";

  function clearMessages() {
    setError("");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    if (isUserRegister) {
      if (password !== confirmPassword) {
        setError("Password and confirm password must match.");
        return;
      }

      if (!secretCode.trim()) {
        setError("Please enter a secret code for password reset.");
        return;
      }
    }

    const formData = new FormData(event.currentTarget);

    const endpoint =
      mode === "register"
        ? role === "admin"
          ? "/api/auth/admin-register"
          : "/api/auth/register"
        : "/api/auth/login";

    const body =
      mode === "register"
        ? role === "admin"
          ? {
              name: String(formData.get("name") || ""),
              email: String(formData.get("email") || ""),
              phone: String(formData.get("phone") || ""),
              password: String(formData.get("password") || ""),
              secretCode: String(formData.get("secretCode") || "")
            }
          : {
              name,
              age: Number(age),
              email,
              phone,
              password,
              confirmPassword,
              secretCode
            }
        : {
            email: String(formData.get("email") || ""),
            password: String(formData.get("password") || ""),
            role
          };

    setLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });

      const data = (await response.json().catch(() => null)) as { user?: unknown; error?: string } | null;

      if (!response.ok) {
        setError(data?.error || "Authentication failed.");
        return;
      }

      if (data?.user) {
        setSession(data.user as any);
      }

      router.push(redirectPath || (role === "admin" ? "/admin/dashboard" : "/shop"));
    } catch {
      setError("Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container section" style={{ display: "grid", placeItems: "center" }}>
      <div className={`panel auth-panel ${variant === "admin" ? "auth-panel--admin" : ""}`}>
        <div className="auth-hero">
          <span
            className="pill"
            style={{ width: "fit-content", background: "rgba(255,255,255,0.12)", color: "white" }}
          >
            Secure access
          </span>
          <h1 className="section-title" style={{ margin: 0, fontSize: "clamp(2rem, 3.2vw, 3rem)" }}>
            {title}
          </h1>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.84)", lineHeight: 1.7 }}>
            {variant === "admin"
              ? "Sign in to manage products, orders, payments, and store settings from the private dashboard."
              : "Sign in to save your cart, view your orders, and keep your delivery details ready for a faster checkout."}
          </p>
          <div className="grid auth-hero-grid">
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

        <form className="card auth-form" onSubmit={handleSubmit}>
          <h1 style={{ margin: 0 }}>{title}</h1>

          {isUserRegister ? (
            <>
              <input
                required
                minLength={2}
                name="name"
                placeholder="Full name"
                style={fieldStyle}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />

              <input
                required
                name="age"
                placeholder="Age"
                style={fieldStyle}
                inputMode="numeric"
                pattern="\d{1,3}"
                title="Enter a valid age"
                value={age}
                onChange={(event) => setAge(event.target.value)}
              />

              <input
                required
                type="email"
                name="email"
                placeholder="Email"
                style={fieldStyle}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              <input
                required
                name="phone"
                placeholder="Phone number"
                style={fieldStyle}
                inputMode="numeric"
                pattern="\d{10}"
                title="Phone number must be 10 digits"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />

              <div style={{ display: "grid", gap: 8 }}>
                <input
                  required
                  name="secretCode"
                  type="password"
                  minLength={4}
                  placeholder="Secret code for password reset"
                  style={fieldStyle}
                  value={secretCode}
                  onChange={(event) => setSecretCode(event.target.value)}
                />
                <span style={{ color: "var(--muted)", fontSize: 13 }}>
                  This secret code will be used later to reset your password.
                </span>
              </div>

              <input
                required
                type="password"
                minLength={8}
                name="password"
                placeholder="Create password"
                style={fieldStyle}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <input
                required
                type="password"
                minLength={8}
                name="confirmPassword"
                placeholder="Confirm password"
                style={fieldStyle}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              <span style={{ color: "var(--muted)", fontSize: 13 }}>
                Use at least 8 characters with uppercase, lowercase, and a number.
              </span>
            </>
          ) : mode === "register" ? (
            <>
              <input required minLength={2} name="name" placeholder="Full name" style={fieldStyle} />
              <input required type="email" name="email" placeholder="Email" style={fieldStyle} />
              <input required name="phone" placeholder="Phone" style={fieldStyle} pattern="\d{10}" title="Phone number must be 10 digits" />
              {role === "admin" ? <input required name="secretCode" placeholder="Admin secret code" style={fieldStyle} /> : null}
              <input required type="password" minLength={8} name="password" placeholder="Password" style={fieldStyle} />
              <input required type="password" minLength={8} name="confirmPassword" placeholder="Confirm password" style={fieldStyle} />
            </>
          ) : (
            <>
              <input required type="email" name="email" placeholder="Email" style={fieldStyle} />
              <input required type="password" minLength={8} name="password" placeholder="Password" style={fieldStyle} />
            </>
          )}

          {message ? <div style={{ color: "var(--success)" }}>{message}</div> : null}
          {error ? <div style={{ color: "var(--danger)" }}>{error}</div> : null}

          <button className="button" disabled={loading} type="submit">
            {loading ? "Please wait..." : mode === "login" ? title : role === "admin" ? title : "Create account"}
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
