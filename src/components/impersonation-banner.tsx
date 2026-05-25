"use client";

import { stopImpersonating } from "@/server/actions/admin.actions";
import { useTransition } from "react";
import { AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ImpersonationBanner({ userName }: { userName: string | null }) {
  const [isPending, startTransition] = useTransition();

  const handleExit = () => {
    startTransition(async () => {
      await stopImpersonating();
      window.location.href = "/admin/vendeurs";
    });
  };

  return (
    <div className="bg-red-500 text-white w-full py-2 px-4 flex items-center justify-center gap-4 fixed top-0 z-[100] shadow-md shadow-red-500/20">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="text-sm font-medium">
        Mode Super-Admin actif : Vous naviguez en tant que <strong>{userName}</strong>.
      </span>
      <Button
        variant="secondary"
        size="sm"
        className="h-7 text-xs font-bold text-red-600 bg-white hover:bg-red-50"
        onClick={handleExit}
        disabled={isPending}
      >
        <LogOut className="h-3 w-3 mr-1.5" />
        Quitter
      </Button>
    </div>
  );
}
