"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Check } from "lucide-react";
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
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
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

  async function sendOtp(target: "phone" | "email") {
    const form = formRef.current;
    if (!form) return;

    setLoading(true);
    setError("");
    setMessage("");

    const name = readField(form, "name");
    const email = readField(form, "email");
    const phone = readField(form, "phone");
    const password = readField(form, "password");

    if (!name || !email || !phone || !password) {
      setError("Please fill name, email, phone, and password first.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          otpChannel: target === "phone" ? otpChannel : undefined,
          sendTarget: target
        })
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error || "Unable to send OTP. Please try again.");
        return;
      }

      setPendingRegister({ email, phone });
      if (target === "phone") {
        setPhoneOtpSent(true);
        setPhoneVerified(false);
        setMessage("Phone OTP sent. Enter the code in the phone container.");
      } else {
        setEmailOtpSent(true);
        setEmailVerified(false);
        setMessage("Email OTP sent. Enter the code in the email container.");
      }
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
    const verificationReady = phoneOtpSent && emailOtpSent;

    if (isUserRegister && !verificationReady) {
      setError("Send both the phone and email OTPs first.");
      setLoading(false);
      return;
    }

    const endpoint =
      mode === "register"
        ? role === "admin"
          ? "/api/auth/admin-register"
          : "/api/auth/register/verify"
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
          : {
              email: pendingRegister?.email || String(formData.get("email")),
              phone: pendingRegister?.phone || String(formData.get("phone")),
              phoneOtp: phoneOtp || String(formData.get("phoneOtp")),
              emailOtp: emailOtp || String(formData.get("emailOtp"))
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

      if (mode === "register" && role === "user") {
        setPhoneVerified(true);
        setEmailVerified(true);
        setMessage("Phone and email verified successfully.");
        window.setTimeout(() => {
          setSession((data?.user as any) ?? null);
          router.push(redirectPath || "/shop");
        }, 700);
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

  const verificationReady = phoneOtpSent && emailOtpSent;
  const registrationLocked = verificationReady || phoneOtpSent || emailOtpSent;

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
          {mode === "register" && role === "user" ? (
            <input required minLength={2} name="name" placeholder="Full name" style={fieldStyle} readOnly={registrationLocked} />
          ) : mode === "register" ? (
            <input required minLength={2} name="name" placeholder="Full name" style={fieldStyle} />
          ) : null}
          {mode === "register" && role === "user" ? (
            <div className="otp-stack">
              <div className="verification-card">
                <div className="verification-card__header">
                  <div>
                    <div className="verification-card__label">Phone number</div>
                    <div className="verification-card__hint">Default code +91</div>
                  </div>
                  <div className={`verification-card__status ${phoneVerified ? "verification-card__status--success" : ""}`}>
                    {phoneVerified ? <Check size={16} /> : null}
                    <span>{phoneVerified ? "Verified" : phoneOtpSent ? "OTP sent" : "Pending"}</span>
                  </div>
                </div>
                {!phoneVerified ? (
                  <div className="otp-channel-row otp-channel-row--card">
                    <span style={{ color: "var(--muted)", fontSize: 13, fontWeight: 700 }}>Send phone OTP via</span>
                    <label className="otp-channel-pill">
                      <input type="radio" name="otpChannel" checked={otpChannel === "sms"} onChange={() => setOtpChannel("sms")} />
                      <span>SMS</span>
                    </label>
                    <label className="otp-channel-pill">
                      <input type="radio" name="otpChannel" checked={otpChannel === "whatsapp"} onChange={() => setOtpChannel("whatsapp")} />
                      <span>WhatsApp</span>
                    </label>
                  </div>
                ) : null}
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
                    readOnly={registrationLocked}
                    defaultValue={pendingRegister?.phone || ""}
                  />
                  {phoneVerified ? (
                    <div className="otp-verified-badge">
                      <Check size={16} />
                      <span>Verified</span>
                    </div>
                  ) : (
                    <button className="button secondary otp-send-button" type="button" onClick={() => sendOtp("phone")} disabled={loading || phoneVerified}>
                      {loading ? "Sending..." : phoneOtpSent ? "Resend OTP" : "Send OTP"}
                    </button>
                  )}
                </div>
                {phoneOtpSent && !phoneVerified ? (
                  <div className="verification-code-row">
                    <input
                      required
                      name="phoneOtp"
                      placeholder="Enter phone OTP"
                      style={fieldStyle}
                      inputMode="numeric"
                      pattern="\d{6}"
                      title="OTP must be 6 digits"
                      value={phoneOtp}
                      onChange={(event) => setPhoneOtp(event.target.value)}
                    />
                  </div>
                ) : null}
              </div>

              <div className="verification-card">
                <div className="verification-card__header">
                  <div>
                    <div className="verification-card__label">Email address</div>
                    <div className="verification-card__hint">OTP goes to your inbox</div>
                  </div>
                  <div className={`verification-card__status ${emailVerified ? "verification-card__status--success" : ""}`}>
                    {emailVerified ? <Check size={16} /> : null}
                    <span>{emailVerified ? "Verified" : emailOtpSent ? "OTP sent" : "Pending"}</span>
                  </div>
                </div>
                <div className="otp-input-row otp-input-row--email">
                  <input
                    required
                    type="email"
                    name="email"
                    placeholder="Email"
                    style={{ ...fieldStyle, minWidth: 0 }}
                    readOnly={registrationLocked}
                    defaultValue={pendingRegister?.email || ""}
                  />
                  {emailVerified ? (
                    <div className="otp-verified-badge">
                      <Check size={16} />
                      <span>Verified</span>
                    </div>
                  ) : (
                    <button className="button secondary otp-send-button" type="button" onClick={() => sendOtp("email")} disabled={loading || emailVerified}>
                      {loading ? "Sending..." : emailOtpSent ? "Resend OTP" : "Send OTP"}
                    </button>
                  )}
                </div>
                {emailOtpSent && !emailVerified ? (
                  <div className="verification-code-row">
                    <input
                      required
                      name="emailOtp"
                      placeholder="Enter email OTP"
                      style={fieldStyle}
                      inputMode="numeric"
                      pattern="\d{6}"
                      title="OTP must be 6 digits"
                      value={emailOtp}
                      onChange={(event) => setEmailOtp(event.target.value)}
                    />
                  </div>
                ) : null}
              </div>

            </div>
          ) : mode === "register" ? (
            <input required name="phone" placeholder="Phone" style={fieldStyle} pattern="\d{10}" title="Phone number must be 10 digits" />
          ) : null}
          {mode === "register" && role === "admin" ? (
            <input required name="secretCode" placeholder="Admin secret code" style={fieldStyle} />
          ) : null}
          {mode === "register" && role === "user" ? (
            <>
              <input required type="password" minLength={8} name="password" placeholder="Password" style={fieldStyle} readOnly={registrationLocked} />
              <input required type="password" minLength={8} name="confirmPassword" placeholder="Confirm password" style={fieldStyle} readOnly={registrationLocked} />
            </>
          ) : mode === "register" ? (
            <input required type="password" minLength={8} name="password" placeholder="Password" style={fieldStyle} />
          ) : null}
          {mode === "register" ? (
            <span style={{ color: "var(--muted)", fontSize: 13 }}>
              Use at least 8 characters with uppercase, lowercase, and a number.
            </span>
          ) : null}
          {message ? <div style={{ color: "var(--success)" }}>{message}</div> : null}
          {error ? <div style={{ color: "var(--danger)" }}>{error}</div> : null}
          {mode === "register" && role === "user" ? (
            verificationReady ? (
              <button className="button" disabled={loading} type="submit">
                {loading ? "Please wait..." : "Verify & Create account"}
              </button>
            ) : (
              <div className="verification-note">
                Send both OTPs to unlock account verification.
              </div>
            )
          ) : (
            <button className="button" disabled={loading} type="submit">
              {loading ? "Please wait..." : title}
            </button>
          )}
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
