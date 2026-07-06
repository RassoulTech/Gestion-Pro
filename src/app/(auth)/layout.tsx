 
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { SupportWidget } from "@/components/support/support-widget";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin/dashboard" : "/boutiques");
  }
  const t = await getTranslations("auth.panel");

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Global Background Pattern */}
      <div className="fixed inset-0 -z-20 h-full w-full bg-background">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="grid min-h-screen lg:h-screen lg:overflow-hidden lg:grid-cols-[45%_55%]">
        {/* ── Panneau visuel (desktop only) ────────────────────────── */}
        <aside className="relative isolate hidden flex-col justify-between overflow-hidden border-r border-border/50 bg-background/50 backdrop-blur-3xl px-12 py-12 lg:flex lg:h-full lg:overflow-hidden">
          {/* Brand Spotlights */}
          <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-brand/10 blur-[100px] rounded-full animate-float" />
            <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-info/10 blur-[100px] rounded-full animate-float [animation-delay:2s]" />
          </div>

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 self-start group"
            aria-label="Accueil GestionPro"
          >
            <BrandLogo
              size={40}
              className="shadow-lg shadow-brand/20 group-hover:rotate-6 transition-transform rounded-xl"
            />
            <span className="text-xl font-bold tracking-tight text-foreground">
              Gestion<span className="text-brand">Pro</span>
            </span>
          </Link>

          {/* Argumentaire */}
          <div className="max-w-md space-y-10 my-auto">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-xs font-bold text-brand uppercase tracking-widest">
                <Sparkles className="w-4 h-4" />
                {t("badge")}
              </div>
              <h2 className="text-display text-4xl lg:text-5xl tracking-tight text-foreground">
                {t("titleLead")} <br />
                <span className="text-shimmer">{t("titleHighlight")}</span>
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground font-medium">
                {t("subtitle")}
              </p>
            </div>

            <ul className="space-y-5">
              {[t("bullet1"), t("bullet2"), t("bullet3")].map((item) => (
                <li key={item} className="flex items-start gap-3.5 group">
                  <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-success/10 text-success transition-transform group-hover:scale-110">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </div>
                  <span className="text-foreground/80 font-semibold">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pied panneau */}
          <p className="text-sm font-medium text-muted-foreground/60 italic mt-6">
            {t("tagline")}
          </p>
        </aside>

        {/* ── Panneau formulaire ──────────────────────────────────── */}
        <main className="relative flex flex-col items-center pt-10 pb-10 p-8 overflow-y-auto lg:h-full lg:max-h-screen w-full lg:justify-start lg:[&::-webkit-scrollbar]:w-1.5 lg:[&::-webkit-scrollbar-track]:bg-transparent lg:[&::-webkit-scrollbar-thumb]:bg-zinc-200 dark:lg:[&::-webkit-scrollbar-thumb]:bg-zinc-800 lg:[&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Header mobile */}
          <div className="flex items-center justify-between w-full mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Accueil GestionPro">
              <BrandLogo size={36} className="shadow-lg shadow-brand/20 rounded-xl" />
              <span className="text-lg font-bold tracking-tight text-foreground">
                Gestion<span className="text-brand">Pro</span>
              </span>
            </Link>
          </div>

          {/* Lien retour desktop */}
          <div className="hidden lg:flex items-center gap-2 mb-6 self-end">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-foreground/5 px-4 py-2 text-sm font-bold text-foreground transition-all hover:bg-foreground/10 hover:translate-x-1"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("back")}
            </Link>
          </div>

          <div className="w-full max-w-sm glass rounded-[2.5rem] p-10 md:p-12 shadow-2xl border border-white/5 lg:my-auto transition-all duration-300">
            {children}
          </div>
        </main>
      </div>
      <SupportWidget variant="visiteur" />
    </div>
  );
}
