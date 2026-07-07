/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowUpDown,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteProduit } from "@/server/actions/produit.actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProduitActionsProps {
  produitId: string;
  boutiqueId: string;
  produitNom: string;
}

export function ProduitActions({ produitId, boutiqueId, produitNom }: ProduitActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteProduit({ produitId, boutiqueId });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success(`Le produit "${produitNom}" a été supprimé.`);
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-brand/10 hover:text-brand">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-xl border-none shadow-2xl w-48 p-2">
          <DropdownMenuLabel className="px-3 py-2 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Actions</DropdownMenuLabel>
          <DropdownMenuSeparator className="mx-1" />
          
          <DropdownMenuItem asChild className="rounded-lg cursor-pointer h-10 px-3">
            <Link href={`/boutiques/${boutiqueId}/produits/${produitId}/edit`}>
              <Edit className="mr-3 h-4 w-4" /> 
              <span className="font-bold">Éditer</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild className="rounded-lg cursor-pointer h-10 px-3">
            <Link href={`/boutiques/${boutiqueId}/stock`}>
              <ArrowUpDown className="mr-3 h-4 w-4" />
              <span className="font-bold">Mouvement Stock</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="mx-1" />
          
          <DropdownMenuItem 
            className="rounded-lg cursor-pointer h-10 px-3 text-red-500 hover:bg-red-500/10 hover:text-red-600 focus:bg-red-500/10 focus:text-red-600"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-3 h-4 w-4" /> 
            <span className="font-bold">Supprimer</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black tracking-tight">Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-muted-foreground">
              Êtes-vous sûr de vouloir supprimer "{produitNom}" ? Cette action est irréversible et supprimera tout l&apos;historique lié à ce produit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl h-12 font-bold border-none bg-zinc-100 hover:bg-zinc-200">Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="rounded-xl h-12 font-black bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmer la suppression
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
