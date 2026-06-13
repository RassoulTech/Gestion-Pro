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
  sku: string;
  prixConseille: number | null;
}

// ─── Schémas JSON (sorties structurées — la réponse est garantie conforme) ───
// Contraintes structured outputs : `additionalProperties: false` obligatoire,
// unions nullables via `anyOf`.

const PRODUCT_PROPERTIES = {
  nom: { type: "string" },
  description: { type: "string" },
  categorie: { type: "string" },
  sousCategorie: { type: "string" },
  unite: { type: "string" },
  tags: { type: "array", items: { type: "string" } },
  caracteristiques: { type: "array", items: { type: "string" } },
  sku: { type: "string" },
  prixConseille: { anyOf: [{ type: "number" }, { type: "null" }] },
} as const;

export const PRODUCT_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: PRODUCT_PROPERTIES,
  required: Object.keys(PRODUCT_PROPERTIES),
  additionalProperties: false,
};

export const PRODUCTS_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    produits: { type: "array", items: PRODUCT_JSON_SCHEMA },
  },
  required: ["produits"],
  additionalProperties: false,
};

export const INSIGHTS_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    insights: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titre: { type: "string" },
          detail: { type: "string" },
          niveau: { type: "string", enum: ["info", "action", "alerte"] },
        },
        required: ["titre", "detail", "niveau"],
        additionalProperties: false,
      },
    },
  },
  required: ["insights"],
  additionalProperties: false,
};

/** Génère une référence/SKU lisible à partir d'un nom de produit. */
export function suggestSku(nom: string): string {
  const base = nom
    .toUpperCase()
    .normalize("NFD")
    .replace(/[^A-Z0-9 ]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.slice(0, 3))
    .join("-");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base || "PRD"}-${suffix}`;
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

/** Contexte boutique injecté dans le prompt pour des fiches ancrées sur le réel. */
export interface ProductTaskContext {
  secteur?: string | null;
  /** Catégories existantes de la boutique — l'IA doit en réutiliser une si possible. */
  categories?: string[];
  /** Produits proches déjà en stock — ancrent le prix conseillé. */
  produitsSimilaires?: { nom: string; prix: number }[];
}

export function buildProductTask(input: string, ctx: ProductTaskContext = {}) {
  const secteurTxt = ctx.secteur ? `Secteur de la boutique : ${ctx.secteur}. ` : "";
  const categoriesTxt = ctx.categories?.length
    ? `Catégories existantes de la boutique : ${ctx.categories.join(" · ")}. ` +
      `Pour "categorie", réutilise EXACTEMENT l'une d'elles si elle convient (orthographe identique) ; sinon proposes-en une nouvelle. `
    : "";
  const prixTxt = ctx.produitsSimilaires?.length
    ? `Prix réels de produits proches dans cette boutique : ${ctx.produitsSimilaires
        .map((p) => `${p.nom} = ${p.prix} FCFA`)
        .join(" · ")}. Ancre prixConseille sur ces prix. `
    : `Si tu n'es pas raisonnablement sûr du prix local, mets prixConseille à null. `;

  const system =
    "Tu es un assistant e-commerce pour des commerçants en Afrique de l'Ouest (prix en FCFA). " +
    "À partir d'une saisie libre, génère une fiche produit complète. " +
    secteurTxt +
    categoriesTxt +
    prixTxt +
    "Réponds UNIQUEMENT par un objet JSON valide, sans texte autour, avec exactement ces clés : " +
    "nom (string), description (string, 2-3 phrases commerciales), categorie (string), sousCategorie (string), " +
    "unite (string), tags (string[] de 4 à 6), caracteristiques (string[] de 3 à 5), " +
    "sku (string, référence courte ex. COC-COL-1234), prixConseille (number ou null).";
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
      sku: suggestSku(nom),
      prixConseille: null,
    };
    return JSON.stringify(result);
  };

  return { system, user, mock };
}

/**
 * Tâche d'analyse d'image (vision) → une OU plusieurs fiches produit.
 * Une photo d'étagère, de catalogue ou de lot produit jusqu'à 8 fiches.
 */
