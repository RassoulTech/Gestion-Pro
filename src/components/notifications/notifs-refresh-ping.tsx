"use client";

import { useEffect } from "react";

/**
 * Micro-composant monté par les pages qui marquent des notifications « lues au
 * passage » côté serveur : signale à la cloche (header) de rafraîchir son
 * compteur IMMÉDIATEMENT, sans attendre le poll de 45 s.
 */
export function NotifsRefreshPing() {
  useEffect(() => {
    window.dispatchEvent(new Event("gp:notifs-refresh"));
  }, []);
  return null;
}
