 
"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { User, Mail, Camera, Save, Loader2, CheckCircle } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { updateProfile } from "@/server/actions/user.actions";

const profileSchema = z.object({
  name: z.string().min(2, "Le nom est trop court").max(100),
  image: z.string().optional().or(z.literal("")),
});

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name || "",
      image: session?.user?.image || "",
    },
  });

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    setLoading(true);
    try {
      const result = await updateProfile(values);

      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }

      await update({
        ...session,
        user: {
          ...session?.user,
          name: values.name,
          image: values.image || null,
        },
      });

      toast.success("Profil mis à jour avec succès !");
 
    } catch (error) {
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  const name = session?.user?.name || "Utilisateur";
  const initials = getInitials(name);

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Mon Profil</h1>
        <p className="text-muted-foreground font-medium text-sm sm:text-base">Gerez vos informations personnelles et votre image de profil.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-12">
        {/* Profile Card */}
        <Card className="md:col-span-4 border-none bg-zinc-900 text-white shadow-2xl rounded-[3rem] overflow-hidden self-start">
          <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-brand shadow-2xl ring-8 ring-white/5">
                {session?.user?.image && <AvatarImage src={session.user.image} />}
                <AvatarFallback className="bg-zinc-800 text-3xl font-black text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl font-black tracking-tight">{name}</h2>
              <p className="text-zinc-400 font-bold text-sm">{session?.user?.email}</p>
            </div>

            <div className="w-full pt-4 space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 leading-none mb-1">Rôle</p>
                  <p className="text-sm font-black">{session?.user?.role || "Utilisateur"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
                <Mail className="h-5 w-5 text-brand" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 leading-none mb-1">Email Vérifié</p>
                  <p className="text-sm font-black">Oui</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="md:col-span-8 border-none bg-white dark:bg-zinc-900 shadow-xl rounded-[3rem]">
          <CardHeader className="p-8">
            <CardTitle className="text-lg font-black">Modifier mes informations</CardTitle>
            <CardDescription className="font-semibold text-xs">Mettez à jour votre nom public et votre photo de profil.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <User className="h-3 w-3" /> Nom complet
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Votre nom" 
                            className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none px-6 font-bold focus:ring-2 focus:ring-brand" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Camera className="h-3 w-3" /> Photo de profil
                        </FormLabel>
                        <FormControl>
                          <ImageUpload value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-14 rounded-2xl font-black text-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-brand dark:hover:bg-brand/90 shadow-xl shadow-brand/10"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-5 w-5" />
                  )}
                  Enregistrer les modifications
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
