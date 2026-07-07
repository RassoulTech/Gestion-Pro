"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Loader2, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { updateFactureSettings } from "@/server/actions/boutique.actions";
import {
  FACTURE_SETTINGS_DEFAULTS,
  parseFactureSettings,
  type FactureSettings,
} from "@/schemas/facture-settings.schema";

const ACCENT_PRESETS = [
  { hex: "#EA580C", nom: "Orange (marque)" },
  { hex: "#0F766E", nom: "Vert canard" },
  { hex: "#1D4ED8", nom: "Bleu" },
  { hex: "#7C3AED", nom: "Violet" },
  { hex: "#BE123C", nom: "Bordeaux" },
  { hex: "#0F172A", nom: "Noir encre" },
];

interface Props {
  boutiqueId: string;
  /** Boutique.factureSettings brut (jsonb) — null si jamais personnalisé. */
  initial: unknown;
  boutique: {
    nom: string;
    logo: string | null;
    telephone: string | null;
    email: string | null;
    adresse: string | null;
  };
}

/**
 * Personnalisation de la facture — avec PRÉVISUALISATION EN DIRECT : l'aperçu
 * (miniature HTML fidèle au gabarit PDF) se met à jour à chaque changement,
 * AVANT enregistrement. Les préférences sont persistées sur la boutique et
 * appliquées à toutes les factures futures (commandes, manuelles, marketplace).
 */
