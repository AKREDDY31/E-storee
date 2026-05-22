import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getStoreSettings } from "@/lib/queries";

export async function StoreLayout({ children }: { children: ReactNode }) {
  const settings = await getStoreSettings();
  return (
    <div className="page-shell">
      {settings.announcementText ? (
        <div style={{ background: "linear-gradient(90deg, #d4af37, #f6d56d)", color: "#2f2a10", overflow: "hidden", whiteSpace: "nowrap", fontWeight: 800, fontSize: 14 }}>
          <div style={{ display: "inline-block", padding: "10px 0", animation: "ticker 18s linear infinite" }}>
            {settings.announcementText} {" • "} {settings.announcementText}
          </div>
        </div>
      ) : null}
      <SiteHeader brandName={settings.brandName} siteLogoUrl={settings.siteLogoUrl} />
      <main>{children}</main>
      <SiteFooter settings={settings} />
    </div>
  );
}
