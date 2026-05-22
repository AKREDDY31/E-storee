"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties, type FormEvent } from "react";
import { ShieldCheck, Truck, UserRound } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { formatCurrency } from "@/lib/utils";
import { type ProductCardData } from "@/types";

type Mode = "login" | "register";

export function HomeAuthClient({ products }: { products: ProductCardData[] }) {
  const router = useRouter();
  const { setSession } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const offerItems = [...products]
    .sort((a, b) => (b.mrp || b.price) - (a.mrp || a.price))
    .slice(0, 10)
    .map((product) => {
      const basePrice = Math.max(product.mrp || 0, product.price || 0);
      const offerPrice = Math.max(1, Math.round(basePrice * 0.7));
      return {
        ...product,
        basePrice,
        offerPrice
      };
    });
  const scrollingOfferItems = offerItems.length > 0 ? [...offerItems, ...offerItems] : [];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(event.currentTarget);

    const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
    const body =
      mode === "register"
        ? {
            name: String(formData.get("name")),
            email: String(formData.get("email")),
            phone: String(formData.get("phone")),
            password: String(formData.get("password"))
          }
        : {
            email: String(formData.get("email")),
            password: String(formData.get("password")),
            role: "user"
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
      router.push("/shop");
    } catch {
      setError("Unable to reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="section" style={{ paddingBottom: 18 }}>
        <div className="container" style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
            <div>
              <span className="eyebrow">Top Price Drop</span>
              <h2 style={{ margin: "8px 0 0", fontSize: "clamp(1.4rem, 3.8vw, 2.2rem)" }}>Premium picks with default 30% offer</h2>
            </div>
            <Link href="/shop" className="button secondary" style={{ height: 42 }}>
              Explore full catalog
            </Link>
          </div>

          <div className="offer-banner-shell">
            <div className="offer-banner-track">
              {scrollingOfferItems.map((item, index) => (
                <Link key={`${item.slug}-${index}`} href={`/shop/${item.slug}`} className="offer-banner-item">
                  <span className="pill" style={{ width: "fit-content" }}>30% OFF</span>
                  <strong style={{ fontSize: 16, lineHeight: 1.35 }}>{item.name}</strong>
                  <span style={{ color: "var(--muted)", fontSize: 13 }}>{item.category}</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700 }}>Actual</span>
                    <span style={{ color: "var(--muted)", textDecoration: "line-through", fontWeight: 700 }}>
                      {formatCurrency(item.basePrice)}
                    </span>
                    <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700 }}>Offer</span>
                    <strong style={{ fontSize: 20, color: "var(--brand-deep)" }}>
                      {formatCurrency(item.offerPrice)}
                    </strong>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 18 }}>
        <div className="container" style={{ display: "grid", gap: 24, gridTemplateColumns: "1.12fr 0.88fr", alignItems: "stretch" }}>
          <div className="card" style={{ padding: 36, background: "linear-gradient(135deg, rgba(13,79,60,0.96), rgba(27,94,32,0.9))", color: "white", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top right, rgba(212,175,55,0.34), transparent 30%)" }} />
            <div style={{ position: "relative", display: "grid", gap: 18 }}>
              <span className="pill" style={{ background: "rgba(255,255,255,0.12)", color: "white" }}>
                <UserRound size={16} /> User Access
              </span>
              <h1 className="title">Sign in to start shopping faster.</h1>
              <p className="subtitle" style={{ color: "rgba(255,255,255,0.84)", maxWidth: 620 }}>
                Login or create your customer account from the homepage, save your address, order easily, and track everything in one place.
              </p>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                {[
                  { icon: ShieldCheck, title: "Secure checkout", text: "COD and online payment with exact payable amount." },
                  { icon: Truck, title: "Quick tracking", text: "Live order status, delivery estimate, and admin updates." },
                  { icon: UserRound, title: "Saved profile", text: "Keep your delivery address ready for every order." }
                ].map((item) => (
                  <div key={item.title} style={{ borderRadius: 20, background: "rgba(255,255,255,0.1)", padding: 18, display: "grid", gap: 8 }}>
                    <item.icon size={18} />
                    <strong>{item.title}</strong>
                    <span style={{ color: "rgba(255,255,255,0.78)", lineHeight: 1.5 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 28, display: "grid", gap: 16, alignSelf: "center" }}>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className={`button ${mode === "login" ? "" : "secondary"}`} onClick={() => setMode("login")} style={{ flex: 1 }}>
                Login
              </button>
              <button type="button" className={`button ${mode === "register" ? "" : "secondary"}`} onClick={() => setMode("register")} style={{ flex: 1 }}>
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
              <h2 style={{ margin: 0 }}>{mode === "login" ? "User login" : "Create your account"}</h2>
              {mode === "register" ? <input required minLength={2} name="name" placeholder="Full name" style={fieldStyle} /> : null}
              <input required type="email" name="email" placeholder="Email address" style={fieldStyle} />
              {mode === "register" ? (
                <input required name="phone" placeholder="Phone number" style={fieldStyle} pattern="\d{10}" title="Phone number must be 10 digits" />
              ) : null}
              <input required type="password" name="password" placeholder="Password" style={fieldStyle} minLength={8} />
              <span style={{ color: "var(--muted)", fontSize: 13 }}>
                Use at least 8 characters with uppercase, lowercase, and a number.
              </span>
              {error ? <div style={{ color: "var(--danger)" }}>{error}</div> : null}
              <button className="button" disabled={loading} type="submit">
                {loading ? "Please wait..." : mode === "login" ? "Login and continue" : "Register and continue"}
              </button>
            </form>

            <div style={{ display: "grid", gap: 8, color: "var(--muted)" }}>
              <Link href="/forgot-password">Forgot password?</Link>
              <Link href="/admin/login">Admin login is separate</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

const fieldStyle: CSSProperties = {
  height: 48,
  borderRadius: 14,
  border: "1px solid var(--border)",
  padding: "0 14px",
  background: "white"
};
