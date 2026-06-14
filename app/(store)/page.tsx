import { HomeAuthClient } from "@/components/store/home-auth-client";
import { getFreshProducts } from "@/lib/queries";

export default async function HomePage() {
  const products = await getFreshProducts();
  return <HomeAuthClient products={products} />;
}
