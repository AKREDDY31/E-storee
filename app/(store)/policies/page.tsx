import { getStoreSettings } from "@/lib/queries";

export default async function PoliciesPage() {
  const settings = await getStoreSettings();

  return (
    <div className="container section" style={{ display: "grid", gap: 20 }}>
      <div className="card" style={{ padding: 26, display: "grid", gap: 10, background: "linear-gradient(135deg, rgba(13,79,60,0.94), rgba(27,94,32,0.88))", color: "white" }}>
        <span className="eyebrow" style={{ color: "rgba(255,255,255,0.74)" }}>Policies</span>
        <h1 className="section-title" style={{ margin: 0, fontSize: "clamp(2rem, 3.4vw, 3rem)" }}>Shipping, returns and privacy</h1>
        <div style={{ color: "rgba(255,255,255,0.82)" }}>Simple policies written for buyers, admins and customer support.</div>
      </div>
      <div className="card" style={{ padding: 24, display: "grid", gap: 16 }}>
        <div className="panel surface-soft" style={{ padding: 18, display: "grid", gap: 8 }}>
          <strong>Shipping</strong>
          <p className="subtitle" style={{ margin: 0 }}>Orders are usually processed within 2 to 4 business days. Delivery times vary by location.</p>
        </div>
        <div className="panel surface-soft" style={{ padding: 18, display: "grid", gap: 8 }}>
          <strong>Returns & Refunds</strong>
          <p className="subtitle" style={{ margin: 0 }}>{settings.refundPolicyText}</p>
          <p className="subtitle" style={{ margin: 0 }}>{settings.refundPolicyNorms}</p>
        </div>
        <div className="panel surface-soft" style={{ padding: 18, display: "grid", gap: 8 }}>
          <strong>Privacy</strong>
          <p className="subtitle" style={{ margin: 0 }}>User data is stored in MongoDB Atlas and should be protected with production environment secrets and access controls.</p>
        </div>
        <div className="panel surface-soft" style={{ padding: 18, display: "grid", gap: 8 }}>
          <strong>Terms</strong>
          <p className="subtitle" style={{ margin: 0 }}>Product usage should follow label instructions and physician guidance where applicable.</p>
        </div>
      </div>
    </div>
  );
}
