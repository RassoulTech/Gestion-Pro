"use client";

import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Section, SectionHeader } from "./section";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0, 0, 0.2, 1] as const },
  },
};

type QA = { question: string; answer: string };

const faqs: QA[] = [
  {
    question: "Combien de temps dure l'essai gratuit ?",
    answer:
      "L'offre Starter est gratuite à vie pour 1 boutique. L'offre Pro inclut un essai gratuit sans carte bancaire — vous ne payez que si vous décidez de continuer.",
  },
  {
    question: "GestionPro fonctionne-t-il avec une connexion lente ?",
    answer:
      "Oui. L'application est optimisée pour les réseaux 3G/4G instables grâce à un chargement fluide des données et une compression des échanges réseau. Vos données restent sécurisées et accessibles.",
  },
  {
    question: "Puis-je l'utiliser sur mon téléphone ?",
    answer:
      "Le dashboard et le POS sont pleinement mobile. Cibles tactiles ≥ 44 px, drawers latéraux, sticky actions — le tout pensé d'abord pour smartphone, puis adapté au desktop.",
  },
  {
    question: "Quelles devises sont supportées ?",
    answer:
      "F CFA (XOF) par défaut, Euro (EUR) et Dollar US (USD) au besoin. Vous pouvez configurer la devise par boutique, et les rapports consolidés sont disponibles dans la devise de votre choix.",
  },
  {
    question: "Mes données sont-elles en sécurité ?",
    answer:
      "Chiffrement TLS pour toutes les communications, sauvegardes automatiques quotidiennes, isolation stricte par boutique et par compte. Aucun accès tiers à vos données. Conformité RGPD pour les utilisateurs européens.",
  },
  {
    question: "Puis-je changer de plan plus tard ?",
    answer:
      "Oui, à tout moment, sans frais. L'upgrade est immédiat ; le downgrade s'applique au prochain cycle de facturation. Aucune perte de données en cas de changement.",
  },
];

export function FAQ() {
  return (
    <Section id="faq" tone="muted" size="lg">
      <SectionHeader
        eyebrow="Questions fréquentes"
        title="Tout ce que vous voulez savoir."
        subtitle="Une question qui n'y est pas ? Écrivez à support@gestionpro.app, on répond en moins de 24 h."
      />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={container}
        className="mx-auto mt-14 max-w-3xl divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card"
      >
        {faqs.map((qa) => (
          <motion.div
            key={qa.question}
            variants={itemVariants}
          >
            <details className="group [&_summary::-webkit-details-marker]:hidden border-b border-border last:border-none">
              <summary
                className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-7"
              >
                <span className="text-base font-medium text-foreground">
                  {qa.question}
                </span>
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-transform duration-200 group-open:rotate-45 group-open:border-brand group-open:text-brand"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
              </summary>
              <div className="px-6 pb-6 pr-14 text-sm leading-relaxed text-muted-foreground sm:px-7">
                {qa.answer}
              </div>
            </details>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
