/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Store, ArrowRight, Globe, Phone, Mail, MapPin, ImageIcon, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

import { createBoutiqueSchema, type CreateBoutiqueInput } from "@/schemas/boutique.schema";
import { createBoutique } from "@/server/actions/boutique.actions";
import { checkBoutiqueLimitAction } from "@/server/actions/boutique.actions";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/image-upload";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

import { 
  Utensils, Shirt, Smartphone, Sparkles, HeartPulse, Briefcase, Hammer, BookOpen, HelpCircle, 
  Search, Check, ChevronDown, Sprout, Palette, Car, Tv, X
} from "lucide-react";
import { AnimatePresence } from "framer-motion";

const SECTEURS = [
  { 
    value: "ALIMENTATION", 
    label: "Alimentation & Restauration", 
    description: "Épiceries, supermarchés, restaurants, boulangeries et fast-foods.",
    icon: Utensils,
    subCategories: ["Épicerie", "Supermarché", "Restaurant", "Boulangerie", "Fast-food", "Traiteur", "Pâtisserie", "Boucherie"],
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/30"
  },
  { 
    value: "HABILLEMENT", 
    label: "Habillement & Mode", 
    description: "Vêtements, chaussures, maroquinerie, bijoux et accessoires de mode.",
    icon: Shirt,
    subCategories: ["Prêt-à-porter", "Chaussures", "Maroquinerie", "Bijouterie", "Friperie", "Vêtements enfants", "Accessoires"],
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/30"
  },
  { 
    value: "ELECTRONIQUE", 
    label: "Électronique & Technologie", 
    description: "Téléphones, ordinateurs, électroménager et gadgets électroniques.",
    icon: Smartphone,
    subCategories: ["Téléphones", "Ordinateurs", "Accessoires tech", "Électroménager", "Réparation", "Gadgets", "Sonorisation"],
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30"
  },
  { 
    value: "BEAUTE", 
    label: "Beauté, Cosmétique & Soins", 
    description: "Salons de coiffure, parfums, cosmétiques et instituts de beauté.",
    icon: Sparkles,
    subCategories: ["Coiffure", "Parfumerie", "Cosmétiques", "Spa & Massage", "Maquillage", "Soins", "Onglerie"],
    color: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20 hover:bg-pink-500/20 hover:border-pink-500/30"
  },
  { 
    value: "SANTE", 
    label: "Santé, Pharmacie & Bien-être", 
    description: "Pharmacies, parapharmacies, cliniques et produits de bien-être.",
    icon: HeartPulse,
    subCategories: ["Pharmacie", "Parapharmacie", "Herboristerie", "Bien-être", "Opticien", "Matériel médical"],
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/30"
  },
  { 
    value: "SERVICES", 
    label: "Services, Conseil & Freelance", 
    description: "Consulting, agences, éducation, location et autres prestations de services.",
    icon: Briefcase,
    subCategories: ["Freelance", "Conseil", "Agence", "Éducation", "Location voiture", "Pressing", "Nettoyage", "Imprimerie"],
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/30"
  },
  { 
    value: "QUINCAILLERIE", 
    label: "Quincaillerie & Matériaux", 
    description: "Outils de bricolage, peinture, matériaux de construction et électricité.",
    icon: Hammer,
    subCategories: ["Bricolage", "Peinture", "Électricité", "Plomberie", "Matériaux de construction", "Outillage"],
    color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/30"
  },
  { 
    value: "LIBRAIRIE", 
    label: "Librairie, Éducation & Papeterie", 
    description: "Livres, fournitures scolaires, papeterie, jeux et matériel éducatif.",
    icon: BookOpen,
    subCategories: ["Livres", "Fournitures scolaires", "Fournitures de bureau", "Papeterie", "Jeux éducatifs", "Mangas"],
    color: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20 hover:bg-teal-500/20 hover:border-teal-500/30"
  },
  { 
    value: "AUTRE", 
    label: "Autre commerce ou activité", 
    description: "Boutiques multiservices, fleurs, artisanat, cadeaux ou concept-store unique.",
    icon: HelpCircle,
    subCategories: ["Multiservices", "Fleuriste", "Artisanat d'art", "Cadeaux", "Animalerie", "Sports", "Concept-store"],
    color: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/20 hover:border-zinc-500/30"
  },
] as const;

