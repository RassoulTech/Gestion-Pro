import { z } from "zod";

export const createCategorieSchema = z.object({
  nom: z.string().min(1, "Le nom est requis").max(100),
  couleur: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Couleur hex invalide")
    .optional(),
});

export const updateCategorieSchema = createCategorieSchema.partial();

export type CreateCategorieInput = z.infer<typeof createCategorieSchema>;
