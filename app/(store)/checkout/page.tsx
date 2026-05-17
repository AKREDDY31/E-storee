import { getStoreSettings } from "@/lib/queries";
import { CheckoutClient } from "@/components/store/checkout-client";

export default async function CheckoutPage() {
  const settings = await getStoreSettings();
  return <CheckoutClient settings={settings} />;
}
