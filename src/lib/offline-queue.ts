/**
 * File d'attente locale des ventes POS réalisées hors-ligne (IndexedDB).
 *
 * Chaque vente est stockée avec son `code` généré côté client — qui sert de
 * clé d'idempotence : à la synchronisation, la contrainte serveur
 * `@@unique([boutiqueId, code])` empêche tout doublon si une vente est rejouée.
 *
 * API navigateur pure (aucune dépendance). Sans effet côté serveur (SSR-safe :
 * toutes les fonctions échouent proprement si IndexedDB est indisponible).
 */
import type { CreateCommandeClientInput } from "@/schemas/commande.schema";

const DB_NAME = "gestionpro-offline";
const STORE = "ventes";
const DB_VERSION = 1;

export interface QueuedSale {
  /** Code de commande = clé primaire + clé d'idempotence. */
  code: string;
  boutiqueId: string;
  /** Payload exact attendu par l'action createCommandeClient. */
  data: CreateCommandeClientInput;
  /** Données du ticket (pour réimpression éventuelle). */
  ticket?: unknown;
  createdAt: number;
}

function hasIDB(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "code" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = run(transaction.objectStore(STORE));
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

/** Ajoute une vente à la file hors-ligne. */
export async function enqueueSale(sale: QueuedSale): Promise<void> {
  if (!hasIDB()) throw new Error("Stockage hors-ligne indisponible sur cet appareil.");
  await tx("readwrite", (store) => store.put(sale));
}

/** Liste les ventes en attente (plus anciennes d'abord). */
export async function getQueuedSales(): Promise<QueuedSale[]> {
  if (!hasIDB()) return [];
  const all = await tx<QueuedSale[]>("readonly", (store) => store.getAll());
  return (all ?? []).sort((a, b) => a.createdAt - b.createdAt);
}

/** Retire une vente synchronisée de la file. */
export async function removeSale(code: string): Promise<void> {
  if (!hasIDB()) return;
  await tx("readwrite", (store) => store.delete(code));
}

/** Nombre de ventes en attente. */
export async function countQueuedSales(): Promise<number> {
  if (!hasIDB()) return 0;
  return tx<number>("readonly", (store) => store.count());
}
