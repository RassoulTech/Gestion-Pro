"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Trash2, Pencil, Loader2, History } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClientSchema, type CreateClientInput } from "@/schemas/client.schema";
import { updateClient, deleteClient } from "@/server/actions/client.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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

interface ClientActionsProps {
  clientId: string;
  boutiqueId: string;
  clientNom: string;
  clientData: {
    nom: string;
    prenom: string | null;
    telephone: string | null;
    email: string | null;
    adresse: string | null;
  };
}

export function ClientActions({ clientId, boutiqueId, clientNom, clientData }: ClientActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const form = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      nom: clientData.nom,
      prenom: clientData.prenom || "",
      telephone: clientData.telephone || "",
      email: clientData.email || "",
      adresse: clientData.adresse || "",
    },
  });

  const handleEdit = async (data: CreateClientInput) => {
    const result = await updateClient({ boutiqueId, clientId, ...data });
    if (result?.serverError) { toast.error(result.serverError); return; }
    toast.success("Client modifié avec succès");
    setShowEditDialog(false);
    router.refresh();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteClient({ clientId, boutiqueId });
      if (result?.data?.success) {
        toast.success(`Le client "${clientNom}" a été supprimé.`);
        router.refresh();
      } else {
        toast.error("Une erreur est survenue lors de la suppression.");
      }
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-xl hover:bg-accent"
        aria-label={`Voir l'historique de ${clientNom}`}
      >
        <Link href={`/boutiques/${boutiqueId}/clients/${clientId}`}>
          <History className="h-4 w-4" />
        </Link>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-xl hover:bg-accent"
        onClick={() => setShowEditDialog(true)}
        aria-label={`Modifier ${clientNom}`}
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-xl hover:bg-rose-50 text-rose-500 hover:text-rose-600 dark:hover:bg-rose-950"
        onClick={() => setShowDeleteDialog(true)}
        aria-label={`Supprimer ${clientNom}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="rounded-[2rem] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Modifier le client</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEdit)} className="space-y-4 pt-4">
              <FormField control={form.control} name="nom" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nom</FormLabel>
                  <FormControl><Input className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="prenom" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Prenom</FormLabel>
                  <FormControl><Input className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="telephone" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Telephone</FormLabel>
                  <FormControl><Input className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email</FormLabel>
                  <FormControl><Input type="email" className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="adresse" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Adresse</FormLabel>
                  <FormControl><Input className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" variant="brand" className="w-full h-12 rounded-xl font-black">Enregistrer</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black tracking-tight">Supprimer ce client ?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-muted-foreground">
              Cette action est irr&eacute;versible et supprimera l&apos;historique des commandes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl h-12 font-bold border-none bg-zinc-100 hover:bg-zinc-200">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              className="rounded-xl h-12 font-black bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
