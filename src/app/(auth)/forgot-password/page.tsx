"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, Mail } from "lucide-react";

import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/schemas/auth.schema";
import { forgotPassword } from "@/server/actions/auth.actions";
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

const EASE = [0.16, 1, 0.3, 1] as const;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setLoading(true);
    try {
      const result = await forgotPassword({ email: data.email });

      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }

      if (result?.data?.success) {
        setSent(true);
        setDevLink(result.data.devLink ?? null);
        toast.success(result.data.success);
      }
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }
  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: EASE }}
        className="space-y-8 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-600/10 border border-orange-500/20 shadow-inner">
          <Mail className="h-8 w-8 text-orange-600 dark:text-orange-400" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Email envoyé !
          </h1>
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation dans quelques instants.
          </p>
        </div>

        {devLink && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-left space-y-3 shadow-md">
            <p className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
              Mode développement
            </p>
            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Aucun service email n&apos;est configuré. Utilisez ce lien pour réinitialiser :
            </p>
            <Link
              href={devLink}
              className="block break-all rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-amber-500/20 px-3.5 py-2.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-white dark:hover:bg-zinc-950 transition-all shadow-sm"
            >
              {devLink}
            </Link>
          </div>
        )}

        <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
          Vous n&apos;avez rien reçu ?{" "}
          <button
            onClick={() => {
              setSent(false);
              setDevLink(null);
            }}
            className="text-orange-600 dark:text-orange-400 hover:underline underline-offset-4"
          >
            Renvoyer
          </button>
        </p>

        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 dark:text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Link>
        </div>
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
          Mot de passe oublié ?
        </h1>
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  Adresse email
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="votre@email.com"
                    autoComplete="email"
                    className="h-12 rounded-2xl border-none bg-zinc-100/50 dark:bg-zinc-950/40 px-5 text-sm font-bold transition-all focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50"
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
            className="w-full h-14 rounded-2xl font-black text-base shadow-xl shadow-orange-600/20 bg-orange-600 text-white hover:bg-orange-700 border-none transition-all active-press"
            loading={loading}
          >
            {loading ? "Envoi en cours…" : "Envoyer le lien"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm font-bold text-zinc-500 dark:text-zinc-400">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:underline underline-offset-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la connexion
        </Link>
      </p>
    </motion.div>
  );
}
