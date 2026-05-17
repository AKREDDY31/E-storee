"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { type CartItem, type ProductCardData } from "@/types";

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (product: ProductCardData) => void;
  removeItem: (slug: string) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const storageKey = session?.role === "user" ? `vedics_cart_${session.id}` : null;

  useEffect(() => {
    if (!storageKey) {
      setItems([]);
      window.localStorage.removeItem("vedics_cart");
      return;
    }

    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      setItems([]);
      return;
    }

    try {
      setItems(JSON.parse(raw));
    } catch {
      setItems([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const value = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      items,
      count,
      total,
      addItem(product: ProductCardData) {
        setItems((current) => {
          const existing = current.find((item) => item.slug === product.slug);
          if (existing) {
            return current.map((item) =>
              item.slug === product.slug ? { ...item, quantity: item.quantity + 1 } : item
            );
          }
          return [...current, { ...product, quantity: 1 }];
        });
      },
      removeItem(slug: string) {
        setItems((current) => current.filter((item) => item.slug !== slug));
      },
      updateQuantity(slug: string, quantity: number) {
        setItems((current) =>
          current
            .map((item) => (item.slug === slug ? { ...item, quantity } : item))
            .filter((item) => item.quantity > 0)
        );
      },
      clearCart() {
        setItems([]);
      }
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error("useCart must be used within CartProvider");
  }
  return value;
}
