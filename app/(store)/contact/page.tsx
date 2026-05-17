import Link from "next/link";
import { getStoreSettings } from "@/lib/queries";

export default async function ContactPage() {
  const settings = await getStoreSettings();
  return (
    <div className="container section" style={{ display: "grid", gap: 24 }}>
      <div className="card" style={{ padding: 26, display: "grid", gap: 10, background: "linear-gradient(135deg, rgba(13,79,60,0.94), rgba(27,94,32,0.88))", color: "white" }}>
        <span className="eyebrow" style={{ color: "rgba(255,255,255,0.74)" }}>Contact</span>
        <h1 className="section-title" style={{ margin: 0, fontSize: "clamp(2rem, 3.4vw, 3rem)" }}>Contact us</h1>
        <div style={{ color: "rgba(255,255,255,0.82)" }}>Reach the store team for orders, delivery support and product questions.</div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <div className="card" style={{ padding: 24, display: "grid", gap: 12 }}>
          <span className="pill" style={{ width: "fit-content" }}>WhatsApp Orders</span>
          <strong style={{ fontSize: 22 }}>Fast order help</strong>
          <span className="muted">{settings.supportPhone}</span>
          <Link className="button" href={`https://wa.me/${settings.whatsappNumber}`}>Open WhatsApp</Link>
        </div>
        <div className="card" style={{ padding: 24, display: "grid", gap: 12 }}>
          <span className="pill" style={{ width: "fit-content" }}>Business Address</span>
          <strong style={{ fontSize: 22 }}>Visit or dispatch info</strong>
          <span className="muted">{settings.businessAddress}</span>
          <span className="muted">{settings.courierDetails}</span>
        </div>
      </div>
    </div>
  );
}
