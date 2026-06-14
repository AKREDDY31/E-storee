import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductImage } from "@/components/common/product-image";
import { AddToCartButton } from "@/components/store/product-detail-actions";
import { ProductRatingPanel } from "@/components/store/product-rating-panel";
import { getCurrentSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models";
import { getFreshProductBySlug, getFreshProducts, getStoreSettings } from "@/lib/queries";
import { buildWhatsAppOrderLink, formatAddressLine, formatCurrency } from "@/lib/utils";
import { type ProductCardData } from "@/types";

export default async function ProductPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getFreshProductBySlug(slug);
  const settings = await getStoreSettings();
  const session = await getCurrentSession();
  let customerAddress = "";

  if (session?.id) {
    try {
      await connectToDatabase();
      const user = await UserModel.findById(session.id).lean();
      customerAddress = formatAddressLine(user?.address);
    } catch {
      customerAddress = "";
    }
  }

  if (!product) notFound();

  const related = (await getFreshProducts({ category: product.category })).filter(
    (item: ProductCardData) => item.slug !== product.slug
  );

  return (
    <div className="container section" style={{ display: "grid", gap: 28 }}>
      <div className="card" style={{ padding: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        <div style={{ background: "var(--surface-alt)", borderRadius: 24, padding: 24, minHeight: 460 }}>
          <ProductImage src={product.imageUrl} alt={product.name} />
        </div>
        <div style={{ display: "grid", gap: 18 }}>
          <span className="pill">{product.category}</span>
          <div>
            <p style={{ margin: 0, color: "var(--muted)", fontWeight: 800 }}>{product.brand}</p>
            <h1 style={{ margin: "8px 0 0", fontSize: "2.4rem" }}>{product.name}</h1>
          </div>
          <p className="subtitle" style={{ margin: 0 }}>{product.description}</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <strong style={{ fontSize: 34 }}>{formatCurrency(product.price)}</strong>
            <span style={{ textDecoration: "line-through", color: "var(--muted)" }}>{formatCurrency(product.mrp)}</span>
            <span style={{ color: "var(--success)", fontWeight: 800 }}>{product.discountPercent}% OFF</span>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", color: "var(--muted)" }}>
            <span>Rating: {product.reviewCount && product.reviewCount > 0 ? product.rating?.toFixed(1) : "Not rated"}</span>
            <span>{product.reviewCount || 0} reviews</span>
            <span>{product.purchaseCount || 0} bought</span>
          </div>
          <div className="card" style={{ padding: 18, display: "grid", gap: 12, background: "white" }}>
            <strong>Payment options</strong>
            <span style={{ color: "var(--muted)" }}>Cash on Delivery available</span>
            <span style={{ color: "var(--muted)" }}>Online payment accepted with amount locked to {formatCurrency(product.price)}</span>
          </div>
          <ProductRatingPanel
            slug={product.slug}
            productName={product.name}
            currentRating={product.rating || 0}
            reviewCount={product.reviewCount || 0}
          />
          <AddToCartButton
            product={product}
            whatsappNumber={settings.whatsappNumber}
            customerAddress={customerAddress}
            productUrl={`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/shop/${product.slug}`}
          />
          <div style={{ display: "grid", gap: 8 }}>
            <strong>Benefits</strong>
            {product.benefits.map((benefit: string) => (
              <div key={benefit} style={{ color: "var(--muted)" }}>{benefit}</div>
            ))}
          </div>
          <Link
            className="button secondary"
            href={buildWhatsAppOrderLink(product.name, product.price, settings.whatsappNumber, {
              productUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/shop/${product.slug}`,
              customerAddress
            })}
          >
            Order on WhatsApp
          </Link>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>Specifications</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {Object.entries(product.specifications || {}).map(([key, value]) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
                <span style={{ color: "var(--muted)" }}>{key}</span>
                <strong>{String(value)}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>How to use</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {product.howToUse?.map((step: string) => (
              <div key={step} style={{ color: "var(--muted)" }}>{step}</div>
            ))}
          </div>
          <h3>Ingredients</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {product.ingredients?.map((ingredient: string) => (
              <div key={ingredient}>{ingredient}</div>
            ))}
          </div>
        </div>
      </div>

      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Related products</h2>
          <Link href="/shop">Explore all</Link>
        </div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {related.slice(0, 4).map((item: ProductCardData) => (
            <Link key={item.itemCode} href={`/shop/${item.slug}`} className="card" style={{ padding: 18, display: "grid", gap: 12 }}>
              <div style={{ aspectRatio: "1/1", background: "var(--surface-alt)", borderRadius: 18, overflow: "hidden" }}>
                <ProductImage src={item.imageUrl} alt={item.name} />
              </div>
              <strong>{item.name}</strong>
              <span style={{ color: "var(--muted)" }}>{formatCurrency(item.price)}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
