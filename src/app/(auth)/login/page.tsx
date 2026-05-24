"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { loginSchema, type LoginInput } from "@/schemas/auth.schema";
import { loginPrecheck, resendVerificationEmail } from "@/server/actions/auth.actions";
import { MailWarning } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordInput } from "@/components/auth/password-input";
import { BrandLogo } from "@/components/brand-logo";

const EASE = [0.16, 1, 0.3, 1] as const;

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Impossible de démarrer la connexion Google. Réessayez.",
  OAuthCallback: "Échec du retour Google. Vérifiez votre connexion et réessayez.",
  OAuthCreateAccount: "Impossible de créer le compte Google. Contactez le support.",
  OAuthAccountNotLinked:
    "Cette adresse est déjà utilisée avec une autre méthode de connexion.",
  Callback: "Erreur de callback. Veuillez réessayer.",
  AccessDenied: "Accès refusé par Google.",
  Configuration:
    "Connexion Google indisponible : configuration côté serveur incomplète.",
  Verification: "Lien de vérification invalide ou expiré.",
};

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      toast.error(
        OAUTH_ERROR_MESSAGES[oauthError] ??
          "Une erreur est survenue lors de la connexion."
      );
    }
  }, [searchParams]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginInput) {
    setLoading(true);
    setNeedsVerification(null);
    setDevLink(null);
    try {
      const precheck = await loginPrecheck({
        email: data.email,
        password: data.password,
      });

      if (precheck?.serverError) {
        toast.error(precheck.serverError);
        return;
      }

      const status = precheck?.data?.status;

      if (status === "invalid_credentials") {
        toast.error("Email ou mot de passe incorrect.");
        return;
      }

      if (status === "needs_verification") {
        setNeedsVerification(data.email);
        setDevLink(precheck?.data?.devLink ?? null);
        if (precheck?.data?.emailFailed) {
          toast.warning("Email non vérifié. Le serveur d'email est actuellement indisponible.");
        } else {
          toast.info("Email non vérifié. Un nouveau lien vient d'être envoyé.");
        }
        return;
      }

      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Email ou mot de passe incorrect.");
        return;
      }

      router.push("/boutiques");
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, ease: EASE }}
      className="space-y-10"
    >
      <div className="space-y-3 flex flex-col items-center text-center">
        <BrandLogo size={64} className="mb-4 shadow-xl shadow-brand/20 rounded-2xl" />
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          Bon retour.
        </h1>
        <p className="text-base font-medium text-muted-foreground">
          Connectez-vous pour accéder à vos boutiques et gérer votre activité.
        </p>
      </div>

      {needsVerification && (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-5">
          <div className="flex items-start gap-3">
            <MailWarning className="h-5 w-5 shrink-0 text-warning mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-black text-foreground">
                Email non vérifié
              </p>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                Avant de vous connecter, confirmez votre adresse via le lien
                envoyé à <span className="font-bold text-foreground">{needsVerification}</span>.
              </p>
            </div>
          </div>
          {devLink && (
            <div className="w-full space-y-2 rounded-xl bg-foreground/5 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-warning">
                Mode développement
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                Pas de service email configuré — utilisez ce lien :
              </p>
              <Link
                href={devLink}
                className="block break-all rounded-lg bg-background/50 px-2 py-1.5 text-[11px] font-bold text-brand hover:bg-background"
              >
                {devLink}
              </Link>
            </div>
          )}
          <button
            type="button"
            onClick={async () => {
              const r = await resendVerificationEmail({ email: needsVerification });
              if (r?.data?.success) {
                if (r.data.emailFailed) {
                  toast.warning(r.data.success);
                } else {
                  toast.success(r.data.success);
                }
                if (r.data.devLink) setDevLink(r.data.devLink);
              } else if (r?.serverError) toast.error(r.serverError);
            }}
            className="text-xs font-bold text-brand hover:underline underline-offset-4"
          >
            Renvoyer le lien
          </button>
        </div>
      )}

      <GoogleButton enabled={true} />

      <div className="relative">
        <Separator className="opacity-50" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card/10 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground border border-white/5">
          ou via email
        </span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="votre@email.com"
                    autoComplete="email"
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Mot de passe
                  </FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-bold text-brand transition-colors hover:opacity-80"
                  >
                    Oublié ?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput
                    autoComplete="current-password"
                    placeholder="Votre mot de passe"
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
            {loading ? "Connexion…" : "Se connecter"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm font-bold text-muted-foreground">
        Nouveau sur GestionPro ?{" "}
        <Link
          href="/register"
          className="text-brand hover:underline underline-offset-4"
        >
          Créer un compte
        </Link>
      </p>
    </motion.div>
  );
}
