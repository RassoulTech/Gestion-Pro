import type { Metadata } from "next";
import { CartClient } from "./_components/cart-client";

export const metadata: Metadata = { title: "Panier — GestionPro" };

export default function PanierPage() {
  return <CartClient />;
}
