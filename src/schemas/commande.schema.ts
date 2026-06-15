import { z } from "zod";

const ligneCommandeSchema = z.object({
  produitId: z.string().min(1),
  quantite: z.number().int().min(1, "Quantité minimum: 1"),
  prixUnitaire: z.number().min(0),
});

export const createCommandeClientSchema = z.object({
  clientId: z.string().optional(),
  notes: z.string().max(500).optional(),
  remise: z.number().min(0).optional(),
  montantRecu: z.number().min(0).optional(),
  monnaieRendue: z.number().min(0).optional(),
  lignes: z.array(ligneCommandeSchema).min(1, "Au moins un produit requis"),
  date: z.string().optional(),
  etat: z.enum(["EN_ATTENTE", "VALIDEE", "LIVREE", "ANNULEE"]).optional(),
  modePaiement: z.string().optional(),
  /**
   * Code de commande généré côté client. Sert de clé d'idempotence pour la
   * synchronisation des ventes hors-ligne : la contrainte `@@unique([boutiqueId,
   * code])` empêche tout doublon si une vente en file est rejouée. Si absent,
   * le serveur en génère un.
   */
  clientCode: z.string().min(3).max(40).optional(),
});

export const updateEtatCommandeSchema = z.object({
  etat: z.enum(["EN_ATTENTE", "VALIDEE", "LIVREE", "ANNULEE"]),
});

export const createCommandeFournisseurSchema = z.object({
  fournisseurId: z.string().min(1, "Fournisseur requis"),
  notes: z.string().max(500).optional(),
  lignes: z.array(ligneCommandeSchema).min(1, "Au moins un produit requis"),
  date: z.string().optional(),
  etat: z.enum(["EN_ATTENTE", "VALIDEE", "LIVREE", "ANNULEE"]).optional(),
});

export const createVenteFlashSchema = z.object({
  nomClient: z.string().max(100).optional(),
  lignes: z.array(ligneCommandeSchema).min(1, "Au moins un produit requis"),
});

export type CreateCommandeClientInput = z.infer<
  typeof createCommandeClientSchema
>;
export type CreateVenteFlashInput = z.infer<typeof createVenteFlashSchema>;
