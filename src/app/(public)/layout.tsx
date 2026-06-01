import Link from "next/link";
import { Github, Mail, Twitter } from "lucide-react";
import { FloatingNavbar } from "@/components/marketing/floating-navbar";
import { BrandLogo } from "@/components/brand-logo";

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

const WhatsAppIcon = (props: React.ComponentProps<"svg">) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.437 0 9.862-4.41 9.865-9.85.002-2.636-1.02-5.115-2.879-6.979C16.398 1.912 13.926.887 11.3.887 5.86.887 1.439 5.3 1.436 10.74c0 1.562.415 3.09 1.202 4.457l-1.018 3.719 3.824-.997c1.336.727 2.766 1.096 4.203 1.096zM17.65 14.15c-.3-.15-1.785-.88-2.062-.98-.278-.1-.48-.15-.68.15-.2.3-.77.98-.945 1.18-.175.2-.35.225-.65.075-.3-.15-1.27-.47-2.42-1.49-.89-.8-1.5-1.78-1.675-2.08-.175-.3-.02-.46.13-.61.135-.13.3-.35.45-.52.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.68-1.64-.93-2.24-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.525.075-.8 0-.275-.3-1.05-1.025-1.44-1.95-.36-.85-.15-1.52.075-1.7.35-.3.6-.525.9-.9.1-.125.175-.25.25-.425.075-.175.04-.325-.02-.475-.06-.15-.58-1.4-.8-1.92-.215-.52-.46-.45-.63-.45h-.54c-.18 0-.475.067-.723.342-.248.275-.945.925-.945 2.25s.965 2.6 1.1 2.775c.135.175 1.9 2.9 4.6 4.075.64.28 1.14.448 1.53.573.645.205 1.23.175 1.69.107.514-.077 1.785-.73 2.037-1.435.252-.705.252-1.31.176-1.435-.075-.125-.275-.2-.575-.35z" />
  </svg>
);

const socials: Array<{ href: string; label: string; icon: React.ComponentType<React.ComponentProps<"svg">> }> = [
  { href: "https://wa.me/221773831364", label: "WhatsApp", icon: WhatsAppIcon },
  { href: "mailto:contact@gestionpro.app", label: "Email", icon: Mail as never },
  { href: "https://twitter.com", label: "Twitter", icon: Twitter as never },
  { href: "https://github.com", label: "GitHub", icon: Github as never },
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
              <Link href="/" className="flex items-center gap-2.5 group self-start" aria-label="Accueil GestionPro">
                <BrandLogo
                  size={40}
                  className="shadow-lg shadow-orange-600/20 group-hover:rotate-6 transition-all duration-500 rounded-xl"
                />
                <span className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                  Gestion<span className="text-orange-600 dark:text-orange-500">Pro</span>
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
