import Link from "next/link";
import { CATEGORY_ORDER, BRAND } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { type ProductCardData } from "@/types";
import { ProductCard } from "@/components/store/product-card";

export function HomeSections({
  products,
  whatsappNumber = BRAND.whatsapp,
  customerAddress,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
}: {
  products: ProductCardData[];
  whatsappNumber?: string;
  customerAddress?: string;
  siteUrl?: string;
}) {
  const featured = products.slice(0, 4);

  return (
    <>
      <section className="section">
        <div className="container" style={{ display: "grid", gap: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap" }}>
            <div>
              <span className="eyebrow">Best Sellers</span>
              <h2 style={{ margin: "8px 0 0", fontSize: "2.25rem" }}>Featured launch products</h2>
            </div>
            <Link href="/shop" style={{ color: "var(--brand-deep)", fontWeight: 800 }}>View all products</Link>
          </div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {featured.map((product) => (
              <ProductCard
                key={product.itemCode}
                product={product}
                whatsappNumber={whatsappNumber}
                customerAddress={customerAddress}
                productUrl={`${siteUrl}/shop/${product.slug}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ display: "grid", gap: 22 }}>
          <div>
            <span className="eyebrow">Categories</span>
            <h2 style={{ margin: "8px 0 0", fontSize: "2.25rem" }}>Browse by wellness need</h2>
          </div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            {CATEGORY_ORDER.map((category, index) => (
              <Link key={category} href={`/shop?category=${encodeURIComponent(category)}`} className="card" style={{ padding: 22, display: "grid", gap: 14, minHeight: 170, background: index % 2 === 0 ? "rgba(255,255,255,0.94)" : "linear-gradient(180deg, #fff8e1, #fffdf5)" }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(212,175,55,0.18)", display: "grid", placeItems: "center", fontWeight: 800, color: "var(--brand-deep)" }}>
                  {category.charAt(0)}
                </div>
                <strong style={{ fontSize: 18 }}>{category}</strong>
                <span style={{ color: "var(--muted)", lineHeight: 1.5 }}>Explore curated products with premium offers and easy checkout.</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container card" style={{ padding: 28, display: "grid", gap: 20 }}>
          <div>
            <span className="eyebrow">Why Vedics</span>
            <h2 style={{ margin: "8px 0 0", fontSize: "2.25rem" }}>Built for trust, clarity and repeat buyers</h2>
          </div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {[
              "Premium natural and ayurvedic wellness range",
              "Visible MRP, discount and final price at every stage",
              "WhatsApp ordering support for faster conversion",
              "COD and online payment flow with vendor QR support",
              "Customer-friendly tracking and refund workflow",
              `${BRAND.marketedBy} | ${BRAND.phone}`
            ].map((item) => (
              <div key={item} style={{ border: "1px solid var(--border)", borderRadius: 18, padding: 18, background: "white" }}>
                {item}
              </div>
            ))}
          </div>
          <div style={{ color: "var(--muted)" }}>Launch pricing starts from {formatCurrency(Math.min(...products.map((item) => item.price)))} with up to 30% off across the catalog.</div>
        </div>
      </section>
    </>
  );
}
