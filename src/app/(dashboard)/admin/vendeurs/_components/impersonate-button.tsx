"use client";

import { useTransition } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { impersonateVendeur } from "@/server/actions/admin.actions";
import { toast } from "sonner";

export function ImpersonateButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleImpersonate = () => {
    startTransition(async () => {
      const result = await impersonateVendeur(userId);
      if (result.success) {
        toast.success("Mode Super-Admin activé");
        window.location.href = "/dashboard";
      } else {
        toast.error("Erreur lors de la connexion");
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
      onClick={handleImpersonate}
      disabled={isPending}
      title="Se connecter en tant que ce vendeur"
    >
      <LogIn className="h-4 w-4" />
      <span className="sr-only">Se connecter en tant que</span>
    </Button>
  );
}
