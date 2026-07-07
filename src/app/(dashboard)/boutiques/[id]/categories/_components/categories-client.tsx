"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCategorieSchema, type CreateCategorieInput } from "@/schemas/categorie.schema";
import { createCategorie, updateCategorie, deleteCategorie } from "@/server/actions/categorie.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";

interface Categorie {
  id: string;
  nom: string;
  couleur: string | null;
  _count: { produits: number };
}

function CategoryDialog({ open, setOpen, form, onSubmit, isEditing, onOpenTrigger }: {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: ReturnType<typeof useForm<CreateCategorieInput>>;
  onSubmit: (data: CreateCategorieInput) => void;
  isEditing: boolean;
  onOpenTrigger: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="brand" className="w-full sm:w-auto rounded-xl h-11 sm:h-12 px-6 font-black shadow-lg shadow-brand/20" onClick={onOpenTrigger}>
          <Plus className="mr-2 h-5 w-5" /> Ajouter une catégorie
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[1.5rem] sm:rounded-[2rem] mx-4 sm:mx-auto max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">
            {isEditing ? "Modifier la catégorie" : "Nouvelle catégorie"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField control={form.control} name="nom" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nom</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Électronique" className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="couleur" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Couleur</FormLabel>
                <FormControl>
                  <Input type="color" {...field} className="h-12 w-24 rounded-xl border-none cursor-pointer" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" variant="brand" className="w-full h-12 rounded-xl font-black">
              {isEditing ? "Enregistrer" : "Créer"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function CategoriesClient({ categories, boutiqueId }: { categories: Categorie[]; boutiqueId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingCategorie, setEditingCategorie] = useState<Categorie | null>(null);

  const form = useForm<CreateCategorieInput>({
    resolver: zodResolver(createCategorieSchema),
    defaultValues: { nom: "", couleur: "#fb923c" },
  });

  function openCreate() {
    setEditingCategorie(null);
    form.reset({ nom: "", couleur: "#fb923c" });
    setOpen(true);
  }

  function openEdit(cat: Categorie) {
    setEditingCategorie(cat);
    form.reset({ nom: cat.nom, couleur: cat.couleur || "#fb923c" });
    setOpen(true);
  }

  async function onSubmit(data: CreateCategorieInput) {
    if (editingCategorie) {
      const result = await updateCategorie({ boutiqueId, categorieId: editingCategorie.id, data });
      if (result?.serverError) { toast.error(result.serverError); return; }
      toast.success("Catégorie modifiée");
    } else {
      const result = await createCategorie({ boutiqueId, data });
      if (result?.serverError) { toast.error(result.serverError); return; }
      toast.success("Catégorie créée");
    }
    form.reset();
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(categorieId: string) {
    const result = await deleteCategorie({ boutiqueId, categorieId });
    if (result?.serverError) { toast.error(result.serverError); return; }
    toast.success("Catégorie supprimée");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <CategoryDialog
        open={open}
        setOpen={setOpen}
        form={form}
        onSubmit={onSubmit}
        isEditing={!!editingCategorie}
        onOpenTrigger={openCreate}
      />

      {categories.length === 0 ? (
        <EmptyState icon={Tag} title="Aucune catégorie" description="Créez votre première catégorie pour organiser vos produits." />
      ) : (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Card key={cat.id} className="border-none shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden">
              <CardContent className="flex items-center justify-between p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: (cat.couleur ?? "#6b7280") + "20" }}>
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.couleur ?? "#6b7280" }} />
                  </div>
                  <div>
                    <p className="font-black text-base">{cat.nom}</p>
                    <p className="text-sm text-muted-foreground font-medium">{cat._count.produits} produit(s)</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    onClick={() => openEdit(cat)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-red-50 text-destructive dark:hover:bg-red-950">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                    title="Supprimer cette catégorie ?"
                    description="Les produits associés ne seront pas supprimés."
                    onConfirm={() => handleDelete(cat.id)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
