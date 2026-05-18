/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { 
 
  User, 
  ArrowLeft, 
  Save, 
  Phone, 
  Mail, 
  MapPin, 
  Loader2 
} from "lucide-react";
 
import { motion } from "framer-motion";
import Link from "next/link";

import { createClient } from "@/server/actions/client.actions";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const clientSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().optional().or(z.literal("")),
  telephone: z.string().optional().or(z.literal("")),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  adresse: z.string().optional().or(z.literal("")),
});

interface NewClientPageProps {
  params: Promise<{ id: string }>;
}

export default function NewClientPage({ params }: NewClientPageProps) {
  const { id: boutiqueId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      telephone: "",
      email: "",
      adresse: "",
    },
  });

  async function onSubmit(data: z.infer<typeof clientSchema>) {
    setLoading(true);
    try {
      const result = await createClient({
        boutiqueId,
        ...data,
 
      } as any);

      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }

      toast.success("Client ajouté avec succès !");
      router.push(`/boutiques/${boutiqueId}/clients`);
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-8 px-4">
      <div className="mb-8 flex items-center gap-4">
        <Button asChild variant="ghost" className="rounded-full h-12 w-12 p-0">
          <Link href={`/boutiques/${boutiqueId}/clients`}>
            <ArrowLeft className="h-6 w-6" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Nouveau Client</h1>
          <p className="text-muted-foreground font-medium">Ajoutez un client à votre base de données.</p>
        </div>
      </div>

      <Card className="border-none bg-white dark:bg-zinc-900 shadow-2xl rounded-[3rem] overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-xl font-black">Informations Personnelles</CardTitle>
          <CardDescription className="font-bold">Saisissez les détails du client pour faciliter le suivi.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="prenom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prénom</FormLabel>
                      <FormControl>
                        <Input placeholder="Prénom" className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-bold" {...field} />
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
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nom *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de famille" className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-bold" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="telephone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Phone className="h-3 w-3" /> Téléphone
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="+221 ..." className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-bold" {...field} />
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
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Mail className="h-3 w-3" /> Email
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="client@email.com" className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-bold" {...field} />
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
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-3 w-3" /> Adresse
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Quartier, Ville" className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-bold" {...field} />
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
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-5 w-5" />
                )}
                Enregistrer le client
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
