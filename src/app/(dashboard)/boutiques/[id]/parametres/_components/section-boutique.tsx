"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Loader2, Save, Store, Mail, Phone, Globe, MapPin, Info, Clock,
  Share2, ImageIcon,
  Utensils, Shirt, Smartphone, Sparkles, HeartPulse, Hammer, BookOpen, HelpCircle,
} from "lucide-react";
// lucide-react v1 a retiré les icônes de marque (marque déposée) → on utilise les
// glyphes officiels du projet.
import { WhatsAppIcon, FacebookIcon, InstagramIcon, LinkedInIcon, XIcon } from "@/components/icons/brand-icons";
import { updateBoutiqueSchema, type UpdateBoutiqueInput } from "@/schemas/boutique.schema";
import { updateBoutique } from "@/server/actions/boutique.actions";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/image-upload";

const SECTEURS = [
  { value: "ALIMENTATION", label: "Restauration & Alimentation", icon: Utensils },
  { value: "HABILLEMENT", label: "Mode & Vêtements", icon: Shirt },
  { value: "ELECTRONIQUE", label: "Technologie & Téléphonie", icon: Smartphone },
  { value: "BEAUTE", label: "Beauté & Cosmétique", icon: Sparkles },
  { value: "SANTE", label: "Santé & Bien-être", icon: HeartPulse },
  { value: "SERVICES", label: "Commerce & Services", icon: Store },
  { value: "QUINCAILLERIE", label: "Construction & Quincaillerie", icon: Hammer },
  { value: "LIBRAIRIE", label: "Éducation & Librairie", icon: BookOpen },
  { value: "AUTRE", label: "Autre activité", icon: HelpCircle },
] as const;

interface Props {
  boutiqueId: string;
  initial: {
    nom: string;
    description: string | null;
    adresse: string | null;
    siteWeb: string | null;
    email: string | null;
    telephone: string | null;
    secteurActivite: (typeof SECTEURS)[number]["value"];
    logo: string | null;
    whatsapp: string | null;
    facebook: string | null;
    instagram: string | null;
    linkedin: string | null;
    twitter: string | null;
    horaires: string | null;
  };
}

export function SectionBoutique({ boutiqueId, initial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<UpdateBoutiqueInput>({
    resolver: zodResolver(updateBoutiqueSchema),
    defaultValues: {
      nom: initial.nom || "",
      description: initial.description || "",
      adresse: initial.adresse || "",
      telephone: initial.telephone || "",
      email: initial.email || "",
      siteWeb: initial.siteWeb || "",
      secteurActivite: initial.secteurActivite || "AUTRE",
      logo: initial.logo || "",
      whatsapp: initial.whatsapp || "",
      facebook: initial.facebook || "",
      instagram: initial.instagram || "",
      linkedin: initial.linkedin || "",
      twitter: initial.twitter || "",
      horaires: initial.horaires || "",
    },
  });

  async function onSubmit(data: UpdateBoutiqueInput) {
    setLoading(true);
    try {
      const result = await updateBoutique({ boutiqueId, data });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success("Boutique mise à jour avec succès");
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <ImageIcon className="h-3 w-3" /> Identité visuelle
          </h3>
          <FormField
            control={form.control}
            name="logo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Logo de la boutique</FormLabel>
                <FormControl>
                  <ImageUpload value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <Store className="h-3 w-3" /> Informations générales
          </h3>
          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Nom de la boutique</FormLabel>
                <FormControl>
                  <Input className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-brand" {...field} />
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
                <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-zinc-400" /> Description
                </FormLabel>
                <FormControl>
                  <Textarea placeholder="Décrivez votre boutique en quelques lignes..." className="min-h-[90px] rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 py-3 font-semibold text-sm focus:ring-2 focus:ring-brand" {...field} />
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
                <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Secteur d&apos;activité</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-brand">
                      <span className="flex items-center gap-2">
                        {field.value && (() => {
                          const current = SECTEURS.find((s) => s.value === field.value);
                          if (current) {
                            const Icon = current.icon;
                            return <Icon className="h-4 w-4 text-brand shrink-0" />;
                          }
                          return null;
                        })()}
                        <SelectValue placeholder="Choisir un secteur" />
                      </span>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SECTEURS.map((s) => {
                      const Icon = s.icon;
                      return (
                        <SelectItem key={s.value} value={s.value}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-zinc-400 shrink-0" />
                            <span>{s.label}</span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <Mail className="h-3 w-3" /> Contact & Adresse
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="telephone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-zinc-400" /> Téléphone
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="+221 77 000 00 00" className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-brand" {...field} />
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
                  <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-zinc-400" /> Email
                  </FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contact@maboutique.com" className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-brand" {...field} />
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
                <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400" /> Adresse
                </FormLabel>
                <FormControl>
                  <Input placeholder="123 Rue du Commerce, Dakar" className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-brand" {...field} />
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
                <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-zinc-400" /> Site web
                </FormLabel>
                <FormControl>
                  <Input placeholder="https://maboutique.com" className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-brand" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <Share2 className="h-3 w-3" /> Réseaux & WhatsApp
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <WhatsAppIcon className="h-3.5 w-3.5 text-emerald-500" /> WhatsApp
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="+221 77 000 00 00" className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-brand" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="facebook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <FacebookIcon className="h-3.5 w-3.5 text-blue-500" /> Facebook
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="facebook.com/maboutique" className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-brand" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <InstagramIcon className="h-3.5 w-3.5 text-orange-500" /> Instagram
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="@maboutique" className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-brand" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <LinkedInIcon className="h-3.5 w-3.5 text-blue-700" /> LinkedIn
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="linkedin.com/company/..." className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-brand" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="twitter"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <XIcon className="h-3.5 w-3.5 text-sky-500" /> Twitter / X
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="@maboutique" className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-brand" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <Clock className="h-3 w-3" /> Horaires d&apos;ouverture
          </h3>
          <FormField
            control={form.control}
            name="horaires"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Horaires (format libre)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Lundi - Vendredi : 8h - 18h&#10;Samedi : 9h - 16h&#10;Dimanche : fermé"
                    className="min-h-[100px] rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 py-3 font-semibold text-sm focus:ring-2 focus:ring-brand"
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
          className="w-full h-12 rounded-xl font-bold text-sm bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-brand dark:hover:bg-brand/90"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Enregistrer la boutique
        </Button>
      </form>
    </Form>
  );
}
