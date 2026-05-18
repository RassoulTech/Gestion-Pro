/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
 
import { Sidebar } from "@/components/layouts/sidebar";
 
import { Header } from "@/components/layouts/header";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Loading skeleton ─────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="flex h-screen w-full">
      {/* Sidebar skeleton */}
      <div className="hidden w-[220px] shrink-0 border-r border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:block">
        <div className="flex h-14 items-center border-b border-zinc-100 px-4 dark:border-zinc-800">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="ml-2 h-4 w-28" />
        </div>
        <div className="space-y-1 p-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-md" />
          ))}
        </div>
      </div>

      {/* Main area skeleton */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-14 shrink-0 items-center border-b border-zinc-100 px-4 dark:border-zinc-800">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="ml-auto h-8 w-8 rounded-full" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-48 rounded-md" />
          <Skeleton className="mt-4 h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard shell (client-interactive wrapper) ─────────────

// We need a client component to manage sidebar mobile state.
// Keep the actual client logic in a thin wrapper.
import { DashboardShell } from "@/components/layouts/dashboard-shell";

// ─── Layout ──────────────────────────────────────────────────

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { name, email, image, role } = session.user;

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardShell
        userName={name}
        userEmail={email}
        userImage={image}
        userRole={role}
      >
        {children}
      </DashboardShell>
    </Suspense>
  );
}
