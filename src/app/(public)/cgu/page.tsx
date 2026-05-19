"use client";

import { motion } from "framer-motion";
import { Scale, FileText, ArrowRight } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

const sections = [
  { id: "acceptation", title: "1. Acceptation des conditions" },
  { id: "services", title: "2. Description des services" },
  { id: "comptes", title: "3. Création et sécurité des comptes" },
  { id: "abonnements", title: "4. Abonnements et facturation" },
  { id: "responsabilite", title: "5. Responsabilité et garanties" },
  { id: "donnees", title: "6. Données personnelles et sécurité" },
  { id: "propriete", title: "7. Propriété intellectuelle" },
  { id: "loi", title: "8. Loi applicable et juridiction" },
];

export default function CGUPage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="relative pt-32 pb-24 overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-1/4 left-10 w-[300px] h-[300px] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="container-app relative z-10 space-y-16">
        {/* --- Hero Section --- */}
        <div className="max-w-3xl space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest border border-blue-500/20">
              <Scale className="h-3 w-3" /> Cadre Juridique
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            Conditions Générales d&apos;Utilisation (CGU)
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
            className="text-sm font-semibold text-zinc-500 dark:text-zinc-400"
          >
            Dernière mise à jour : 19 Mai 2026. Veuillez lire attentivement ces conditions avant d&apos;utiliser notre plateforme.
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
                <FileText className="h-4 w-4 text-blue-600" /> Table des matières
              </h3>
              <ul className="space-y-2">
                {sections.map((sec) => (
                  <li key={sec.id}>
                    <button
                      onClick={() => scrollToSection(sec.id)}
                      className="text-left text-xs font-bold text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors py-1 flex items-center gap-1.5 group"
                    >
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-blue-500" />
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
            <section id="acceptation" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                1. Acceptation des conditions
              </h2>
              <p>
                En accédant et en utilisant la plateforme GestionPro, éditée par RassoulTech, vous acceptez sans réserve d&apos;être lié par les présentes Conditions Générales d&apos;Utilisation. Si vous n&apos;acceptez pas ces conditions, veuillez cesser immédiatement l&apos;utilisation de notre site et de nos services.
              </p>
            </section>

            <section id="services" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                2. Description des services
              </h2>
              <p>
                GestionPro est un progiciel de gestion intégré (SaaS) destiné aux commerçants d&apos;Afrique de l&apos;Ouest. Il propose des outils de facturation (calcul de TVA), de suivi et d&apos;alertes de stock, de gestion des dépenses et fournisseurs, de création rapide d&apos;e-boutiques, ainsi que de rapports analytiques avancés.
              </p>
            </section>

            <section id="comptes" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                3. Création et sécurité des comptes
              </h2>
              <p>
                Pour utiliser la plateforme, vous devez créer un compte valide en fournissant des informations exactes. Vous êtes entièrement responsable du maintien de la confidentialité de vos identifiants (email et mot de passe) et de toutes les activités générées sous votre compte. Toute utilisation suspecte doit nous être notifiée sans délai.
              </p>
            </section>

            <section id="abonnements" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                4. Abonnements et facturation
              </h2>
              <p>
                L&apos;accès complet à GestionPro est soumis à la souscription d&apos;un abonnement payant (mensuel ou annuel). Les tarifs sont indiqués en Francs CFA (FCFA) et sont hors taxes, sauf mention contraire. Le paiement s&apos;effectue par carte bancaire ou via les réseaux Mobile Money partenaires de la zone UEMOA.
              </p>
            </section>

            <section id="responsabilite" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                5. Responsabilité et garanties
              </h2>
              <p>
                GestionPro s&apos;efforce d&apos;assurer un taux de disponibilité de 99.9%. Toutefois, nous ne saurions être tenus responsables des interruptions momentanées pour maintenance ou des pannes réseau indépendantes de notre volonté. De plus, les données financières calculées par nos outils de facturation doivent être vérifiées par le commerçant avant toute déclaration fiscale officielle.
              </p>
            </section>

            <section id="donnees" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                6. Données personnelles et sécurité
              </h2>
              <p>
                Nous attachons une importance capitale à la protection de vos données commerciales et personnelles. Vos bases de données de clients, ventes et fournisseurs sont cryptées et stockées de manière hautement sécurisée. Conformément aux lois locales (telles que la CDP au Sénégal), vous disposez d&apos;un droit total d&apos;accès, de modification et de suppression de vos données.
              </p>
            </section>

            <section id="propriete" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                7. Propriété intellectuelle
              </h2>
              <p>
                Tous les éléments constitutifs de la plateforme (code source, interfaces graphiques, logos, marques, textes) sont la propriété exclusive de RassoulTech. Toute reproduction, distribution ou modification non autorisée de nos actifs numériques est formellement interdite.
              </p>
            </section>

            <section id="loi" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                8. Loi applicable et juridiction
              </h2>
              <p>
                Les présentes CGU sont régies par le droit en vigueur dans la zone UEMOA, et plus spécifiquement par la législation du Sénégal. Tout litige relatif à l&apos;interprétation ou l&apos;exécution des présentes qui ne pourrait être résolu à l&apos;amiable sera soumis à la compétence exclusive des tribunaux de Dakar.
              </p>
            </section>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
