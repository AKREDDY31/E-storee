"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { type ProductCardData } from "@/types";

export function OfferBanner({ products }: { products: ProductCardData[] }) {
  const offerItems = [...products]
    .sort((a, b) => (b.mrp || b.price) - (a.mrp || a.price))
    .filter((p) => (p.mrp || p.price) > 200)
    .slice(0, 12)
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

  if (offerItems.length === 0) return null;

  return (
    <div className="offer-banner-shell" style={{ margin: "18px 0 0" }}>
      <div className="offer-banner-track">
        {scrollingOfferItems.map((item, index) => (
          <Link key={`${item.slug}-${index}`} href={`/shop/${item.slug}`} className="offer-banner-item">
            {item.imageUrl ? (
              <div style={{ height: 110, borderRadius: 12, overflow: "hidden", display: "grid", placeItems: "center" }}>
                <img src={item.imageUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ) : null}
            <div style={{ display: "grid", gap: 6 }}>
              <span className="pill" style={{ width: "fit-content" }}>30% OFF</span>
              <strong style={{ fontSize: 16, lineHeight: 1.2 }}>{item.name}</strong>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>{item.category}</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700 }}>Actual</span>
                <span style={{ color: "var(--muted)", textDecoration: "line-through", fontWeight: 700 }}>
                  {formatCurrency(item.basePrice)}
                </span>
                <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700 }}>Offer</span>
                <strong style={{ fontSize: 18, color: "var(--brand-deep)" }}>{formatCurrency(item.offerPrice)}</strong>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
