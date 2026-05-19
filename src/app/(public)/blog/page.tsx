"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, ArrowRight, Search, BookOpen, Sparkles } from "lucide-react";
import Link from "next/link";

const EASE = [0.16, 1, 0.3, 1] as const;

const categories = ["Tous", "Gestion de Stock", "E-Commerce", "Fiscalité", "Conseils Pro"];

const articles = [
  {
    id: 1,
    title: "Comment gérer ses stocks en période de fêtes de fin d'année au Sénégal",
    excerpt: "La fin d'année est synonyme de forte demande. Découvrez nos stratégies incontournables pour anticiper vos approvisionnements et éviter les ruptures de stock.",
    category: "Gestion de Stock",
    date: "15 Mai 2026",
    readTime: "6 min",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600",
    slug: "gestion-stock-fetes-senegal",
  },
  {
    id: 2,
    title: "Guide complet de la facturation et calcul de la TVA 18% en zone UEMOA",
    excerpt: "Comprendre et appliquer correctement la TVA de 18% est crucial pour votre conformité fiscale. Suivez notre guide pas-à-pas pour éviter tout redressement.",
    category: "Fiscalité",
    date: "12 Mai 2026",
    readTime: "8 min",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600",
    slug: "guide-facturation-tva-uemoa",
  },
  {
    id: 3,
    title: "5 astuces pour optimiser les livraisons de votre e-boutique à Abidjan",
    excerpt: "La logistique du dernier kilomètre est le principal défi du e-commerce en Côte d'Ivoire. Voici comment réduire vos délais et satisfaire vos clients.",
    category: "E-Commerce",
    date: "08 Mai 2026",
    readTime: "5 min",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600",
    slug: "astuces-livraison-eboutique-abidjan",
  },
  {
    id: 4,
    title: "Pourquoi digitaliser les finances de votre commerce physique est urgent",
    excerpt: "Le passage des carnets papier à un système de gestion automatisé multiplie par deux la rentabilité des commerçants. Découvrez pourquoi et comment sauter le pas.",
    category: "Conseils Pro",
    date: "02 Mai 2026",
    readTime: "7 min",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600",
    slug: "pourquoi-digitaliser-finances-commerce",
  },
];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredArticles = articles.filter((art) => {
    const matchesCategory = selectedCategory === "Tous" || art.category === selectedCategory;
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          art.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="relative pt-32 pb-24 overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-10 left-1/3 w-[350px] h-[350px] bg-violet-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-1/3 w-[350px] h-[350px] bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container-app relative z-10 space-y-16">
        {/* --- Hero Area --- */}
        <div className="text-center max-w-2xl mx-auto space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest border border-emerald-500/20">
              <Sparkles className="h-3 w-3" /> Ressources & Conseils
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            Le Blog de <span className="bg-gradient-to-r from-violet-600 to-emerald-500 bg-clip-text text-transparent">GestionPro</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
            className="text-base font-semibold text-zinc-500 dark:text-zinc-400"
          >
            Des guides pratiques, des analyses sectorielles et des conseils d&apos;experts pour propulser votre boutique en Afrique.
          </motion.p>
        </div>

        {/* --- Search and Category Filter Bar --- */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-4 rounded-3xl bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-xl shadow-md">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  selectedCategory === cat
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
                    : "bg-white/50 dark:bg-zinc-950/30 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 border border-zinc-200/40 dark:border-zinc-800/40"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-5 rounded-2xl bg-white/50 dark:bg-zinc-950/30 border border-zinc-200/50 dark:border-zinc-800/50 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 text-sm font-semibold outline-none transition-all placeholder:text-zinc-400"
            />
          </div>
        </div>

        {/* --- Articles Grid --- */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredArticles.length > 0 ? (
              filteredArticles.map((art, idx) => (
                <motion.article
                  key={art.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, delay: idx * 0.05, ease: EASE }}
                  className="group rounded-3xl bg-white/55 dark:bg-zinc-900/55 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm overflow-hidden backdrop-blur-xl hover:border-violet-500/20 hover:shadow-xl hover:shadow-violet-600/5 transition-all flex flex-col h-full"
                >
                  <div className="relative h-56 overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={art.image}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-4 left-4 inline-flex items-center px-3 py-1.5 rounded-xl bg-white/90 dark:bg-zinc-900/90 text-xs font-black uppercase tracking-wider text-violet-600 dark:text-violet-400 shadow-sm border border-zinc-200/20 dark:border-zinc-800/20">
                      {art.category}
                    </span>
                  </div>

                  <div className="p-8 flex flex-col flex-1 space-y-4">
                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs font-bold text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> {art.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> {art.readTime}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-tight">
                      {art.title}
                    </h3>

                    <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 leading-relaxed flex-1">
                      {art.excerpt}
                    </p>

                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">
                        Lire l&apos;article <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </motion.article>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-1 md:col-span-2 text-center py-20 space-y-4"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-inner">
                  <BookOpen className="h-8 w-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                  Aucun article trouvé
                </h3>
                <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                  Essayez de modifier vos filtres ou d&apos;ajuster les mots clés de votre recherche.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
