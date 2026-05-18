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
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        {!success && !error && (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-brand mx-auto" />
            <h1 className="text-2xl font-bold">Vérification de votre email...</h1>
            <p className="text-muted-foreground">Un instant s&apos;il vous plaît.</p>
          </div>
        )}

        {success && (
          <div className="space-y-4">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
            <h1 className="text-2xl font-bold text-success">Email vérifié !</h1>
            <p className="text-muted-foreground">{success}</p>
            <p className="text-xs text-muted-foreground italic">Redirection vers la page de connexion...</p>
            <Button asChild variant="brand" className="mt-4">
              <Link href="/login">Se connecter maintenant</Link>
            </Button>
          </div>
        )}

        {error && (
          <div className="space-y-4">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-destructive">Oups !</h1>
            <p className="text-muted-foreground">{error}</p>
            <Button asChild variant="outline" className="mt-4">
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
