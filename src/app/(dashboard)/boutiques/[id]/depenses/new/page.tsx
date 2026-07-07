"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Save, 
  Calendar, 
  Loader2 
} from "lucide-react";
import Link from "next/link";

import { createDepense } from "@/server/actions/depense.actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const depenseSchema = z.object({
  libelle: z.string().min(1, "Le libellé est requis"),
  montant: z.coerce.number().min(0, "Le montant doit être positif"),
  categorie: z.string().min(1, "La catégorie est requise"),
  date: z.string().optional().or(z.literal("")),
});

const CATEGORIES = [
  "LOYER",
  "ELECTRICITE",
  "EAU",
  "TRANSPORT",
  "SALAIRE",
  "MARKETING",
  "AUTRE",
];

interface NewDepensePageProps {
  params: Promise<{ id: string }>;
}

export default function NewDepensePage({ params }: NewDepensePageProps) {
  const { id: boutiqueId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof depenseSchema>>({
    resolver: zodResolver(depenseSchema),
    defaultValues: {
      libelle: "",
      montant: 0,
      categorie: "AUTRE",
      date: new Date().toISOString().split("T")[0],
    },
  });

  async function onSubmit(data: z.infer<typeof depenseSchema>) {
    setLoading(true);
    try {
      const result = await createDepense({
        boutiqueId,
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      });

      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }

      toast.success("Dépense enregistrée !");
      router.push(`/boutiques/${boutiqueId}/depenses`);
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
          <Link href={`/boutiques/${boutiqueId}/depenses`}>
            <ArrowLeft className="h-6 w-6" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Nouvelle Dépense</h1>
          <p className="text-muted-foreground font-medium">Enregistrez un coût lié à votre activité.</p>
        </div>
      </div>

      <Card className="border-none bg-white dark:bg-zinc-900 shadow-2xl rounded-[3rem] overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-xl font-black">Détails de la dépense</CardTitle>
          <CardDescription className="font-bold">Soyez précis pour une meilleure comptabilité.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="libelle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Libellé *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Loyer du mois de Mars" className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none px-6 font-black" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="montant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Montant (FCFA) *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none px-6 font-black text-red-500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categorie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Catégorie *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none px-6 font-black">
                            <SelectValue placeholder="Catégorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat} className="rounded-xl font-bold">
                              {cat}
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3 w-3" /> Date de la dépense
                    </FormLabel>
                    <FormControl>
                      <Input type="date" className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none px-6 font-black" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                variant="brand" 
                size="xl" 
                className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-brand/20 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-brand"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  <Save className="mr-2 h-6 w-6" />
                )}
                Enregistrer la dépense
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
