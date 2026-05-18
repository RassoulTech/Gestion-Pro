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
        initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: EASE }}
        className="space-y-8 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Lien invalide
          </h1>
          <p className="text-base font-medium text-muted-foreground leading-relaxed">
            Ce lien de réinitialisation est invalide ou a expiré.
            Veuillez en demander un nouveau.
          </p>
        </div>

        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90 shadow-xl shadow-brand/20"
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
        initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: EASE }}
        className="space-y-8 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Mot de passe modifié !
          </h1>
          <p className="text-base font-medium text-muted-foreground leading-relaxed">
            Votre mot de passe a été réinitialisé avec succès.
            Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
          </p>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90 shadow-xl shadow-brand/20"
        >
          Se connecter
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, ease: EASE }}
      className="space-y-10"
    >
      <div className="space-y-3">
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          Nouveau mot de passe
        </h1>
        <p className="text-base font-medium text-muted-foreground">
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
                <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Nouveau mot de passe
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="new-password"
                    placeholder="8 caractères minimum"
                    className="h-14 rounded-2xl bg-foreground/5 border-none px-6 text-base font-bold transition-all focus:bg-foreground/10"
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
                <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Confirmer
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="new-password"
                    placeholder="Retapez le mot de passe"
                    className="h-14 rounded-2xl bg-foreground/5 border-none px-6 text-base font-bold transition-all focus:bg-foreground/10"
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
            className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-brand/20 active-press"
            loading={loading}
          >
            {loading ? "Réinitialisation…" : "Réinitialiser"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm font-bold text-muted-foreground">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-brand hover:underline underline-offset-4"
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
