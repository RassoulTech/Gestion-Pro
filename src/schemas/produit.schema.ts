import { z } from "zod";

export const createProduitSchema = z.object({
  nom: z.string().min(1, "Le nom est requis").max(150),
  code: z.string().min(1, "Le code est requis").max(50),
  description: z.string().max(1000).optional().or(z.literal("")),
  categorieId: z.string().optional(),
  prixAchat: z.coerce.number().min(0, "Le prix d'achat doit etre positif"),
  prixUnitaire: z.coerce.number().min(0, "Le prix unitaire doit etre positif"),
  quantite: z.coerce.number().int("La quantite doit etre un entier").min(0, "La quantite doit etre positive"),
  seuilAlerte: z.coerce.number().int().min(0).default(5),
  photo: z.string().optional().or(z.literal("")),
});

export const updateProduitSchema = createProduitSchema.partial();

export type CreateProduitInput = z.infer<typeof createProduitSchema>;
export type UpdateProduitInput = z.infer<typeof updateProduitSchema>;
