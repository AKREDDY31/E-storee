"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers/cart-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { type ProductCardData } from "@/types";

export function AddToCartButton({
  product,
  whatsappNumber,
  customerAddress,
  productUrl
}: {
  product: ProductCardData;
  whatsappNumber: string;
  customerAddress?: string;
  productUrl: string;
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const { session } = useAuth();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <button
        className="button"
        type="button"
        onClick={() => {
          if (!session?.id) return router.push(`/login?redirect=/shop/${product.slug}`);
          addItem(product);
        }}
      >
        Add to Cart
      </button>
      <button
        className="button gold"
        type="button"
        onClick={() => {
          if (!session?.id) return router.push(`/login?redirect=/shop/${product.slug}`);
          addItem(product);
          router.push("/checkout");
        }}
      >
        Buy Now
      </button>
    </div>
  );
}
