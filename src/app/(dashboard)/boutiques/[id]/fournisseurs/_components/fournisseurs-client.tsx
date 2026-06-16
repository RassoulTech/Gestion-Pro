"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Pencil, Trash2, Truck, Phone, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFournisseurSchema, type CreateFournisseurInput } from "@/schemas/fournisseur.schema";
import { createFournisseur, updateFournisseur, deleteFournisseur } from "@/server/actions/fournisseur.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";


interface Fournisseur {
  id: string; nom: string; telephone: string | null; email: string | null; adresse: string | null;
  _count: { commandes: number };
}

export function FournisseursClient({ fournisseurs, boutiqueId }: { fournisseurs: Fournisseur[]; boutiqueId: string; total?: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null);

  const form = useForm<CreateFournisseurInput>({
    resolver: zodResolver(createFournisseurSchema),
    defaultValues: { nom: "", telephone: "", email: "", adresse: "", categorie: "", notes: "" },
  });

  const filtered = fournisseurs;

  function openCreate() {
    setEditingFournisseur(null);
    form.reset({ nom: "", telephone: "", email: "", adresse: "", categorie: "", notes: "" });
    setOpen(true);
  }

  function openEdit(f: Fournisseur) {
    setEditingFournisseur(f);
    const parts = f.adresse ? f.adresse.split(" | ") : [];
    let baseAdresse = parts[0] || "";
    let cat = "";
    let nts = "";
    parts.forEach((p) => {
      if (p.startsWith("Catégorie: ")) cat = p.replace("Catégorie: ", "");
      if (p.startsWith("Notes: ")) nts = p.replace("Notes: ", "");
    });
    if (baseAdresse.startsWith("Catégorie: ") || baseAdresse.startsWith("Notes: ")) {
      baseAdresse = "";
    }

    form.reset({
      nom: f.nom,
      telephone: f.telephone || "",
      email: f.email || "",
      adresse: baseAdresse,
      categorie: cat,
      notes: nts,
    });
    setOpen(true);
  }

  async function onSubmit(data: CreateFournisseurInput) {
    if (editingFournisseur) {
      const result = await updateFournisseur({ boutiqueId, fournisseurId: editingFournisseur.id, ...data });
      if (result?.serverError) { toast.error(result.serverError); return; }
      toast.success("Fournisseur modifié");
    } else {
      const result = await createFournisseur({ boutiqueId, ...data });
      if (result?.serverError) { toast.error(result.serverError); return; }
      toast.success("Fournisseur créé");
    }
    form.reset(); setOpen(false); router.refresh();
  }

  async function handleDelete(fournisseurId: string) {
    const result = await deleteFournisseur({ boutiqueId, fournisseurId });
    if (result?.serverError) { toast.error(result.serverError); return; }
    toast.success("Fournisseur supprimé"); router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="brand" className="w-full sm:w-auto rounded-xl h-12 px-6 font-black shadow-lg shadow-brand/20" onClick={openCreate}>
              <Plus className="mr-2 h-5 w-5" /> Ajouter
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle className="text-xl font-black">{editingFournisseur ? "Modifier le fournisseur" : "Nouveau fournisseur"}</SheetTitle></SheetHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
                <FormField control={form.control} name="nom" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nom</FormLabel>
                    <FormControl><Input placeholder="Nom du fournisseur" className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="telephone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Téléphone</FormLabel>
                    <FormControl><Input placeholder="+221 ..." className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email</FormLabel>
                    <FormControl><Input type="email" placeholder="email@fournisseur.com" className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="adresse" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Adresse</FormLabel>
                    <FormControl><Input placeholder="Adresse du fournisseur" className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="categorie" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Catégorie</FormLabel>
                    <FormControl><Input placeholder="Ex: Grossiste, Importateur" className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Notes</FormLabel>
                    <FormControl><Input placeholder="Ex: Livraison sous 24h, conditions de paiement" className="h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" variant="brand" className="w-full h-12 rounded-xl font-black">
                  {editingFournisseur ? "Enregistrer" : "Créer"}
                </Button>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Truck} title="Aucun fournisseur" description="Aucun fournisseur trouvé. Ajustez vos filtres ou ajoutez-en un nouveau." />
      ) : (
        <Card className="border-none shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50 dark:bg-zinc-800/50 border-none">
                    <TableHead className="px-4 sm:px-8 py-4 sm:py-5 font-black uppercase text-[10px] tracking-widest">Nom</TableHead>
                    <TableHead className="py-4 sm:py-5 font-black uppercase text-[10px] tracking-widest hidden sm:table-cell">Téléphone</TableHead>
                    <TableHead className="py-4 sm:py-5 font-black uppercase text-[10px] tracking-widest hidden md:table-cell">Email</TableHead>
                    <TableHead className="py-4 sm:py-5 font-black uppercase text-[10px] tracking-widest text-right">Cmd</TableHead>
                    <TableHead className="py-4 sm:py-5 font-black uppercase text-[10px] tracking-widest text-right px-4 sm:px-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((f) => (
                    <TableRow key={f.id} className="border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                      <TableCell className="px-4 sm:px-8 py-4 sm:py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                            <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-black text-sm sm:text-base">{f.nom}</p>
                            <p className="text-xs text-muted-foreground sm:hidden">
                              {f.telephone || f.email || "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 hidden sm:table-cell">
                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {f.telephone || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="py-5 hidden md:table-cell">
                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[160px]">{f.email || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 text-right font-black">{f._count.commandes}</TableCell>
                      <TableCell className="px-4 sm:px-8 py-5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem className="rounded-lg" onSelect={() => openEdit(f)}>
                              <Pencil className="mr-2 h-4 w-4" /> Modifier
                            </DropdownMenuItem>
                            <ConfirmDialog
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive rounded-lg">
                                  <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                </DropdownMenuItem>
                              }
                              title="Supprimer ce fournisseur ?"
                              description="Les commandes associées seront conservées."
                              onConfirm={() => handleDelete(f.id)}
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
