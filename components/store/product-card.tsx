"use client";

import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";
import { ProductImage } from "@/components/common/product-image";
import { useCart } from "@/components/providers/cart-provider";
import { buildWhatsAppOrderLink, formatCurrency, getProductPricing } from "@/lib/utils";
import { type ProductCardData } from "@/types";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";

export function ProductCard({
  product,
  whatsappNumber,
  customerAddress,
  productUrl
}: {
  product: ProductCardData;
  whatsappNumber: string;
  customerAddress?: string;
  productUrl: string;
}) {
  const { addItem } = useCart();
  const { session } = useAuth();
  const router = useRouter();
  const isSubscriber = session?.subscriptionStatus === "verified";
  const pricing = getProductPricing(product, isSubscriber);
  const cartProduct = { ...product, ...pricing };

  return (
    <article className="card" style={{ overflow: "hidden", background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(247,244,238,0.96))" }}>
      <Link href={`/shop/${product.slug}`} style={{ display: "grid", gap: 16 }}>
        <div style={{ aspectRatio: "1 / 1", padding: 18, background: "var(--surface-alt)" }}>
          <ProductImage src={product.imageUrl} alt={product.name} />
        </div>
      </Link>
      <div style={{ padding: 20, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span className="pill">{product.category}</span>
          <span style={{ color: "var(--muted)", fontSize: 14, display: "inline-flex", gap: 4, alignItems: "center" }}>
            <Star size={14} fill={product.reviewCount && product.reviewCount > 0 ? "currentColor" : "none"} /> {product.reviewCount && product.reviewCount > 0 ? product.rating?.toFixed(1) : "-"}
          </span>
        </div>
        <div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 13, fontWeight: 700 }}>{product.brand}</p>
          <Link href={`/shop/${product.slug}`} style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.35 }}>{product.name}</Link>
        </div>
        <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6, minHeight: 72 }}>{product.description}</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 28 }}>{formatCurrency(pricing.price)}</strong>
          <span style={{ color: "var(--muted)", textDecoration: "line-through" }}>{formatCurrency(product.mrp)}</span>
          <span style={{ color: "var(--success)", fontWeight: 800 }}>{pricing.discountPercent}% OFF</span>
          {isSubscriber && pricing.price < product.price ? (
            <span className="pill">Subscriber price</span>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", color: "var(--muted)", fontSize: 14 }}>
          <span>{product.reviewCount || 0} reviews</span>
          <span>{product.purchaseCount || 0} bought</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button
            className="button"
            type="button"
            onClick={() => {
              if (!session?.id) return router.push(`/login?redirect=/shop/${product.slug}`);
              addItem(cartProduct);
            }}
          >
            <ShoppingBag size={18} />
            Add to cart
          </button>
          <Link
            className="button secondary"
            href={buildWhatsAppOrderLink(product.name, pricing.price, whatsappNumber, { productUrl, customerAddress })}
          >
            WhatsApp
          </Link>
        </div>
      </div>
    </article>
  );
}
