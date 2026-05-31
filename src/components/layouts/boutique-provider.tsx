"use client";

import React, { createContext, useContext } from "react";

export type BoutiquePlanInfo = {
  codePlan: "STARTER" | "PRO" | "ENTERPRISE";
  nom: string;
  isActive: boolean;
};

export type BoutiqueContextValue = {
  id: string;
  nom: string;
  slug: string;
  logo: string | null;
  secteurActivite: string | null;
  description: string | null;
  plan: BoutiquePlanInfo;
};

const BoutiqueContext = createContext<BoutiqueContextValue | null>(null);

export function BoutiqueProvider({
  children,
  boutique,
}: {
  children: React.ReactNode;
  boutique: BoutiqueContextValue;
}) {
  return (
    <BoutiqueContext.Provider value={boutique}>
      {children}
    </BoutiqueContext.Provider>
  );
}

export function useBoutique(): BoutiqueContextValue {
  const ctx = useContext(BoutiqueContext);
  if (!ctx) {
    throw new Error("useBoutique must be used within a BoutiqueProvider");
  }
  return ctx;
}
