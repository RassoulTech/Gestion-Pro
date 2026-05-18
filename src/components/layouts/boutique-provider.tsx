"use client";

import React, { createContext, useContext } from "react";

export type BoutiqueContextValue = {
  id: string;
  nom: string;
  slug: string;
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
