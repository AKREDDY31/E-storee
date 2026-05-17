import { redirect } from "next/navigation";
import { SubscriptionClient } from "@/components/store/subscription-client";
import { getCurrentSession } from "@/lib/auth";
import { getStoreSettings } from "@/lib/queries";

export default async function SubscriptionPage() {
  const session = await getCurrentSession();
  if (!session || session.role !== "user") {
    redirect("/login");
  }

  const settings = await getStoreSettings();
  return <SubscriptionClient settings={settings} amount={500} />;
}