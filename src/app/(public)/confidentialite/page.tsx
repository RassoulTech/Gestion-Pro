"use client";

import { motion } from "framer-motion";
import { Scale, FileText, ArrowRight } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

const sections = [
  { id: "donnees-collectees", title: "1. Données collectées" },
  { id: "utilisation", title: "2. Utilisation des données" },
  { id: "propriete-marchand", title: "3. Propriété absolue des données" },
  { id: "securite", title: "4. Protocoles de sécurité" },
  { id: "partage", title: "5. Partage avec des tiers" },
  { id: "cookies", title: "6. Politique relative aux cookies" },
  { id: "droits", title: "7. Vos droits (CDP zone UEMOA)" },
  { id: "contact", title: "8. Nous contacter" },
];

export default function ConfidentialitePage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="relative pt-32 pb-24 overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-1/4 left-10 w-[300px] h-[300px] bg-violet-600/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="container-app relative z-10 space-y-16">
        {/* --- Hero Section --- */}
        <div className="max-w-3xl space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-black uppercase tracking-widest border border-violet-500/20">
              <Scale className="h-3 w-3" /> Protection de la Vie Privée
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            Politique de Confidentialité
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
            className="text-sm font-semibold text-zinc-500 dark:text-zinc-400"
          >
            Dernière mise à jour : 19 Mai 2026. Chez GestionPro, la sécurité et la confidentialité de vos données commerciales sont notre priorité absolue.
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
                <FileText className="h-4 w-4 text-violet-600" /> Table des matières
              </h3>
              <ul className="space-y-2">
                {sections.map((sec) => (
                  <li key={sec.id}>
                    <button
                      onClick={() => scrollToSection(sec.id)}
                      className="text-left text-xs font-bold text-zinc-500 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400 transition-colors py-1 flex items-center gap-1.5 group"
                    >
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-violet-500" />
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
            <section id="donnees-collectees" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                1. Données collectées
              </h2>
              <p>
                Dans le cadre de l&apos;utilisation de la plateforme, nous collectons les données d&apos;inscription nécessaires (nom de la boutique, adresse email, mot de passe chiffré, numéro de téléphone portable). Nous hébergeons également les données nécessaires au fonctionnement de vos modules (articles de stock, ventes, clients, dépenses, et configurations de facturation).
              </p>
            </section>

            <section id="utilisation" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                2. Utilisation des données
              </h2>
              <p>
                Vos données sont strictement utilisées pour assurer le bon fonctionnement technique de vos services : génération automatique de factures conformes, calcul d&apos;alertes de stock, mise à disposition de votre boutique publique e-commerce en ligne, et production de graphiques analytiques détaillés.
              </p>
            </section>

            <section id="propriete-marchand" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                3. Propriété absolue des données
              </h2>
              <p>
                RassoulTech applique une règle fondamentale : **les données hébergées vous appartiennent à 100%**. Nous ne commercialisons, ne louons, n&apos;analysons ni ne vendons jamais l&apos;historique de vos transactions commerciales ou vos portefeuilles clients à des tiers. Vous êtes l&apos;unique propriétaire de vos bases de données.
              </p>
            </section>

            <section id="securite" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                4. Protocoles de sécurité
              </h2>
              <p>
                Toutes les communications entre vos navigateurs et nos serveurs s&apos;effectuent via des tunnels de chiffrement HTTPS de niveau industriel (SSL/TLS 1.3). Vos mots de passe sont hachés de manière irréversible via l&apos;algorithme bcrypt. Nos infrastructures de bases de données bénéficient de sauvegardes quotidiennes automatiques.
              </p>
            </section>

            <section id="partage" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                5. Partage avec des tiers
              </h2>
              <p>
                Aucune donnée n&apos;est partagée à l&apos;exception de nos passerelles de paiement partenaires (afin de valider et sécuriser vos transactions d&apos;abonnement en ligne) et de nos serveurs d&apos;envois d&apos;emails transactionnels. Ces intermédiaires sont tenus par des engagements stricts de non-divulgation.
              </p>
            </section>

            <section id="cookies" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                6. Politique relative aux cookies
              </h2>
              <p>
                Nous utilisons uniquement des cookies techniques essentiels pour maintenir votre état de connexion actif d&apos;une page à l&apos;autre, sécuriser vos formulaires contre les attaques CSRF, et mémoriser vos préférences d&apos;affichage (par exemple, le mode sombre). Nous n&apos;utilisons aucun cookie de ciblage publicitaire intrusif.
              </p>
            </section>

            <section id="droits" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                7. Vos droits (CDP zone UEMOA)
              </h2>
              <p>
                Conformément aux réglementations sur la protection des données personnelles applicables en zone CEDEAO/UEMOA (dont la loi sur la Commission de protection des Données Personnelles - CDP au Sénégal), vous disposez d&apos;un droit de regard complet sur vos informations. Vous pouvez à tout moment exporter ou supprimer vos données de nos serveurs.
              </p>
            </section>

            <section id="contact" className="space-y-3 scroll-mt-24">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                8. Nous contacter
              </h2>
              <p>
                Pour toute question ou demande de support relative à la gestion et au traitement de vos données personnelles, vous pouvez adresser un message à notre délégué à la protection des données (DPO) par email à : **dionemhd1@gmail.com**.
              </p>
            </section>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
