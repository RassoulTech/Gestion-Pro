"use client";

import { motion } from "framer-motion";
import { Scale, FileText, ArrowRight } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

const sections = [
  { id: "editeur", title: "1. Éditeur de la plateforme" },
  { id: "publication", title: "2. Direction de la publication" },
  { id: "hebergeur", title: "3. Hébergeur du site" },
  { id: "activite", title: "4. Réglementation d'activité" },
  { id: "propriete", title: "5. Propriété intellectuelle" },
  { id: "responsabilite", title: "6. Responsabilité limitée" },
];

export default function MentionsLegalesPage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="relative pt-32 pb-24 overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-1/4 right-10 w-[300px] h-[300px] bg-emerald-600/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="container-app relative z-10 space-y-16">
        {/* --- Hero Section --- */}
        <div className="max-w-3xl space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest border border-emerald-500/20">
              <Scale className="h-3 w-3" /> Informations Légales
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            Mentions Légales
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
            className="text-sm font-semibold text-zinc-500 dark:text-zinc-400"
          >
            Dernière mise à jour : 19 Mai 2026. Conformément à la législation sur la confiance dans l&apos;économie numérique.
          </motion.p>
        </div>

        {/* --- Main Document Layout --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Sticky Index */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
            className="lg:col-span-4 lg:sticky lg:top-28 space-y-6 hidden lg:block"
          >
            <div className="p-6 rounded-3xl bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-xl shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" /> Table des matières
              </h3>
              <ul className="space-y-2">
                {sections.map((sec) => (
                  <li key={sec.id}>
                    <button
                      onClick={() => scrollToSection(sec.id)}
                      className="text-left text-xs font-bold text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 transition-colors py-1 flex items-center gap-1.5 group"
                    >
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-emerald-500" />
                      {sec.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </motion.aside>

          {/* Right Column: Actual Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
            className="lg:col-span-8 p-8 md:p-12 rounded-3xl bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-xl shadow-md space-y-8 text-zinc-600 dark:text-zinc-300 font-semibold leading-relaxed text-sm"
          >
            <section id="editeur" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                1. Éditeur de la plateforme
              </h2>
              <p>
                Le site internet et l&apos;application SaaS GestionPro sont édités et exploités par la société **RassoulTech S.U.A.R.L.**, entreprise technologique au capital social de 1 000 000 FCFA, dont le siège social est situé à : Mermoz Pyrotechnie, Dakar, Sénégal.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>**NINEA** : 008945623 2B2</li>
                <li>**Registre du Commerce (RCCM)** : SN-DKR-2025-B-12345</li>
                <li>**Contact e-mail** : contact@gestionpro.africa</li>
              </ul>
            </section>

            <section id="publication" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                2. Direction de la publication
              </h2>
              <p>
                Le Directeur de la publication de la plateforme (site web, blog, e-boutiques publiques et applications de gestion) est **Mouhamadou Rassoul**, en sa qualité de Fondateur et Gérant de la société RassoulTech S.U.A.R.L.
              </p>
            </section>

            <section id="hebergeur" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                3. Hébergeur du site
              </h2>
              <p>
                L&apos;infrastructure logicielle et les services d&apos;hébergement cloud de GestionPro sont fournis par :
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>**Vercel Inc.** (pour l&apos;hébergement de l&apos;application frontend React/Next.js) situé au 340 S Lemon Ave #4133, Walnut, CA 91789, USA.</li>
                <li>**Amazon Web Services (AWS)** (pour l&apos;hébergement hautement sécurisé des bases de données) dans leurs centres de données de la région Europe (Paris / Francfort).</li>
              </ul>
            </section>

            <section id="activite" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                4. Réglementation d&apos;activité
              </h2>
              <p>
                L&apos;activité de RassoulTech est soumise aux réglementations de l&apos;Union Économique et Monétaire Ouest Africaine (UEMOA) relatives au commerce électronique, ainsi qu&apos;aux directives du Ministère de l&apos;Économie Numérique et des Télécommunications du Sénégal.
              </p>
            </section>

            <section id="propriete" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                5. Propriété intellectuelle
              </h2>
              <p>
                L&apos;intégralité des marques, logos, conceptions graphiques, illustrations et codes sources apparaissant sur le site et l&apos;application de gestion sont protégés au titre du droit d&apos;auteur et de la propriété intellectuelle de l&apos;OAPI (Organisation Africaine de la Propriété Intellectuelle). Toute reproduction non expressément autorisée constitue une contrefaçon passible de sanctions pénales.
              </p>
            </section>

            <section id="responsabilite" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                6. Responsabilité limitée
              </h2>
              <p>
                RassoulTech s&apos;efforce d&apos;assurer l&apos;exactitude des informations diffusées sur le site. Toutefois, RassoulTech ne saurait être tenue pour responsable des omissions, des inexactitudes ou des retards de mise à jour. L&apos;utilisation des outils de calcul (stocks, taxes, rapports financiers) s&apos;effectue sous la seule responsabilité du Client marchand.
              </p>
            </section>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
