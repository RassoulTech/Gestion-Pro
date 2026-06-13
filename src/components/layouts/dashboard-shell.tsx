"use client";

import React from "react";
import { Sidebar } from "@/components/layouts/sidebar";
import { Header } from "@/components/layouts/header";
import { BottomNav } from "@/components/layouts/bottom-nav";
import { useBoutique } from "@/components/layouts/boutique-provider";
import { useParams } from "next/navigation";

import { usePathname } from "next/navigation";

type DashboardShellProps = {
  children: React.ReactNode;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  userRole?: string;
};

function BoutiqueAwareSidebar({ role }: { role?: string }) {
  const pathname = usePathname() || "";
  const isAdminRoute = pathname.startsWith("/admin");
  const params = useParams();
  const boutiqueIdFromUrl = params?.id as string | undefined;

  let boutiqueId: string | undefined;
  let boutiqueName: string | undefined;

  try {
    const ctx = useBoutique();
    boutiqueId = ctx.id;
    boutiqueName = ctx.nom;
  } catch {
    // Not inside a BoutiqueProvider
  }

  const finalBoutiqueId = isAdminRoute ? undefined : (boutiqueId || boutiqueIdFromUrl);
  const finalBoutiqueName = isAdminRoute ? undefined : boutiqueName;

  return (
    <Sidebar
      boutiqueId={finalBoutiqueId}
      boutiqueName={finalBoutiqueName}
      role={isAdminRoute ? "ADMIN" : role}
    />
  );
}

function BoutiqueAwareHeader(props: Omit<DashboardShellProps, "children">) {
  const pathname = usePathname() || "";
  const isAdminRoute = pathname.startsWith("/admin");
  const params = useParams();
  const boutiqueIdFromUrl = params?.id as string | undefined;

  let boutiqueName: string | undefined;

  try {
    const ctx = useBoutique();
    boutiqueName = ctx.nom;
  } catch {
    // Not inside a BoutiqueProvider
  }

  const finalBoutiqueName = isAdminRoute ? undefined : (boutiqueName || (boutiqueIdFromUrl ? "Boutique" : undefined));

  return (
    <Header
      boutiqueName={finalBoutiqueName}
      userName={props.userName}
      userEmail={props.userEmail}
      userImage={props.userImage}
    />
  );
}

export function DashboardShell({
  children,
  userName,
  userEmail,
  userImage,
  userRole,
}: DashboardShellProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <BoutiqueAwareSidebar role={userRole} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <BoutiqueAwareHeader
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
        />

        <main className="flex-1 overflow-auto p-3 pb-24 sm:p-4 sm:pb-24 md:p-6 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
