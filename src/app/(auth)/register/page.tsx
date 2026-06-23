"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
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
import { PasswordInput } from "@/components/auth/password-input";
import { GoogleButton } from "@/components/auth/google-button";
import { BrandLogo } from "@/components/brand-logo";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function RegisterPage() {
  const t = useTranslations("auth");
  const [loading, setLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [emailFailed, setEmailFailed] = useState<boolean>(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (!oauthError) return;
    const map: Record<string, string> = {
      OAuthSignin: t("oauth.registerSignin"),
      OAuthCallback: t("oauth.callback"),
      OAuthCreateAccount: t("oauth.createAccount"),
      OAuthAccountNotLinked: t("oauth.accountNotLinked"),
      Callback: t("oauth.callbackGeneric"),
      AccessDenied: t("oauth.accessDenied"),
      Configuration: t("oauth.registerConfiguration"),
    };
    toast.error(map[oauthError] ?? t("oauth.registerFallback"));
  }, [searchParams, t]);

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
      toast.error(t("genericError"));
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
            {emailFailed ? t("register.successTitleFailed") : t("register.successTitle")}
          </h1>
          <p className="text-base font-medium text-muted-foreground leading-relaxed">
            {emailFailed
              ? t.rich("register.successTextFailed", {
                  b: (chunks) => (
                    <span className="font-bold text-destructive">{chunks}</span>
                  ),
                })
              : t.rich("register.successText", {
                  email: sentEmail,
                  b: (chunks) => (
                    <span className="font-bold text-foreground">{chunks}</span>
                  ),
                })}
          </p>
          {!emailFailed && (
            <p className="text-xs font-medium text-muted-foreground/80 italic">
              {t("register.checkSpam")}
            </p>
          )}
        </div>

        {devLink && (
          <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-left space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-warning">
              {t("devModeTitle")}
            </p>
            <p className="text-xs font-medium text-muted-foreground leading-relaxed">
              {t("register.devModeText")}
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
          {t("register.notReceived")}{" "}
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
            {t("resendLink")}
          </button>
        </p>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("register.backToLogin")}
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
      <div className="space-y-3 flex flex-col items-center text-center">
        <BrandLogo size={64} className="mb-4 shadow-xl shadow-brand/20 rounded-2xl" />
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          {t("register.title")}
        </h1>
        <p className="text-base font-medium text-muted-foreground">
          {t("register.subtitle")}
        </p>
      </div>

      <GoogleButton label={t("register.googleLabel")} enabled={true} />

      <div className="relative">
        <Separator className="opacity-50" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card/10 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground border border-white/5">
          {t("orEmail")}
        </span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t("register.nameLabel")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("register.namePlaceholder")}
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
                <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t("register.emailLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t("register.emailPlaceholder")}
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
                <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t("register.passwordLabel")}</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="new-password"
                    placeholder={t("register.passwordPlaceholder")}
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
                <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t("register.confirmLabel")}</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="new-password"
                    placeholder={t("register.confirmPlaceholder")}
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
            {loading ? t("register.submitting") : t("register.submit")}
          </Button>

          <p className="text-center text-[10px] font-bold leading-relaxed text-muted-foreground uppercase tracking-wider">
            {t.rich("register.terms", {
              cgu: (chunks) => (
                <Link href="/cgu" className="text-brand hover:underline">{chunks}</Link>
              ),
              privacy: (chunks) => (
                <Link href="/confidentialite" className="text-brand hover:underline">{chunks}</Link>
              ),
            })}
          </p>
        </form>
      </Form>

      <p className="text-center text-sm font-bold text-muted-foreground">
        {t("register.alreadyMember")}{" "}
        <Link
          href="/login"
          className="text-brand hover:underline underline-offset-4"
        >
          {t("register.signin")}
        </Link>
      </p>
    </motion.div>
  );
}
