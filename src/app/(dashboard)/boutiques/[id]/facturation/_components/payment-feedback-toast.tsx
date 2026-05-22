"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

export function PaymentFeedbackToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const success = searchParams.get("success");
    
    if (success === "true") {
      toast.success("Paiement réussi", {
        description: "Votre abonnement a été mis à jour avec succès.",
      });
      // Remove query param
      router.replace(pathname, { scroll: false });
    } else if (success === "false") {
      toast.error("Échec du paiement", {
        description: "Le paiement a été annulé ou a échoué. Aucun frais n'a été appliqué.",
      });
      // Remove query param
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  return null;
}
