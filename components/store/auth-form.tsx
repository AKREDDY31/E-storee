"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useAuth } from "@/components/providers/auth-provider";

export function AuthForm({
  mode,
  role,
  title,
  variant = "default",
  redirectPath
}: {
  mode: "login" | "register";
  role: "user" | "admin";
  title: string;
  variant?: "default" | "admin";
  redirectPath?: string;
}) {
  const router = useRouter();
  const { setSession } = useAuth();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [otpChannel, setOtpChannel] = useState<"sms" | "whatsapp">("sms");
  const [registerStep, setRegisterStep] = useState<"start" | "verify">("start");
  const [pendingRegister, setPendingRegister] = useState<{ email: string; phone: string } | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  function readField(form: HTMLFormElement, name: string) {
    const element = form.elements.namedItem(name) as HTMLInputElement | null;
    return String(element?.value || "").trim();
  }

  async function sendOtpsFromCurrentForm() {
    const form = formRef.current;
    if (!form) return;

    setLoading(true);
    setError("");
    setMessage("");

    const name = readField(form, "name");
    const email = readField(form, "email");
    const phone = readField(form, "phone");
    const password = readField(form, "password");
    const confirmPassword = readField(form, "confirmPassword");

    if (!name || !email || !phone || !password) {
      setError("Please fill name, email, phone, and password first.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, phone, password, otpChannel })
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error || "Unable to send OTP. Please try again.");
        return;
      }

      setPendingRegister({ email, phone });
      setRegisterStep("verify");
      setMessage("OTP sent to your phone and email. Enter both OTPs below to create your account.");
    } catch {
      setError("Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const formData = new FormData(event.currentTarget);

    const isUserRegister = mode === "register" && role === "user";

    if (isUserRegister && registerStep === "start") {
      setLoading(false);
      await sendOtpsFromCurrentForm();
      return;
    }

    const endpoint =
      mode === "register"
        ? role === "admin"
          ? "/api/auth/admin-register"
          : registerStep === "verify"
            ? "/api/auth/register/verify"
            : "/api/auth/register"
        : "/api/auth/login";

    const body =
      mode === "register"
        ? role === "admin"
          ? {
              name: String(formData.get("name")),
              email: String(formData.get("email")),
              phone: String(formData.get("phone")),
              password: String(formData.get("password")),
              secretCode: String(formData.get("secretCode"))
            }
          : registerStep === "verify"
            ? {
                email: pendingRegister?.email || String(formData.get("email")),
                phone: pendingRegister?.phone || String(formData.get("phone")),
                phoneOtp: String(formData.get("phoneOtp")),
                emailOtp: String(formData.get("emailOtp"))
              }
            : {
                name: String(formData.get("name")),
                email: String(formData.get("email")),
                phone: String(formData.get("phone")),
                password: String(formData.get("password")),
                otpChannel
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
          <span className="pill" style={{ width: "fit-content", background: "rgba(255,255,255,0.12)", color: "white" }}>Secure access</span>
          <h1 className="section-title" style={{ margin: 0, fontSize: "clamp(2rem, 3.2vw, 3rem)" }}>{title}</h1>
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
        <form ref={formRef} className="card auth-form" onSubmit={handleSubmit}>
          <h1 style={{ margin: 0 }}>{title}</h1>
          {mode === "register" && registerStep === "start" ? <input required minLength={2} name="name" placeholder="Full name" style={fieldStyle} /> : null}
          {mode === "register" && role === "user" ? (
            <input required type="email" name="email" placeholder="Email" style={fieldStyle} readOnly={registerStep === "verify"} defaultValue={pendingRegister?.email || ""} />
          ) : (
            <input required type="email" name="email" placeholder="Email" style={fieldStyle} />
          )}
          {mode === "register" && role === "user" ? (
            <div className="otp-stack">
              <div className="otp-input-row otp-input-row--phone">
                <input value="+91" readOnly style={{ ...fieldStyle, background: "var(--surface-alt)" }} aria-label="Country code" />
                <input
                  required
                  name="phone"
                  placeholder="Phone number"
                  style={{ ...fieldStyle, minWidth: 0 }}
                  inputMode="numeric"
                  pattern="\d{10}"
                  title="Phone number must be 10 digits"
                  readOnly={registerStep === "verify"}
                  defaultValue={pendingRegister?.phone || ""}
                />
                <button className="button secondary otp-send-button" type="button" onClick={sendOtpsFromCurrentForm} disabled={loading}>
                  {loading ? "Sending..." : registerStep === "verify" ? "Resend OTP" : "Send OTP"}
                </button>
              </div>
              {registerStep === "start" ? (
                <div className="otp-channel-row">
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
              ) : null}
            </div>
          ) : mode === "register" ? (
            <input required name="phone" placeholder="Phone" style={fieldStyle} pattern="\d{10}" title="Phone number must be 10 digits" />
          ) : null}
          {mode === "register" && role === "admin" ? (
            <input required name="secretCode" placeholder="Admin secret code" style={fieldStyle} />
          ) : null}
          {mode === "register" && role === "user" && registerStep === "verify" ? (
            <div className="otp-verify-stack">
              <div className="otp-input-row otp-input-row--verify">
                <input required name="phoneOtp" placeholder="Phone OTP" style={fieldStyle} inputMode="numeric" pattern="\d{6}" title="OTP must be 6 digits" />
                <input required name="emailOtp" placeholder="Email OTP" style={fieldStyle} inputMode="numeric" pattern="\d{6}" title="OTP must be 6 digits" />
              </div>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>
                Enter the OTP sent to your phone and email to complete registration.
              </span>
            </div>
          ) : mode === "register" ? (
            <>
              <input required type="password" minLength={8} name="password" placeholder="Password" style={fieldStyle} />
              {mode === "register" && role === "user" ? (
                <input required type="password" minLength={8} name="confirmPassword" placeholder="Confirm password" style={fieldStyle} />
              ) : null}
            </>
          ) : null}
          {mode === "register" ? (
            <span style={{ color: "var(--muted)", fontSize: 13 }}>
              Use at least 8 characters with uppercase, lowercase, and a number.
            </span>
          ) : null}
          {message ? <div style={{ color: "var(--success)" }}>{message}</div> : null}
          {error ? <div style={{ color: "var(--danger)" }}>{error}</div> : null}
          <button className="button" disabled={loading} type="submit">
            {loading
              ? "Please wait..."
              : mode === "register" && role === "user"
                ? registerStep === "verify"
                  ? "Verify & Create account"
                  : "Send OTPs"
                : title}
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
