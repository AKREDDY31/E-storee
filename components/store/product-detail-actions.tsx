"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers/cart-provider";
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

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <button className="button" type="button" onClick={() => addItem(product)}>
        Add to Cart
      </button>
      <button
        className="button gold"
        type="button"
        onClick={() => {
          addItem(product);
          router.push("/checkout");
        }}
      >
        Buy Now
      </button>
    </div>
  );
}
