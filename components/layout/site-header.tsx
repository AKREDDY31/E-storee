"use client";

import Link from "next/link";
import { Menu, ShoppingCart, User2 } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { LogoutButton } from "@/components/shared/logout-button";

export function SiteHeader({
  brandName
}: {
  brandName: string;
}) {
  const { count } = useCart();
  const { session } = useAuth();
  const homeHref = session?.role === "user" ? "/shop" : session?.role === "admin" ? "/admin/dashboard" : "/";

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 30, backdropFilter: "blur(18px)", background: "rgba(252, 251, 248, 0.88)", borderBottom: "1px solid rgba(221, 211, 196, 0.7)" }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", gap: 16 }}>
        <Link href={homeHref} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 16, background: "linear-gradient(135deg, var(--accent), #f1c14f)", display: "grid", placeItems: "center", color: "#543c00", fontWeight: 900 }}>V</div>
          <div>
            <div style={{ fontWeight: 900 }}>{brandName}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Natural Living Store</div>
          </div>
        </Link>

        <nav className="hidden-mobile" style={{ display: "flex", gap: 18, color: "var(--muted)", alignItems: "center" }}>
          <Link href="/shop">Shop</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/track-order">Track Order</Link>
          {session?.role === "user" ? <Link href="/account/orders">My Orders</Link> : null}
          {session?.role === "admin" ? <Link href="/admin/dashboard">Dashboard</Link> : null}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {session?.subscriptionStatus === "verified" ? <span className="pill hidden-mobile">Subscriber</span> : session?.subscriptionStatus === "pending" ? <span className="pill hidden-mobile">Pending</span> : null}
          {session?.role === "user" ? (
            <Link href="/subscription" className="button secondary" style={{ height: 42, padding: "0 14px", borderRadius: 14 }}>
              Subscribe
            </Link>
          ) : null}
          <Link href={session ? "/account" : "/"} aria-label="User account" style={{ width: 42, height: 42, borderRadius: 14, border: "1px solid var(--border)", display: "grid", placeItems: "center", background: "white" }}>
            <User2 size={18} />
          </Link>
          {session ? <LogoutButton label="Logout" redirectTo={session.role === "admin" ? "/admin/login" : "/"} /> : null}
          <Link href="/cart" aria-label="Cart" style={{ width: 42, height: 42, borderRadius: 14, border: "1px solid var(--border)", display: "grid", placeItems: "center", background: "white", position: "relative" }}>
            <ShoppingCart size={18} />
            {count > 0 ? (
              <span style={{ position: "absolute", top: -4, right: -4, width: 22, height: 22, borderRadius: 999, background: "var(--brand)", color: "white", fontSize: 12, display: "grid", placeItems: "center", fontWeight: 800 }}>{count}</span>
            ) : null}
          </Link>
          <button type="button" aria-label="Menu" className="hidden-mobile" style={{ display: "none" }}>
            <Menu />
          </button>
        </div>
      </div>
    </header>
  );
}
