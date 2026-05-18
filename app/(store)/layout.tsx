import type { ReactNode } from "react";
import { StoreLayout } from "@/components/layout/store-layout";

export const dynamic = "force-dynamic";

export default function PublicStoreLayout({
  children
}: {
  children: ReactNode;
}) {
  return <StoreLayout>{children}</StoreLayout>;
}
