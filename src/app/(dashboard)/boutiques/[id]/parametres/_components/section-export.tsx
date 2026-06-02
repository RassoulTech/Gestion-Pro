"use client";

import React from "react";
import Link from "next/link";
import { Download, FileText, Package, Users, Truck, ShoppingBag, Wallet, ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  boutiqueId: string;
}

const EXPORT_LINKS: { title: string; desc: string; href: (id: string) => string; icon: React.ComponentType<{ className?: string }>; }[] = [
  {
    title: "Rapports & Ventes",
    desc: "Export PDF / Excel des ventes, marges, stock — depuis la page Rapports.",
    href: (id) => `/boutiques/${id}/rapports`,
    icon: FileText,
  },
  {
    title: "Produits",
    desc: "Liste complète des produits du catalogue.",
    href: (id) => `/boutiques/${id}/produits`,
    icon: Package,
  },
  {
    title: "Commandes clients",
    desc: "Historique des commandes et factures.",
    href: (id) => `/boutiques/${id}/commandes`,
    icon: ShoppingBag,
  },
  {
    title: "Clients",
    desc: "Annuaire de votre clientèle.",
    href: (id) => `/boutiques/${id}/clients`,
    icon: Users,
  },
  {
    title: "Fournisseurs",
    desc: "Annuaire de vos fournisseurs et commandes.",
    href: (id) => `/boutiques/${id}/fournisseurs`,
    icon: Truck,
  },
  {
    title: "Dépenses",
    desc: "Suivi des charges et dépenses opérationnelles.",
    href: (id) => `/boutiques/${id}/depenses`,
    icon: Wallet,
  },
];

export function SectionExport({ boutiqueId }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
        <Info className="h-4 w-4 text-brand mt-0.5 shrink-0" />
        <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Les exports (PDF, Excel, CSV) sont disponibles directement sur chaque section depuis le bouton{" "}
          <span className="inline-flex items-center gap-1 font-bold text-zinc-900 dark:text-zinc-100">
            <Download className="h-3 w-3" /> Télécharger
          </span>. Vous retrouvez ici un raccourci vers chaque source de données.
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {EXPORT_LINKS.map(({ title, desc, href, icon: Icon }) => (
          <Link
            key={title}
            href={href(boutiqueId)}
            className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-5 transition-colors hover:bg-white dark:hover:bg-zinc-900 hover:border-brand/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="h-10 w-10 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-brand" />
              </div>
              <ExternalLink className="h-4 w-4 text-zinc-300 group-hover:text-brand transition-colors" />
            </div>
            <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 mt-3">{title}</p>
            <p className="text-[11px] font-medium text-zinc-500 mt-1 leading-relaxed">{desc}</p>
          </Link>
        ))}
      </div>

      <Button asChild className="w-full h-12 rounded-xl font-bold text-sm bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-brand dark:hover:bg-brand/90">
        <Link href={`/boutiques/${boutiqueId}/rapports`}>
          <Download className="mr-2 h-4 w-4" /> Aller au centre Rapports
        </Link>
      </Button>
    </div>
  );
}
