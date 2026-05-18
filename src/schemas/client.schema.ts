import { z } from "zod";

export const createClientSchema = z.object({
  nom: z.string().min(1, "Le nom est requis").max(100),
  prenom: z.string().max(100).optional(),
  telephone: z.string().max(20).regex(/^[0-9+\s()-]*$/, "Numero invalide").optional().or(z.literal("")),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  adresse: z.string().max(300).optional(),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
