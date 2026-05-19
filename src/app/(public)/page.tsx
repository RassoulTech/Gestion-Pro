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
  title: "GestionPro — L'intelligence commerciale au service de votre réussite",
  description:
    "La plateforme d'excellence pour piloter votre commerce en Afrique. Gestion de stock en temps réel, facturation intelligente, multi-boutiques et comptabilité simplifiée.",
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
