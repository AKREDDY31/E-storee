"use client";

import Link from "next/link";
import { useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const navigationItems = [
    { href: "/shop", label: "Shop" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/track-order", label: "Track Order" },
    session?.role === "user" ? { href: "/account/orders", label: "My Orders" } : null,
    session?.role === "admin" ? { href: "/admin/dashboard", label: "Dashboard" } : null
  ].filter(Boolean) as Array<{ href: string; label: string }>;

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href={homeHref} className="brand-link" onClick={closeMenu}>
          <div style={{ width: 44, height: 44, borderRadius: 16, background: "linear-gradient(135deg, var(--accent), #f1c14f)", display: "grid", placeItems: "center", color: "#543c00", fontWeight: 900 }}>V</div>
          <div>
            <div className="brand-name">{brandName}</div>
            <div className="brand-subtitle">Natural Living Store</div>
          </div>
        </Link>

        <nav className="desktop-nav">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>{item.label}</Link>
          ))}
        </nav>

        <div className="header-actions">
          {session?.subscriptionStatus === "verified" ? <span className="pill desktop-chip">Subscriber</span> : session?.subscriptionStatus === "pending" ? <span className="pill desktop-chip">Pending</span> : null}
          {session?.role === "user" ? (
            <Link href="/subscription" className="button secondary header-action-button">
              Subscribe
            </Link>
          ) : null}
          <Link href={session ? "/account" : "/"} aria-label="User account" className="icon-button">
            <User2 size={18} />
          </Link>
          {session ? <LogoutButton label="Logout" redirectTo={session.role === "admin" ? "/admin/login" : "/"} /> : null}
          <Link href="/cart" aria-label="Cart" className="icon-button icon-button--cart">
            <ShoppingCart size={18} />
            {count > 0 ? (
              <span className="cart-count">{count}</span>
            ) : null}
          </Link>
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
            className="mobile-menu-button"
          >
            <Menu />
          </button>
        </div>
      </div>

      <div className={`mobile-drawer ${menuOpen ? "open" : ""}`}>
        <div className="container mobile-drawer-inner">
          <div className="mobile-drawer-links">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={closeMenu} className="mobile-drawer-link">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mobile-drawer-actions">
            {session?.subscriptionStatus === "verified" ? <span className="pill">Subscriber</span> : session?.subscriptionStatus === "pending" ? <span className="pill">Pending</span> : null}
            {session?.role === "user" ? (
              <Link href="/subscription" className="button secondary" onClick={closeMenu}>
                Subscribe
              </Link>
            ) : null}
            {session ? <LogoutButton label="Logout" redirectTo={session.role === "admin" ? "/admin/login" : "/"} /> : null}
          </div>
        </div>
      </div>
    </header>
  );
}
