"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { createStripePortalSession } from "@/server/actions/subscription.actions";
import { RefreshCw, ExternalLink } from "lucide-react";

interface ManageStripeButtonProps {
  hasStripeCustomer: boolean;
}

export function ManageStripeButton({ hasStripeCustomer }: ManageStripeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManageBilling = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await createStripePortalSession();
      
      if (result?.data?.url) {
        window.location.href = result.data.url;
      } else {
        throw new Error(result?.serverError || "Impossible de générer le lien de facturation Stripe.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      console.error("Stripe Portal Error:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!hasStripeCustomer) {
    return (
      <Button disabled variant="outline" className="w-full sm:w-auto font-black rounded-xl">
        Aucun compte Stripe actif
      </Button>
    );
  }

  return (
    <div className="w-full sm:w-auto space-y-2">
      <Button
        onClick={handleManageBilling}
        disabled={loading}
        variant="brand"
        className="w-full sm:w-auto font-black shadow-lg shadow-brand/20 hover:scale-[1.02] transition-transform h-12 rounded-xl"
      >
        {loading ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Redirection...
          </>
        ) : (
          <>
            Gérer mon abonnement Stripe
            <ExternalLink className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
      {error && <p className="text-xs font-bold text-rose-500">{error}</p>}
    </div>
  );
}
