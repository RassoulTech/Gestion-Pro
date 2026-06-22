import { FlaskConical } from "lucide-react";
import { isPaytechSandbox } from "@/lib/paytech";

/**
 * Mention discrète signalant que les paiements passent par l'environnement de
 * TEST PayTech. Composant serveur : ne s'affiche QU'EN mode sandbox (rien en live).
 * À placer sur les écrans liés au paiement (checkout, succès, annulation, facturation).
 */
export function PaytechSandboxBadge() {
  if (!isPaytechSandbox()) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-50/95 px-4 py-2 text-[11px] font-bold text-amber-800 shadow-lg backdrop-blur dark:border-amber-500/30 dark:bg-amber-950/80 dark:text-amber-300">
      <FlaskConical className="h-3.5 w-3.5 shrink-0" />
        Paiement effectué dans l&apos;environnement de test PayTech.
      </div>
    </div>
  );
}
