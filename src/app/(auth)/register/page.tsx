"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Check, Lock, MailCheck, Store, User } from "lucide-react";
import { z } from "zod";

import {
  registerAccountSchema,
  registerIdentitySchema,
  registerBoutiqueSchema,
} from "@/schemas/auth.schema";
import {
  submitVendorRegistration,
  resendVerificationEmail,
} from "@/server/actions/auth.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/image-upload";
import { SectorSelect } from "@/components/auth/sector-select";
import { PasswordInput } from "@/components/auth/password-input";
import { GoogleButton } from "@/components/auth/google-button";

const EASE = [0.16, 1, 0.3, 1] as const;

const OAUTH_ERROR_KEYS: Record<string, string> = {
  OAuthSignin: "registerSignin",
  OAuthCallback: "callback",
  OAuthCreateAccount: "createAccount",
  OAuthAccountNotLinked: "accountNotLinked",
  Callback: "callbackGeneric",
  AccessDenied: "accessDenied",
  Configuration: "registerConfiguration",
};

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

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tw = useTranslations("auth.wizard");
  const tm = useTranslations("marketplace");
  const searchParams = useSearchParams();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  // Données conservées CÔTÉ CLIENT pendant tout le parcours (allers-retours sans
  // perte) — rien n'est persisté en base tant que l'étape 3 n'est pas soumise.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  // Écran de confirmation (e-mail envoyé)
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [emailFailed, setEmailFailed] = useState(false);

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (!oauthError) return;
    const key = OAUTH_ERROR_KEYS[oauthError];
    toast.error(key ? t(`oauth.${key}`) : t("oauth.registerFallback"));
  }, [searchParams, t]);

  function goNext() {
    let result: z.SafeParseReturnType<unknown, unknown>;
    if (step === 1) {
      result = registerAccountSchema.safeParse({ email, password, confirmPassword });
    } else {
      result = registerIdentitySchema.safeParse({ prenom, nom, telephone });
    }
    if (!result.success) {
      setErrors(zodErrors(result.error));
      return;
    }
    setErrors({});
    setStep((s) => (s === 1 ? 2 : 3) as 1 | 2 | 3);
  }

  function goBack() {
    setErrors({});
    setStep((s) => (s === 3 ? 2 : 1) as 1 | 2 | 3);
  }

  async function handleSubmit() {
    if (!secteurActivite) {
      setErrors({ secteurActivite: tw("sectorPlaceholder") });
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
      const res = await submitVendorRegistration({
        email,
        password,
        prenom,
        nom,
        telephone,
        boutiqueNom,
        secteurActivite: secteurActivite as (typeof SECTEURS)[number],
        boutiqueAdresse,
        boutiqueTelephone,
        // Email boutique : si « même que le compte », on laisse vide → le serveur
        // retombe sur l'email du compte à la création finale.
        boutiqueEmail: sameAsAccount ? "" : boutiqueEmail,
        logo,
      });
      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      if (res?.data?.success) {
        if (res.data.emailFailed) toast.warning(res.data.success);
        else toast.success(res.data.success);
        setSentEmail(email);
        setDevLink(res.data.devLink ?? null);
        setEmailFailed(res.data.emailFailed ?? false);
      }
    } catch {
      toast.error(t("genericError"));
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "h-12 rounded-2xl bg-foreground/5 border-none px-5 text-sm font-bold transition-all focus:bg-foreground/10";
  const errClass = "text-xs font-semibold text-destructive mt-1";

  // ─── Écran de confirmation ───────────────────────────────────────────────
  if (sentEmail) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: EASE }}
        className="space-y-8 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
          <MailCheck className="h-8 w-8 text-success" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            {emailFailed ? t("register.successTitleFailed") : t("register.successTitle")}
          </h1>
          <p className="text-base font-medium text-muted-foreground leading-relaxed">
            {emailFailed
              ? t.rich("register.successTextFailed", {
                  b: (chunks) => <span className="font-bold text-destructive">{chunks}</span>,
                })
              : t.rich("register.successText", {
                  email: sentEmail,
                  b: (chunks) => <span className="font-bold text-foreground">{chunks}</span>,
                })}
          </p>
          {!emailFailed && (
            <p className="text-xs font-medium text-muted-foreground/80 italic">
              {t("register.checkSpam")}
            </p>
          )}
        </div>

        {devLink && (
          <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-left space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-warning">
              {t("devModeTitle")}
            </p>
            <p className="text-xs font-medium text-muted-foreground leading-relaxed">
              {t("register.devModeText")}
            </p>
            <Link
              href={devLink}
              className="block break-all rounded-lg bg-foreground/5 px-3 py-2 text-xs font-bold text-brand hover:bg-foreground/10"
            >
              {devLink}
            </Link>
          </div>
        )}

        <p className="text-sm font-bold text-muted-foreground">
          {t("register.notReceived")}{" "}
          <button
            type="button"
            onClick={async () => {
              const r = await resendVerificationEmail({ email: sentEmail });
              if (r?.data?.success) {
                if (r.data.emailFailed) toast.warning(r.data.success);
                else {
                  toast.success(r.data.success);
                  setEmailFailed(false);
                }
                if (r.data.devLink) setDevLink(r.data.devLink);
              } else if (r?.serverError) toast.error(r.serverError);
            }}
            className="text-brand hover:underline underline-offset-4"
          >
            {t("resendLink")}
          </button>
        </p>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("register.backToLogin")}
        </Link>
      </motion.div>
    );
  }

  // ─── Barre de progression ────────────────────────────────────────────────
  const STEPS = [
    { n: 1, label: tw("stepAccount"), icon: Lock },
    { n: 2, label: tw("stepIdentity"), icon: User },
    { n: 3, label: tw("stepBoutique"), icon: Store },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, ease: EASE }}
      className="space-y-8"
    >
      {/* Indicateur d'étapes */}
      <div className="flex items-center justify-center gap-1.5">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = step > s.n;
          const active = step === s.n;
          return (
            <div key={s.n} className="flex items-center gap-1.5">
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
                <div className={`h-0.5 w-6 rounded ${step > s.n ? "bg-success" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="space-y-6"
        >
          {/* ── Étape 1 — Compte ── */}
          {step === 1 && (
            <>
              <div className="space-y-1.5 text-center">
                <h1 className="text-2xl font-black tracking-tight text-foreground">{tw("accountTitle")}</h1>
                <p className="text-sm font-medium text-muted-foreground">{tw("accountSubtitle")}</p>
              </div>

              <GoogleButton label={t("register.googleLabel")} enabled callbackUrl="/onboarding" />

              <div className="relative">
                <div className="h-px w-full bg-border" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {t("orEmail")}
                </span>
              </div>

              <div>
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  {t("register.emailLabel")}
                </Label>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder={t("register.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`mt-1.5 ${fieldClass}`}
                />
                {errors.email && <p className={errClass}>{errors.email}</p>}
              </div>

              <div>
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  {t("register.passwordLabel")}
                </Label>
                <PasswordInput
                  autoComplete="new-password"
                  placeholder={t("register.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`mt-1.5 ${fieldClass}`}
                />
                {errors.password && <p className={errClass}>{errors.password}</p>}
              </div>

              <div>
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  {t("register.confirmLabel")}
                </Label>
                <PasswordInput
                  autoComplete="new-password"
                  placeholder={t("register.confirmPlaceholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`mt-1.5 ${fieldClass}`}
                />
                {errors.confirmPassword && <p className={errClass}>{errors.confirmPassword}</p>}
              </div>

              <Button
                type="button"
                variant="brand"
                size="xl"
                onClick={goNext}
                className="w-full h-14 rounded-2xl font-black text-base shadow-xl shadow-brand/20 active-press"
              >
                {tw("next")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </>
          )}

          {/* ── Étape 2 — Identité ── */}
          {step === 2 && (
            <>
              <div className="space-y-1.5 text-center">
                <h1 className="text-2xl font-black tracking-tight text-foreground">{tw("identityTitle")}</h1>
                <p className="text-sm font-medium text-muted-foreground">{tw("identitySubtitle")}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    {tw("firstName")}
                  </Label>
                  <Input
                    placeholder={tw("firstNamePlaceholder")}
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className={`mt-1.5 ${fieldClass}`}
                  />
                  {errors.prenom && <p className={errClass}>{errors.prenom}</p>}
                </div>
                <div>
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    {tw("lastName")}
                  </Label>
                  <Input
                    placeholder={tw("lastNamePlaceholder")}
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className={`mt-1.5 ${fieldClass}`}
                  />
                  {errors.nom && <p className={errClass}>{errors.nom}</p>}
                </div>
              </div>

              <div>
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  {tw("phone")}
                </Label>
                <Input
                  type="tel"
                  inputMode="tel"
                  placeholder={tw("phonePlaceholder")}
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className={`mt-1.5 ${fieldClass}`}
                />
                {errors.telephone && <p className={errClass}>{errors.telephone}</p>}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="xl"
                  onClick={goBack}
                  className="h-14 rounded-2xl font-bold px-5"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="brand"
                  size="xl"
                  onClick={goNext}
                  className="flex-1 h-14 rounded-2xl font-black text-base shadow-xl shadow-brand/20 active-press"
                >
                  {tw("next")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </>
          )}

          {/* ── Étape 3 — Boutique ── */}
          {step === 3 && (
            <>
              <div className="space-y-1.5 text-center">
                <h1 className="text-2xl font-black tracking-tight text-foreground">{tw("boutiqueTitle")}</h1>
                <p className="text-sm font-medium text-muted-foreground">{tw("boutiqueSubtitle")}</p>
              </div>

              {/* Logo (optionnel) — data URL en staging, rien d'externe avant vérif */}
              <div className="flex flex-col items-center gap-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  {tw("logoLabel")}{" "}
                  <span className="text-[10px] font-bold normal-case text-muted-foreground/60">
                    ({tw("logoOptional")})
                  </span>
                </Label>
                <ImageUpload mode="dataUrl" value={logo} onChange={setLogo} />
              </div>

              <div>
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  {tw("boutiqueName")}
                </Label>
                <Input
                  placeholder={tw("boutiqueNamePlaceholder")}
                  value={boutiqueNom}
                  onChange={(e) => setBoutiqueNom(e.target.value)}
                  className={`mt-1.5 ${fieldClass}`}
                />
                {errors.boutiqueNom && <p className={errClass}>{errors.boutiqueNom}</p>}
              </div>

              <div>
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  {tw("sector")}
                </Label>
                <SectorSelect
                  value={secteurActivite}
                  onValueChange={setSecteurActivite}
                  className="mt-1.5 h-12"
                />
                {errors.secteurActivite && <p className={errClass}>{errors.secteurActivite}</p>}
              </div>

              {/* Email boutique : par défaut = email du compte, modifiable */}
              <div>
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  {tw("boutiqueEmail")}
                </Label>
                <label className="mt-1.5 flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsAccount}
                    onChange={(e) => {
                      setSameAsAccount(e.target.checked);
                      if (!e.target.checked && !boutiqueEmail) setBoutiqueEmail(email);
                    }}
                    className="h-4 w-4 rounded accent-brand cursor-pointer"
                  />
                  <span className="text-xs font-bold text-muted-foreground">{tw("sameAsAccount")}</span>
                </label>
                <Input
                  type="email"
                  inputMode="email"
                  placeholder={t("register.emailPlaceholder")}
                  value={sameAsAccount ? email : boutiqueEmail}
                  onChange={(e) => setBoutiqueEmail(e.target.value)}
                  disabled={sameAsAccount}
                  className={`mt-2 ${fieldClass} ${sameAsAccount ? "opacity-60" : ""}`}
                />
                {errors.boutiqueEmail && <p className={errClass}>{errors.boutiqueEmail}</p>}
              </div>

              <div>
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  {tw("boutiqueAddress")}
                </Label>
                <Input
                  placeholder={tw("boutiqueAddressPlaceholder")}
                  value={boutiqueAdresse}
                  onChange={(e) => setBoutiqueAdresse(e.target.value)}
                  className={`mt-1.5 ${fieldClass}`}
                />
                {errors.boutiqueAdresse && <p className={errClass}>{errors.boutiqueAdresse}</p>}
              </div>

              <div>
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  {tw("boutiquePhone")}
                </Label>
                <Input
                  type="tel"
                  inputMode="tel"
                  placeholder={tw("phonePlaceholder")}
                  value={boutiqueTelephone}
                  onChange={(e) => setBoutiqueTelephone(e.target.value)}
                  className={`mt-1.5 ${fieldClass}`}
                />
                {errors.boutiqueTelephone && <p className={errClass}>{errors.boutiqueTelephone}</p>}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="xl"
                  onClick={goBack}
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
                  className="flex-1 h-14 rounded-2xl font-black text-base shadow-xl shadow-brand/20 active-press"
                >
                  {loading ? tw("submitting") : tw("submit")}
                </Button>
              </div>

              <p className="text-center text-[10px] font-bold leading-relaxed text-muted-foreground uppercase tracking-wider">
                {t.rich("register.terms", {
                  cgu: (chunks) => (
                    <Link href="/cgu" className="text-brand hover:underline">{chunks}</Link>
                  ),
                  privacy: (chunks) => (
                    <Link href="/confidentialite" className="text-brand hover:underline">{chunks}</Link>
                  ),
                })}
              </p>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <p className="text-center text-sm font-bold text-muted-foreground">
        {t("register.alreadyMember")}{" "}
        <Link href="/login" className="text-brand hover:underline underline-offset-4">
          {t("register.signin")}
        </Link>
      </p>
    </motion.div>
  );
}
