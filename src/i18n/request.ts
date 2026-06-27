import { getRequestConfig } from "next-intl/server";

import { defaultLocale } from "./config";
import { getUserLocale } from "./locale";

type Dict = { [k: string]: string | Dict };

/**
 * Fusion profonde : `base` (langue par défaut, FR) recouverte par `override`
 * (langue active). Toute clé absente de la langue active retombe donc sur le FR
 * — jamais de clé brute affichée, jamais d'incohérence de langue.
 */
function isPlainObject(v: unknown): v is Dict {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function deepMerge(base: Dict, override: Dict): Dict {
  const out: Dict = { ...base };
  for (const key of Object.keys(override)) {
    const o = override[key];
    const b = out[key];
    // On ne fusionne récursivement QUE les objets simples. Les tableaux (et
    // toute valeur feuille) sont remplacés par la langue active — sinon la
    // fusion indexerait les tableaux et les transformerait en objets
    // `{0:…,1:…}`, cassant les `.map()` (ex. faq.items, testimonials).
    if (isPlainObject(o) && isPlainObject(b)) {
      out[key] = deepMerge(b, o);
    } else if (o !== undefined) {
      out[key] = o;
    }
  }
  return out;
}

export default getRequestConfig(async () => {
  const locale = await getUserLocale();

  const localeMessages = (await import(`../messages/${locale}.json`)).default;
  const messages =
    locale === defaultLocale
      ? localeMessages
      : deepMerge(
          (await import(`../messages/${defaultLocale}.json`)).default,
          localeMessages,
        );

  return {
    locale,
    messages,
    // Dernier filet : si une clé manque dans les DEUX dictionnaires, on affiche
    // le dernier segment lisible plutôt que « namespace.cle.brute ».
    getMessageFallback({ key }) {
      return key.split(".").pop() ?? key;
    },
    onError(error) {
      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }
    },
  };
});
