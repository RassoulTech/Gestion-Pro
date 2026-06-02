"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Save, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateAccountSecurity } from "@/server/actions/user.actions";

const compteSchema = z
  .object({
    email: z.string().email("Email invalide"),
    oldPassword: z.string().optional().or(z.literal("")),
    newPassword: z.string().optional().or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .refine(
    (d) => !d.newPassword || d.newPassword.length >= 8,
    { path: ["newPassword"], message: "Au moins 8 caractères" }
  )
  .refine(
    (d) => !d.newPassword || d.newPassword === d.confirmPassword,
    { path: ["confirmPassword"], message: "Les mots de passe ne correspondent pas" }
  )
  .refine(
    (d) => !d.newPassword || !!d.oldPassword,
    { path: ["oldPassword"], message: "Requis pour changer le mot de passe" }
  );

type CompteInput = z.infer<typeof compteSchema>;

interface Props {
  initial: {
    email: string;
    hasPassword: boolean;
  };
}

export function SectionCompte({ initial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<CompteInput>({
    resolver: zodResolver(compteSchema),
    defaultValues: {
      email: initial.email,
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: CompteInput) {
    setLoading(true);
    try {
      const result = await updateAccountSecurity(values);
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success("Compte mis à jour avec succès");
      form.reset({
        email: values.email,
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
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
            <Mail className="h-3 w-3" /> Adresse email
          </h3>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Email de connexion</FormLabel>
                <FormControl>
                  <Input type="email" className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 font-semibold text-sm focus:ring-2 focus:ring-brand" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <Lock className="h-3 w-3" /> Mot de passe
          </h3>

          {!initial.hasPassword && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                Votre compte n&apos;a pas encore de mot de passe (connexion OAuth). Définissez-en un pour activer la connexion par email.
              </p>
            </div>
          )}

          {initial.hasPassword && (
            <FormField
              control={form.control}
              name="oldPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Ancien mot de passe</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showOld ? "text" : "password"}
                        autoComplete="current-password"
                        className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 pr-12 font-semibold text-sm focus:ring-2 focus:ring-brand"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowOld((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      >
                        {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Nouveau mot de passe</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showNew ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Min. 8 caractères"
                        className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 pr-12 font-semibold text-sm focus:ring-2 focus:ring-brand"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      >
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Confirmation</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-none px-4 pr-12 font-semibold text-sm focus:ring-2 focus:ring-brand"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl font-bold text-sm bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-brand dark:hover:bg-brand/90"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Mettre à jour le compte
        </Button>
      </form>
    </Form>
  );
}
