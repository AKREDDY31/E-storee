"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { ProductCard } from "@/components/store/product-card";
import { CATEGORY_ORDER } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { type ProductCardData } from "@/types";

export function CatalogView({
  products,
  whatsappNumber,
  customerAddress
}: {
  products: ProductCardData[];
  whatsappNumber: string;
  customerAddress?: string;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [priceLimit, setPriceLimit] = useState(2000);

  const filtered = useMemo(() => {
    const base = products.filter((product) => {
      const matchesSearch = `${product.name} ${product.description} ${product.brand}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesCategory = category === "All" || product.category === category;
      const matchesPrice = product.price <= priceLimit;
      return matchesSearch && matchesCategory && matchesPrice;
    });

    return base.sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "discount") return b.discountPercent - a.discountPercent;
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });
  }, [category, priceLimit, products, search, sort]);

  return (
    <div className="container section" style={{ display: "grid", gap: 28 }}>
      <div className="card" style={{ padding: 28, display: "grid", gap: 20, background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(247,244,238,0.94))" }}>
        <div style={{ display: "grid", gap: 10 }}>
          <span className="eyebrow">Filters</span>
          <h1 className="section-title" style={{ fontSize: "clamp(2rem, 3.6vw, 3.3rem)" }}>Find the right wellness product</h1>
          <p className="subtitle" style={{ margin: 0, maxWidth: 760 }}>
            Browse by category, search by product name, and sort by price or offer value.
          </p>
        </div>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" style={inputStyle} />
          <select value={category} onChange={(event) => setCategory(event.target.value)} style={inputStyle}>
            <option>All</option>
            {CATEGORY_ORDER.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value)} style={inputStyle}>
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="discount">Best Discount</option>
          </select>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ color: "var(--muted)", fontSize: 14 }}>Max price: {formatCurrency(priceLimit)}</span>
            <input type="range" min="50" max="2000" value={priceLimit} onChange={(event) => setPriceLimit(Number(event.target.value))} />
          </label>
        </div>
      </div>

      <div className="panel surface-soft" style={{ padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <strong>{filtered.length} products found</strong>
        <span className="muted">Secure checkout, COD and online payment available</span>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 34, textAlign: "center", display: "grid", gap: 10 }}>
          <strong>No products match these filters.</strong>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            The admin can add or publish products from the dashboard and they will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {filtered.map((product) => (
            <ProductCard
              key={product.itemCode}
              product={product}
              whatsappNumber={whatsappNumber}
              customerAddress={customerAddress}
              productUrl={`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/shop/${product.slug}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle: CSSProperties = {
  height: 48,
  borderRadius: 14,
  border: "1px solid var(--border)",
  padding: "0 14px",
  background: "rgba(255,255,255,0.96)"
};
