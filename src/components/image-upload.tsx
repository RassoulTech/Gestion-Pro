"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, X, Loader2, FileWarning, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Client-side intelligent resizing and compression to high-quality WEBP
  async function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new window.Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const MAX_SIZE = 800; // Resizing to max 800px to ensure perfect rendering and lightweight size

            if (width > height) {
              if (width > MAX_SIZE) {
                height = Math.round((height * MAX_SIZE) / width);
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width = Math.round((width * MAX_SIZE) / height);
                height = MAX_SIZE;
              }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Canvas context non disponible"));
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Convert to high-performance and lightweight WEBP
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error("La compression a échoué"));
                }
              },
              "image/webp",
              0.85 // 85% WebP quality (exceptional detail at a fraction of size)
            );
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error("Erreur de chargement de l'image"));
      };
      reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
    });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict format validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format non supporté. Utilisez PNG, JPG, JPEG ou WEBP.");
      return;
    }

    // Size limit check (max 10MB raw file size)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("L'image d'origine ne doit pas dépasser 10 Mo.");
      return;
    }

    setCompressing(true);
    let fileToUpload: File | Blob = file;
    let fileName = file.name;

    try {
      // Automatic client-side compression & resizing
      const compressedBlob = await compressImage(file);
      fileToUpload = compressedBlob;
      // Change extension to .webp for the compressed image
      const baseName = file.name.split(".").slice(0, -1).join(".");
      fileName = `${baseName || "upload"}.webp`;
    } catch (err) {
      // Fallback to original file if compression fails (ensuring zero regression)
      console.warn("La compression a échoué, envoi du fichier original:", err);
    } finally {
      setCompressing(false);
    }

     setUploading(true);
     try {
       const formData = new FormData();
       formData.append("file", fileToUpload, fileName);
 
       const res = await fetch("/api/upload", { method: "POST", body: formData });
       
       let data: any = {};
       const contentType = res.headers.get("content-type");
       if (contentType && contentType.includes("application/json")) {
         data = await res.json();
       } else {
         const text = await res.text();
         console.error("Erreur de réponse brute du serveur:", text);
         toast.error(`Erreur serveur (${res.status}) : Réponse invalide.`);
         return;
       }
 
       if (!res.ok) {
         toast.error(data.error || "Erreur lors du transfert de l'image");
         return;
       }
 
       onChange(data.url);
       toast.success("Image optimisée et importée avec succès !");
     } catch (err: any) {
       console.error("CLIENT EXCEPTION DURING UPLOAD:", err);
       toast.error(`Échec du transfert : ${err?.message || "Erreur réseau ou serveur"}`);
     } finally {
       setUploading(false);
       if (inputRef.current) inputRef.current.value = "";
     }
  }

  const isPending = uploading || compressing;

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleUpload}
        className="hidden"
        disabled={isPending}
      />
      {value ? (
        <div className="relative h-36 w-36 rounded-3xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-lg group transition-all duration-300 hover:shadow-2xl">
          <Image 
            src={value} 
            alt="Aperçu du logo" 
            fill 
            className="object-cover" 
            sizes="144px"
            loading="lazy"
            unoptimized 
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="h-9 w-9 rounded-xl bg-white text-zinc-900 flex items-center justify-center shadow-md transform scale-90 group-hover:scale-100 transition-all duration-300 hover:bg-orange-500 hover:text-white"
              title="Changer d'image"
            >
              <Camera className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="h-9 w-9 rounded-xl bg-white text-rose-600 flex items-center justify-center shadow-md transform scale-90 group-hover:scale-100 transition-all duration-300 hover:bg-rose-600 hover:text-white"
              title="Supprimer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="h-36 w-36 rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-orange-500/60 dark:hover:border-orange-500/40 flex flex-col items-center justify-center gap-2.5 transition-all duration-300 bg-zinc-50 hover:bg-orange-500/[0.02] dark:bg-zinc-950 dark:hover:bg-orange-500/[0.01] hover:scale-[0.98] relative overflow-hidden group"
        >
          {isPending ? (
            <div className="flex flex-col items-center gap-2 px-2 text-center relative z-10 animate-fade-in">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider leading-none">
                {compressing ? "Optimisation..." : "Envoi..."}
              </span>
            </div>
          ) : (
            <>
              <div className="h-10 w-10 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 group-hover:text-orange-500 group-hover:bg-orange-500/10 flex items-center justify-center transition-all duration-300 shadow-sm">
                <Camera className="h-5 w-5" />
              </div>
              <div className="text-center">
                <span className="text-[10px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-widest block">
                  Importer
                </span>
                <span className="text-[8px] text-zinc-400 dark:text-zinc-500 mt-0.5 block font-bold">
                  PNG, JPG, WEBP
                </span>
              </div>
              
              {/* Premium micro-border hover glow */}
              <div className="absolute inset-0 border border-transparent group-hover:border-orange-500/20 rounded-3xl pointer-events-none transition-colors duration-300" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

