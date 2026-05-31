import React from "react";
// Touch file to trigger IDE TS cache reload
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBoutiqueOwnerQuotas } from "@/lib/quotas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { QRCodeClient } from "./_components/qrcode-client";

interface QRCodePageProps {
  params: Promise<{ id: string }>;
}

export default async function BoutiqueQRCodePage({ params }: QRCodePageProps) {
  const { id: boutiqueId } = await params;
  
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Query boutique details with casting to bypass IDE caching issues
  const boutique = (await prisma.boutique.findUnique({
    where: { id: boutiqueId },
    select: {
      id: true,
      nom: true,
      slug: true,
      logo: true,
      description: true,
      qrCodeUrl: true,
      qrCodeGeneratedAt: true,
    } as any,
  })) as any;

  if (!boutique) {
    notFound();
  }

  // Get plan quotas to enforce permissions
  const quotas = await getBoutiqueOwnerQuotas(boutiqueId);
  const isStarter = quotas.codePlan === "STARTER";

  if (isStarter) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full relative group">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-600 rounded-3xl blur-2xl opacity-10 group-hover:opacity-15 transition-opacity" />
          
          <Card className="relative z-10 border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-orange-500/5 blur-3xl rounded-full" />
            <CardHeader className="text-center pt-8 pb-4">
              <div className="mx-auto w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 mb-4 animate-pulse">
                <Lock className="h-6 w-6 text-amber-500" />
              </div>
              <CardTitle className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                Fonctionnalité Verrouillée
              </CardTitle>
              <CardDescription className="font-semibold text-zinc-500 dark:text-zinc-400 mt-2">
                Génération de QR Code Boutique Officiel
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-8 text-center">
              <p className="text-sm text-zinc-600 dark:text-zinc-300 font-semibold mb-6 leading-relaxed">
                Cette fonctionnalité est réservée aux forfaits <span className="text-orange-500 font-bold">Pro</span> et <span className="text-orange-500 font-bold">Enterprise</span>. Elle vous permet d&apos;imprimer des affiches commerciales professionnelles au format A4 pour votre boutique physique.
              </p>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Aperçu et téléchargement de l&apos;affiche en haute qualité (PNG, PDF)</span>
                </div>
                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Intégration du logo et d&apos;un design d&apos;affiche commerciale premium</span>
                </div>
                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Redirection instantanée des clients vers votre boutique Marketplace</span>
                </div>
              </div>

              <Button
                asChild
                className="w-full h-12 rounded-xl font-black bg-gradient-to-r from-orange-500 to-amber-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-orange-500/20 text-white"
              >
                <Link href={`/boutiques/${boutiqueId}/facturation`} className="inline-flex items-center justify-center">
                  Passer au forfait Pro
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white">QR Code Boutique</h1>
            <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/15 border-none font-bold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Crown className="h-3 w-3 fill-amber-500" />
              {quotas.codePlan}
            </Badge>
          </div>
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-1">
            Générez et téléchargez votre QR code officiel pour rediriger vos clients vers votre espace de vente.
          </p>
        </div>
      </div>

      <QRCodeClient 
        boutiqueId={boutiqueId} 
        boutiqueName={boutique.nom}
        boutiqueSlug={boutique.slug}
        boutiqueLogo={boutique.logo}
        boutiqueDescription={boutique.description}
        initialQrCodeUrl={boutique.qrCodeUrl}
        plan={quotas.codePlan}
      />
    </div>
  );
}
