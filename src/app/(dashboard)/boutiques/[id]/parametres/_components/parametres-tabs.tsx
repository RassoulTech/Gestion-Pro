"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, Store, KeyRound, ShieldCheck, Sparkles, Bell, Sliders, Download, AlertTriangle, Link2,
} from "lucide-react";

interface Section {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

interface Props {
  defaultValue?: string;
  sections: {
    profil: React.ReactNode;
    boutique: React.ReactNode;
    lienPublic: React.ReactNode;
    compte: React.ReactNode;
    securite: React.ReactNode;
    abonnement: React.ReactNode;
    notifications: React.ReactNode;
    preferences: React.ReactNode;
    exportData: React.ReactNode;
    danger: React.ReactNode;
  };
}

export function ParametresTabs({ defaultValue = "profil", sections }: Props) {
  const items: Section[] = [
    { value: "profil", label: "Profil", icon: User, content: sections.profil },
    { value: "boutique", label: "Ma Boutique", icon: Store, content: sections.boutique },
    { value: "lien", label: "Lien public", icon: Link2, content: sections.lienPublic },
    { value: "compte", label: "Compte", icon: KeyRound, content: sections.compte },
    { value: "securite", label: "Sécurité", icon: ShieldCheck, content: sections.securite },
    { value: "abonnement", label: "Abonnement", icon: Sparkles, content: sections.abonnement },
    { value: "notifications", label: "Notifications", icon: Bell, content: sections.notifications },
    { value: "preferences", label: "Préférences", icon: Sliders, content: sections.preferences },
    { value: "export", label: "Export", icon: Download, content: sections.exportData },
    { value: "danger", label: "Zone sensible", icon: AlertTriangle, content: sections.danger },
  ];

  return (
    <Tabs defaultValue={defaultValue} className="w-full">
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-none">
        <TabsList className="inline-flex h-auto items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl w-max sm:w-full sm:flex-wrap">
          {items.map((item) => {
            const Icon = item.icon;
            const isDanger = item.value === "danger";
            return (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className={`inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs font-bold whitespace-nowrap transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-zinc-800 ${
                  isDanger ? "data-[state=active]:text-rose-600" : "data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {items.map((item) => (
        <TabsContent key={item.value} value={item.value} className="mt-6 focus-visible:ring-0 focus-visible:outline-none">
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
