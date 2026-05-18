import { z } from "zod";

export const createDepenseSchema = z.object({
  libelle: z.string().min(1, "Le libelle est requis").max(200),
  montant: z.coerce.number().min(0, "Le montant doit etre positif"),
  date: z.coerce.date(),
  categorie: z.string().max(100).optional(),
});

export const updateDepenseSchema = createDepenseSchema.partial();

export type CreateDepenseInput = z.infer<typeof createDepenseSchema>;
