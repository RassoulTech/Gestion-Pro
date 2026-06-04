import { z } from "zod";

/** Une ligne de facture : soit liée à un produit, soit 100 % personnalisée. */
export const ligneFactureSchema = z.object({
  produitId: z.string().optional().nullable(),
  designation: z.string().min(1, "Désignation requise").max(200),
  quantite: z.number().int().min(1, "Quantité minimum : 1"),
  prixUnitaire: z.number().min(0, "Prix invalide"),
});

export const factureStatuts = ["BROUILLON", "PAYEE", "IMPAYEE", "ANNULEE"] as const;

export const createFactureSchema = z.object({
  // Client existant (optionnel) — sinon on stocke un snapshot saisi à la volée.
  clientId: z.string().optional().nullable(),
  clientNom: z.string().max(120).optional().nullable(),
  clientTelephone: z.string().max(40).optional().nullable(),
  clientEmail: z.string().max(120).optional().nullable(),
  clientAdresse: z.string().max(200).optional().nullable(),

  date: z.string().optional(),
  statut: z.enum(factureStatuts).optional(),
  remise: z.number().min(0).optional(),
  tauxTva: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional().nullable(),
  deduireStock: z.boolean().optional(),

  lignes: z.array(ligneFactureSchema).min(1, "Au moins une ligne requise"),
});

export const updateFactureStatutSchema = z.object({
  statut: z.enum(factureStatuts),
});

export type CreateFactureInput = z.infer<typeof createFactureSchema>;
export type LigneFactureInput = z.infer<typeof ligneFactureSchema>;
export type FactureStatut = (typeof factureStatuts)[number];
