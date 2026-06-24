import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CheckoutClient } from "./_components/checkout-client";
import { PaytechSandboxBadge } from "@/components/payments/paytech-sandbox-badge";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout");
  return { title: t("metaTitle") };
}

export default function CheckoutPage() {
  return (
    <>
      <CheckoutClient />
      <PaytechSandboxBadge />
    </>
  );
}
