"use client";

import { useState, useEffect, useCallback } from "react";

export interface CartItem {
  produitId: string;
  boutiqueSlug: string;
  boutiqueNom: string;
  nom: string;
  prixUnitaire: number;
  photo: string | null;
  quantite: number;
}

const STORAGE_KEY = "gestionpro-cart";

type Listener = () => void;
const listeners = new Set<Listener>();

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(readCart());
    const onChange = () => setItems(readCart());
    listeners.add(onChange);
    return () => { listeners.delete(onChange); };
  }, []);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantite">, qty = 1) => {
      const current = readCart();
      const idx = current.findIndex((i) => i.produitId === item.produitId);
      if (idx >= 0) {
        const existing = current[idx]!;
        current[idx] = { ...existing, quantite: existing.quantite + qty };
      } else {
        current.push({ ...item, quantite: qty });
      }
      writeCart(current);
    },
    []
  );

  const removeItem = useCallback((produitId: string) => {
    writeCart(readCart().filter((i) => i.produitId !== produitId));
  }, []);

  const updateQuantity = useCallback((produitId: string, quantite: number) => {
    if (quantite <= 0) {
      writeCart(readCart().filter((i) => i.produitId !== produitId));
      return;
    }
    const current = readCart();
    const idx = current.findIndex((i) => i.produitId === produitId);
    if (idx >= 0) {
      const existing = current[idx]!;
      current[idx] = { ...existing, quantite };
      writeCart(current);
    }
  }, []);

  const clearCart = useCallback(() => {
    writeCart([]);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantite, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.prixUnitaire * i.quantite, 0);

  return { items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice };
}
