"use client";

import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
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

type QA = { q: string; a: string };

export function FAQ() {
  const t = useTranslations("landing.faq");
  const faqs = t.raw("items") as QA[];
  return (
    <Section id="faq" tone="muted" size="lg">
      <SectionHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
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
            key={qa.q}
            variants={itemVariants}
          >
            <details className="group [&_summary::-webkit-details-marker]:hidden border-b border-border last:border-none">
              <summary
                className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-7"
              >
                <span className="text-base font-medium text-foreground">
                  {qa.q}
                </span>
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-transform duration-200 group-open:rotate-45 group-open:border-brand group-open:text-brand"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
              </summary>
              <div className="px-6 pb-6 pr-14 text-sm leading-relaxed text-muted-foreground sm:px-7">
                {qa.a}
              </div>
            </details>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
