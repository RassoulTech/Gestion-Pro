"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Settings, Store, ImageIcon, Globe, MapPin, Save } from "lucide-react";
import { updateBoutiqueSchema, type UpdateBoutiqueInput } from "@/schemas/boutique.schema";
import { updateBoutique } from "@/server/actions/boutique.actions";
import { getBoutiqueForSettings } from "@/server/queries/boutique.queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/image-upload";

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

export default function ParametresPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const form = useForm<UpdateBoutiqueInput>({
    resolver: zodResolver(updateBoutiqueSchema),
    defaultValues: {
      nom: "",
      description: "",
      adresse: "",
      telephone: "",
      email: "",
      siteWeb: "",
      secteurActivite: "AUTRE",
      logo: "",
    },
  });

  useEffect(() => {
    async function loadBoutique() {
      try {
        const boutique = await getBoutiqueForSettings(params.id);
        if (boutique) {
          form.reset({
            nom: boutique.nom || "",
            description: boutique.description || "",
            adresse: boutique.adresse || "",
            telephone: boutique.telephone || "",
            email: boutique.email || "",
            siteWeb: boutique.siteWeb || "",
            secteurActivite: boutique.secteurActivite || "AUTRE",
            logo: boutique.logo || "",
          });
        }
      } catch {
        toast.error("Impossible de charger les données de la boutique");
      } finally {
        setPageLoading(false);
      }
    }
    loadBoutique();
  }, [params.id, form]);

  async function onSubmit(data: UpdateBoutiqueInput) {
    setLoading(true);
    try {
      const result = await updateBoutique({ boutiqueId: params.id, data });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success("Paramètres mis à jour avec succès");
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="text-muted-foreground font-bold">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground font-medium">Configurez l&apos;identité et les informations de votre boutique.</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-12">
        {/* Sidebar Card */}
        <Card className="md:col-span-4 border-none bg-zinc-900 text-white shadow-2xl rounded-[2.5rem] overflow-hidden self-start">
          <CardContent className="p-8">
            <div className="mb-6 h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-brand">
              <Settings className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2">Configuration</h2>
            <p className="text-zinc-400 font-medium text-sm mb-6">
              Personnalisez votre boutique avec un logo, une bannière et toutes vos informations essentielles.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                <ImageIcon className="h-5 w-5 text-brand" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 leading-none mb-1">Identité visuelle</p>
                  <p className="text-sm font-black">Logo</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                <Store className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 leading-none mb-1">Boutique</p>
                  <p className="text-sm font-black">{form.watch("nom") || "Ma Boutique"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                <Globe className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 leading-none mb-1">Contact</p>
                  <p className="text-sm font-black">{form.watch("email") || "Non défini"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Form */}
        <Card className="md:col-span-8 border-none bg-white dark:bg-zinc-900 shadow-xl rounded-[2.5rem]">
          <CardHeader className="p-8">
            <CardTitle className="text-2xl font-black">Informations de la boutique</CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Logo & Banner */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <ImageIcon className="h-3 w-3" /> Identité visuelle
                  </h3>
                  <FormField
                    control={form.control}
                    name="logo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-bold">Logo de la boutique</FormLabel>
                        <FormControl>
                          <ImageUpload value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* General Info */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Store className="h-3 w-3" /> Informations générales
                  </h3>
                  <div className="grid gap-6">
                    <FormField
                      control={form.control}
                      name="nom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold">Nom de la boutique</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ma Boutique"
                              className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none px-6 font-bold focus:ring-2 focus:ring-brand"
                              {...field}
                            />
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
                          <FormLabel className="text-sm font-bold">Description</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Décrivez votre boutique..."
                              className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none px-6 font-bold focus:ring-2 focus:ring-brand"
                              {...field}
                            />
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
                          <FormLabel className="text-sm font-bold">Secteur d&apos;activité</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none px-6 font-bold focus:ring-2 focus:ring-brand">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SECTEURS.map((s) => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Globe className="h-3 w-3" /> Contact & Localisation
                  </h3>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="telephone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold">Téléphone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="+225 07 00 00 00"
                              className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none px-6 font-bold focus:ring-2 focus:ring-brand"
                              {...field}
                            />
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
                          <FormLabel className="text-sm font-bold">Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="contact@maboutique.com"
                              className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none px-6 font-bold focus:ring-2 focus:ring-brand"
                              {...field}
                            />
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
                        <FormLabel className="text-sm font-bold flex items-center gap-2">
                          <MapPin className="h-3 w-3" /> Adresse
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123 Rue du Commerce, Abidjan"
                            className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none px-6 font-bold focus:ring-2 focus:ring-brand"
                            {...field}
                          />
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
                        <FormLabel className="text-sm font-bold">Site web</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://maboutique.com"
                            className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none px-6 font-bold focus:ring-2 focus:ring-brand"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 rounded-2xl font-black text-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-brand dark:hover:bg-brand/90 shadow-xl shadow-brand/10"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-5 w-5" />
                  )}
                  Enregistrer les modifications
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="border-none bg-red-50 dark:bg-red-950/20 shadow-xl rounded-[2.5rem]">
        <CardContent className="p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-destructive">Zone de danger</h3>
              <p className="text-sm text-muted-foreground font-medium">Actions irréversibles pour votre boutique.</p>
            </div>
            <Button variant="destructive" className="rounded-xl h-12 px-6 font-black">
              Suspendre la boutique
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