export function buildImageProductsTask(ctx: ProductTaskContext = {}) {
  const categoriesTxt = ctx.categories?.length
    ? `Catégories existantes de la boutique : ${ctx.categories.join(" · ")}. ` +
      `Pour "categorie", réutilise EXACTEMENT l'une d'elles si elle convient ; sinon proposes-en une nouvelle. `
    : "";

  const system =
    "Tu es un assistant e-commerce pour des commerçants en Afrique de l'Ouest (prix en FCFA). " +
    "Analyse l'image : elle peut montrer UN produit ou PLUSIEURS (étagère, catalogue, lot). " +
    "Génère une fiche par produit clairement identifiable (8 maximum, les plus visibles d'abord). " +
    categoriesTxt +
    "Réponds UNIQUEMENT par un objet JSON valide de la forme {\"produits\": [...]} où chaque produit a les clés : " +
    "nom, description, categorie, sousCategorie, unite, tags (string[]), caracteristiques (string[]), sku, prixConseille (number ou null). " +
    "Si aucun produit n'est reconnaissable, renvoie {\"produits\": []}.";
  const user = "Analyse cette image et remplis les fiches produit.";

  // Le mock ne peut pas voir l'image → liste vide, qui déclenche le message
  // « complétez manuellement » côté UI.
  const mock = (): string => JSON.stringify({ produits: [] });

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

// ─── Résumé intelligent du dashboard ─────────────────────────────────────────

export interface AiInsight {
  titre: string;
  detail: string;
  niveau: "info" | "action" | "alerte";
}

export interface InsightsStats {
  periodeLabel: string;
  caTotal: number;
  nbCommandes: number;
  panierMoyen: number;
  topProduits: { nom: string; quantiteVendue: number }[];
  stockBas: { nom: string; quantite: number; seuil: number }[];
  nbClients: number;
}

export function buildInsightsTask(stats: InsightsStats) {
  const system =
    "Tu es un conseiller commercial pour un commerçant en Afrique de l'Ouest (montants en FCFA). " +
    "À partir des chiffres fournis, produis 3 à 4 insights CONCRETS et actionnables, en français simple. " +
    "Chaque insight cite au moins un chiffre fourni — aucune généralité. " +
    "Réponds UNIQUEMENT par un objet JSON {\"insights\": [...]} où chaque insight a : " +
    "titre (8 mots max), detail (1-2 phrases avec les chiffres), niveau (\"info\", \"action\" ou \"alerte\").";
  const user = `Chiffres de la boutique : ${JSON.stringify(stats)}`;

  const mock = (): string => {
    const insights: AiInsight[] = [];
    const top = stats.topProduits[0];
    if (top) {
      insights.push({
        titre: `${top.nom} porte vos ventes`,
        detail: `${top.nom} est votre meilleure vente (${top.quantiteVendue} unités sur ${stats.periodeLabel}). Mettez-le en avant et surveillez son stock.`,
        niveau: "info",
      });
    }
    if (stats.stockBas.length > 0) {
      insights.push({
        titre: `${stats.stockBas.length} produit${stats.stockBas.length > 1 ? "s" : ""} sous le seuil d'alerte`,
        detail: `${stats.stockBas.slice(0, 3).map((s) => s.nom).join(", ")} ${stats.stockBas.length > 1 ? "sont" : "est"} en stock bas. Pensez au réapprovisionnement avant la rupture.`,
        niveau: "alerte",
      });
    }
    if (stats.nbCommandes > 0) {
      insights.push({
        titre: "Votre panier moyen",
        detail: `${stats.nbCommandes} commande${stats.nbCommandes > 1 ? "s" : ""} pour ${stats.caTotal} FCFA sur ${stats.periodeLabel}, soit un panier moyen de ${Math.round(stats.panierMoyen)} FCFA.`,
        niveau: "info",
      });
    } else {
      insights.push({
        titre: "Aucune vente sur la période",
        detail: `Aucune commande enregistrée sur ${stats.periodeLabel}. Pensez à enregistrer vos ventes au comptoir via la caisse (POS) pour suivre votre activité.`,
        niveau: "action",
      });
    }
    return JSON.stringify({ insights });
  };

  return { system, user, mock };
}

// ─── Relance client WhatsApp ─────────────────────────────────────────────────

export interface RelanceContext {
  boutiqueNom: string;
  clientPrenom: string | null;
  clientNom: string;
  joursDepuisDernierAchat: number | null;
  produitsAchetes: string[];
  nbCommandes: number;
}

export function buildRelanceTask(ctx: RelanceContext) {
  const system =
    "Tu rédiges un court message WhatsApp (3-4 phrases maximum) pour qu'un commerçant d'Afrique de l'Ouest relance un client. " +
    "Ton chaleureux et respectueux, français simple, 1 à 2 émojis maximum. " +
    "Mentionne le nom de la boutique, personnalise avec l'historique d'achat fourni, invite à revenir sans être insistant. " +
    "Réponds UNIQUEMENT par le message, sans guillemets ni préambule.";
  const user = `Contexte : ${JSON.stringify(ctx)}`;

  const mock = (): string => {
    const prenom = ctx.clientPrenom || ctx.clientNom;
    const produit = ctx.produitsAchetes[0];
    const accroche = produit
      ? `Nous venons d'être réapprovisionnés en ${produit} et nous avons pensé à vous.`
      : "De nouveaux produits viennent d'arriver en boutique !";
    return `Bonjour ${prenom} 👋 C'est ${ctx.boutiqueNom}. ${accroche} Passez nous voir quand vous voulez, ou répondez simplement à ce message pour commander. À très bientôt !`;
  };

  return { system, user, mock };
}
