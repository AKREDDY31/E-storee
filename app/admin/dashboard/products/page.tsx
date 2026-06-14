import { AdminProductsClient } from "@/components/admin/admin-products-client";
import { getFreshProducts } from "@/lib/queries";

export default async function AdminProductsPage() {
  const products = await getFreshProducts();
  return <AdminProductsClient initialProducts={products} />;
}
