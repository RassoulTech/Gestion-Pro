/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import {
  Store,
  Zap,
  Package,
 
  Users,
 
  BarChart3,
  Globe,
  ArrowUpRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Section, SectionHeader } from "./section";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export function FeaturesGrid() {
  return (
    <Section id="fonctionnalites" tone="default" size="xl">
      <SectionHeader
        eyebrow="Puissance & Simplicité"
        title={
          <>
            Une plateforme conçue pour <br />
            <span className="text-shimmer">la croissance.</span>
          </>
        }
        subtitle="Oubliez les fichiers Excel et les carnets. Passez au niveau supérieur avec des outils professionnels."
      />

      <div className="mt-16 grid grid-cols-1 md:grid-cols-6 md:grid-rows-2 gap-4 lg:gap-6">
        {/* Large Feature: POS */}
        <BentoCard
          className="md:col-span-4 md:row-span-1"
          icon={<Zap className="w-6 h-6 text-brand" />}
          title="POS Ultra-Rapide"
          description="Enregistrez vos ventes en un éclair. Synchronisation instantanée avec votre stock et votre comptabilité."
          visual={<POSVisual />}
        />

        {/* Medium Feature: Stock */}
        <BentoCard
          className="md:col-span-2 md:row-span-1"
          icon={<Package className="w-6 h-6 text-info" />}
          title="Gestion des Stocks"
          description="Alertes de rupture, mouvements précis et inventaires simplifiés."
          visual={<StockVisual />}
        />

        {/* Medium Feature: Multi-boutiques */}
        <BentoCard
          className="md:col-span-2 md:row-span-1"
          icon={<Store className="w-6 h-6 text-success" />}
          title="Multi-boutiques"
          description="Gérez tous vos points de vente depuis un tableau de bord unique."
        />

        {/* Medium Feature: Marketplace */}
        <BentoCard
          className="md:col-span-4 md:row-span-1"
          icon={<Globe className="w-6 h-6 text-warning" />}
          title="Marketplace Intégré"
          description="Vendez vos produits en ligne sans effort. Vos clients commandent, vous livrez."
          visual={<MarketplaceVisual />}
        />
      </div>
    </Section>
  );
}

function BentoCard({ 
  title, 
  description, 
  icon, 
  visual, 
  className 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  visual?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: EASE }}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-border bg-card p-8 flex flex-col justify-between hover:border-brand/40 transition-colors duration-500",
        className
      )}
    >
      <div className="relative z-10">
        <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-foreground/5 p-3 group-hover:scale-110 transition-transform duration-500">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
          {title}
          <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
          {description}
        </p>
      </div>

      {visual && (
        <div className="absolute inset-0 z-0 pointer-events-none translate-y-12 group-hover:translate-y-8 transition-transform duration-700">
          {visual}
        </div>
      )}

      {/* Decorative gradient */}
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-brand/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </motion.div>
  );
}

function POSVisual() {
  return (
    <div className="absolute bottom-0 right-0 w-[60%] h-full opacity-20 group-hover:opacity-40 transition-opacity">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-linear-to-br from-brand/20 to-transparent blur-2xl" />
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 rounded-lg bg-foreground/10 border border-foreground/5" />
        ))}
      </div>
    </div>
  );
}

function StockVisual() {
  return (
    <div className="absolute bottom-0 left-0 w-full p-6 opacity-20 group-hover:opacity-40 transition-opacity">
      <div className="flex items-end gap-1 h-20">
        {[40, 70, 45, 90, 65].map((h, i) => (
          <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-info/40 rounded-t-sm" />
        ))}
      </div>
    </div>
  );
}

function MarketplaceVisual() {
  return (
    <div className="absolute top-1/2 right-4 -translate-y-1/2 flex gap-4 rotate-12 scale-110 opacity-10 group-hover:opacity-30 transition-all duration-700">
      <div className="w-24 h-32 rounded-xl bg-foreground/10 border border-foreground/5 shadow-2xl" />
      <div className="w-24 h-32 rounded-xl bg-foreground/10 border border-foreground/5 shadow-2xl translate-y-8" />
    </div>
  );
}
