import type { Metadata } from "next";
import { CheckoutClient } from "./_components/checkout-client";
import { PaytechSandboxBadge } from "@/components/payments/paytech-sandbox-badge";

export const metadata: Metadata = { title: "Paiement — GestionPro" };

export default function CheckoutPage() {
  return (
    <>
      <CheckoutClient />
      <PaytechSandboxBadge />
    </>
  );
}
