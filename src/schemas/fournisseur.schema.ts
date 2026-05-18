import { z } from "zod";

export const createFournisseurSchema = z.object({
  nom: z.string().min(1, "Le nom est requis").max(100),
  telephone: z.string().max(20).regex(/^[0-9+\s()-]*$/, "Numero invalide").optional().or(z.literal("")),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  adresse: z.string().max(300).optional(),
});

export const updateFournisseurSchema = createFournisseurSchema.partial();

export type CreateFournisseurInput = z.infer<typeof createFournisseurSchema>;