export function SectionFacture({ boutiqueId, initial, boutique }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [s, setS] = useState<FactureSettings>(() => parseFactureSettings(initial));

  const set = <K extends keyof FactureSettings>(key: K, value: FactureSettings[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));

  const contactLine = useMemo(() => {
    const parts: string[] = [];
    if (s.showAdresse && boutique.adresse) parts.push(boutique.adresse);
    if (s.showTelephone && boutique.telephone) parts.push(`Tél: ${boutique.telephone}`);
    if (s.showEmail && boutique.email) parts.push(`Email: ${boutique.email}`);
    return parts.join("  |  ");
  }, [s.showAdresse, s.showTelephone, s.showEmail, boutique]);

  async function save() {
    setBusy(true);
    try {
      const result = await updateFactureSettings({
        boutiqueId,
        settings: {
          accentColor: s.accentColor,
          showTelephone: s.showTelephone,
          showEmail: s.showEmail,
          showAdresse: s.showAdresse,
          merci: s.merci.trim() || undefined,
          mentions: s.mentions?.trim() || undefined,
        },
      });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      if (result?.validationErrors) {
        toast.error("Vérifiez les champs saisis.");
        return;
      }
      toast.success("Personnalisation enregistrée — appliquée à toutes vos prochaines factures.");
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-black tracking-tight">
          <FileText className="h-5 w-5 text-brand" /> Personnalisation de la facture
        </h3>
        <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Couleur, coordonnées affichées, message de remerciement et mentions. L&apos;aperçu se met à
          jour en direct ; l&apos;enregistrement s&apos;applique à toutes vos futures factures (commandes,
          factures manuelles, marketplace).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Réglages ── */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">
              Couleur d&apos;accent
            </Label>
            <div className="flex flex-wrap items-center gap-2">
              {ACCENT_PRESETS.map((p) => (
                <button
                  key={p.hex}
                  type="button"
                  title={p.nom}
                  aria-label={`Couleur ${p.nom}`}
                  onClick={() => set("accentColor", p.hex)}
                  className={`h-9 w-9 rounded-xl border-2 transition-transform active:scale-95 ${
                    s.accentColor.toUpperCase() === p.hex
                      ? "border-zinc-900 dark:border-white scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: p.hex }}
                />
              ))}
              <label className="flex h-9 items-center gap-2 rounded-xl border border-zinc-200 px-2 dark:border-zinc-800">
                <input
                  type="color"
                  value={s.accentColor}
                  onChange={(e) => set("accentColor", e.target.value)}
                  className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                  aria-label="Couleur personnalisée"
                />
                <span className="font-mono text-[11px] font-bold text-zinc-500">{s.accentColor.toUpperCase()}</span>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">
              Coordonnées affichées dans l&apos;en-tête
            </Label>
            {(
              [
                ["showAdresse", "Adresse", boutique.adresse],
                ["showTelephone", "Téléphone", boutique.telephone],
                ["showEmail", "E-mail", boutique.email],
              ] as const
            ).map(([key, label, value]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3 dark:border-zinc-800"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold">{label}</p>
                  <p className="truncate text-xs text-zinc-400">
                    {value || "Non renseigné (onglet « Ma Boutique »)"}
                  </p>
                </div>
                <Switch checked={s[key]} onCheckedChange={(v) => set(key, v)} aria-label={label} />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="facture-merci" className="text-xs font-black uppercase tracking-wider text-zinc-500">
              Message de remerciement
            </Label>
            <Input
              id="facture-merci"
              value={s.merci}
              maxLength={160}
              onChange={(e) => set("merci", e.target.value)}
              placeholder={FACTURE_SETTINGS_DEFAULTS.merci}
              className="h-11 rounded-xl font-medium"
            />
            <p className="text-right text-[10px] font-bold text-zinc-400">{s.merci.length}/160</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="facture-mentions" className="text-xs font-black uppercase tracking-wider text-zinc-500">
              Mentions personnalisées <span className="font-medium normal-case">(optionnel — RC, NINEA, conditions…)</span>
            </Label>
            <Textarea
              id="facture-mentions"
              value={s.mentions ?? ""}
              maxLength={300}
              rows={3}
              onChange={(e) => set("mentions", e.target.value || null)}
              placeholder="Ex. : RC SN-DKR-2026-A-1234 — NINEA 0099887 — Marchandise ni reprise ni échangée."
              className="rounded-xl font-medium"
            />
            <p className="text-right text-[10px] font-bold text-zinc-400">{(s.mentions ?? "").length}/300</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={save} disabled={busy} className="h-11 flex-1 rounded-xl font-black" variant="brand">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Enregistrer
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setS({ ...FACTURE_SETTINGS_DEFAULTS })}
              className="h-11 rounded-xl font-bold"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser
            </Button>
          </div>
        </div>

        {/* ── Prévisualisation en direct (fidèle au gabarit PDF) ── */}
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">
            Aperçu en direct
          </Label>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 sm:p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mx-auto flex aspect-[210/260] w-full max-w-[430px] flex-col rounded-lg bg-white p-4 text-left shadow-lg sm:p-5" style={{ color: "#0f172a" }}>
              {/* En-tête */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                  {boutique.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={boutique.logo} alt="" className="h-9 w-9 shrink-0 rounded object-contain" />
                  ) : null}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black leading-tight">{boutique.nom}</p>
                    <p className="mt-0.5 line-clamp-2 text-[8px] leading-snug text-zinc-500">{contactLine}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-black" style={{ color: s.accentColor }}>FACTURE</p>
                  <p className="text-[8px] text-zinc-500"># FAC-2026-0042</p>
                </div>
              </div>

              <div className="my-2 border-t border-zinc-100" />

              {/* Facturé à / détails */}
              <div className="flex justify-between gap-2 text-[8px]">
                <div>
                  <p className="font-black text-zinc-800">FACTURÉ À</p>
                  <p className="mt-0.5 text-zinc-500">Awa Diop</p>
                  <p className="text-zinc-500">Tél: +221 77 000 00 00</p>
                </div>
                <div className="text-right">
                  <p><span className="text-zinc-500">Date : </span><b>{new Date().toLocaleDateString("fr-FR")}</b></p>
                  <p><span className="text-zinc-500">Statut : </span><b style={{ color: "#10b981" }}>Payée</b></p>
                  <p><span className="text-zinc-500">Paiement : </span><b>Wave</b></p>
                </div>
              </div>

              {/* Tableau */}
              <div className="mt-3 overflow-hidden rounded">
                <div className="grid grid-cols-[1fr_auto_auto] gap-2 bg-zinc-900 px-2 py-1 text-[7.5px] font-bold text-white">
                  <span>Description</span><span>Qté</span><span className="text-right">Montant</span>
                </div>
                {[
                  ["Riz parfumé 25 kg", "2", "25 000 FCFA"],
                  ["Huile 5 L", "1", "8 500 FCFA"],
                ].map(([n, q, m], i) => (
                  <div key={n} className={`grid grid-cols-[1fr_auto_auto] gap-2 px-2 py-1 text-[7.5px] ${i % 2 ? "bg-zinc-50" : "bg-white"}`}>
                    <span>{n}</span><span>{q}</span><span className="text-right">{m}</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mt-2 flex justify-end">
                <p className="text-[9px] font-black">
                  Total à payer : <span style={{ color: s.accentColor }}>33 500 FCFA</span>
                </p>
              </div>

              {/* Pied */}
              <div className="mt-auto">
                {s.mentions ? (
                  <p className="mb-1 line-clamp-2 text-[6.5px] leading-snug text-zinc-400">{s.mentions}</p>
                ) : null}
                <div className="border-t border-zinc-100 pt-1">
                  <div className="flex items-end justify-between gap-2">
                    <p className="line-clamp-2 max-w-[70%] text-[7px] leading-snug text-zinc-500">{s.merci}</p>
                    <p className="shrink-0 text-[7.5px] font-black">
                      Gestion<span className="text-[#EA580C]">Pro</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-[10px] font-medium text-zinc-400">
            Aperçu indicatif — le PDF final reprend exactement ces réglages.
          </p>
        </div>
      </div>
    </div>
  );
}
