import "server-only";

/**
 * Prompts + générateurs mock par tâche. Chaque builder renvoie { system, user, mock }
 * pour être passé tel quel à aiComplete().
 */

export interface AiProductResult {
  nom: string;
  description: string;
  categorie: string;
  sousCategorie: string;
  unite: string;
  tags: string[];
  caracteristiques: string[];
  prixConseille: number | null;
}

const SECTORS: { rx: RegExp; cat: string }[] = [
  { rx: /coca|cola|jus|eau|boisson|soda|biere|vin|sucrerie|sprite|fanta/i, cat: "Boissons" },
  { rx: /ordinateur|laptop|pc|hp|dell|lenovo|macbook|telephone|smartphone|iphone|samsung|ecran|clavier|souris|casque|ecouteur|tablette/i, cat: "Électronique" },
  { rx: /chaussure|nike|adidas|basket|sandale|t-?shirt|chemise|robe|pantalon|veste|jean|sac|montre/i, cat: "Mode & Vêtements" },
  { rx: /riz|huile|sucre|farine|lait|pain|cafe|the|pate|tomate|oignon|poisson|viande|cereale/i, cat: "Alimentation" },
  { rx: /savon|creme|parfum|shampoing|maquillage|rouge|gel|lotion/i, cat: "Beauté & Cosmétique" },
  { rx: /medicament|vitamine|pansement|masque|gant|sante/i, cat: "Santé & Bien-être" },
  { rx: /ciment|peinture|clou|vis|marteau|tuyau|fil|outil|quincaillerie/i, cat: "Quincaillerie" },
  { rx: /livre|cahier|stylo|crayon|sac a dos|regle/i, cat: "Librairie & Fournitures" },
];

function guessCategory(input: string): string {
  for (const s of SECTORS) if (s.rx.test(input)) return s.cat;
  return "Divers";
}

function guessUnit(input: string): string {
  const l = input.toLowerCase();
  if (/\b\d+\s?l\b|litre|\bcl\b|\bml\b/.test(l)) return "Litre";
  if (/\b\d+\s?(kg|g)\b|kilo|gramme/.test(l)) return "Kg";
  if (/\bm\b|metre|cm/.test(l)) return "Mètre";
  return "Pièce";
}

export function buildProductTask(input: string) {
  const system =
    "Tu es un assistant e-commerce pour des commerçants en Afrique de l'Ouest (prix en FCFA). " +
    "À partir d'une saisie libre, génère une fiche produit complète. " +
    "Réponds UNIQUEMENT par un objet JSON valide, sans texte autour, avec exactement ces clés : " +
    "nom (string), description (string, 2-3 phrases commerciales), categorie (string), sousCategorie (string), " +
    "unite (string), tags (string[] de 4 à 6), caracteristiques (string[] de 3 à 5), prixConseille (number ou null).";
  const user = `Saisie du vendeur : "${input}"`;

  const mock = (): string => {
    const nom = input.trim().replace(/\s+/g, " ");
    const categorie = guessCategory(input);
    const unite = guessUnit(input);
    const tags = Array.from(
      new Set(
        input
          .toLowerCase()
          .split(/[^a-z0-9àâçéèêëîïôûùüÿ]+/i)
          .filter((w) => w.length > 2)
      )
    ).slice(0, 6);
    const result: AiProductResult = {
      nom,
      description: `${nom} de qualité, disponible immédiatement en boutique. Un excellent rapport qualité-prix pour vos besoins du quotidien. Livraison rapide possible.`,
      categorie,
      sousCategorie: categorie,
      unite,
      tags: tags.length ? tags : [categorie.toLowerCase()],
      caracteristiques: ["Bonne qualité", "Disponible en stock", "Garantie vendeur"],
      prixConseille: null,
    };
    return JSON.stringify(result);
  };

  return { system, user, mock };
}

export type DescriptionTone = "pro" | "commercial" | "court" | "detaille";

const TONE_LABEL: Record<DescriptionTone, string> = {
  pro: "professionnelle et soignée",
  commercial: "commerciale et persuasive (incite à l'achat)",
  court: "courte et percutante (1 à 2 phrases)",
  detaille: "détaillée et complète (avantages + usage)",
};

export function buildDescriptionTask(opts: { nom: string; description: string; tone: DescriptionTone }) {
  const { nom, description, tone } = opts;
  const system =
    "Tu es un rédacteur e-commerce pour des commerçants en Afrique de l'Ouest. " +
    "Réécris la description d'un produit en français. Réponds UNIQUEMENT par la description réécrite, sans guillemets ni préambule.";
  const user = `Produit : "${nom}". Description actuelle : "${description || "(vide)"}". ` +
    `Réécris-la de façon ${TONE_LABEL[tone]}.`;

  const mock = (): string => {
    const base = nom || "Ce produit";
    switch (tone) {
      case "court":
        return `${base} : qualité au meilleur prix, disponible maintenant.`;
      case "commercial":
        return `Craquez pour ${base} ! Un choix malin alliant qualité et prix doux. Stock limité — commandez vite et profitez d'une livraison rapide partout.`;
      case "detaille":
        return `${base} est conçu pour vous offrir fiabilité et satisfaction au quotidien. Apprécié pour sa qualité et sa durabilité, il convient à un usage régulier. Disponible immédiatement en boutique, avec garantie vendeur et possibilité de livraison rapide. Un excellent rapport qualité-prix.`;
      default:
        return `${base} — un produit de qualité, sélectionné avec soin pour répondre à vos attentes. Disponible en boutique avec un service client à votre écoute.`;
    }
  };

  return { system, user, mock };
}
