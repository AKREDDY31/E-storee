import Link from "next/link";
import { type StoreSettings } from "@/types";

export function SiteFooter({ settings }: { settings: StoreSettings }) {
  return (
    <footer style={{ background: "linear-gradient(180deg, #173d24 0%, #0d4f3c 100%)", color: "white", marginTop: 64 }}>
      <div className="container" style={{ padding: "42px 0", display: "grid", gap: 28 }}>
        <div style={{ display: "grid", gap: 12 }}>
          <strong style={{ fontSize: 22 }}>{settings.brandName}</strong>
          <span style={{ color: "rgba(255,255,255,0.78)" }}>{settings.tagline}</span>
          <span style={{ color: "rgba(255,255,255,0.78)" }}>Marketed by Vedics, Madanapalle, AP</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, color: "rgba(255,255,255,0.86)" }}>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/policies">Shipping & Policies</Link>
          <Link href="/track-order">Order Tracking</Link>
          <Link href="/account">My Account</Link>
          <Link href="/admin/login">Admin</Link>
        </div>
        <small style={{ color: "rgba(255,255,255,0.64)" }}>
          {settings.businessAddress} | {settings.supportPhone}
        </small>
      </div>
    </footer>
  );
}
