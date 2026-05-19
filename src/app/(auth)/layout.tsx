/* eslint-disable @typescript-eslint/no-unused-vars */
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft, Check, Sparkles } from "lucide-react";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin/dashboard" : "/boutiques");
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Global Background Pattern */}
      <div className="fixed inset-0 -z-20 h-full w-full bg-background">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="grid min-h-screen lg:grid-cols-2">
        {/* ── Panneau visuel (desktop only) ────────────────────────── */}
        <aside className="relative isolate hidden flex-col justify-start gap-10 overflow-hidden border-r border-border/50 bg-background/50 backdrop-blur-3xl px-12 pt-12 pb-8 lg:flex">
          {/* Brand Spotlights */}
          <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-brand/10 blur-[100px] rounded-full animate-float" />
            <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-info/10 blur-[100px] rounded-full animate-float [animation-delay:2s]" />
          </div>

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 self-start group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-lg shadow-brand/20 group-hover:rotate-6 transition-transform">
              <span className="text-xl font-black">G</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              GestionPro
            </span>
          </Link>

          {/* Argumentaire */}
          <div className="max-w-md space-y-10">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-xs font-bold text-brand uppercase tracking-widest">
                <Sparkles className="w-4 h-4" />
                Plateforme Commerciale
              </div>
              <h2 className="text-display text-4xl lg:text-5xl tracking-tight text-foreground">
                Maîtrisez votre <br />
                <span className="text-shimmer">commerce.</span>
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground font-medium">
                Boutiques, stock, ventes, clients, marketplace — une seule
                interface, pensée pour la croissance.
              </p>
            </div>

            <ul className="space-y-5">
              {[
                "Essai gratuit sans carte bancaire",
                "Configuration en moins de 2 minutes",
                "Données 100 % sécurisées et chiffrées",
              ].map((item) => (
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
          <p className="text-sm font-medium text-muted-foreground/60 italic">
            Rejoignez l&apos;élite des commerçants africains.
          </p>
        </aside>

        {/* ── Panneau formulaire ──────────────────────────────────── */}
        <main className="relative flex flex-col items-center pt-10 p-8 overflow-y-auto">
          {/* Header mobile */}
          <div className="flex items-center justify-between w-full mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-lg shadow-brand/20">
                <span className="text-lg font-black">G</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                GestionPro
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
              Retour
            </Link>
          </div>

          <div className="w-full max-w-sm glass rounded-[2.5rem] p-10 md:p-12 shadow-2xl border border-white/5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
