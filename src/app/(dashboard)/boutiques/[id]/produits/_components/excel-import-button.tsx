"use client";

import { useState } from "react";
import { FileSpreadsheet, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
// ⚡ Perf : `xlsx` (~130 Ko) n'est PAS importé au chargement de la page produits.
// Il est chargé dynamiquement uniquement quand l'utilisateur ouvre/traite un fichier.
import { importProductsExcel } from "@/server/actions/produit.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ExcelImportButtonProps {
  boutiqueId: string;
}

export function ExcelImportButton({ boutiqueId }: ExcelImportButtonProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const router = useRouter();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import("xlsx");
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        if (!wsname) throw new Error("Format invalide");
        const ws = wb.Sheets[wsname];
        if (!ws) throw new Error("Onglet introuvable");
        const data = XLSX.utils.sheet_to_json(ws);
        setPreview(data.slice(0, 3)); // show first 3 for preview
      } catch (err) {
        toast.error("Format de fichier invalide");
        setFile(null);
      }
    };
    reader.readAsBinaryString(selected);
  };

  const handleImport = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const XLSX = await import("xlsx");
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          if (!wsname) throw new Error("Fichier vide");
          const ws = wb.Sheets[wsname];
          if (!ws) throw new Error("Onglet introuvable");
          const data = XLSX.utils.sheet_to_json(ws);

          if (!data || data.length === 0) {
            toast.error("Le fichier est vide");
            setIsProcessing(false);
            return;
          }

          // Format check
          const formattedData = data.map((row: any) => ({
            nom: String(row.Nom || row.nom || "Produit sans nom"),
            code: row.Code || row.code ? String(row.Code || row.code) : undefined,
            description: row.Description || row.description ? String(row.Description || row.description) : undefined,
            prixUnitaire: Number(row.Prix || row.prix || row.prixUnitaire || 0),
            prixAchat: row.PrixAchat || row.prixAchat ? Number(row.PrixAchat || row.prixAchat) : undefined,
            quantite: Number(row.Quantite || row.quantite || 0),
            seuilAlerte: Number(row.SeuilAlerte || row.seuilAlerte || 5),
          }));

          const res = await importProductsExcel(boutiqueId, formattedData);
          if (res.success) {
            toast.success(`${res.count} produits importés avec succès`);
            setOpen(false);
            setFile(null);
            setPreview([]);
            router.refresh();
          } else {
            toast.error(res.error || "Erreur lors de l'import");
          }
        } catch (err: any) {
          toast.error("Erreur de lecture: " + err.message);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      setIsProcessing(false);
      toast.error("Erreur inattendue");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-12 rounded-xl font-bold border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-blue-200">
          <FileSpreadsheet className="mr-2 h-4.5 w-4.5" />
          Importer Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            Importation en masse (Admin)
          </DialogTitle>
          <DialogDescription>
            Importez un fichier Excel (.xlsx) ou CSV. Colonnes attendues: Nom, Code, Description, Prix, PrixAchat, Quantite, SeuilAlerte.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!file ? (
            <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="h-8 w-8 text-zinc-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Cliquez ou glissez un fichier ici
              </p>
              <p className="text-xs text-zinc-500 mt-1">.xlsx, .xls, .csv</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 truncate">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span className="text-sm font-medium text-emerald-800 truncate">
                    {file.name}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="h-6 px-2 text-xs text-emerald-700 hover:bg-emerald-100">
                  Changer
                </Button>
              </div>

              {preview.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-500 uppercase">Aperçu (3 premières lignes)</span>
                  <div className="text-xs bg-zinc-100 dark:bg-zinc-900 p-3 rounded-lg overflow-x-auto whitespace-pre">
                    {JSON.stringify(preview, null, 2)}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-50/50 p-3 rounded-lg flex gap-3 text-sm text-blue-800 border border-blue-100">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-xs leading-relaxed">
              Assurez-vous que la première ligne du fichier contient les en-têtes (Nom, Prix, Quantite...).
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!file || isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isProcessing ? "Importation..." : "Lancer l'import"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
