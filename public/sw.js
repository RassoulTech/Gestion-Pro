/*
 * Service worker GestionPro — fondation hors-ligne CONSERVATRICE.
 *
 * Stratégie volontairement minimale et sûre :
 *  - network-first sur les NAVIGATIONS uniquement ; si le réseau échoue, on
 *    sert la page /offline mise en cache.
 *  - AUCUNE mise en cache des chunks JS/CSS/_next : pas de risque de servir un
 *    asset périmé après un déploiement (cause classique d'app « cassée »).
 *  - tout le reste passe directement au réseau (passthrough).
 *
 * La file d'attente des ventes hors-ligne (IndexedDB) est un chantier séparé
 * qui s'appuiera sur cette base.
 */
const CACHE = "gestionpro-shell-v1";
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icons/192", "/icons/512"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // On ne gère QUE les navigations (pages). Le reste (chunks, API, images)
  // part directement au réseau, sans cache.
  if (request.mode !== "navigate") return;

  event.respondWith(
    fetch(request).catch(() =>
      caches.match(OFFLINE_URL).then((cached) => cached || Response.error())
    )
  );
});
