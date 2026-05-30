"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { Check } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

type OtpChannel = "sms" | "whatsapp";

export function AuthForm({
  mode,
  role,
  title,
  variant = "default",
  redirectPath,
  initialEmail,
  initialEmailVerified = false,
  initialVerificationError = false
}: {
  mode: "login" | "register";
  role: "user" | "admin";
  title: string;
  variant?: "default" | "admin";
  redirectPath?: string;
  initialEmail?: string;
  initialEmailVerified?: boolean;
  initialVerificationError?: boolean;
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
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpChannel, setOtpChannel] = useState<OtpChannel>("sms");
  const [phoneOtp, setPhoneOtp] = useState("");

  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mode !== "register" || role !== "user") return;

    if (initialEmail) {
      setEmail(initialEmail);
    }

    if (initialEmailVerified) {
      setEmailVerified(true);
      setMessage("Email verified successfully. Now verify your phone OTP.");
      setError("");
    } else if (initialVerificationError) {
      setError("Email verification link is invalid or expired. Please send a new link.");
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

  async function sendEmailVerificationLink() {
    clearMessages();

    if (!name.trim()) {
      setError("Please enter your name first.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email first.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register/email-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email })
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error || "Unable to send email verification link.");
        return;
      }

      setEmailLinkSent(true);
      setMessage("Verification link sent to your email. Open the link to verify.");
    } catch {
      setError("Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function sendPhoneOtp() {
    clearMessages();

    if (!phone.trim()) {
      setError("Please enter your mobile number first.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register/phone-otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otpChannel, purpose: "register" })
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error || "Unable to send OTP.");
        return;
      }

      setPhoneOtpSent(true);
      setPhoneVerified(false);
      setMessage("OTP sent to your mobile number.");
    } catch {
      setError("Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyPhoneOtp() {
    clearMessages();

    if (!phoneOtp.trim()) {
      setError("Please enter the OTP first.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register/phone-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: phoneOtp, purpose: "register" })
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error || "OTP verification failed.");
        return;
      }

      setPhoneVerified(true);
      setMessage("Phone number verified successfully.");
    } catch {
      setError("Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const formData = new FormData(event.currentTarget);

    if (isUserRegister) {
      if (!emailVerified) {
        setError("Please verify your email first.");
        return;
      }

      if (!phoneVerified) {
        setError("Please verify your mobile OTP first.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Password and confirm password must match.");
        return;
      }
    }

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
              confirmPassword
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

              <div className="verification-card">
                <div className="verification-card__header">
                  <div>
                    <div className="verification-card__label">Email address</div>
                    <div className="verification-card__hint">A verification link will be sent</div>
                  </div>
                  <div className={`verification-card__status ${emailVerified ? "verification-card__status--success" : ""}`}>
                    {emailVerified ? <Check size={16} /> : null}
                    <span>{emailVerified ? "Verified" : emailLinkSent ? "Link sent" : "Pending"}</span>
                  </div>
                </div>

                <div className="otp-input-row otp-input-row--email">
                  <input
                    required
                    type="email"
                    name="email"
                    placeholder="Email"
                    style={{ ...fieldStyle, minWidth: 0 }}
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setEmailVerified(false);
                    }}
                  />
                  {emailVerified ? (
                    <div className="otp-verified-badge">
                      <Check size={16} />
                      <span>Verified</span>
                    </div>
                  ) : (
                    <button
                      className="button secondary otp-send-button"
                      type="button"
                      onClick={sendEmailVerificationLink}
                      disabled={loading}
                    >
                      {loading ? "Please wait..." : emailLinkSent ? "Resend link" : "Verify"}
                    </button>
                  )}
                </div>
              </div>

              <div className="verification-card">
                <div className="verification-card__header">
                  <div>
                    <div className="verification-card__label">Mobile number</div>
                    <div className="verification-card__hint">Send OTP and verify before register</div>
                  </div>
                  <div className={`verification-card__status ${phoneVerified ? "verification-card__status--success" : ""}`}>
                    {phoneVerified ? <Check size={16} /> : null}
                    <span>{phoneVerified ? "Verified" : phoneOtpSent ? "OTP sent" : "Pending"}</span>
                  </div>
                </div>

                {!phoneVerified ? (
                  <div className="otp-channel-row otp-channel-row--card">
                    <span style={{ color: "var(--muted)", fontSize: 13, fontWeight: 700 }}>Send OTP via</span>
                    <button
                      type="button"
                      className={`otp-channel-button ${otpChannel === "sms" ? "otp-channel-button--active" : ""}`}
                      onClick={() => setOtpChannel("sms")}
                    >
                      SMS
                    </button>
                    <button
                      type="button"
                      className={`otp-channel-button ${otpChannel === "whatsapp" ? "otp-channel-button--active" : ""}`}
                      onClick={() => setOtpChannel("whatsapp")}
                    >
                      WhatsApp
                    </button>
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
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value);
                      setPhoneVerified(false);
                    }}
                  />
                  {phoneVerified ? (
                    <div className="otp-verified-badge">
                      <Check size={16} />
                      <span>Verified</span>
                    </div>
                  ) : (
                    <button className="button secondary otp-send-button" type="button" onClick={sendPhoneOtp} disabled={loading}>
                      {loading ? "Please wait..." : phoneOtpSent ? "Resend OTP" : "Verify"}
                    </button>
                  )}
                </div>

                {phoneOtpSent && !phoneVerified ? (
                  <div className="verification-code-row" style={{ display: "grid", gap: 10 }}>
                    <input
                      required
                      name="phoneOtp"
                      placeholder="Enter mobile OTP"
                      style={fieldStyle}
                      inputMode="numeric"
                      pattern="\d{6}"
                      title="OTP must be 6 digits"
                      value={phoneOtp}
                      onChange={(event) => setPhoneOtp(event.target.value)}
                    />
                    <button className="button secondary" type="button" onClick={verifyPhoneOtp} disabled={loading}>
                      {loading ? "Please wait..." : "Verify OTP"}
                    </button>
                  </div>
                ) : null}
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
