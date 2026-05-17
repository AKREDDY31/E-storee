import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/providers/cart-provider";
import { AuthProvider } from "@/components/providers/auth-provider";

export const metadata: Metadata = {
  title: "Vedics.online | Natural Living Store",
  description:
    "Ayurvedic products, wellness essentials, honey, tonics, hair care and trusted natural living products."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
