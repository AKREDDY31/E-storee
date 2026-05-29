import type { ReactNode } from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { LogoutButton } from "@/components/shared/logout-button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  await requireRole("admin");

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #f6f8f4 0%, #eef3ee 100%)" }}>
      <div className="container" style={{ padding: "24px 0 34px", display: "grid", gap: 20, gridTemplateColumns: "260px minmax(0, 1fr)" }}>
        <aside className="panel surface-soft" style={{ padding: 18, alignSelf: "start", position: "sticky", top: 18 }}>
          <div className="stack" style={{ gap: 10 }}>
            <div style={{ padding: 14, borderRadius: 16, background: "rgba(13, 79, 60, 0.08)", display: "grid", gap: 4 }}>
              <strong>Admin Workspace</strong>
              <span className="muted" style={{ fontSize: 13 }}>Products, orders, refunds, users and store settings</span>
            </div>
            <Link className="nav-link" href="/admin/dashboard">Overview</Link>
            <Link className="nav-link" href="/admin/dashboard/products">Products</Link>
            <Link className="nav-link" href="/admin/dashboard/orders">Orders</Link>
            <Link className="nav-link" href="/admin/dashboard/refunds">Refunds</Link>
            <Link className="nav-link" href="/admin/dashboard/users">Users</Link>
            <Link className="nav-link" href="/admin/dashboard/notifications">Notifications</Link>
            <Link className="nav-link" href="/admin/dashboard/settings">Settings</Link>
            <Link className="nav-link" href="/">View Store</Link>
            <div style={{ paddingTop: 8 }}>
              <LogoutButton label="Logout admin" redirectTo="/admin/login" />
            </div>
          </div>
        </aside>
        <main style={{ minWidth: 0 }}>{children}</main>
      </div>
    </div>
  );
}
