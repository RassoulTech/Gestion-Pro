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
    <Section id="fonctionnalites" tone="default" size="xl" className="relative overflow-hidden">
      {/* Decorative Glow Spotlights */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-violet-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/3 right-0 w-96 h-96 bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none" />

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

      <div className="mt-16 grid grid-cols-1 md:grid-cols-6 md:grid-rows-2 gap-6">
        {/* Large Feature: POS */}
        <BentoCard
          className="md:col-span-4 md:row-span-1"
          icon={<Zap className="w-6 h-6 text-violet-600 dark:text-violet-400" />}
          title="POS Caisses Ultra-Rapide"
          description="Enregistrez vos ventes en un éclair. Synchronisation instantanée avec votre stock et votre comptabilité, même hors-ligne."
          visual={<POSVisual />}
          accentColor="rgba(124, 58, 237, 0.15)"
        />

        {/* Medium Feature: Stock */}
        <BentoCard
          className="md:col-span-2 md:row-span-1"
          icon={<Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          title="Gestion des Stocks"
          description="Alertes automatiques de rupture, inventaires précis et traçabilité complète des mouvements de marchandises."
          visual={<StockVisual />}
          accentColor="rgba(16, 185, 129, 0.15)"
        />

        {/* Medium Feature: Multi-boutiques */}
        <BentoCard
          className="md:col-span-2 md:row-span-1"
          icon={<Store className="w-6 h-6 text-sky-600 dark:text-sky-400" />}
          title="Multi-boutiques"
          description="Pilotez et centralisez tous vos points de vente physiques et dépôts depuis un tableau de bord unifié."
          visual={<MultiStoreVisual />}
          accentColor="rgba(14, 165, 233, 0.15)"
        />

        {/* Medium Feature: Marketplace */}
        <BentoCard
          className="md:col-span-4 md:row-span-1"
          icon={<Globe className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
          title="Marketplace Intégré"
          description="Déployez votre vitrine en ligne en un clic. Vos clients locaux commandent directement, vous encaissez et livrez."
          visual={<MarketplaceVisual />}
          accentColor="rgba(245, 158, 11, 0.15)"
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
  className,
  accentColor = "rgba(124, 58, 237, 0.1)"
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  visual?: React.ReactNode;
  className?: string;
  accentColor?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: EASE }}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 p-8 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all duration-500 backdrop-blur-xl shadow-lg hover:shadow-2xl hover:shadow-violet-600/[0.02]",
        className
      )}
    >
      {/* Dynamic Background Glow Effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0"
        style={{
          background: `radial-gradient(max(300px, 60%) circle at 50% 120%, ${accentColor}, transparent)`
        }}
      />

      <div className="relative z-10">
        <div className="mb-5 inline-flex items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 p-3.5 border border-zinc-200/30 dark:border-zinc-700/30 group-hover:scale-110 group-hover:bg-white dark:group-hover:bg-zinc-800 group-hover:shadow-md transition-all duration-500">
          {icon}
        </div>
        <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 mb-2.5 flex items-center gap-2">
          {title}
          <ArrowUpRight className="w-4.5 h-4.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
        </h3>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed max-w-sm font-semibold">
          {description}
        </p>
      </div>

      {visual && (
        <div className="relative h-44 mt-6 overflow-hidden rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/30 dark:border-zinc-850 z-10">
          {visual}
        </div>
      )}

      {/* Edge border hover glow */}
      <div className="absolute inset-0 border border-transparent rounded-3xl group-hover:border-violet-600/10 dark:group-hover:border-violet-400/10 pointer-events-none transition-colors duration-500" />
    </motion.div>
  );
}

function POSVisual() {
  return (
    <div className="absolute inset-0 flex flex-col justify-end p-4">
      {/* Glassmorphic simulated POS interface */}
      <div className="w-full bg-white/70 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-200/40 dark:border-zinc-800/40 p-3 space-y-2.5 shadow-lg shadow-black/[0.02]">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-2">
          <div className="h-3.5 w-24 bg-violet-600/10 dark:bg-violet-400/10 rounded-md animate-pulse" />
          <span className="text-[10px] font-black text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">Panier</span>
        </div>
        <div className="space-y-1.5">
          {[
            { label: "Riz Parfumé 5kg", qty: "1x", price: "4 500 F" },
            { label: "Huile de Palme 1L", qty: "2x", price: "3 000 F" }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ x: -10, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.2 }}
              className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300"
            >
              <span className="truncate">{item.label}</span>
              <span className="text-[10px] text-zinc-400 font-semibold">{item.qty}</span>
              <span className="font-extrabold">{item.price}</span>
            </motion.div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/50 text-xs font-black">
          <span className="text-zinc-500">Total</span>
          <span className="text-zinc-900 dark:text-zinc-50 text-sm">7 500 FCFA</span>
        </div>
      </div>
    </div>
  );
}

function StockVisual() {
  const bars = [35, 75, 50, 95, 60, 80];
  return (
    <div className="absolute inset-0 flex items-end justify-between px-6 pb-4">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          custom={h}
          variants={{
            hover: { height: `${h}%` },
            initial: { height: "15%" }
          }}
          initial="initial"
          whileInView="hover"
          viewport={{ once: true }}
          transition={{
            type: "spring",
            stiffness: 70,
            damping: 15,
            delay: i * 0.1
          }}
          className={cn(
            "w-7 rounded-t-lg bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 dark:border-emerald-500/10 hover:bg-emerald-500/20 transition-colors relative group",
          )}
        >
          {/* Top light glow bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 rounded-t-lg" />
        </motion.div>
      ))}
    </div>
  );
}

function MultiStoreVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-4 px-6">
      {[
        { name: "Dakar", value: "Actif", bg: "bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400" },
        { name: "Abidjan", value: "Actif", bg: "bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400" }
      ].map((store, i) => (
        <motion.div
          key={store.name}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: i * 0.2 }}
          className={cn(
            "flex flex-col p-3 rounded-2xl border backdrop-blur-md w-28 text-center space-y-1 shadow-md shadow-black/[0.01]",
            store.bg
          )}
        >
          <Store className="h-5 w-5 mx-auto opacity-80" />
          <span className="text-xs font-black">{store.name}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest bg-white/60 dark:bg-zinc-950/60 px-1.5 py-0.5 rounded-full inline-block">
            {store.value}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function MarketplaceVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="flex gap-4 rotate-6 scale-95 opacity-80">
        {[
          { title: "Basket Air Run", price: "24 000 F", scale: "scale-100" },
          { title: "Montre Chrono", price: "35 000 F", scale: "translate-y-4 scale-95" }
        ].map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -8, rotate: -2 }}
            className={cn(
              "w-32 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-2.5 shadow-xl transition-all duration-300",
              item.scale
            )}
          >
            <div className="h-16 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 mb-2 overflow-hidden flex items-center justify-center">
              <Store className="h-6 w-6 text-zinc-300 dark:text-zinc-700" />
            </div>
            <div className="text-[10px] font-black text-zinc-900 dark:text-zinc-50 truncate">{item.title}</div>
            <div className="text-[9px] text-brand font-extrabold mt-0.5">{item.price}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
