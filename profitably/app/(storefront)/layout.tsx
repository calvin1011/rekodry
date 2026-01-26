import { CartProvider } from '@/lib/cart-context'
import React from "react";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CartProvider>{children}</CartProvider>
}