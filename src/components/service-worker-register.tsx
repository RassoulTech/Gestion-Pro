"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker (fondation PWA / hors-ligne).
 * Monté une fois dans le layout racine. Sans effet visuel.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("Échec d'enregistrement du service worker :", err);
      });
    };
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
