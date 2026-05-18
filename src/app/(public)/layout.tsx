import Link from "next/link";
import { Github, Mail, Twitter } from "lucide-react";
import { FloatingNavbar } from "@/components/marketing/floating-navbar";

const footerColumns: Array<{
  title: string;
  links: Array<{ href: string; label: string }>;
}> = [
  {
    title: "Produit",
    links: [
      { href: "/#fonctionnalites", label: "Fonctionnalités" },
      { href: "/#tarifs", label: "Tarifs" },
      { href: "/marketplace", label: "Marketplace" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Entreprise",
    links: [
      { href: "/a-propos", label: "À propos" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
      { href: "mailto:partenariats@gestionpro.app", label: "Partenariats" },
    ],
  },
  {
    title: "Légal",
    links: [
      { href: "/cgu", label: "CGU" },
      { href: "/cgv", label: "CGV" },
      { href: "/confidentialite", label: "Confidentialité" },
      { href: "/mentions-legales", label: "Mentions légales" },
    ],
  },
  {
    title: "Compte",
    links: [
      { href: "/login", label: "Connexion" },
      { href: "/register", label: "Inscription" },
      { href: "/support", label: "Support" },
      { href: "/status", label: "Statut" },
    ],
  },
];

const socials: Array<{ href: string; label: string; icon: typeof Github }> = [
  { href: "mailto:contact@gestionpro.app", label: "Email", icon: Mail },
  { href: "https://twitter.com", label: "Twitter", icon: Twitter },
  { href: "https://github.com", label: "GitHub", icon: Github },
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col relative">
      {/* Global Background Pattern */}
      <div className="fixed inset-0 -z-20 h-full w-full bg-background">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <FloatingNavbar />

      <main className="flex-1">{children}</main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative border-t border-border/50 bg-background/50 backdrop-blur-md">
        <div className="container-app py-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-4">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-lg shadow-brand/20 group-hover:rotate-6 transition-transform">
                  <span className="text-lg font-black">G</span>
                </div>
                <span className="text-xl font-bold tracking-tight text-foreground">
                  GestionPro
                </span>
              </Link>
              <p className="mt-6 max-w-sm text-base leading-relaxed text-muted-foreground">
                La solution ultime pour digitaliser votre commerce en Afrique de l&apos;Ouest.
                Simplicité, fiabilité, croissance.
              </p>

              <ul className="mt-8 flex gap-4">
                {socials.map((s) => {
                  const Icon = s.icon;
                  const isExternal = /^https?:/.test(s.href);
                  return (
                    <li key={s.label}>
                      <a
                        href={s.href}
                        aria-label={s.label}
                        {...(isExternal && {
                          target: "_blank",
                          rel: "noopener noreferrer",
                        })}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all hover:border-brand hover:text-brand hover:-translate-y-1"
                      >
                        <Icon className="h-5 w-5" strokeWidth={1.5} />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-8 md:col-span-8 md:grid-cols-4">
              {footerColumns.map((col) => (
                <div key={col.title}>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground mb-6">
                    {col.title}
                  </h3>
                  <ul className="space-y-4">
                    {col.links.map((l) => {
                      const isExternal = /^https?:|^mailto:/.test(l.href);
                      if (isExternal) {
                        return (
                          <li key={l.href}>
                            <a
                              href={l.href}
                              className="text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
                            >
                              {l.label}
                            </a>
                          </li>
                        );
                      }
                      return (
                        <li key={l.href}>
                          <Link
                            href={l.href}
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
                          >
                            {l.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-20 flex flex-col items-start justify-between gap-6 border-t border-border/50 pt-10 sm:flex-row sm:items-center">
            <p className="text-sm text-muted-foreground font-medium">
              © {new Date().getFullYear()} GestionPro. Fabriqué avec passion pour l&apos;Afrique.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/20">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-bold text-success uppercase tracking-wider">Opérationnel</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
