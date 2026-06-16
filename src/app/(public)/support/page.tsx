"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, HelpCircle, ChevronDown, BookOpen, CreditCard, ShoppingBag, Settings, PhoneCall } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

const categories = [
  { id: "getting-started", label: "Démarrage", icon: Settings },
  { id: "stock", label: "Gestion de Stock", icon: BookOpen },
  { id: "billing", label: "Facturation & TVA", icon: CreditCard },
  { id: "eboutique", label: "E-Boutique", icon: ShoppingBag },
];

const faqs = [
  {
    category: "getting-started",
    question: "Comment créer ma première boutique sur GestionPro ?",
    answer: "Après votre inscription, cliquez sur 'Créer une boutique' depuis votre tableau de bord central. Saisissez le nom de votre boutique, choisissez votre devise (par défaut le FCFA pour la zone UEMOA), puis sélectionnez votre secteur d'activité parmi notre liste enrichie. Votre espace de gestion est instantanément configuré !",
  },
  {
    category: "getting-started",
    question: "Puis-je gérer plusieurs boutiques physiques avec un seul compte ?",
    answer: "Oui ! La formule Premium de GestionPro vous permet de piloter jusqu'à 5 boutiques distinctes depuis un unique compte. Vous pouvez basculer d'une boutique à l'autre en un clic depuis le menu déroulant en haut de votre tableau de bord, sans avoir à vous reconnecter.",
  },
  {
    category: "stock",
    question: "Comment fonctionne le système d'alerte de stock bas ?",
    answer: "Pour chaque produit ajouté à votre catalogue, vous pouvez définir un 'Seuil d'alerte'. Dès que la quantité disponible en stock est inférieure ou égale à ce seuil suite à des ventes, une notification visuelle s'affiche en rouge sur votre tableau de bord pour vous éviter toute rupture de stock.",
  },
  {
    category: "stock",
    question: "Puis-je importer mon catalogue produit depuis un fichier Excel ?",
    answer: "Absolument. Depuis le module 'Stocks', cliquez sur 'Importer' et téléchargez notre modèle de fichier Excel/CSV standard. Remplissez les colonnes (Désignation, Prix d'achat, Prix de vente, Quantité, Seuil) puis importez-le pour configurer tout votre catalogue en quelques secondes.",
  },
  {
    category: "billing",
    question: "Comment activer le calcul automatique de la TVA UEMOA à 18% ?",
    answer: "Lors de la création de vos factures ou devis, cochez l'option 'Appliquer la TVA (18%)'. Notre algorithme calcule instantanément le montant HT, le montant de la TVA ainsi que le TTC total en Francs CFA, assurant une parfaite conformité avec la réglementation fiscale en vigueur.",
  },
  {
    category: "billing",
    question: "Puis-je exporter mes factures et dépenses pour mon comptable ?",
    answer: "Oui, tous vos journaux de ventes, de factures émises et de dépenses enregistrées sont exportables en un clic au format standard Excel/CSV ou PDF. Ces documents sont structurés de manière à simplifier la tenue de votre comptabilité de fin de mois.",
  },
  {
    category: "eboutique",
    question: "Comment ma boutique en ligne est-elle créée ?",
    answer: "Dès que vous ajoutez des produits dans votre catalogue et activez l'option 'Boutique en ligne', GestionPro génère automatiquement un site web e-commerce public pour votre marque. Vos clients locaux peuvent parcourir vos produits, remplir leur panier et soumettre leurs commandes directement vers votre WhatsApp !",
  },
  {
    category: "eboutique",
    question: "Comment lier mon propre nom de domaine personnalisé ?",
    answer: "Les abonnés Premium peuvent associer leur propre nom de domaine (ex: maboutique.com). Rendez-vous dans Paramètres > E-Boutique, saisissez votre nom de domaine puis configurez les enregistrements DNS (CNAME et A) indiqués. Notre équipe s'occupe de l'installation du certificat SSL gratuit sous 24h.",
  },
];

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("getting-started");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    // If there is a search query, bypass category restriction to find answers everywhere
    return searchQuery ? matchesSearch : (matchesCategory && matchesSearch);
  });

  return (
    <div className="relative pt-32 pb-24 overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/4 left-10 w-[400px] h-[400px] bg-orange-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-[400px] h-[400px] bg-emerald-600/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="container-app relative z-10 space-y-16">
        {/* --- Hero / Search --- */}
        <div className="text-center max-w-2xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-black uppercase tracking-widest border border-orange-500/20">
              <HelpCircle className="h-3 w-3" /> Centre d&apos;aide
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight"
          >
            Comment pouvons-nous <br />
            <span className="bg-gradient-to-r from-orange-600 to-emerald-500 bg-clip-text text-transparent">vous aider ?</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
            className="relative max-w-lg mx-auto mt-4"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher une question, une fonctionnalité..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-6 rounded-2xl bg-white/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 text-base font-semibold outline-none transition-all placeholder:text-zinc-400 shadow-lg"
            />
          </motion.div>
        </div>

        {/* --- Category Selector (Hidden if searching) --- */}
        {!searchQuery && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.08, ease: EASE }}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setExpandedIndex(null);
                  }}
                  className={`p-6 rounded-3xl border flex flex-col items-center text-center gap-3 transition-all duration-300 ${
                    isActive
                      ? "bg-orange-600 text-white shadow-xl shadow-orange-600/20 border-orange-600"
                      : "bg-white/40 dark:bg-zinc-900/40 border-zinc-200/50 dark:border-zinc-800/50 text-zinc-600 dark:text-zinc-400 hover:border-orange-500/30"
                  }`}
                >
                  <div className={`p-3 rounded-2xl ${isActive ? "bg-white/20 text-white" : "bg-orange-500/10 text-orange-600"}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider">{cat.label}</span>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* --- Dynamic Accordions List --- */}
        <div className="max-w-3xl mx-auto space-y-4">
          <AnimatePresence mode="wait">
            {filteredFaqs.length > 0 ? (
              <motion.div
                key={activeCategory + searchQuery}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="space-y-4"
              >
                {filteredFaqs.map((faq, idx) => {
                  const isExpanded = expandedIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl shadow-sm overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                        className="w-full p-6 text-left flex items-center justify-between gap-4 font-black text-zinc-900 dark:text-zinc-50 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                      >
                        <span className="text-base leading-tight">{faq.question}</span>
                        <ChevronDown className={`h-5 w-5 text-zinc-400 shrink-0 transition-transform duration-300 ${isExpanded ? "rotate-180 text-orange-500" : ""}`} />
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.3, ease: EASE }}
                          >
                            <div className="px-6 pb-6 pt-1 text-sm font-semibold text-zinc-500 dark:text-zinc-400 border-t border-zinc-100/50 dark:border-zinc-800/50 leading-relaxed">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <div className="text-center py-16 space-y-4">
                <HelpCircle className="h-12 w-12 text-zinc-400 mx-auto" />
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">Aucun résultat trouvé</h3>
                <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                  Essayez de saisir d&apos;autres mots clés comme &quot;TVA&quot;, &quot;Premium&quot; ou &quot;catalogue&quot;.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-8">
          <div className="p-8 rounded-3xl bg-gradient-to-tr from-emerald-600/10 to-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 shadow-inner">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.437 0 9.862-4.41 9.865-9.85.002-2.636-1.02-5.115-2.879-6.979C16.398 1.912 13.926.887 11.3.887 5.86.887 1.439 5.3 1.436 10.74c0 1.562.415 3.09 1.202 4.457l-1.018 3.719 3.824-.997c1.336.727 2.766 1.096 4.203 1.096zM17.65 14.15c-.3-.15-1.785-.88-2.062-.98-.278-.1-.48-.15-.68.15-.2.3-.77.98-.945 1.18-.175.2-.35.225-.65.075-.3-.15-1.27-.47-2.42-1.49-.89-.8-1.5-1.78-1.675-2.08-.175-.3-.02-.46.13-.61.135-.13.3-.35.45-.52.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.68-1.64-.93-2.24-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.525.075-.8 0-.275-.3-1.05-1.025-1.44-1.95-.36-.85-.15-1.52.075-1.7.35-.3.6-.525.9-.9.1-.125.175-.25.25-.425.075-.175.04-.325-.02-.475-.06-.15-.58-1.4-.8-1.92-.215-.52-.46-.45-.63-.45h-.54c-.18 0-.475.067-.723.342-.248.275-.945.925-.945 2.25s.965 2.6 1.1 2.775c.135.175 1.9 2.9 4.6 4.075.64.28 1.14.448 1.53.573.645.205 1.23.175 1.69.107.514-.077 1.785-.73 2.037-1.435.252-.705.252-1.31.176-1.435-.075-.125-.275-.2-.575-.35z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">Support par Chat (WhatsApp)</h3>
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Besoin d&apos;aide en direct ? Parlez à nos techniciens locaux directement sur WhatsApp pour une assistance pas-à-pas.
              </p>
            </div>
            <a
              href="https://wa.me/221773831364"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#25D366] text-white text-xs font-black uppercase tracking-wider hover:bg-[#20ba59] shadow-lg shadow-emerald-600/20 transition-all self-start px-6"
            >
              Ouvrir WhatsApp
            </a>
          </div>

          <div className="p-8 rounded-3xl bg-gradient-to-tr from-orange-600/10 to-orange-500/10 border border-orange-500/20 backdrop-blur-xl flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600/10 text-orange-600 dark:text-orange-400 shadow-inner">
                <PhoneCall className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">Nous appeler directement</h3>
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Nos conseillers basés à Dakar et Abidjan répondent à vos appels du lundi au vendredi de 8h à 18h GMT.
              </p>
            </div>
            <a
              href="tel:+221773831364"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-orange-600 text-white text-xs font-black uppercase tracking-wider hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-all self-start px-6"
            >
              Appeler le +221 77 383 13 64
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
