"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/schemas/auth.schema";
import { resetPassword } from "@/server/actions/auth.actions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/auth/password-input";

const EASE = [0.16, 1, 0.3, 1] as const;

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: token || "", password: "", confirmPassword: "" },
  });

  async function onSubmit(data: ResetPasswordInput) {
    setLoading(true);
    try {
      const result = await resetPassword({
        token: data.token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }

      if (result?.data?.success) {
        setSuccess(true);
        toast.success(result.data.success);
      }
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  // No token provided
  if (!token) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: EASE }}
        className="space-y-8 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20 shadow-inner">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Lien invalide
          </h1>
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Ce lien de réinitialisation est invalide ou a expiré. Veuillez en demander un nouveau.
          </p>
        </div>

        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-black text-white hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20"
        >
          Demander un nouveau lien
        </Link>
      </motion.div>
    );
  }

  // Success state
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: EASE }}
        className="space-y-8 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-inner">
          <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Mot de passe modifié !
          </h1>
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
          </p>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-black text-white hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20"
        >
          Se connecter
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, ease: EASE }}
      className="space-y-10"
    >
      <div className="space-y-3">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Nouveau mot de passe
        </h1>
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Choisissez un nouveau mot de passe sécurisé pour votre compte.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Nouveau mot de passe
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="new-password"
                    placeholder="8 caractères minimum"
                    className="h-12 rounded-2xl border-none bg-zinc-100/50 dark:bg-zinc-950/40 px-5 text-sm font-bold transition-all focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
                    {...field}
                  />
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
                <FormLabel className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Confirmer le mot de passe
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="new-password"
                    placeholder="Retapez le mot de passe"
                    className="h-12 rounded-2xl border-none bg-zinc-100/50 dark:bg-zinc-950/40 px-5 text-sm font-bold transition-all focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
                    {...field}
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
            className="w-full h-14 rounded-2xl font-black text-base shadow-xl shadow-blue-600/20 bg-blue-600 text-white hover:bg-blue-700 border-none transition-all active-press"
            loading={loading}
          >
            {loading ? "Réinitialisation…" : "Réinitialiser le mot de passe"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm font-bold text-zinc-500 dark:text-zinc-400">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline underline-offset-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la connexion
        </Link>
      </p>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-brand" />
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
