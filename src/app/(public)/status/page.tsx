"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { CheckCircle2, Server, Database, MessageSquare, CreditCard, Activity } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

const serviceConfig = [
  { uptime: "99.98%", latency: "124ms", icon: Server },
  { uptime: "99.99%", latency: "86ms", icon: Activity },
  { uptime: "99.85%", latency: "320ms", icon: MessageSquare },
  { uptime: "100%", latency: "190ms", icon: CreditCard },
  { uptime: "99.99%", latency: "12ms", icon: Database },
];

export default function StatusPage() {
  const t = useTranslations("public.status");
  const serviceList = t.raw("services") as { name: string; desc: string }[];
  return (
    <div className="relative pt-32 pb-24 overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container-app relative z-10 max-w-4xl space-y-12">
        {/* --- Header Box --- */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="p-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-md"
        >
          <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 relative">
              <CheckCircle2 className="h-8 w-8" />
              <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-950 animate-ping" />
            </div>
            <div>
              <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                {t("allOperational")}
              </h1>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
                {t("lastCheck")}
              </p>
            </div>
          </div>
          <span className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20">
            {t("operationalBadge")}
          </span>
        </motion.div>

        {/* --- Services Grid --- */}
        <div className="space-y-6">
          <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">
            {t("servicesTitle")}
          </h2>

          <div className="space-y-4">
            {serviceConfig.map((ser, idx) => {
              const Icon = ser.icon;
              const info = serviceList[idx] ?? { name: "", desc: "" };
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.08, ease: EASE }}
                  className="p-6 rounded-3xl bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shadow-inner">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-zinc-900 dark:text-zinc-50 text-sm">
                        {info.name}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5">
                        {info.desc}
                      </p>
                    </div>
                  </div>

                  {/* Uptime bar visualizer */}
                  <div className="flex items-center gap-6 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
                    <div className="flex flex-col items-end text-right">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                        {t("operational")}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400 mt-0.5">
                        {t("uptimeLatency", { uptime: ser.uptime, latency: ser.latency })}
                      </span>
                    </div>

                    {/* Simulating uptime history bars */}
                    <div className="flex gap-0.5 h-6 items-end pointer-events-none">
                      {Array.from({ length: 18 }).map((_, barIdx) => {
                        const isSlightDrop = barIdx === 6 || barIdx === 14;
                        return (
                          <div
                            key={barIdx}
                            className={`w-1 rounded-full transition-all ${
                              isSlightDrop
                                ? "h-3 bg-emerald-500/40"
                                : "h-5 bg-emerald-500"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* --- Incident Logs --- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="p-8 rounded-3xl bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-xl shadow-sm space-y-4"
        >
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            {t("incidentsTitle")}
          </h3>
          <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
            {t("noIncidents")}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
