import { AdminProductsClient } from "@/components/admin/admin-products-client";
import { getProducts } from "@/lib/queries";

export default async function AdminProductsPage() {
  const products = await getProducts();
  return <AdminProductsClient initialProducts={products} />;
}
