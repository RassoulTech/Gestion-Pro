"use server";

import { cookies } from "next/headers";

import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";

/** Lit la langue active (cookie) côté serveur, avec repli sur la langue par défaut. */
export async function getUserLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

/**
 * Persiste la langue choisie dans un cookie (1 an). N'altère JAMAIS l'URL :
 * le rendu suivant relira ce cookie via `request.ts`.
 */
export async function setUserLocale(locale: Locale): Promise<void> {
  if (!isLocale(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
