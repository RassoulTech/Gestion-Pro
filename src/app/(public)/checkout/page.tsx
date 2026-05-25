import type { Metadata } from "next";
import { CheckoutClient } from "./_components/checkout-client";

export const metadata: Metadata = { title: "Paiement — GestionPro" };

export default function CheckoutPage() {
  return <CheckoutClient />;
}
