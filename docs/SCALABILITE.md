# Scalabilité & durabilité — feuille de route par paliers

> Audit du 2026-07-06. Objectif : savoir À L'AVANCE quoi faire à chaque palier,
> sans sur-ingénierie aujourd'hui. Relire ce document à chaque signal atteint.

## État de la base (fait au palier actuel)

- **Index critiques** (migration `add_scalability_indexes`, 2026-07-06) :
  `paiements(transaction_ref)`, `paiements(abonnement_id)`,
  `abonnements(vendeur_id, statut)`, `commandes_client(code)`,
  `commandes_client(user_id, created_at)`, `membres_boutique(vendeur_id)`
  — tous alignés dans `prisma/schema.prisma`.
- **Croissance des données** : le PDF de facture n'est PLUS stocké en base64 dans
  `commandes_client.invoice_pdf_url` (poids mort ~70-100 Ko/commande, jamais lu).
  Les PDF sont régénérés à la demande (`generate-invoice.ts`, déterministe).
- **Pooling** : PgBouncer (`?pgbouncer=true` sur DATABASE_URL) + singleton Prisma.
  DDL uniquement via DIRECT_URL ou Supabase (le pooler n'applique pas le DDL).
- **Déjà en place** : rate limiting Upstash (auth), `unstable_cache` (marketplace
  60 s / filtres 300 s), bundles lazy (xlsx, jspdf), Sentry, CSP.
- **Sans état local bloquant** : sessions = JWT (cookie), rate-limit = Upstash.
  Seule exception : cache quotas en `Map` mémoire (micro-cache TTL par lambda,
  acceptable — voir palier Croissance).

## Signaux à surveiller (regarder 1×/mois, Vercel Analytics + Supabase)

| Signal | Où le lire | Seuil de déclenchement |
|---|---|---|
| TTFB p95 des pages dashboard | Vercel → Analytics | > 800 ms soutenu |
| Requêtes DB lentes | Supabase → Query Performance | > 100 ms répétées |
| Lignes par boutique (produits/commandes) | `SELECT count(*) … GROUP BY boutique_id` | > ~2 000 lignes/boutique |
| Commandes payées / heure (pic) | table `commandes_client` | > ~50/h |
| Taille DB | Supabase → Database | > 1 Go |
| Erreurs 5xx | Sentry / Vercel logs | > 0,5 % des requêtes |

## Palier CROISSANCE (déclencher quand un signal ci-dessus est atteint)

1. **Pagination serveur des listes tenant** (produits, clients, commandes,
   mouvements) : `take`/`cursor` + recherche côté DB. Déclencheur : une boutique
   > 2 000 lignes ou TTFB > 800 ms.
2. **Images → Supabase Storage + URL** (fin du base64 en DB, cause racine =
   repli EROFS de `/api/upload` sur Vercel). Donne cache navigateur + CDN.
   Prévoir un script de migration des base64 existants. Déclencheur : avant
   toute campagne marketing, ou DB > 1 Go.
3. **File de traitement** (QStash/Inngest) pour e-mails + PDF du webhook IPN
   (aujourd'hui inline best-effort, jamais bloquant). Déclencheur : > 50
   commandes payées/h ou timeouts IPN.
4. **Cache quotas → Upstash** (remplace la Map mémoire) si des incohérences de
   quota apparaissent entre instances.
5. **Cache CDN des pages publiques** (landing, marketplace, boutiques publiques) :
   sortir `auth()`/`getLocale()` du layout racine pour rendre ces routes
   statiques/ISR. Levier n°1 de perf publique — chantier architectural, à faire
   sur une branche avec vérification EN + FR au runtime.

## Palier ÉCHELLE (des milliers de boutiques actives)

- Réplicas de lecture Supabase si p95 lecture > 100 ms après indexation/cache.
- Partitionnement par date de `activity_logs` / `mouvements_stock` (> 5 M lignes)
  + politique d'archivage (export annuel puis purge des logs > 24 mois).
- Service PDF séparé (worker dédié) si la génération dépasse ~1 000/jour.
- Multi-région Vercel + failover si SLA requis.

## Points de défaillance externes (comportements prévus)

| Service | Si indisponible | Comportement actuel |
|---|---|---|
| PayTech | Paiement en ligne impossible | Vente en boutique/à la livraison continue ; IPN rejouable (idempotent) |
| Resend | E-mails non envoyés | `MailResult {sent:false}` — jamais bloquant, loggé `RESEND_ERROR` |
| Upstash | Rate-limit indisponible | Auth continue (fail-open contrôlé) |
| Supabase | Panne totale | SPOF assumé — sauvegardes + PITR = la vraie parade |

## Routine de maintenance continue

- **Mensuel — dépendances** : `npm audit` + `npm outdated` ; patchs/mineurs par
  petits lots (`npm update`), tsc + build + EN runtime avant push ; majeurs UN
  par UN (voir mémoire « deps-majeurs-bloques » : zod 4, Next 16, Prisma 7 différés).
- **Mensuel — signaux** : relire le tableau ci-dessus (10 min).
- **Trimestriel — sauvegardes** : Supabase fait des backups quotidiens
  automatiques ; VÉRIFIER la restauration en restaurant sur un projet jetable
  (une sauvegarde jamais testée n'est pas une sauvegarde). Envisager PITR
  (plan payant) dès que l'app génère du revenu réel.
- **Tests** : vitest existant (`tests/`) sur PayTech config ; e2e suppression
  compte (`scripts/e2e-delete-account.ts`). À étoffer en priorité : inscription→
  vérification→boutique, checkout marketplace, IPN idempotent (rejeu), facture.
- **Docs** : ce fichier + les mémoires de session = décisions d'architecture.
  Mettre à jour à CHAQUE changement de palier.
