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
  Sparkles
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  { name: "Wave Cyan", hex: "#00C2C9" },
  { name: "Orange Money", hex: "#f97316" },
  { name: "Emerald Pay", hex: "#10b981" },
  { name: "Slate Professional", hex: "#0f172a" },
  { name: "Indigo Modern", hex: "#6366f1" },
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
      });

      doc.save(`fiche-paiement-${boutiqueSlug}.pdf`);
      toast.success("Fiche PDF téléchargée !", { id: "pdf-gen" });
    } catch (err) {
      console.error(err);
      toast.error("Erreur de génération du PDF.", { id: "pdf-gen" });
    }
  };

  const handleShare = () => {
    const domain = window.location.origin;
    const storeUrl = `${domain}/s/${boutiqueSlug}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(storeUrl);
      toast.success("Lien de votre boutique copié !");
    } else {
      toast.error("Votre navigateur ne supporte pas le partage.");
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
      
      {/* ─── LEFT: A4 Preview Support Mockup ─── */}
      <div className="lg:col-span-7 flex justify-center">
        <div 
          className="w-full max-w-[420px] aspect-[1/1.414] bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
          style={{ 
            borderColor: selectedColor + "30",
            boxShadow: `0 20px 40px -15px ${selectedColor}15`
          }}
        >
          {/* Wave-style top line color accent */}
          <div 
            className="absolute top-0 inset-x-0 h-2 transition-colors duration-300"
            style={{ backgroundColor: selectedColor }}
          />

          <div className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-2xl p-6 flex flex-col justify-between items-center relative">
            
            {/* Header / Logo */}
            <div className="flex flex-col items-center gap-3 w-full">
              {boutiqueLogo ? (
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 relative bg-zinc-50 flex items-center justify-center shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={boutiqueLogo} alt="Logo" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold transition-colors duration-300 shadow-md"
                  style={{ backgroundColor: selectedColor }}
                >
                  GP
                </div>
              )}
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight text-center">{boutiqueName}</h2>
              {boutiqueDescription && (
                <p className="text-[10px] text-zinc-400 font-semibold text-center line-clamp-2 px-4 max-w-[280px]">
                  {boutiqueDescription}
                </p>
              )}
            </div>

            {/* QR Code Container */}
            <div className="my-4 relative">
              <div className="w-48 h-48 rounded-2xl bg-slate-50 dark:bg-zinc-900 border-2 border-slate-100 dark:border-zinc-800 flex items-center justify-center p-3 transition-all">
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

            {/* Instructions */}
            <div className="text-center w-full">
              <p className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                Scannez ce code pour accéder directement à notre boutique.
              </p>
              <p 
                className="text-[10px] font-bold mt-2 transition-colors duration-300"
                style={{ color: selectedColor }}
              >
                gestionpro.com/s/{boutiqueSlug}
              </p>
            </div>
            
            {/* Wave branded colored bottom strip */}
            <div 
              className="absolute bottom-3 inset-x-6 h-6 rounded-lg flex items-center justify-center text-[7px] font-black text-white transition-colors duration-300"
              style={{ backgroundColor: selectedColor }}
            >
              SUPPORT DE PAIEMENT & COMMANDE SECURISE — GESTIONPRO
            </div>

          </div>
        </div>
      </div>

      {/* ─── RIGHT: Configuration Panel ─── */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-xl bg-white dark:bg-zinc-950 overflow-hidden relative">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-orange-500/5 blur-3xl rounded-full" />
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-500" />
              Panneau de Contrôle
            </CardTitle>
            <CardDescription className="font-semibold text-zinc-400">
              Gérez le design et l&apos;export de votre fiche officielle.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* ─── Advanced Personalization (Enterprise only) ─── */}
            {isEnterprise && (
              <div className="space-y-4 border-b border-zinc-100 dark:border-zinc-800 pb-6">
                <div className="flex items-center gap-2">
                  <Palette className="h-4.5 w-4.5 text-orange-500" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Personnalisation Premium</h3>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-zinc-500">Palettes de couleur</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_COLORS.map((col) => (
                      <button
                        key={col.hex}
                        onClick={() => handleColorPreset(col.hex)}
                        title={col.name}
                        className="w-full aspect-square rounded-lg border border-zinc-200 dark:border-zinc-800 relative flex items-center justify-center shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95"
                        style={{ backgroundColor: col.hex }}
                      >
                        {selectedColor === col.hex && (
                          <Check className="h-4 w-4 text-white drop-shadow-md font-bold" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-zinc-500">Code Couleur Personnalisé (HEX)</Label>
                  <Input 
                    type="text" 
                    placeholder="#ea580c" 
                    value={customColor || selectedColor} 
                    onChange={handleCustomColor}
                    className="h-10 rounded-xl bg-slate-50 dark:bg-zinc-900 border-none font-bold"
                  />
                </div>
              </div>
            )}

            {/* ─── Quick Actions Grid ─── */}
            <div className="space-y-3">
              <Button
                onClick={handleDownloadPDF}
                disabled={!hasQrCode || isExecuting}
                className="w-full h-12 rounded-xl font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-850 dark:hover:bg-zinc-850 text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <FileText className="h-4.5 w-4.5" />
                Télécharger le PDF Fiche A4
              </Button>

              <Button
                onClick={handleDownloadPNG}
                disabled={!hasQrCode || isExecuting}
                variant="outline"
                className="w-full h-12 rounded-xl font-bold border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Download className="h-4.5 w-4.5" />
                Télécharger l&apos;image QR Code (PNG)
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="h-12 rounded-xl font-bold border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Share2 className="h-4.5 w-4.5" />
                  Partager
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
