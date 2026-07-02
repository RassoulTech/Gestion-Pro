"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { verifyEmail } from "@/server/actions/auth.actions";
import { Button } from "@/components/ui/button";

const EASE = [0.16, 1, 0.3, 1] as const;

function VerifyEmailInner() {
  const t = useTranslations("auth");
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const status = searchParams.get("status");
  const boutiqueId = searchParams.get("boutiqueId");
  const [loginHref, setLoginHref] = useState("/login");
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    // Flux principal : la route serveur /api/verify-email a déjà validé le token
    // et nous redirige avec ?status=success|expired|invalid|error.
    if (status) {
      if (status === "success") {
        setSuccess(t("verify.statusSuccess"));
        // Après connexion, atterrissage DIRECT dans la boutique (son Tableau de
        // bord) grâce au callbackUrl. La connexion reste requise (sécurité).
        const next = boutiqueId ? `/boutiques/${boutiqueId}` : "/boutiques";
        const href = `/login?verified=1&callbackUrl=${encodeURIComponent(next)}`;
        setLoginHref(href);
        setTimeout(() => router.push(href), 2000);
      } else if (status === "expired") {
        setError(t("verify.statusExpired"));
      } else if (status === "invalid") {
        setError(t("verify.statusInvalid"));
      } else {
        setError(t("verify.statusError"));
      }
      return;
    }

    // Flux hérité : un token brut est présent dans l'URL (anciens e-mails).
    if (!token) {
      setError(t("verify.tokenMissing"));
      return;
    }

    (async () => {
      try {
        const result = await verifyEmail({ token });
        if (result?.serverError) {
          setError(result.serverError);
        } else if (result?.data?.success) {
          setSuccess(result.data.success);
          setLoginHref("/login?verified=1");
          setTimeout(() => router.push("/login?verified=1"), 3000);
        }
      } catch {
        setError(t("genericError"));
      }
    })();
  }, [token, status, boutiqueId, router, t]);

  return (
    <div className="flex flex-col items-center justify-center space-y-8 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="w-full"
      >
        {!success && !error && (
          <div className="space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-600/10 border border-orange-500/20 shadow-inner">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600 dark:text-orange-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{t("verify.verifying")}</h1>
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t("verify.verifyingDesc")}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-inner">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{t("verify.successTitle")}</h1>
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 leading-relaxed">{success}</p>
              <p className="text-xs text-zinc-400 font-semibold italic">{t("verify.redirecting")}</p>
            </div>
            <Button asChild variant="brand" className="w-full h-14 rounded-2xl font-black text-base shadow-xl shadow-orange-600/20 bg-orange-600 text-white hover:bg-orange-700 border-none transition-all active-press mt-2">
              <Link href={loginHref}>{t("verify.signinNow")}</Link>
            </Button>
          </div>
        )}

        {error && (
          <div className="space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20 shadow-inner">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-destructive">{t("verify.errorTitle")}</h1>
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 leading-relaxed">{error}</p>
            </div>
            <Button asChild variant="outline" className="w-full h-14 rounded-2xl font-black text-base border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all active-press mt-2">
              <Link href="/register">{t("verify.backToRegister")}</Link>
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function VerifyEmailFallback() {
  const t = useTranslations("auth");
  return (
    <div className="flex flex-col items-center justify-center space-y-4 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-brand mx-auto" />
      <h1 className="text-2xl font-bold">{t("verify.verifying")}</h1>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailInner />
    </Suspense>
  );
}
