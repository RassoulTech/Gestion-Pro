import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { FeaturesGrid } from "@/components/marketing/features-grid";
import { Personas } from "@/components/marketing/personas";
import { PricingSection } from "@/components/marketing/pricing-section";
import { Testimonials } from "@/components/marketing/testimonials";
import { FAQ } from "@/components/marketing/faq";
import { ContactSection } from "@/components/marketing/contact-section";
import { CTAFinal } from "@/components/marketing/cta-final";

export const metadata: Metadata = {
  title: "GestionPro — La plateforme tout-en-un pour les commerçants africains",
  description:
    "Gérez vos boutiques, votre stock, vos ventes, vos clients et vos fournisseurs depuis une seule plateforme. Pensé pour le Sénégal, la Côte d'Ivoire et le Mali.",
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <FeaturesGrid />
      <Personas />
      <PricingSection />
      <Testimonials />
      <FAQ />
      <ContactSection />
      <CTAFinal />
    </>
  );
}
