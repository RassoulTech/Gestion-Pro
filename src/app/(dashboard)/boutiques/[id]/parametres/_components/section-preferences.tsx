"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Languages, Clock4, CalendarDays, Coins, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateVendeurPreferences } from "@/server/actions/user.actions";

const prefSchema = z.object({
  langue: z.string().min(1),
  timezone: z.string().min(1),
  dateFormat: z.string().min(1),
  currencyFormat: z.string().min(1),
});

type PrefInput = z.infer<typeof prefSchema>;

const LANGUES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

const TIMEZONES = [
  { value: "UTC", label: "UTC (Universel)" },
  { value: "Africa/Dakar", label: "Dakar (GMT+0)" },
  { value: "Africa/Abidjan", label: "Abidjan (GMT+0)" },
  { value: "Africa/Casablanca", label: "Casablanca (GMT+1)" },
  { value: "Africa/Lagos", label: "Lagos (GMT+1)" },
  { value: "Europe/Paris", label: "Paris (GMT+1/+2)" },
];

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "31/12/2025" },
  { value: "YYYY-MM-DD", label: "2025-12-31" },
  { value: "MM/DD/YYYY", label: "12/31/2025" },
  { value: "DD MMM YYYY", label: "31 déc. 2025" },
];

const CURRENCIES = [
  { value: "FCFA", label: "FCFA (XOF / XAF)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "USD", label: "Dollar ($)" },
  { value: "MAD", label: "Dirham (MAD)" },
];

interface Props {
  initial: PrefInput;
}

export function SectionPreferences({ initial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<PrefInput>({
    resolver: zodResolver(prefSchema),
    defaultValues: initial,
  });

  async function onSubmit(values: PrefInput) {
    setLoading(true);
    try {
      const result = await updateVendeurPreferences(values);
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success("Préférences enregistrées");
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="langue"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Languages className="h-3.5 w-3.5 text-zinc-400" /> Langue
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-brand">
                      <SelectValue placeholder="Choisir une langue" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LANGUES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Clock4 className="h-3.5 w-3.5 text-zinc-400" /> Fuseau horaire
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-brand">
                      <SelectValue placeholder="Choisir un fuseau" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateFormat"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-zinc-400" /> Format date
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-brand">
                      <SelectValue placeholder="Choisir un format" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DATE_FORMATS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currencyFormat"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-zinc-400" /> Devise
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-brand">
                      <SelectValue placeholder="Choisir une devise" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          Enregistrer les préférences
        </Button>
      </form>
    </Form>
  );
}
