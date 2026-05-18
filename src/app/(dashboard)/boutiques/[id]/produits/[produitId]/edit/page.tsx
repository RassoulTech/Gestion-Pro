"use client";

import { useState, use, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

import { updateProduitSchema, type UpdateProduitInput } from "@/schemas/produit.schema";
import { updateProduit } from "@/server/actions/produit.actions";
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

interface EditProductPageProps {
  params: Promise<{ id: string; produitId: string }>;
}

interface ProduitData {
  id: string;
  nom: string;
  code: string;
  description: string;
  prixAchat: number;
  prixUnitaire: number;
  quantite: number;
  seuilAlerte: number;
  photo: string | null;
  categorieId: string | null;
}

interface Categorie {
  id: string;
  nom: string;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id: boutiqueId, produitId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [produit, setProduit] = useState<ProduitData | null>(null);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [fetching, setFetching] = useState(true);

  const form = useForm<UpdateProduitInput>({
    resolver: zodResolver(updateProduitSchema),
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
    async function fetchData() {
      try {
        const [produitRes, catRes] = await Promise.all([
          fetch(`/api/boutiques/${boutiqueId}/produits/${produitId}`),
          fetch(`/api/boutiques/${boutiqueId}/categories`),
        ]);

        if (!produitRes.ok) {
          toast.error("Produit introuvable");
          router.push(`/boutiques/${boutiqueId}/produits`);
          return;
        }

        const data: ProduitData = await produitRes.json();
        const cats: Categorie[] = await catRes.json();

        setProduit(data);
        setCategories(cats);
        form.reset({
          nom: data.nom,
          code: data.code,
          description: data.description || "",
          categorieId: data.categorieId || undefined,
          prixAchat: data.prixAchat,
          prixUnitaire: data.prixUnitaire,
          quantite: data.quantite,
          seuilAlerte: data.seuilAlerte,
          photo: data.photo || "",
        });
      } catch {
        toast.error("Erreur lors du chargement du produit");
        router.push(`/boutiques/${boutiqueId}/produits`);
      } finally {
        setFetching(false);
      }
    }
    fetchData();
  }, [boutiqueId, produitId, form, router]);

  async function onSubmit(data: UpdateProduitInput) {
    setLoading(true);
    try {
      const result = await updateProduit({
        boutiqueId,
        produitId,
        data,
      });

      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }

      toast.success("Produit modifié avec succès !");
      router.push(`/boutiques/${boutiqueId}/produits`);
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!produit) return null;

  return (
    <div className="mx-auto max-w-4xl py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="rounded-full h-12 w-12 p-0">
              <Link href={`/boutiques/${boutiqueId}/produits`}>
                <ArrowLeft className="h-6 w-6" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Modifier le Produit</h1>
              <p className="text-muted-foreground">{produit.nom}</p>
            </div>
          </div>
        </div>

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
                            <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Quantité</FormLabel>
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

              {/* Right Column */}
              <div className="space-y-6">
                <Card className="border-none bg-zinc-900 text-white shadow-2xl rounded-[2.5rem] overflow-hidden">
                  <CardContent className="p-8">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                      <BarChart3 className="h-6 w-6 text-brand" />
                    </div>
                    <h3 className="text-xl font-black tracking-tight mb-2">Modification</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      Modifiez les informations du produit. Les changements de stock seront enregistrés automatiquement.
                    </p>
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  variant="brand"
                  size="xl"
                  className="w-full h-20 rounded-[2rem] font-black text-xl shadow-2xl shadow-brand/20"
                  disabled={loading}
                >
                  {loading ? "Enregistrement..." : "Enregistrer"}
                  <Save className="ml-2 h-6 w-6" />
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </motion.div>
    </div>
  );
}
