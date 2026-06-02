"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Save, User, Phone, MapPin, Globe2, AtSign, FileText, Camera } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateVendeurProfile } from "@/server/actions/user.actions";

const profilSchema = z.object({
  nom: z.string().min(1, "Le nom est requis").max(80),
  prenom: z.string().min(1, "Le prénom est requis").max(80),
  nomAffiche: z.string().max(80).optional().or(z.literal("")),
  telephone: z.string().max(30).optional().or(z.literal("")),
  pays: z.string().max(80).optional().or(z.literal("")),
  ville: z.string().max(80).optional().or(z.literal("")),
  adresse: z.string().max(200).optional().or(z.literal("")),
  bio: z.string().max(400).optional().or(z.literal("")),
  photo: z.string().optional().or(z.literal("")),
});

type ProfilInput = z.infer<typeof profilSchema>;

interface Props {
  initial: {
    nom: string;
    prenom: string;
    nomAffiche: string | null;
    telephone: string | null;
    pays: string | null;
    ville: string | null;
    adresse: string | null;
    bio: string | null;
    photo: string | null;
  };
}

export function SectionProfil({ initial }: Props) {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);

  const form = useForm<ProfilInput>({
    resolver: zodResolver(profilSchema),
    defaultValues: {
      nom: initial.nom || "",
      prenom: initial.prenom || "",
      nomAffiche: initial.nomAffiche || "",
      telephone: initial.telephone || "",
      pays: initial.pays || "",
      ville: initial.ville || "",
      adresse: initial.adresse || "",
      bio: initial.bio || "",
      photo: initial.photo || "",
    },
  });

  async function onSubmit(values: ProfilInput) {
    setLoading(true);
    try {
      const result = await updateVendeurProfile(values);
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      const displayName = values.nomAffiche || `${values.prenom} ${values.nom}`.trim();
      await update({
        ...session,
        user: {
          ...session?.user,
          name: displayName,
          image: values.photo || null,
        },
      });
      toast.success("Profil mis à jour avec succès");
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  const photo = form.watch("photo");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <Camera className="h-3 w-3" /> Photo de profil
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUpload value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="text-xs font-medium text-muted-foreground space-y-1.5">
              <p className="font-bold text-zinc-700 dark:text-zinc-300">Aperçu instantané</p>
              <p>{photo ? "Cliquez sur l'image pour la remplacer." : "Format PNG, JPG ou WEBP. Max 10 Mo."}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <User className="h-3 w-3" /> Identité
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="prenom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Prénom</FormLabel>
                  <FormControl>
                    <Input className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-brand" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Nom</FormLabel>
                  <FormControl>
                    <Input className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-brand" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="nomAffiche"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <AtSign className="h-3.5 w-3.5 text-zinc-400" /> Nom affiché
                </FormLabel>
                <FormControl>
                  <Input placeholder="Ex. Khalil Pro" className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-brand" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <MapPin className="h-3 w-3" /> Localisation
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="pays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Globe2 className="h-3.5 w-3.5 text-zinc-400" /> Pays
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Sénégal" className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-brand" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ville"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Ville</FormLabel>
                  <FormControl>
                    <Input placeholder="Dakar" className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-brand" {...field} />
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
                <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Adresse</FormLabel>
                <FormControl>
                  <Input placeholder="123 Rue du Commerce" className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-brand" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <FileText className="h-3 w-3" /> À propos
          </h3>
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Bio courte</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Une phrase ou deux sur vous (max 400 caractères)"
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
          Enregistrer le profil
        </Button>
      </form>
    </Form>
  );
}
