"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, MailCheck } from "lucide-react";

import { registerSchema, type RegisterInput } from "@/schemas/auth.schema";
import { registerUser, resendVerificationEmail } from "@/server/actions/auth.actions";
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

const EASE = [0.16, 1, 0.3, 1] as const;

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Impossible de démarrer l'inscription Google. Réessayez.",
  OAuthCallback: "Échec du retour Google. Vérifiez votre connexion et réessayez.",
  OAuthCreateAccount: "Impossible de créer le compte Google. Contactez le support.",
  OAuthAccountNotLinked:
    "Cette adresse est déjà utilisée avec une autre méthode de connexion.",
  Callback: "Erreur de callback. Veuillez réessayer.",
  AccessDenied: "Accès refusé par Google.",
  Configuration:
    "Inscription Google indisponible : configuration côté serveur incomplète.",
};

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [emailFailed, setEmailFailed] = useState<boolean>(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      toast.error(
        OAUTH_ERROR_MESSAGES[oauthError] ??
          "Une erreur est survenue lors de l'inscription."
      );
    }
  }, [searchParams]);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(data: RegisterInput) {
    setLoading(true);
    try {
      const result = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }

      if (result?.data?.success) {
        if (result.data.emailFailed) {
          toast.warning(result.data.success);
        } else {
          toast.success(result.data.success);
        }
        setSentEmail(data.email);
        setDevLink(result.data.devLink ?? null);
        setEmailFailed(result.data.emailFailed ?? false);
        form.reset();
      }
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  if (sentEmail) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: EASE }}
        className="space-y-8 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
          <MailCheck className="h-8 w-8 text-success" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            {emailFailed ? "Compte créé !" : "Vérifiez votre boîte mail"}
          </h1>
          <p className="text-base font-medium text-muted-foreground leading-relaxed">
            {emailFailed ? (
              <>
                Votre compte a bien été créé, mais <span className="font-bold text-destructive">notre serveur d'email est indisponible</span> pour le moment.
                Votre compte a bien été créé, mais <span className="font-bold text-destructive">notre serveur d&apos;email est indisponible</span> pour le moment.
                <br />Vous pourrez demander un nouveau lien de vérification plus tard.
              </>
            ) : (
              <>
                Nous venons d&apos;envoyer un lien d&apos;activation à{" "}
                <span className="font-bold text-foreground">{sentEmail}</span>.
                Gérez votre commerce en toute simplicité. Suivez vos ventes, vos stocks et développez votre activité.
              </>
            )}
          </p>
          {!emailFailed && (
            <p className="text-xs font-medium text-muted-foreground/80 italic">
              Pensez à vérifier vos spams.
            </p>
          )}
        </div>

        {devLink && (
          <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-left space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-warning">
              Mode développement
            </p>
            <p className="text-xs font-medium text-muted-foreground leading-relaxed">
              Aucun service email n&apos;est configuré (AUTH_RESEND_KEY vide).
              Cliquez sur le lien ci-dessous pour vérifier votre compte :
            </p>
            <Link
              href={devLink}
              className="block break-all rounded-lg bg-foreground/5 px-3 py-2 text-xs font-bold text-brand hover:bg-foreground/10"
            >
              {devLink}
            </Link>
          </div>
        )}

        <p className="text-sm font-bold text-muted-foreground">
          Pas reçu ?{" "}
          <button
            type="button"
            onClick={async () => {
              const r = await resendVerificationEmail({ email: sentEmail });
              if (r?.data?.success) {
                if (r.data.emailFailed) {
                  toast.warning(r.data.success);
                } else {
                  toast.success(r.data.success);
                  setEmailFailed(false);
                }
                if (r.data.devLink) setDevLink(r.data.devLink);
              } else if (r?.serverError) toast.error(r.serverError);
            }}
            className="text-brand hover:underline underline-offset-4"
          >
            Renvoyer le lien
          </button>
        </p>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la connexion
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
          Bienvenue.
        </h1>
        <p className="text-base font-medium text-muted-foreground">
          Propulsez votre commerce vers de nouveaux sommets dès aujourd&apos;hui.
        </p>
      </div>

      <GoogleButton label="S'inscrire avec Google" enabled={true} />

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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nom complet</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Votre nom"
                    autoComplete="name"
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
                <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Mot de passe</FormLabel>
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
                <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Confirmer</FormLabel>
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
            {loading ? "Création…" : "Créer mon compte"}
          </Button>

          <p className="text-center text-[10px] font-bold leading-relaxed text-muted-foreground uppercase tracking-wider">
            En continuant, vous acceptez nos{" "}
            <Link href="/cgu" className="text-brand hover:underline">CGU</Link>
            {" "}et notre{" "}
            <Link href="/confidentialite" className="text-brand hover:underline">politique de confidentialité</Link>.
          </p>
        </form>
      </Form>

      <p className="text-center text-sm font-bold text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link
          href="/login"
          className="text-brand hover:underline underline-offset-4"
        >
          Se connecter
        </Link>
      </p>
    </motion.div>
  );
}
