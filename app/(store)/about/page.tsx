export default function AboutPage() {
  return (
    <div className="container section" style={{ display: "grid", gap: 20 }}>
      <div className="card" style={{ padding: 26, display: "grid", gap: 10, background: "linear-gradient(135deg, rgba(13,79,60,0.94), rgba(27,94,32,0.88))", color: "white" }}>
        <span className="eyebrow" style={{ color: "rgba(255,255,255,0.74)" }}>About Vedics.online</span>
        <h1 className="section-title" style={{ margin: 0, fontSize: "clamp(2rem, 3.4vw, 3rem)" }}>A natural living store built for trust-first buying.</h1>
        <div style={{ color: "rgba(255,255,255,0.82)" }}>Ayurvedic care, wellness essentials and a customer experience designed to stay clear from browse to delivery.</div>
      </div>
      <div className="card" style={{ padding: 28, display: "grid", gap: 14 }}>
        <p className="subtitle" style={{ margin: 0 }}>
          Vedics.online brings ayurvedic wellness, hair care, natural skin care, diabetes support products and everyday herbal essentials into one mobile-friendly storefront.
        </p>
        <p className="subtitle" style={{ margin: 0 }}>
          The site is designed for public customers, village and city buyers, COD users, and repeat wellness shoppers who need clarity in product information, price visibility and order updates.
        </p>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {[
            "Clear pricing and discounts",
            "Mobile-friendly shopping",
            "COD and online payments"
          ].map((item) => (
            <div key={item} className="panel surface-soft" style={{ padding: 16, borderRadius: 18 }}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
