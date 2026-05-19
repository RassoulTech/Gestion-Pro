"use client";

import { motion } from "framer-motion";
import { Users, Target, Shield, Heart, Store, Rocket } from "lucide-react";
import Link from "next/link";

const EASE = [0.16, 1, 0.3, 1] as const;

const values = [
  {
    icon: Target,
    title: "Notre Vision",
    description: "Permettre à chaque commerçant d'Afrique de l'Ouest d'accéder à des outils de gestion modernes, intuitifs et puissants pour propulser leur croissance.",
  },
  {
    icon: Shield,
    title: "Fiabilité Absolue",
    description: "Nous construisons des technologies ultra-robustes sur lesquelles les entreprises peuvent compter chaque jour pour sécuriser leurs transactions et stocks.",
  },
  {
    icon: Heart,
    title: "Proximité client",
    description: "Nous sommes fiers de concevoir notre solution en pensant d'abord aux réalités et aux besoins des entrepreneurs locaux de la zone UEMOA.",
  },
];

const stats = [
  { value: "10K+", label: "Boutiques digitalisées" },
  { value: "15M+", label: "Ventes enregistrées" },
  { value: "99.9%", label: "Taux de disponibilité" },
];

export default function AboutPage() {
  return (
    <div className="relative pt-32 pb-24 overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-10 w-[400px] h-[400px] bg-violet-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-[400px] h-[400px] bg-emerald-600/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="container-app relative z-10 space-y-24">
        {/* --- Hero Section --- */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-black uppercase tracking-widest border border-violet-500/20">
              <Rocket className="h-3 w-3" /> Notre Histoire
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight"
          >
            Digitaliser le commerce pour <span className="bg-gradient-to-r from-violet-600 via-indigo-500 to-emerald-500 bg-clip-text text-transparent">libérer le potentiel</span> africain.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
            className="text-lg font-semibold text-zinc-500 dark:text-zinc-400 leading-relaxed"
          >
            GestionPro est né d&apos;un constat simple : la gestion d&apos;une boutique physique ou en ligne en Afrique de l&apos;Ouest ne devrait pas être un casse-tête quotidien.
          </motion.p>
        </div>

        {/* --- Key Metrics --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 p-12 rounded-3xl bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-xl shadow-xl"
        >
          {stats.map((s, idx) => (
            <div key={idx} className="text-center space-y-2">
              <p className="text-5xl font-black bg-gradient-to-r from-violet-600 to-emerald-500 bg-clip-text text-transparent">
                {s.value}
              </p>
              <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                {s.label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* --- Story Timeline & Narrative --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              Simplifier, connecter, automatiser.
            </h2>
            <div className="space-y-4 text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed">
              <p>
                Créé par des ingénieurs passionnés basés au Sénégal et en Côte d&apos;Ivoire, GestionPro répond à la complexité de la gestion manuelle. Du suivi de stock au grand livre des dépenses, nous éliminons les erreurs pour libérer votre temps.
              </p>
              <p>
                En intégrant un générateur de e-boutique en quelques clics et des outils de facturation professionnels adaptés à nos réalités fiscales, nous aidons les PME locales à se professionnaliser et à accroître leur rentabilité de façon exponentielle.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="relative p-8 rounded-3xl bg-gradient-to-tr from-violet-600/10 to-emerald-500/10 border border-violet-500/20 shadow-inner flex flex-col justify-center items-center h-[340px]"
          >
            <Store className="h-24 w-24 text-violet-600 dark:text-violet-400 animate-pulse mb-6" />
            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 text-center">
              Des milliers de marchands nous font confiance.
            </h3>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 text-center mt-2 max-w-sm">
              Des boutiques de prêt-à-porter de Dakar aux grossistes d&apos;Abidjan, GestionPro propulse l&apos;économie locale.
            </p>
          </motion.div>
        </div>

        {/* --- Core Values Grid --- */}
        <div className="space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              Nos Valeurs Fondamentales
            </h2>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Ce qui nous guide au quotidien pour concevoir la meilleure plateforme de commerce d&apos;Afrique.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v, idx) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1, ease: EASE }}
                  className="p-8 rounded-2xl bg-white/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-xl hover:border-violet-500/30 hover:shadow-lg transition-all space-y-4 group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/10 text-violet-600 dark:text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-inner">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                    {v.title}
                  </h3>
                  <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {v.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* --- CTA Section --- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="p-12 md:p-16 rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-700 text-white text-center space-y-8 relative overflow-hidden shadow-2xl"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-60" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Prêt à propulser la croissance de votre boutique ?
            </h2>
            <p className="text-base font-semibold text-violet-100 leading-relaxed">
              Rejoignez des milliers de marchands africains qui font confiance à GestionPro pour digitaliser et piloter leurs activités en toute simplicité.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-white px-8 text-base font-black text-violet-600 hover:bg-violet-50 hover:shadow-lg transition-all active:scale-[0.98]"
              >
                Créer mon compte
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-8 text-base font-black text-white hover:bg-white/20 transition-all active:scale-[0.98]"
              >
                Parler à un expert
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
