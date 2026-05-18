"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClientSchema, type CreateClientInput } from "@/schemas/client.schema";
import { createClient, updateClient, deleteClient } from "@/server/actions/client.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";

interface Client {
  id: string;
  nom: string;
  prenom: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  _count: { commandes: number };
}

export function ClientsClient({ clients, boutiqueId, total }: { clients: Client[]; boutiqueId: string; total: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");

  const form = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
    defaultValues: { nom: "", prenom: "", telephone: "", email: "", adresse: "" },
  });

  const filtered = clients.filter((c) =>
    `${c.nom} ${c.prenom ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditingClient(null);
    form.reset({ nom: "", prenom: "", telephone: "", email: "", adresse: "" });
    setOpen(true);
  }

  function openEdit(c: Client) {
    setEditingClient(c);
    form.reset({ nom: c.nom, prenom: c.prenom || "", telephone: c.telephone || "", email: c.email || "", adresse: c.adresse || "" });
    setOpen(true);
  }

  async function onSubmit(data: CreateClientInput) {
    if (editingClient) {
      const result = await updateClient({ boutiqueId, clientId: editingClient.id, ...data });
      if (result?.serverError) { toast.error(result.serverError); return; }
      toast.success("Client modifié");
    } else {
      const result = await createClient({ boutiqueId, ...data });
      if (result?.serverError) { toast.error(result.serverError); return; }
      toast.success("Client créé");
    }
    form.reset();
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(clientId: string) {
    const result = await deleteClient({ boutiqueId, clientId });
    if (result?.serverError) { toast.error(result.serverError); return; }
    toast.success("Client supprimé");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11" />
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button onClick={openCreate} className="w-full sm:w-auto h-11"><Plus className="mr-2 h-4 w-4" /> Ajouter un client</Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle>{editingClient ? "Modifier le client" : "Nouveau client"}</SheetTitle></SheetHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
                <FormField control={form.control} name="nom" render={({ field }) => (
                  <FormItem><FormLabel>Nom</FormLabel><FormControl><Input className="h-11" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="prenom" render={({ field }) => (
                  <FormItem><FormLabel>Prénom</FormLabel><FormControl><Input className="h-11" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="telephone" render={({ field }) => (
                  <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input className="h-11" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" className="h-11" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="adresse" render={({ field }) => (
                  <FormItem><FormLabel>Adresse</FormLabel><FormControl><Input className="h-11" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full h-11">{editingClient ? "Enregistrer" : "Créer le client"}</Button>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      {/* Table */}
      {filtered.length === 0 && !search ? (
        <EmptyState icon={Users} title="Aucun client" description="Ajoutez votre premier client." />
      ) : (
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead className="hidden sm:table-cell">Téléphone</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="text-right">Cmd</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <div>
                        <span>{c.nom} {c.prenom}</span>
                        <span className="block text-xs text-muted-foreground sm:hidden">{c.telephone || c.email || ""}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{c.telephone || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="truncate max-w-[160px] block">{c.email || "—"}</span>
                    </TableCell>
                    <TableCell className="text-right">{c._count.commandes}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openEdit(c)}><Pencil className="mr-2 h-4 w-4" /> Modifier</DropdownMenuItem>
                          <ConfirmDialog trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Supprimer</DropdownMenuItem>} title="Supprimer ce client ?" description="Les commandes associées seront conservées." onConfirm={() => handleDelete(c.id)} />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="h-24 text-center">Aucun résultat.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      <p className="text-sm text-muted-foreground">{total} client(s) au total</p>
    </div>
  );
}
