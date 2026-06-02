"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Bell, ShoppingBag, TrendingUp, Users, CreditCard, FileText, Mail, Loader2, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { updateVendeurNotifications } from "@/server/actions/user.actions";

const notifSchema = z.object({
  commandes: z.boolean(),
  ventes: z.boolean(),
  clients: z.boolean(),
  paiements: z.boolean(),
  rapports: z.boolean(),
  emails: z.boolean(),
});

type NotifInput = z.infer<typeof notifSchema>;

const ROWS: { key: keyof NotifInput; title: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "commandes", title: "Nouvelles commandes", desc: "Soyez alerté à chaque nouvelle commande client.", icon: ShoppingBag },
  { key: "ventes", title: "Nouvelles ventes", desc: "Notifications sur vos ventes journalières.", icon: TrendingUp },
  { key: "clients", title: "Nouveaux clients", desc: "Soyez prévenu quand un nouveau client est ajouté.", icon: Users },
  { key: "paiements", title: "Paiements", desc: "Confirmations de paiement et relances.", icon: CreditCard },
  { key: "rapports", title: "Rapports périodiques", desc: "Résumés hebdomadaires et mensuels.", icon: FileText },
  { key: "emails", title: "Emails système", desc: "Mises à jour produit, sécurité, conditions.", icon: Mail },
];

interface Props {
  initial: NotifInput;
}

export function SectionNotifications({ initial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<NotifInput>({
    resolver: zodResolver(notifSchema),
    defaultValues: initial,
  });

  async function onSubmit(values: NotifInput) {
    setLoading(true);
    try {
      const result = await updateVendeurNotifications(values);
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success("Préférences de notification enregistrées");
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
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <Bell className="h-3 w-3" /> Préférences
          </h3>
          <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
            {ROWS.map(({ key, title, desc, icon: Icon }) => (
              <FormField
                key={key}
                control={form.control}
                name={key}
                render={({ field }) => (
                  <FormItem className="flex items-start gap-3 p-4 sm:p-5 bg-zinc-50 dark:bg-zinc-950">
                    <div className="h-9 w-9 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">{title}</p>
                      <p className="text-[11px] font-medium text-zinc-500 mt-0.5">{desc}</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl font-bold text-sm bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-brand dark:hover:bg-brand/90"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Enregistrer les notifications
        </Button>
      </form>
    </Form>
  );
}
