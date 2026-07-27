import fr from "@/messages/fr.json";
import en from "@/messages/en.json";
import { defaultLocale, type Locale } from "./config";

type Dict = { [k: string]: unknown };

function isPlainObject(v: unknown): v is Dict {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * MÊME règle de fusion que côté serveur (src/i18n/request.ts) : le FR recouvre
 * les trous de la langue active ; les TABLEAUX sont des feuilles (jamais
 * fusionnés, sinon ils deviennent des objets {0:…} et cassent les .map()).
 */
function deepMerge(base: Dict, override: Dict): Dict {
  const out: Dict = { ...base };
  for (const key of Object.keys(override)) {
    const o = override[key];
    const b = out[key];
    if (isPlainObject(o) && isPlainObject(b)) out[key] = deepMerge(b, o);
    else if (o !== undefined) out[key] = o;
  }
  return out;
}

// Catalogues précalculés UNE FOIS au chargement du module (bascule O(1)).
const MERGED_EN = deepMerge(fr as Dict, en as Dict);

/**
 * Catalogue complet d'une langue, EN MÉMOIRE côté client — permet une bascule
 * de langue instantanée (aucun aller-retour serveur pour les textes des
 * composants client, c'est-à-dire l'essentiel de l'interface).
 * Coût : le catalogue EN rejoint le bundle (~+20 Ko gzip), payé une fois.
 */
export function getClientMessages(locale: Locale): Record<string, unknown> {
  return locale === defaultLocale ? (fr as Dict) : MERGED_EN;
}
