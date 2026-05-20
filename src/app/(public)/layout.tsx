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

      {/* ── Premium Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl overflow-hidden py-16 md:py-24">
        {/* Glowing Decorative Radial Orbs */}
        <div className="absolute -bottom-10 left-1/4 w-96 h-96 bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 right-1/4 w-96 h-96 bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="container-app relative z-10">
          <div className="grid gap-12 md:grid-cols-12">
            {/* Brand Card Column */}
            <div className="md:col-span-4 space-y-6">
              <Link href="/" className="flex items-center gap-2.5 group self-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-600 to-emerald-500 text-white shadow-lg shadow-orange-600/20 group-hover:rotate-6 transition-all duration-500">
                  <span className="text-xl font-black">G</span>
                </div>
                <span className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                  GestionPro
                </span>
              </Link>
              <p className="max-w-sm text-sm font-semibold leading-relaxed text-zinc-500 dark:text-zinc-400">
                La solution ultime de commerce et gestion pour digitaliser votre commerce en Afrique de l&apos;Ouest. Simplicité, fiabilité, croissance.
              </p>

              {/* High-End Social Icons */}
              <ul className="flex gap-3">
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
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 transition-all hover:bg-orange-600/10 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-600/30 hover:-translate-y-1 hover:shadow-md"
                      >
                        <Icon className="h-5 w-5" strokeWidth={1.5} />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Links Columns Grid */}
            <div className="grid grid-cols-2 gap-8 md:col-span-8 md:grid-cols-4">
              {footerColumns.map((col) => (
                <div key={col.title} className="space-y-5">
                  <h3 className="text-xs font-black uppercase tracking-[0.25em] text-zinc-900 dark:text-zinc-50">
                    {col.title}
                  </h3>
                  <ul className="space-y-3.5">
                    {col.links.map((l) => {
                      const isExternal = /^https?:|^mailto:/.test(l.href);
                      const linkClass = "text-sm font-semibold text-zinc-500 dark:text-zinc-400 transition-all hover:text-orange-600 dark:hover:text-orange-400 inline-block hover:translate-x-1";
                      if (isExternal) {
                        return (
                          <li key={l.href}>
                            <a href={l.href} className={linkClass}>
                              {l.label}
                            </a>
                          </li>
                        );
                      }
                      return (
                        <li key={l.href}>
                          <Link href={l.href} className={linkClass}>
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

          {/* Divider */}
          <div className="mt-16 pt-8 border-t border-zinc-200/50 dark:border-zinc-800/50 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <p className="text-xs text-zinc-400 font-semibold">
              © {new Date().getFullYear()} GestionPro. Fabriqué avec passion pour l&apos;Afrique. Tous droits réservés.
            </p>
            
            {/* Operational Status Pulse */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Opérationnel
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
