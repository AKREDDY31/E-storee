import { ShieldCheck, Store, Wallet } from "lucide-react";
import { AuthForm } from "@/components/store/auth-form";

export function AdminAuthShell({
  mode,
  title
}: {
  mode: "login" | "register";
  title: string;
}) {
  return (
    <div className="container section" style={{ display: "grid", gap: 24, gridTemplateColumns: "1.05fr 0.95fr", alignItems: "stretch" }}>
      <div className="card" style={{ padding: 34, background: "linear-gradient(135deg, #103f2b, #0d4f3c)", color: "white", display: "grid", gap: 18 }}>
        <span className="pill" style={{ background: "rgba(255,255,255,0.12)", color: "white" }}>Admin Access</span>
        <h1 className="title" style={{ maxWidth: 560 }}>Run the store from one clean control panel.</h1>
        <p className="subtitle" style={{ color: "rgba(255,255,255,0.82)", margin: 0 }}>
          Manage products, stock, QR payments, order flow, announcements and customer activity from a private admin area.
        </p>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          {[
            { icon: Store, title: "Catalog control" },
            { icon: Wallet, title: "Payment updates" },
            { icon: ShieldCheck, title: "Protected access" }
          ].map((item) => (
            <div key={item.title} style={{ borderRadius: 20, background: "rgba(255,255,255,0.1)", padding: 18, display: "grid", gap: 8 }}>
              <item.icon size={18} />
              <strong>{item.title}</strong>
            </div>
          ))}
        </div>
      </div>
      <AuthForm mode={mode} role="admin" title={title} />
    </div>
  );
}
