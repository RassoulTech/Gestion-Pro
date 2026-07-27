"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { getClientMessages } from "@/i18n/messages-client";

interface LocaleSwitchContextValue {
  locale: Locale;
  /** Bascule INSTANTANÉE (mémoire) + synchronisation serveur en arrière-plan. */
  setLocaleInstant: (next: Locale) => void;
  /** True pendant la synchronisation serveur (indicateur discret). */
  isSyncing: boolean;
}

const LocaleSwitchContext = React.createContext<LocaleSwitchContextValue | null>(null);

export function useLocaleSwitch(): LocaleSwitchContextValue {
  const ctx = React.useContext(LocaleSwitchContext);
  if (!ctx) throw new Error("useLocaleSwitch doit être utilisé sous I18nClientProvider");
  return ctx;
}

/**
 * CORRECTIF « langue lente » (preuve 2 du rapport perf : 2 214 ms mesurées) :
 * avant, chaque bascule = cookie + router.refresh() → re-rendu RSC COMPLET de
 * la page dynamique (serveur) + réconciliation client (+367 ms de script).
 *
 * Désormais les DEUX catalogues sont en mémoire côté client : la bascule change
 * localement `locale` + `messages` → tous les composants client (l'essentiel de
 * l'interface) changent de langue AU CLIC, sans réseau. Le `router.refresh()`
 * part EN ARRIÈRE-PLAN pour resynchroniser les textes rendus côté serveur.
 *
 * Hydratation sûre : le premier rendu utilise exactement locale+messages reçus
 * du serveur ; les catalogues client ne prennent le relais qu'après une bascule.
 */
export function I18nClientProvider({
  locale: serverLocale,
  messages: serverMessages,
  children,
}: {
  locale: Locale;
  messages: AbstractIntlMessages;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocale] = React.useState<Locale>(serverLocale);
  const [isSyncing, startTransition] = React.useTransition();

  // Après la resynchronisation serveur (refresh), le serveur devient la vérité.
  React.useEffect(() => setLocale(serverLocale), [serverLocale]);

  const setLocaleInstant = React.useCallback(
    (next: Locale) => {
      if (next === locale) return;
      // 1) Bascule LOCALE immédiate (textes client + attribut lang).
      setLocale(next);
      document.documentElement.lang = next;
      // 2) Persistance (cookie lu par le serveur au prochain rendu).
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      // 3) Resynchronisation serveur en arrière-plan (textes RSC, metadata).
      startTransition(() => router.refresh());
    },
    [locale, router]
  );

  const ctx = React.useMemo(
    () => ({ locale, setLocaleInstant, isSyncing }),
    [locale, setLocaleInstant, isSyncing]
  );

  const messages =
    locale === serverLocale ? serverMessages : (getClientMessages(locale) as AbstractIntlMessages);

  return (
    <LocaleSwitchContext.Provider value={ctx}>
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        getMessageFallback={({ key }) => key.split(".").pop() ?? key}
        onError={() => {}}
      >
        {children}
      </NextIntlClientProvider>
    </LocaleSwitchContext.Provider>
  );
}
