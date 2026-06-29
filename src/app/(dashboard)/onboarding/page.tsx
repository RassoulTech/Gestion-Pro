"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { ArrowLeft, ArrowRight, Check, Rocket, Store, User } from "lucide-react";
import { z } from "zod";

import { registerIdentitySchema, registerBoutiqueSchema } from "@/schemas/auth.schema";
import { completeOAuthRegistration } from "@/server/actions/auth.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/image-upload";
import { SectorSelect } from "@/components/auth/sector-select";
import { Card, CardContent } from "@/components/ui/card";

const EASE = [0.16, 1, 0.3, 1] as const;

const SECTEURS = [
  "ALIMENTATION",
  "HABILLEMENT",
  "ELECTRONIQUE",
  "BEAUTE",
  "SANTE",
  "SERVICES",
  "QUINCAILLERIE",
  "LIBRAIRIE",
  "AUTRE",
] as const;

type Errors = Record<string, string>;

function zodErrors(error: z.ZodError): Errors {
  const out: Errors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}

/**
 * Complétion d'inscription pour les comptes OAuth (Google) — e-mail déjà
 * vérifié par le fournisseur. 2 étapes (Identité → Boutique) puis création
 * directe via `completeOAuthRegistration`, et accès immédiat à la boutique.
 */
