"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Target, Shield, Heart, Store, Rocket } from "lucide-react";
import Link from "next/link";

const EASE = [0.16, 1, 0.3, 1] as const;

const VALUE_ICONS = [Target, Shield, Heart];

export default function AboutPage() {
  const t = useTranslations("public.about");
  const values = (t.raw("values") as { title: string; description: string }[]).map((v, i) => ({
    ...v,
    icon: VALUE_ICONS[i] ?? Target,
  }));
  const stats = t.raw("stats") as { value: string; label: string }[];
  return (
    <div className="relative pt-32 pb-24 overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-10 w-[400px] h-[400px] bg-orange-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-[400px] h-[400px] bg-emerald-600/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="container-app relative z-10 space-y-24">
        {/* --- Hero Section --- */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-black uppercase tracking-widest border border-orange-500/20">
              <Rocket className="h-3 w-3" /> {t("eyebrow")}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight"
          >
            {t("titleLead")} <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-emerald-500 bg-clip-text text-transparent">{t("titleHighlight")}</span> {t("titleEnd")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
            className="text-lg font-semibold text-zinc-500 dark:text-zinc-400 leading-relaxed"
          >
            {t("subtitle")}
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
              <p className="text-5xl font-black bg-gradient-to-r from-orange-600 to-emerald-500 bg-clip-text text-transparent">
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
              {t("storyTitle")}
            </h2>
            <div className="space-y-4 text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed">
              <p>
                {t("storyP1")}
              </p>
              <p>
                {t("storyP2")}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="relative p-8 rounded-3xl bg-gradient-to-tr from-orange-600/10 to-emerald-500/10 border border-orange-500/20 shadow-inner flex flex-col justify-center items-center h-[340px]"
          >
            <Store className="h-24 w-24 text-orange-600 dark:text-orange-400 animate-pulse mb-6" />
            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 text-center">
              {t("trustTitle")}
            </h3>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 text-center mt-2 max-w-sm">
              {t("trustText")}
            </p>
          </motion.div>
        </div>

        {/* --- Core Values Grid --- */}
        <div className="space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("valuesTitle")}
            </h2>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              {t("valuesSubtitle")}
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
                  className="p-8 rounded-2xl bg-white/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-xl hover:border-orange-500/30 hover:shadow-lg transition-all space-y-4 group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-600/10 text-orange-600 dark:text-orange-400 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-inner">
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
          className="p-12 md:p-16 rounded-3xl bg-gradient-to-tr from-orange-600 to-orange-700 text-white text-center space-y-8 relative overflow-hidden shadow-2xl"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-60" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              {t("ctaTitle")}
            </h2>
            <p className="text-base font-semibold text-orange-100 leading-relaxed">
              {t("ctaText")}
            </p>
            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-white px-8 text-base font-black text-orange-600 hover:bg-orange-50 hover:shadow-lg transition-all active:scale-[0.98]"
              >
                {t("ctaCreate")}
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-8 text-base font-black text-white hover:bg-white/20 transition-all active:scale-[0.98]"
              >
                {t("ctaExpert")}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
