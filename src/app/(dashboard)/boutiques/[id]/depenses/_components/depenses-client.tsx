"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Wallet, Calendar, Tag, Trash2, Pencil, ArrowDownCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createDepenseSchema, type CreateDepenseInput } from "@/schemas/depense.schema";
import { updateDepense, deleteDepense } from "@/server/actions/depense.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import Link from "next/link";

import { SearchInput } from "@/components/ui/search-input";

interface Depense {
  id: string;
  libelle: string;
  montant: number;
  categorie: string | null;
  date: Date;
}

export function DepensesClient({ 
  depenses, 
  boutiqueId,
  totalDepenses,
}: { 
  depenses: Depense[]; 
  boutiqueId: string;
  totalDepenses: number;
}) {
  const router = useRouter();
  const [editingDepense, setEditingDepense] = useState<Depense | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const form = useForm<CreateDepenseInput>({
    resolver: zodResolver(createDepenseSchema),
    defaultValues: { libelle: "", montant: 0, categorie: "", date: new Date() },
  });

  function openEdit(depense: Depense) {
    setEditingDepense(depense);
    form.reset({
      libelle: depense.libelle,
      montant: depense.montant,
      categorie: depense.categorie || "",
      date: new Date(depense.date),
    });
    setShowEditDialog(true);
  }

  async function handleEdit(data: CreateDepenseInput) {
    if (!editingDepense) return;
    const result = await updateDepense({ boutiqueId, depenseId: editingDepense.id, ...data });
    if (result?.serverError) { toast.error(result.serverError); return; }
    toast.success("Depense modifiee");
    setShowEditDialog(false);
    router.refresh();
  }

  async function handleDelete(depenseId: string) {
    const result = await deleteDepense({ boutiqueId, depenseId });
    if (result?.serverError) { toast.error(result.serverError); return; }
    toast.success("Depense supprimee");
    router.refresh();
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Stats cards */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 border-none bg-zinc-900 text-white shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem]">
          <CardContent className="p-5 sm:p-8">
            <div className="mb-3 sm:mb-4 h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-white/10 flex items-center justify-center text-brand">
              <ArrowDownCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-zinc-400 uppercase tracking-widest">Total des depenses</p>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tighter mt-1 text-white">{totalDepenses.toLocaleString()} FCFA</h2>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-none bg-white dark:bg-zinc-900 shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem] flex items-center">
          <CardContent className="p-5 sm:p-8 w-full">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                <Tag className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-black tracking-tight">Conseil de gestion</h3>
                <p className="text-sm text-muted-foreground font-medium">Categorisez bien vos depenses pour identifier vos plus gros postes de couts.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Table */}
      <Card className="border-none shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden animate-in fade-in duration-300">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
                <TableRow className="border-none">
                  <TableHead className="px-4 sm:px-8 py-4 sm:py-5 font-black uppercase text-[10px] tracking-widest">Depense</TableHead>
                  <TableHead className="py-4 sm:py-5 font-black uppercase text-[10px] tracking-widest hidden sm:table-cell">Categorie</TableHead>
                  <TableHead className="py-4 sm:py-5 font-black uppercase text-[10px] tracking-widest hidden md:table-cell">Date</TableHead>
                  <TableHead className="py-4 sm:py-5 font-black uppercase text-[10px] tracking-widest text-right">Montant</TableHead>
                  <TableHead className="py-4 sm:py-5 font-black uppercase text-[10px] tracking-widest text-right px-4 sm:px-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {depenses.length > 0 ? (
                  depenses.map((depense) => (
                    <TableRow key={depense.id} className="border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                      <TableCell className="px-4 sm:px-8 py-4 sm:py-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 font-black shrink-0">
                            <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-sm sm:text-base truncate">{depense.libelle}</p>
                            <div className="flex items-center gap-2 sm:hidden">
                              {depense.categorie && (
                                <Badge variant="outline" className="text-[9px] font-bold px-2 py-0.5 border-brand/20 text-brand">
                                  {depense.categorie}
                                </Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(depense.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-6 hidden sm:table-cell">
                        <Badge variant="outline" className="text-[10px] font-black uppercase px-3 py-1 border-brand/20 text-brand">
                          {depense.categorie || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-6 hidden md:table-cell">
                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(depense.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 sm:py-6 text-right font-black text-base sm:text-lg tracking-tighter whitespace-nowrap">
                        {depense.montant.toLocaleString()} <span className="text-xs">FCFA</span>
                      </TableCell>
                      <TableCell className="px-4 sm:px-8 py-4 sm:py-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            onClick={() => openEdit(depense)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <ConfirmDialog
                            trigger={
                              <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-rose-50 text-rose-500 hover:text-rose-600 dark:hover:bg-rose-950">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                            title="Supprimer cette depense ?"
                            description="Cette action est irreversible."
                            onConfirm={() => handleDelete(depense.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 sm:h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                          <Wallet className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-black">Aucune depense enregistree</h3>
                        <Button asChild variant="brand" className="rounded-xl h-11 sm:h-12 px-6 sm:px-8 font-black mt-4">
                          <Link href={`/boutiques/${boutiqueId}/depenses/new`}>Ajouter une depense</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="rounded-[1.5rem] sm:rounded-[2rem] border-none shadow-2xl mx-4 sm:mx-auto max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Modifier la depense</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEdit)} className="space-y-4 pt-4">
              <FormField control={form.control} name="libelle" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Libelle</FormLabel>
                  <FormControl><Input className="h-11 sm:h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="montant" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Montant (FCFA)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      className="h-11 sm:h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="categorie" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Categorie</FormLabel>
                  <FormControl><Input className="h-11 sm:h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="h-11 sm:h-12 rounded-xl bg-foreground/5 border-none px-4 font-bold"
                      value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : ""}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" variant="brand" className="w-full h-11 sm:h-12 rounded-xl font-black">Enregistrer</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
