"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Tag,
  BarChart3,
  Camera,
  Coins,
  Hash,
  Layers,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

import { createProduitSchema, type CreateProduitInput } from "@/schemas/produit.schema";
import { createProduit, checkProductLimitAction } from "@/server/actions/produit.actions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ImageUpload } from "@/components/image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EASE = [0.16, 1, 0.3, 1] as const;

interface NewProductPageProps {
  params: Promise<{ id: string }>;
}

interface Categorie {
  id: string;
  nom: string;
}

interface LimitData {
  limitReached: boolean;
  productCount: number;
  maxProduits: number;
  planName: string;
}

export default function NewProductPage({ params }: NewProductPageProps) {
  const { id: boutiqueId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [limitData, setLimitData] = useState<LimitData | null>(null);

  const form = useForm<CreateProduitInput>({
    resolver: zodResolver(createProduitSchema),
    defaultValues: {
      nom: "",
      code: "",
      description: "",
      prixAchat: 0,
      prixUnitaire: 0,
      quantite: 0,
      seuilAlerte: 5,
      photo: "",
    },
  });

  useEffect(() => {
    fetch(`/api/boutiques/${boutiqueId}/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(() => {});

    checkProductLimitAction({ boutiqueId })
      .then((res) => {
        if (res?.data) {
          setLimitData(res.data);
        }
      })
      .catch(() => {});
  }, [boutiqueId]);

  async function onSubmit(data: CreateProduitInput) {
    if (limitData?.limitReached) {
      toast.error("Limite de produits atteinte. Veuillez passer au plan supérieur.");
      return;
    }
    setLoading(true);
    try {
      const result = await createProduit({
        boutiqueId,
        data,
      });

      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }

      toast.success("Produit ajouté avec succès !");
      router.push(`/boutiques/${boutiqueId}/produits`);
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="rounded-full h-12 w-12 p-0 hover:bg-slate-100/50">
              <Link href={`/boutiques/${boutiqueId}/produits`}>
                <ArrowLeft className="h-6 w-6 text-slate-500" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                Nouveau Produit
              </h1>
              <p className="text-muted-foreground text-sm font-medium">Ajoutez un article à votre inventaire boutique</p>
            </div>
          </div>
        </div>

        {limitData?.limitReached ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="mb-8 p-8 sm:p-10 rounded-[2.5rem] border border-red-100 dark:border-red-500/20 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden relative"
          >
            {/* Soft decorative background glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-gradient-to-br from-red-500/10 to-amber-500/10 blur-3xl rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left justify-between">
              <div className="space-y-4 max-w-lg">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-500 shadow-inner">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-zinc-100">
                    Limite de produits atteinte
                  </h3>
                  <p className="text-slate-500 dark:text-zinc-400 text-sm sm:text-base leading-relaxed font-medium">
                    Vous avez atteint la limite de <strong className="text-red-500 font-extrabold">{limitData.maxProduits} produits</strong> du forfait <span className="font-extrabold text-slate-900 dark:text-white uppercase">{limitData.planName}</span>. Passez au forfait Pro pour ajouter plus de produits.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Button asChild size="lg" className="h-14 rounded-2xl font-black text-sm bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white border-none shadow-lg shadow-red-500/20">
                  <Link href="/boutiques">
                    Passer au forfait Pro
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 rounded-2xl font-bold border-slate-200 dark:border-zinc-800 text-xs sm:text-sm bg-slate-50/50 hover:bg-slate-100/50">
                  <Link href={`/boutiques/${boutiqueId}/produits`}>
                    Retourner à l&apos;inventaire
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-8 lg:grid-cols-3">
                {/* Left Column: Main Info */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="border-none bg-card/50 shadow-2xl backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-8 md:p-10 space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="h-4 w-4 text-brand" />
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Informations Générales</span>
                      </div>

                      <FormField
                        control={form.control}
                        name="nom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nom du produit *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: iPhone 15 Pro" className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} />
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
                                placeholder="Description du produit (optionnel)"
                                rows={3}
                                className="rounded-xl bg-foreground/5 border-none px-4 py-3 font-bold resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Hash className="h-3 w-3" /> Code SKU / Barre *
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="IPH15-PRO-256" className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="categorieId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Layers className="h-3 w-3" /> Catégorie
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold">
                                    <SelectValue placeholder="Choisir une catégorie" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                      {cat.nom}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="photo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                              <Camera className="h-3 w-3" /> Image du produit
                            </FormLabel>
                            <FormControl>
                              <ImageUpload value={field.value} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card className="border-none bg-card/50 shadow-2xl backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-8 md:p-10 space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Coins className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tarification & Stock</span>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="prixAchat"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Prix d&apos;Achat (FCFA)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="prixUnitaire"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground text-brand">Prix de Vente (FCFA) *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  className="h-12 rounded-xl bg-brand/5 border-none px-4 font-black text-brand text-lg"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="quantite"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Quantité Initiale</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="seuilAlerte"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Seuil d&apos;Alerte Stock</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column: Tips / Sidebar */}
                <div className="space-y-6">
                  <Card className="border-none bg-zinc-900 text-white shadow-2xl rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-8">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                        <BarChart3 className="h-6 w-6 text-brand" />
                      </div>
                      <h3 className="text-xl font-black tracking-tight mb-2">Conseil Stock</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                        Le seuil d&apos;alerte vous permet d&apos;être notifié quand il est temps de repasser une commande fournisseur. Un seuil de 5 est recommandé pour les articles à rotation moyenne.
                      </p>
                    </CardContent>
                  </Card>

                  <Button
                    type="submit"
                    variant="brand"
                    size="xl"
                    className="w-full h-20 rounded-[2rem] font-black text-xl shadow-2xl shadow-brand/20 transition-all hover:scale-[1.02] active:scale-[0.98] bg-brand hover:bg-brand/90 border-none text-white"
                    disabled={loading}
                  >
                    {loading ? "Enregistrement..." : "Enregistrer"}
                    <Save className="ml-2.5 h-6 w-6" />
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}
      </motion.div>
    </div>
  );
}
