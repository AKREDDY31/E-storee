import Link from "next/link";
import { Clock3, ShieldCheck, Truck } from "lucide-react";

export function HeroSection() {
  return (
    <section className="section">
      <div className="container" style={{ display: "grid", gap: 24, gridTemplateColumns: "1.2fr 0.8fr", alignItems: "stretch" }}>
        <div className="card" style={{ padding: 36, background: "linear-gradient(135deg, rgba(13,79,60,0.96), rgba(27,94,32,0.9))", color: "white", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top right, rgba(212,175,55,0.34), transparent 28%)" }} />
          <div style={{ position: "relative", display: "grid", gap: 20 }}>
            <span className="pill" style={{ background: "rgba(255,255,255,0.14)", color: "white" }}>
              <Clock3 size={16} /> Launch offer: Flat 30% off on all brands
            </span>
            <span className="eyebrow" style={{ color: "rgba(255,255,255,0.78)" }}>
              Premium Natural Living
            </span>
            <h1 className="title">Trusted ayurvedic care, wellness tonics and natural essentials.</h1>
            <p className="subtitle" style={{ color: "rgba(255,255,255,0.84)", maxWidth: 640 }}>
              Mobile-first shopping experience with category filtering, secure payments, COD, WhatsApp ordering and real-time admin management.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link className="button gold" href="/shop">
                Shop Now
              </Link>
              <Link className="button secondary" href="/track-order">
                Track Order
              </Link>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gap: 16 }}>
          {[
            { icon: ShieldCheck, title: "Secure payments", text: "Online payment and COD with price reflected clearly at checkout." },
            { icon: Truck, title: "Order tracking", text: "Customers and admin can monitor order updates from placement to delivery." },
            { icon: Clock3, title: "Admin controls", text: "Add unlimited products, images, specifications and categories through the admin panel." }
          ].map((item) => (
            <div key={item.title} className="card" style={{ padding: 22, display: "grid", gap: 10 }}>
              <item.icon size={20} color="var(--brand-deep)" />
              <strong>{item.title}</strong>
              <span style={{ color: "var(--muted)", lineHeight: 1.6 }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
