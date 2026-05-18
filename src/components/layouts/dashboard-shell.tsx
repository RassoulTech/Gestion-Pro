"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layouts/sidebar";
import { Header } from "@/components/layouts/header";
import { BottomNav } from "@/components/layouts/bottom-nav";
import { useBoutique } from "@/components/layouts/boutique-provider";
import { useParams } from "next/navigation";

type DashboardShellProps = {
  children: React.ReactNode;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  userRole?: string;
};

function BoutiqueAwareSidebar({
  mobileOpen,
  onMobileClose,
  role,
}: {
  mobileOpen: boolean;
  onMobileClose: () => void;
  role?: string;
}) {
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

  const finalBoutiqueId = boutiqueId || boutiqueIdFromUrl;

  return (
    <Sidebar
      boutiqueId={finalBoutiqueId}
      boutiqueName={boutiqueName}
      mobileOpen={mobileOpen}
      onMobileClose={onMobileClose}
      role={role}
    />
  );
}

function BoutiqueAwareHeader(
  props: Omit<DashboardShellProps, "children"> & { onToggleSidebar: () => void },
) {
  const params = useParams();
  const boutiqueIdFromUrl = params?.id as string | undefined;

  let boutiqueName: string | undefined;

  try {
    const ctx = useBoutique();
    boutiqueName = ctx.nom;
  } catch {
    // Not inside a BoutiqueProvider
  }

  return (
    <Header
      boutiqueName={boutiqueName || (boutiqueIdFromUrl ? "Boutique" : undefined)}
      onToggleSidebar={props.onToggleSidebar}
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <BoutiqueAwareSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        role={userRole}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <BoutiqueAwareHeader
          onToggleSidebar={() => setMobileSidebarOpen((o) => !o)}
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
