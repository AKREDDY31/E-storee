import { CatalogView } from "@/components/store/catalog-view";
import { getCurrentSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models";
import { getProducts, getStoreSettings } from "@/lib/queries";
import { formatAddressLine } from "@/lib/utils";

export default async function ShopPage() {
  const products = await getProducts();
  const settings = await getStoreSettings();
  const session = await getCurrentSession();
  let customerAddress = "";

  if (session?.id) {
    try {
      await connectToDatabase();
      const user = await UserModel.findById(session.id).lean();
      customerAddress = formatAddressLine(user?.address);
    } catch {
      customerAddress = "";
    }
  }

  return <CatalogView products={products} whatsappNumber={settings.whatsappNumber} customerAddress={customerAddress} />;
}
