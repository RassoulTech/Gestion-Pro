import { z } from "zod";

export const ajusterStockSchema = z.object({
  produitId: z.string().min(1, "Veuillez sélectionner un produit"),
  type: z.enum(["ENTREE", "SORTIE"]),
  quantite: z.coerce.number().int().positive("La quantité doit être un nombre positif"),
  raison: z.string().min(1, "Veuillez indiquer une raison"),
});

export type AjusterStockInput = z.infer<typeof ajusterStockSchema>;