export default function OnboardingPage() {
  const t = useTranslations("auth.wizard");
  const ta = useTranslations("auth");
  const tm = useTranslations("marketplace");
  const router = useRouter();
  const { data: session, update } = useSession();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [boutiqueNom, setBoutiqueNom] = useState("");
  const [secteurActivite, setSecteurActivite] = useState("");
  const [boutiqueAdresse, setBoutiqueAdresse] = useState("");
  const [boutiqueTelephone, setBoutiqueTelephone] = useState("");
  const [logo, setLogo] = useState("");
  const [boutiqueEmail, setBoutiqueEmail] = useState("");
  const [sameAsAccount, setSameAsAccount] = useState(true);

  const accountEmail = session?.user?.email ?? "";

  // Garde : admins et vendeurs déjà créés n'ont rien à faire ici.
  useEffect(() => {
    const role = session?.user?.role;
    if (role === "ADMIN") router.replace("/admin/dashboard");
    else if (role === "VENDEUR") router.replace("/boutiques");
  }, [session, router]);

  // Pré-remplissage de l'identité depuis la session Google (nom complet).
  useEffect(() => {
    const fullName = (session?.user?.name || "").trim();
    if (fullName && !prenom && !nom) {
      const [p = "", ...rest] = fullName.split(" ");
      setPrenom(p);
      setNom(rest.join(" "));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  function goNext() {
    const result = registerIdentitySchema.safeParse({ prenom, nom, telephone });
    if (!result.success) {
      setErrors(zodErrors(result.error));
      return;
    }
    setErrors({});
    setStep(2);
  }

  async function handleSubmit() {
    if (!secteurActivite) {
      setErrors({ secteurActivite: t("sectorPlaceholder") });
      return;
    }
    const result = registerBoutiqueSchema.safeParse({
      boutiqueNom,
      secteurActivite,
      boutiqueAdresse,
      boutiqueTelephone,
    });
    if (!result.success) {
      setErrors(zodErrors(result.error));
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await completeOAuthRegistration({
        prenom,
        nom,
        telephone,
        boutiqueNom,
        secteurActivite: secteurActivite as (typeof SECTEURS)[number],
        boutiqueAdresse,
        boutiqueTelephone,
        boutiqueEmail: sameAsAccount ? "" : boutiqueEmail,
        logo,
      });
      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      if (res?.data?.boutiqueId) {
        await update({ role: "VENDEUR" });
        toast.success(t("finishSubmit"));
        router.push(`/boutiques/${res.data.boutiqueId}`);
        router.refresh();
      }
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "h-12 rounded-xl bg-foreground/5 border-none px-4 text-sm font-bold transition-all focus:bg-foreground/10";
  const errClass = "text-xs font-semibold text-destructive mt-1";

  const STEPS = [
    { n: 1, label: t("stepIdentity"), icon: User },
    { n: 2, label: t("stepBoutique"), icon: Store },
  ];

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="w-full max-w-xl"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand/10 text-brand">
            <Rocket className="h-8 w-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {t("finishHeading")}
          </h1>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">{t("finishSub")}</p>
        </div>

        {/* Indicateur d'étapes */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = step > s.n;
            const active = step === s.n;
            return (
              <div key={s.n} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                      done
                        ? "border-success bg-success text-white"
                        : active
                          ? "border-brand text-brand"
                          : "border-border text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" strokeWidth={3} /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      active ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-8 rounded ${step > s.n ? "bg-success" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        <Card className="overflow-hidden border-none bg-card/50 shadow-2xl backdrop-blur-xl">
          <CardContent className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="space-y-6"
              >
                {step === 1 && (
                  <>
                    <h2 className="text-xl font-black tracking-tight text-foreground">{t("identityTitle")}</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                          {t("firstName")}
                        </Label>
                        <Input
                          placeholder={t("firstNamePlaceholder")}
                          value={prenom}
                          onChange={(e) => setPrenom(e.target.value)}
                          className={`mt-1.5 ${fieldClass}`}
                        />
                        {errors.prenom && <p className={errClass}>{errors.prenom}</p>}
                      </div>
                      <div>
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                          {t("lastName")}
                        </Label>
                        <Input
                          placeholder={t("lastNamePlaceholder")}
                          value={nom}
                          onChange={(e) => setNom(e.target.value)}
                          className={`mt-1.5 ${fieldClass}`}
                        />
                        {errors.nom && <p className={errClass}>{errors.nom}</p>}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        {t("phone")}
                      </Label>
                      <Input
                        type="tel"
                        inputMode="tel"
                        placeholder={t("phonePlaceholder")}
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                        className={`mt-1.5 ${fieldClass}`}
                      />
                      {errors.telephone && <p className={errClass}>{errors.telephone}</p>}
                    </div>
                    <Button
                      type="button"
                      variant="brand"
                      size="xl"
                      onClick={goNext}
                      className="w-full h-14 rounded-2xl font-black text-base shadow-xl shadow-brand/20"
                    >
                      {t("next")}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h2 className="text-xl font-black tracking-tight text-foreground">{t("boutiqueTitle")}</h2>

                    <div className="flex flex-col items-center gap-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        {t("logoLabel")}{" "}
                        <span className="text-[10px] font-bold normal-case text-muted-foreground/60">
                          ({t("logoOptional")})
                        </span>
                      </Label>
                      <ImageUpload mode="dataUrl" value={logo} onChange={setLogo} />
                    </div>

                    <div>
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        {t("boutiqueName")}
                      </Label>
                      <Input
                        placeholder={t("boutiqueNamePlaceholder")}
                        value={boutiqueNom}
                        onChange={(e) => setBoutiqueNom(e.target.value)}
                        className={`mt-1.5 ${fieldClass}`}
                      />
                      {errors.boutiqueNom && <p className={errClass}>{errors.boutiqueNom}</p>}
                    </div>
                    <div>
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        {t("sector")}
                      </Label>
                      <SectorSelect
                        value={secteurActivite}
                        onValueChange={setSecteurActivite}
                        className="mt-1.5 h-12"
                      />
                      {errors.secteurActivite && <p className={errClass}>{errors.secteurActivite}</p>}
                    </div>
                    <div>
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        {t("boutiqueEmail")}
                      </Label>
                      <label className="mt-1.5 flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sameAsAccount}
                          onChange={(e) => {
                            setSameAsAccount(e.target.checked);
                            if (!e.target.checked && !boutiqueEmail) setBoutiqueEmail(accountEmail);
                          }}
                          className="h-4 w-4 rounded accent-brand cursor-pointer"
                        />
                        <span className="text-xs font-bold text-muted-foreground">{t("sameAsAccount")}</span>
                      </label>
                      <Input
                        type="email"
                        inputMode="email"
                        placeholder="boutique@email.com"
                        value={sameAsAccount ? accountEmail : boutiqueEmail}
                        onChange={(e) => setBoutiqueEmail(e.target.value)}
                        disabled={sameAsAccount}
                        className={`mt-2 ${fieldClass} ${sameAsAccount ? "opacity-60" : ""}`}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        {t("boutiqueAddress")}
                      </Label>
                      <Input
                        placeholder={t("boutiqueAddressPlaceholder")}
                        value={boutiqueAdresse}
                        onChange={(e) => setBoutiqueAdresse(e.target.value)}
                        className={`mt-1.5 ${fieldClass}`}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        {t("boutiquePhone")}
                      </Label>
                      <Input
                        type="tel"
                        inputMode="tel"
                        placeholder={t("phonePlaceholder")}
                        value={boutiqueTelephone}
                        onChange={(e) => setBoutiqueTelephone(e.target.value)}
                        className={`mt-1.5 ${fieldClass}`}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="xl"
                        onClick={() => {
                          setErrors({});
                          setStep(1);
                        }}
                        disabled={loading}
                        className="h-14 rounded-2xl font-bold px-5"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        type="button"
                        variant="brand"
                        size="xl"
                        onClick={handleSubmit}
                        loading={loading}
                        className="flex-1 h-14 rounded-2xl font-black text-base shadow-xl shadow-brand/20"
                      >
                        {loading ? t("submitting") : t("finishSubmit")}
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
