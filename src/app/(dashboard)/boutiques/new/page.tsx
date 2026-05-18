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

const EASE = [0.16, 1, 0.3, 1] as const;

const SECTEURS = [
  { value: "ALIMENTATION", label: "Alimentation" },
  { value: "HABILLEMENT", label: "Habillement" },
  { value: "ELECTRONIQUE", label: "Électronique" },
  { value: "BEAUTE", label: "Beauté" },
  { value: "SANTE", label: "Santé" },
  { value: "SERVICES", label: "Services" },
  { value: "QUINCAILLERIE", label: "Quincaillerie" },
  { value: "LIBRAIRIE", label: "Librairie" },
  { value: "AUTRE", label: "Autre" },
] as const;

export default function NouvelleBoutiquePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [checking, setChecking] = useState(true);

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
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Secteur d&apos;activité *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold">
                              <SelectValue placeholder="Choisir un secteur" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-none shadow-2xl">
                            {SECTEURS.map((s) => (
                              <SelectItem key={s.value} value={s.value} className="rounded-lg">
                                {s.label}
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
