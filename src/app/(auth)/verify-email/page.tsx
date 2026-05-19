"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { verifyEmail } from "@/server/actions/auth.actions";
import { Button } from "@/components/ui/button";

const EASE = [0.16, 1, 0.3, 1] as const;

function VerifyEmailInner() {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    if (!token) {
      setError("Jeton de vérification manquant.");
      return;
    }

    (async () => {
      try {
        const result = await verifyEmail({ token });
        if (result?.serverError) {
          setError(result.serverError);
        } else if (result?.data?.success) {
          setSuccess(result.data.success);
          setTimeout(() => router.push("/login"), 3000);
        }
      } catch {
        setError("Une erreur est survenue.");
      }
    })();
  }, [token, router]);

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
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20 shadow-inner">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">Vérification de votre email...</h1>
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Un court instant s&apos;il vous plaît pendant que nous validons vos informations.</p>
            </div>
          </div>
        )}

        {success && (
          <div className="space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-inner">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">Email vérifié !</h1>
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 leading-relaxed">{success}</p>
              <p className="text-xs text-zinc-400 font-semibold italic">Redirection vers la page de connexion...</p>
            </div>
            <Button asChild variant="brand" className="w-full h-14 rounded-2xl font-black text-base shadow-xl shadow-blue-600/20 bg-blue-600 text-white hover:bg-blue-700 border-none transition-all active-press mt-2">
              <Link href="/login">Se connecter maintenant</Link>
            </Button>
          </div>
        )}

        {error && (
          <div className="space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20 shadow-inner">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-destructive">Oups !</h1>
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 leading-relaxed">{error}</p>
            </div>
            <Button asChild variant="outline" className="w-full h-14 rounded-2xl font-black text-base border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all active-press mt-2">
              <Link href="/register">Retour à l&apos;inscription</Link>
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function VerifyEmailFallback() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-brand mx-auto" />
      <h1 className="text-2xl font-bold">Vérification de votre email...</h1>
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
