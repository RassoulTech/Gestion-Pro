import { z } from "zod";

export const createVendeurProfileSchema = z.object({
  nom: z.string().min(1, "Le nom est requis").max(100),
  prenom: z.string().min(1, "Le prénom est requis").max(100),
  email: z.string().email("Email invalide"),
  telephone: z.string().max(20).optional().nullable().or(z.literal("")),
  dateNaissance: z.coerce.date().optional().nullable(),
  adresse: z.string().max(255).optional().nullable().or(z.literal("")),
  photo: z.string().url("URL de photo invalide").optional().nullable().or(z.literal("")),
});

export type CreateVendeurProfileInput = z.infer<
  typeof createVendeurProfileSchema
>;
