/**
 * Livraison de PDF multi-appareils (client uniquement) — source unique pour
 * TÉLÉCHARGER / PARTAGER / IMPRIMER une facture, fiable sur desktop, Android,
 * iPhone/iPad.
 *
 * Pourquoi pas `doc.save()` partout : sur iOS Safari, selon la version et le
 * contexte (PWA installée, in-app browser), l'attribut `download` est parfois
 * ignoré → onglet blanc et fichier introuvable. Et `doc.output("dataurlnewwindow")`
 * pour l'impression est bloqué par les bloqueurs de popups.
 *
 * Stratégies :
 * - download : <a download> + Blob URL (desktop/Android/iOS moderne) ; si iOS
 *   sans support fiable → ouverture dans un onglet (l'utilisateur utilise
 *   Partager → Enregistrer dans Fichiers).
 * - share : Web Share API niveau 2 (fichiers) → feuille de partage native avec
 *   le PDF EN PIÈCE JOINTE (WhatsApp, Mail, Fichiers…). Android + iOS.
 * - print : iframe caché + print() (pas de popup) ; repli onglet.
 */

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ se présente comme macOS mais a le tactile.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

export function isMobileLike(): boolean {
  if (typeof navigator === "undefined") return false;
  return isIOS() || /Android/i.test(navigator.userAgent);
}

/** Le partage de FICHIERS est-il disponible (Web Share API niveau 2) ? */
export function canSharePdf(): boolean {
  if (typeof navigator === "undefined" || !("canShare" in navigator)) return false;
  try {
    const probe = new File([new Blob(["x"], { type: "application/pdf" })], "probe.pdf", {
      type: "application/pdf",
    });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

/**
 * Télécharge un Blob PDF avec un nom de fichier clair.
 * Retourne "downloaded" ou "opened" (iOS sans téléchargement direct fiable).
 */
export function downloadPdfBlob(blob: Blob, filename: string): "downloaded" | "opened" {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const supportsDownload = "download" in a;

  if (supportsDownload) {
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Laisse le temps au navigateur de démarrer le téléchargement avant révocation.
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return "downloaded";
  }

  // Très vieux iOS / in-app browsers : ouvrir le PDF (Partager → Enregistrer).
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return "opened";
}

/**
 * Ouvre la feuille de partage native avec le PDF en PIÈCE JOINTE (WhatsApp,
 * Mail, Fichiers…). Retourne "shared", "aborted" (annulé par l'utilisateur) ou
 * "unsupported" (l'appelant applique alors son repli).
 */
export async function sharePdfBlob(
  blob: Blob,
  filename: string,
  opts: { title?: string; text?: string } = {}
): Promise<"shared" | "aborted" | "unsupported"> {
  if (!canSharePdf()) return "unsupported";
  const file = new File([blob], filename, { type: "application/pdf" });
  try {
    await navigator.share({ files: [file], title: opts.title, text: opts.text });
    return "shared";
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return "aborted";
    return "unsupported";
  }
}

/**
 * Imprime un Blob PDF via un iframe caché (aucune popup → pas de blocage).
 * Repli : ouverture dans un onglet (l'utilisateur imprime depuis le lecteur).
 */
export function printPdfBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);

  // iOS : le print() d'un iframe PDF est peu fiable → onglet + impression manuelle
  // (le lecteur PDF intégré propose Partager → Imprimer).
  if (isIOS()) {
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.src = url;

  const cleanup = () => {
    setTimeout(() => {
      iframe.remove();
      URL.revokeObjectURL(url);
    }, 60_000); // après la fermeture du dialogue d'impression
  };

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.open(url, "_blank", "noopener");
    } finally {
      cleanup();
    }
  };
  iframe.onerror = () => {
    window.open(url, "_blank", "noopener");
    cleanup();
  };

  document.body.appendChild(iframe);
}

/** Base64 → Blob PDF (pour les factures renvoyées par une action serveur). */
export function base64ToPdfBlob(base64: string): Blob {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: "application/pdf" });
}
