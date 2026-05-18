import { z } from "zod";

export const createBoutiqueSchema = z.object({
  nom: z.string().min(2, "Le nom doit faire au moins 2 caractères").max(100),
  description: z.string().max(500).optional(),
  adresse: z.string().max(200).optional(),
  siteWeb: z.string().url("URL invalide").optional().or(z.literal("")),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  telephone: z.string().max(20).optional(),
  secteurActivite: z.enum([
    "ALIMENTATION",
    "HABILLEMENT",
    "ELECTRONIQUE",
    "BEAUTE",
    "SANTE",
    "SERVICES",
    "QUINCAILLERIE",
    "LIBRAIRIE",
    "AUTRE",
  ]),
  logo: z.string().optional().or(z.literal("")),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const updateBoutiqueSchema = createBoutiqueSchema.partial();

export type CreateBoutiqueInput = z.infer<typeof createBoutiqueSchema>;
export type UpdateBoutiqueInput = z.infer<typeof updateBoutiqueSchema>;
