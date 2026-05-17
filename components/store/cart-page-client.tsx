"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { formatCurrency } from "@/lib/utils";

export function CartPageClient() {
  const { items, total, removeItem, updateQuantity } = useCart();
  const shipping = items.reduce((sum, item) => sum + (typeof item.deliveryPrice === "number" ? item.deliveryPrice : 60) * item.quantity, 0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <div className="container section" style={{ display: "grid", gap: 24 }}>
      <div className="card" style={{ padding: 26, display: "grid", gap: 10, background: "linear-gradient(135deg, rgba(13,79,60,0.94), rgba(27,94,32,0.88))", color: "white" }}>
        <span className="eyebrow" style={{ color: "rgba(255,255,255,0.74)" }}>Cart</span>
        <h1 className="section-title" style={{ margin: 0, fontSize: "clamp(2rem, 3.4vw, 3rem)" }}>Your cart</h1>
        <div style={{ color: "rgba(255,255,255,0.82)" }}>Review quantities, total amount and move to checkout when ready.</div>
      </div>
      {items.length === 0 ? (
        <div className="card" style={{ padding: 28, display: "grid", gap: 12 }}>
          <strong>Your cart is empty.</strong>
          <Link href="/shop" className="button" style={{ width: "fit-content" }}>
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1.3fr) minmax(300px, 0.7fr)", alignItems: "start" }}>
          <div className="card" style={{ padding: 24, display: "grid", gap: 18 }}>
            {items.map((item) => (
              <div key={item.slug} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 18, borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
                <div style={{ display: "grid", gap: 8 }}>
                  <strong>{item.name}</strong>
                  <span style={{ color: "var(--muted)" }}>{formatCurrency(item.price)} each</span>
                </div>
                <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                  <input
                    type="number"
                    min={1}
                    value={drafts[item.slug] ?? String(item.quantity)}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [item.slug]: event.target.value
                      }))
                    }
                    onBlur={() => {
                      const raw = drafts[item.slug];
                      const next = raw === undefined || raw === "" ? item.quantity : Math.max(1, Number(raw));
                      updateQuantity(item.slug, next);
                      setDrafts((current) => {
                        const clone = { ...current };
                        delete clone[item.slug];
                        return clone;
                      });
                    }}
                    style={{ width: 72, height: 42, borderRadius: 12, border: "1px solid var(--border)", padding: "0 10px" }}
                  />
                  <button type="button" onClick={() => removeItem(item.slug)} style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer" }}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 24, display: "grid", gap: 16, position: "sticky", top: 20 }}>
            <strong>Order summary</strong>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Subtotal</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Shipping</span>
              <strong>{formatCurrency(shipping)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20 }}>
              <span>Total</span>
              <strong>{formatCurrency(total + shipping)}</strong>
            </div>
            <Link href="/checkout" className="button">
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
