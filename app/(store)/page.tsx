import { HomeAuthClient } from "@/components/store/home-auth-client";
import { getProducts } from "@/lib/queries";

export default async function HomePage() {
  const products = await getProducts();
  return <HomeAuthClient products={products} />;
}
