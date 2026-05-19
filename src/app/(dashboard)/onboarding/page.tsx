/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
 
import { Rocket, ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";

import { createVendeurProfileSchema, type CreateVendeurProfileInput } from "@/schemas/vendeur.schema";
import { createVendeurProfile } from "@/server/actions/auth.actions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session, update } = useSession();

  // Les admins n'ont pas à créer de profil vendeur.
  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      router.replace("/admin/dashboard");
    }
  }, [session, router]);

  const form = useForm<CreateVendeurProfileInput>({
    resolver: zodResolver(createVendeurProfileSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
 
      dateNaissance: "" as any,
      adresse: "",
    },
  });

  async function onSubmit(data: CreateVendeurProfileInput) {
    setLoading(true);
    try {
      // Nettoyage des données pour éviter les erreurs de type
      const sanitizedData = {
        ...data,
        telephone: data.telephone || null,
        adresse: data.adresse || null,
        dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : null,
      };

 
      const result = await createVendeurProfile(sanitizedData as any);

      if (result?.serverError) {
        toast.error(result.serverError || "Une erreur est survenue sur le serveur.");
        console.error("SERVER ERROR:", result.serverError);
        return;
      }

      if (result?.validationErrors) {
        toast.error("Veuillez vérifier les informations saisies.");
        console.log("Validation errors:", result.validationErrors);
        return;
      }

      // Update session to reflect new role and vendeurId
      await update({
        role: "VENDEUR",
        vendeurId: result?.data?.vendeur?.id,
      });

      toast.success("Profil vendeur créé avec succès !");
      router.push("/boutiques");
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue lors de la création de votre profil.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="w-full max-w-2xl"
      >
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand/10 text-brand">
            <Rocket className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Presque prêt.
          </h1>
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            Configurez votre profil vendeur pour commencer à créer vos boutiques.
          </p>
        </div>

        <Card className="overflow-hidden border-none bg-card/50 shadow-2xl backdrop-blur-xl">
          <CardContent className="p-8 md:p-12">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="prenom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Prénom</FormLabel>
                        <FormControl>
                          <Input placeholder="Jean" className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} />
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
                        <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nom</FormLabel>
                        <FormControl>
                          <Input placeholder="Dupont" className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email professionnel</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@boutique.com" className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="telephone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Téléphone</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+221 77 383 13 64" 
                            className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" 
                            {...field} 
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateNaissance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Date de naissance</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" 
                            {...field} 
                            value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value) : ""}
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
                      <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Adresse complète</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Quartier, Ville, Pays" 
                          className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" 
                          {...field} 
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  variant="brand"
                  size="xl"
                  className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-brand/20"
                  loading={loading}
                >
                  {loading ? "Création du profil…" : "Lancer mon activité"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