export default function NouvelleBoutiquePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [checking, setChecking] = useState(true);
  const [selectOpen, setSelectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkBoutiqueLimitAction().then((result) => {
      if (result?.data?.limitReached) {
        setLimitReached(true);
      }
    }).finally(() => setChecking(false));
  }, []);

  const form = useForm<CreateBoutiqueInput>({
    resolver: zodResolver(createBoutiqueSchema),
    defaultValues: {
      nom: "",
      description: "",
      adresse: "",
      telephone: "",
      email: "",
      siteWeb: "",
      logo: "",
      secteurActivite: "" as any,
    },
  });

  const selectedValue = form.watch("secteurActivite");
  const selectedSector = SECTEURS.find((s) => s.value === selectedValue);
  const SelectedIcon = selectedSector?.icon;

  const filteredSecteurs = SECTEURS.filter((s) => 
    s.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.subCategories.some(sub => sub.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  async function onSubmit(data: CreateBoutiqueInput) {
    setLoading(true);
    try {
      const result = await createBoutique(data);
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success("Boutique créée avec succès !");
      router.push("/boutiques");
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue lors de la création.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="mx-auto max-w-3xl p-6 lg:py-12 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (limitReached) {
    return (
      <div className="mx-auto max-w-3xl p-6 lg:py-12">
        <Card className="border-none bg-card/50 shadow-2xl backdrop-blur-xl p-10 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Limite atteinte</h2>
          <p className="text-muted-foreground text-lg">
            Votre plan actuel ne permet pas de créer plus de boutiques. Passez au plan supérieur pour débloquer cette fonctionnalité.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild variant="brand" className="rounded-xl h-12 px-6 font-black">
              <Link href="/pricing">Voir les plans</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl h-12 px-6 font-bold">
              <Link href="/boutiques">Retour</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6 lg:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div className="mb-10">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Nouvelle boutique
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Donnez vie à votre point de vente en quelques secondes.
          </p>
        </div>

        <Card className="overflow-hidden border-none bg-card/50 shadow-2xl backdrop-blur-xl">
          <CardContent className="p-8 md:p-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nom de la boutique *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Ma Boutique Dakar" className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="secteurActivite"
                    render={({ field }) => (
                      <FormItem className="relative">
                        <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Secteur d&apos;activité *</FormLabel>
                        <FormControl>
                          <button
                            type="button"
                            onClick={() => setSelectOpen(true)}
                            className="flex w-full items-center justify-between h-12 rounded-xl bg-foreground/5 border border-transparent px-4 font-bold text-left transition-all hover:bg-foreground/10 active:scale-[0.99] text-sm"
                          >
                            <span className="flex items-center gap-2.5 truncate">
                              {SelectedIcon ? (
                                <span className={cn("p-1.5 rounded-lg shrink-0", selectedSector.color.split(" ")[0], selectedSector.color.split(" ")[1])}>
                                  <SelectedIcon className="h-4 w-4" />
                                </span>
                              ) : (
                                <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                              <span className="truncate">{selectedSector ? selectedSector.label : "Choisir un secteur"}</span>
                            </span>
                            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200" />
                          </button>
                        </FormControl>

                        {/* Rich Premium Sector Selection Overlay */}
                        <AnimatePresence>
                          {selectOpen && (
                            <>
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectOpen(false)}
                                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                              />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                transition={{ type: "spring", duration: 0.4 }}
                                className="fixed inset-x-4 top-[8%] bottom-[8%] md:inset-x-[10%] lg:inset-x-[15%] xl:inset-x-[20%] z-50 flex flex-col rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 shadow-2xl backdrop-blur-2xl p-6"
                              >
                                <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-900 shrink-0">
                                  <div>
                                    <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50">Secteur d&apos;Activité</h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Choisissez le secteur qui décrit le mieux votre point de vente</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setSelectOpen(false)}
                                    className="h-9 w-9 flex items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-250 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                                  >
                                    <X className="h-4.5 w-4.5" />
                                  </button>
                                </div>

                                {/* Search Field */}
                                <div className="relative my-4 shrink-0">
                                  <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-400 dark:text-zinc-500" />
                                  <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Rechercher un secteur (ex: boutique, restaurant, mode, téléphone...)"
                                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 font-bold text-sm focus:outline-none focus:border-brand dark:focus:border-brand/60 transition-colors"
                                  />
                                </div>

                                {/* Sector Cards Scrollable Grid */}
                                <div className="flex-1 overflow-y-auto pr-1 space-y-3.5">
                                  {filteredSecteurs.length > 0 ? (
                                    <div className="grid gap-3.5 sm:grid-cols-2">
                                      {filteredSecteurs.map((sector) => {
                                        const Icon = sector.icon;
                                        const isSelected = sector.value === field.value;

                                        return (
                                          <motion.button
                                            key={sector.value}
                                            type="button"
                                            whileHover={{ y: -2, transition: { duration: 0.15 } }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                              field.onChange(sector.value);
                                              setSelectOpen(false);
                                            }}
                                            className={cn(
                                              "flex flex-col items-start p-4.5 rounded-2xl border text-left transition-all duration-300 relative group overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/10",
                                              isSelected
                                                ? "border-violet-600 bg-violet-600/5 dark:border-violet-500 dark:bg-violet-500/5 shadow-[0_0_15px_rgba(124,58,237,0.08)]"
                                                : "border-zinc-200/60 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-800"
                                            )}
                                          >
                                            <div className="flex items-center gap-3.5 w-full">
                                              <span className={cn("p-2.5 rounded-xl shrink-0 border transition-all duration-300 group-hover:scale-105", sector.color)}>
                                                <Icon className="h-5 w-5" />
                                              </span>
                                              <div className="flex-1 min-w-0 pr-2">
                                                <div className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                                                  {sector.label}
                                                  {isSelected && (
                                                    <span className="inline-flex items-center justify-center h-4.5 w-4.5 rounded-full bg-violet-600 dark:bg-violet-500 text-white shrink-0 shadow-md">
                                                      <Check className="h-3 w-3" />
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                            
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2.5 leading-relaxed font-semibold">
                                              {sector.description}
                                            </p>

                                            {/* Sub-categories Pills */}
                                            <div className="flex flex-wrap gap-1 mt-3.5">
                                              {sector.subCategories.slice(0, 5).map((sub) => (
                                                <span 
                                                  key={sub}
                                                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-450 border border-zinc-200/30 dark:border-zinc-800/40"
                                                >
                                                  {sub}
                                                </span>
                                              ))}
                                              {sector.subCategories.length > 5 && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black text-zinc-400 dark:text-zinc-550">
                                                  +{sector.subCategories.length - 5}
                                                </span>
                                              )}
                                            </div>
                                          </motion.button>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400 dark:text-zinc-550">
                                      <HelpCircle className="h-12 w-12 mb-3 text-zinc-300 dark:text-zinc-700 animate-bounce" />
                                      <p className="text-sm font-black">Aucun secteur ne correspond à votre recherche</p>
                                      <p className="text-xs text-zinc-500 mt-1 max-w-xs">Essayez d&apos;autres mots-clés ou utilisez le secteur &quot;Autre&quot;.</p>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <ImageIcon className="h-3 w-3" /> Logo / Image de la boutique
                      </FormLabel>
                      <FormControl>
                        <ImageUpload value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Décrivez brièvement votre activité..." 
                          className="min-h-[100px] rounded-xl bg-foreground/5 border-none px-4 py-3 font-medium" 
                          {...field} 
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="telephone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Phone className="h-3 w-3" /> Téléphone
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="+221 ..." className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Mail className="h-3 w-3" /> Email
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="boutique@email.com" className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="adresse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-3 w-3" /> Adresse physique
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Quartier, Rue, Ville" className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="siteWeb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Globe className="h-3 w-3" /> Site web (optionnel)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.ma-boutique.com" className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4">
                  <Button type="submit" variant="brand" size="xl" className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-brand/20" disabled={loading}>
                    {loading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Créer ma boutique
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
