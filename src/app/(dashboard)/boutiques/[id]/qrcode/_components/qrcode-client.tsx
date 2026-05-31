"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { generateBoutiqueQRCode } from "@/server/actions/qrcode.actions";
import { generateBoutiqueQRCodePDF } from "@/lib/generate-qrcode-pdf";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Download, 
  Share2, 
  RefreshCw, 
  FileText, 
  Check, 
  Image as ImageIcon,
  Palette,
  Sparkles,
  Copy,
  ExternalLink,
  MessageSquare,
  Type
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/brand-logo";

interface QRCodeClientProps {
  boutiqueId: string;
  boutiqueName: string;
  boutiqueSlug: string;
  boutiqueLogo: string | null;
  boutiqueDescription: string | null;
  initialQrCodeUrl: string | null;
  plan: string;
}

const PRESET_COLORS = [
  { name: "Orange Brand", hex: "#ea580c" },
  { name: "Slate Professional", hex: "#0f172a" },
  { name: "Gris Élégant", hex: "#64748b" },
];

export function QRCodeClient({
  boutiqueId,
  boutiqueName,
  boutiqueSlug,
  boutiqueLogo,
  boutiqueDescription,
  initialQrCodeUrl,
  plan,
}: QRCodeClientProps) {
  const router = useRouter();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(initialQrCodeUrl);
  const [selectedColor, setSelectedColor] = useState("#ea580c");
  const [customColor, setCustomColor] = useState("");
  
  // Enterprise Customization states
  const [customSlogan, setCustomSlogan] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  
  const isEnterprise = plan === "ENTERPRISE";
  const hasQrCode = !!qrCodeUrl;

  const { execute, isExecuting } = useAction(generateBoutiqueQRCode, {
    onSuccess: ({ data }) => {
      if (data?.success && data.qrCodeUrl) {
        setQrCodeUrl(data.qrCodeUrl);
        toast.success("QR Code généré avec succès !");
        router.refresh();
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erreur lors de la génération du QR Code.");
    },
  });

  // Auto-generate QR code if not already generated
  useEffect(() => {
    if (!initialQrCodeUrl) {
      execute({ boutiqueId });
    }
  }, [initialQrCodeUrl, boutiqueId, execute]);

  const handleDownloadPNG = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `qrcode-${boutiqueSlug}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Image PNG téléchargée !");
  };

  const handleDownloadPDF = async () => {
    try {
      toast.loading("Génération de la fiche PDF...", { id: "pdf-gen" });
      
      const doc = await generateBoutiqueQRCodePDF({
        boutiqueName,
        boutiqueSlug,
        boutiqueLogo,
        boutiqueDescription,
        themeColor: isEnterprise ? selectedColor : undefined,
        customSlogan: isEnterprise ? (customSlogan || undefined) : undefined,
        customMessage: isEnterprise ? (customMessage || undefined) : undefined,
      });

      doc.save(`affiche-boutique-${boutiqueSlug}.pdf`);
      toast.success("Affiche PDF A4 téléchargée !", { id: "pdf-gen" });
    } catch (err) {
      console.error(err);
      toast.error("Erreur de génération du PDF.", { id: "pdf-gen" });
    }
  };

  const getStoreUrl = () => {
    if (typeof window === "undefined") return `https://gestionpro.com/s/${boutiqueSlug}`;
    return `${window.location.origin}/s/${boutiqueSlug}`;
  };

  const handleCopyLink = () => {
    const storeUrl = getStoreUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(storeUrl);
      toast.success("Lien de la boutique copié dans le presse-papiers !");
    } else {
      toast.error("Votre navigateur ne supporte pas le copier-coller.");
    }
  };

  const handleShare = async () => {
    const storeUrl = getStoreUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: boutiqueName,
          text: `Découvrez ma boutique en ligne ${boutiqueName} !`,
          url: storeUrl,
        });
        toast.success("Partage réussi !");
      } catch (err) {
        // ignore abort error
      }
    } else {
      handleCopyLink();
    }
  };

  const handleColorPreset = (hex: string) => {
    setSelectedColor(hex);
    setCustomColor("");
  };

  const handleCustomColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomColor(val);
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      setSelectedColor(val);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* ─── LEFT: A4 Preview Support Mockup (Poster Style) ─── */}
      <div className="lg:col-span-7 flex justify-center">
        <div 
          className="w-full max-w-[420px] aspect-[1/1.414] bg-white border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
          style={{ 
            borderColor: selectedColor + "25",
            boxShadow: `0 20px 40px -15px ${selectedColor}10`
          }}
        >
          {/* Subtle elegant gray thin outer frame */}
          <div className="absolute inset-3 border border-zinc-100 dark:border-zinc-900 rounded-2xl pointer-events-none" />

          <div className="flex-1 flex flex-col justify-between items-center py-4 relative z-10">
            
            {/* 1. Logo of the Application at the top center */}
            <div className="flex flex-col items-center gap-1.5">
              <BrandLogo size={28} />
              <span className="text-[7px] font-black text-zinc-400 dark:text-zinc-500 tracking-[0.2em]">GESTIONPRO</span>
            </div>

            {/* 2. Logo of the Boutique */}
            <div className="flex flex-col items-center gap-2 mt-4">
              {boutiqueLogo ? (
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 relative bg-zinc-50 flex items-center justify-center shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={boutiqueLogo} alt="Logo Boutique" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md"
                  style={{ backgroundColor: selectedColor }}
                >
                  {boutiqueName.substring(0, 2).toUpperCase()}
                </div>
              )}

              {/* 3. Nom de la Boutique */}
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 tracking-tight text-center mt-1">
                {boutiqueName}
              </h2>
            </div>

            {/* 4. QR Code centré et visible */}
            <div className="my-4 relative">
              <div className="w-44 h-44 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center p-4 transition-all">
                {isExecuting ? (
                  <RefreshCw className="h-8 w-8 animate-spin text-zinc-300" />
                ) : qrCodeUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrCodeUrl} alt="Boutique QR Code" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-zinc-300" />
                )}
              </div>
            </div>

            {/* 5. Sous le QR Code : "Scannez pour visiter notre boutique" */}
            <div className="text-center w-full px-4">
              <p className="text-[11px] font-black text-zinc-900 dark:text-zinc-100">
                {isEnterprise && customSlogan ? customSlogan : "Scannez pour visiter notre boutique"}
              </p>
              
              {/* 6. URL de la Boutique */}
              <p 
                className="text-[9px] font-bold mt-1.5 transition-colors duration-300"
                style={{ color: selectedColor }}
              >
                {getStoreUrl().replace("https://", "").replace("http://", "")}
              </p>

              {/* 7. Phrase marketing */}
              <p className="text-[8px] text-zinc-400 dark:text-zinc-500 font-semibold mt-2.5 max-w-[260px] mx-auto leading-relaxed">
                {isEnterprise && customMessage ? customMessage : "Découvrez nos produits et commandez en ligne en quelques secondes."}
              </p>
            </div>
            
            {/* Branded subtle footer separator */}
            <div className="w-full mt-4 border-t border-zinc-100 dark:border-zinc-900 pt-2 flex items-center justify-center">
              <span className="text-[5px] font-bold text-zinc-400 dark:text-zinc-500 tracking-[0.1em]">
                AFFICHE D&apos;ACCES DIRECT — SECURISE PAR GESTIONPRO
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* ─── RIGHT: Configuration & Actions Panel ─── */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Boutique Link Card (Copier le lien) */}
        <Card className="border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-xl bg-white dark:bg-zinc-950 overflow-hidden relative p-5">
          <div className="flex flex-col gap-3">
            <Label className="text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Lien de votre Boutique Marketplace</Label>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-850">
              <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 truncate flex-1">
                {getStoreUrl()}
              </span>
              <Button 
                onClick={handleCopyLink} 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 rounded-lg shrink-0 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              >
                <Copy className="h-4 w-4 text-zinc-500" />
              </Button>
            </div>
          </div>
        </Card>

        <Card className="border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-xl bg-white dark:bg-zinc-950 overflow-hidden relative">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-orange-500/5 blur-3xl rounded-full" />
          <CardHeader>
            <CardTitle className="text-xl font-black flex items-center gap-2 text-zinc-900 dark:text-white">
              <Sparkles className="h-5 w-5 text-orange-500" />
              Configuration d&apos;Affiche
            </CardTitle>
            <CardDescription className="font-semibold text-zinc-400">
              Téléchargez, personnalisez et partagez l&apos;accès rapide de votre boutique.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* ─── Enterprise Customization fields ─── */}
            {isEnterprise && (
              <div className="space-y-5 border-b border-zinc-100 dark:border-zinc-800 pb-6">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-orange-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-50">Personnalisation Enterprise</h3>
                </div>
                
                {/* Custom Slogan */}
                <div className="space-y-1.5">
                  <Label htmlFor="custom-slogan" className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                    <Type className="h-3.5 w-3.5" />
                    Slogan d&apos;accroche personnalisé
                  </Label>
                  <Input 
                    id="custom-slogan"
                    type="text" 
                    placeholder="Scannez pour visiter notre boutique" 
                    value={customSlogan}
                    onChange={(e) => setCustomSlogan(e.target.value)}
                    maxLength={50}
                    className="h-10 rounded-xl bg-slate-50 dark:bg-zinc-900 border-none font-bold text-sm"
                  />
                </div>

                {/* Custom Message */}
                <div className="space-y-1.5">
                  <Label htmlFor="custom-message" className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Phrase marketing personnalisée
                  </Label>
                  <Input 
                    id="custom-message"
                    type="text" 
                    placeholder="Découvrez nos produits et commandez en ligne en quelques secondes." 
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    maxLength={100}
                    className="h-10 rounded-xl bg-slate-50 dark:bg-zinc-900 border-none font-bold text-sm"
                  />
                </div>

                {/* Palette selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-zinc-500">Accent de couleur secondaire</Label>
                  <div className="flex gap-2">
                    {PRESET_COLORS.map((col) => (
                      <button
                        key={col.hex}
                        onClick={() => handleColorPreset(col.hex)}
                        title={col.name}
                        className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 relative flex items-center justify-center shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95"
                        style={{ backgroundColor: col.hex }}
                      >
                        {selectedColor === col.hex && (
                          <Check className="h-4 w-4 text-white drop-shadow-md font-bold" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Accent HEX code */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-500">Ou Saisir Code HEX</Label>
                  <Input 
                    type="text" 
                    placeholder="#ea580c" 
                    value={customColor || selectedColor} 
                    onChange={handleCustomColor}
                    className="h-10 rounded-xl bg-slate-50 dark:bg-zinc-900 border-none font-bold text-sm"
                  />
                </div>
              </div>
            )}

            {/* ─── Export & Action Buttons ─── */}
            <div className="space-y-3">
              <Button
                onClick={handleDownloadPDF}
                disabled={!hasQrCode || isExecuting}
                className="w-full h-12 rounded-xl font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <FileText className="h-4.5 w-4.5" />
                Télécharger PDF A4 Haute Qualité
              </Button>

              <Button
                onClick={handleDownloadPNG}
                disabled={!hasQrCode || isExecuting}
                variant="outline"
                className="w-full h-12 rounded-xl font-bold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <ImageIcon className="h-4.5 w-4.5" />
                Télécharger l&apos;image QR Code (PNG HD)
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="h-12 rounded-xl font-bold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Share2 className="h-4.5 w-4.5" />
                  Partager le lien
                </Button>

                <Button
                  onClick={() => execute({ boutiqueId })}
                  disabled={isExecuting}
                  variant="ghost"
                  className="h-12 rounded-xl font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <RefreshCw className={`h-4.5 w-4.5 ${isExecuting ? 'animate-spin' : ''}`} />
                  Régénérer
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

    </div>
  );
}
