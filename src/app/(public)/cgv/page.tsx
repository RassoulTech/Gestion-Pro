"use client";

import { motion } from "framer-motion";
import { Scale, FileText, ArrowRight } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

const sections = [
  { id: "objet", title: "1. Objet des CGV" },
  { id: "tarifs", title: "2. Tarifs et devises" },
  { id: "commandes", title: "3. Commande et activation" },
  { id: "paiement", title: "4. Modalités de paiement" },
  { id: "retractation", title: "5. Rétractation et remboursement" },
  { id: "support", title: "6. Support et maintenance technique" },
  { id: "resiliation", title: "7. Résiliation de l'abonnement" },
  { id: "litiges", title: "8. Règlement des litiges" },
];

export default function CGVPage() {
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
              <Scale className="h-3 w-3" /> Conditions de Vente
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            Conditions Générales de Vente (CGV)
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
            className="text-sm font-semibold text-zinc-500 dark:text-zinc-400"
          >
            Dernière mise à jour : 19 Mai 2026. Ces conditions encadrent l&apos;achat d&apos;abonnements sur GestionPro.
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
            <section id="objet" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                1. Objet des CGV
              </h2>
              <p>
                Les présentes Conditions Générales de Vente régissent la relation contractuelle entre RassoulTech (éditeur de GestionPro) et toute personne physique ou morale (ci-après &quot;le Client&quot;) souscrivant à un abonnement à notre progiciel en mode SaaS.
              </p>
            </section>

            <section id="tarifs" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                2. Tarifs et devises
              </h2>
              <p>
                Les tarifs de nos abonnements (Gratuit, Basique, Premium) sont fermes et définitifs. Ils sont exprimés en Francs CFA (FCFA) et sont affichés hors taxes. RassoulTech se réserve le droit de modifier ses tarifs à tout moment. Toutefois, le Client restera facturé au tarif en vigueur au moment de sa souscription pour la durée initiale de son abonnement.
              </p>
            </section>

            <section id="commandes" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                3. Commande et activation
              </h2>
              <p>
                L&apos;activation des services s&apos;effectue immédiatement après la validation du paiement en ligne. Un email de confirmation récapitulant les termes de la souscription et contenant la facture correspondante est envoyé instantanément à l&apos;adresse email de gestion associée au compte.
              </p>
            </section>

            <section id="paiement" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                4. Modalités de paiement
              </h2>
              <p>
                Le règlement des abonnements s&apos;effectue en ligne via les réseaux sécurisés de nos partenaires agréés par la BCEAO. Les moyens de paiement acceptés sont les cartes bancaires Visa et Mastercard, ainsi que les principaux services de Mobile Money opérationnels dans la zone UEMOA (Wave, Orange Money, MTN MoMo, Moov Money).
              </p>
            </section>

            <section id="retractation" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                5. Rétractation et remboursement
              </h2>
              <p>
                S&apos;agissant de la fourniture d&apos;un contenu numérique en ligne immédiatement accessible, et conformément aux usages du commerce électronique de services SaaS, le Client renonce expressément à son droit de rétractation dès l&apos;activation de son compte. Aucun remboursement partiel ou total ne sera accordé en cours d&apos;utilisation, sauf défaillance technique majeure imputable à GestionPro et non résolue sous 7 jours ouvrés.
              </p>
            </section>

            <section id="support" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                6. Support et maintenance technique
              </h2>
              <p>
                Le Client bénéficie d&apos;un support technique accessible via ticket de support, WhatsApp ou email. RassoulTech s&apos;engage à apporter une réponse qualifiée sous 24 heures pour toute anomalie bloquante affectant l&apos;utilisation quotidienne de la facturation ou de la gestion de stock.
              </p>
            </section>

            <section id="resiliation" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                7. Résiliation de l&apos;abonnement
              </h2>
              <p>
                Le Client peut résilier son abonnement à tout moment directement depuis ses paramètres de facturation dans le dashboard GestionPro. La résiliation prend effet à la fin de la période de facturation en cours. Les données du Client restent disponibles en export sous format Excel/CSV pendant une période de 90 jours après la fin effective de l&apos;abonnement.
              </p>
            </section>

            <section id="litiges" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                8. Règlement des litiges
              </h2>
              <p>
                Toute réclamation doit d&apos;abord être soumise au service client à l&apos;adresse **dionemhd1@gmail.com**. À défaut de résolution amiable sous 30 jours, le litige sera tranché exclusivement par les tribunaux compétents de Dakar, Sénégal, sous l&apos;application stricte du droit sénégalais et de l&apos;OHADA.
              </p>
            </section>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
