/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
 
import { motion } from "framer-motion";
 
import { Mail, MessageSquare, Send, User } from "lucide-react";
import { toast } from "sonner";

import { sendContactMessage } from "@/server/actions/contact.actions";
import { Section } from "./section";
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
import { Textarea } from "@/components/ui/textarea";

const contactSchema = z.object({
  nom: z.string().min(2, "Le nom est trop court"),
  email: z.string().email("Email invalide"),
  sujet: z.string().min(5, "Le sujet est trop court"),
  message: z.string().min(10, "Le message est trop court"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactSection() {
  const [loading, setLoading] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      nom: "",
      email: "",
      sujet: "",
      message: "",
    },
  });

  async function onSubmit(data: ContactFormValues) {
    setLoading(true);
    try {
      const result = await sendContactMessage(data);

      if (result?.serverError) {
        toast.error(result.serverError);
      } else if (result?.data?.success) {
        toast.success(result.data.success);
        form.reset();
      }
    } catch {
      toast.error("Une erreur est survenue lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Section id="contact" className="bg-zinc-50/50 dark:bg-zinc-900/50">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Contactez-nous
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Une question ? Un besoin spécifique ? Notre équipe est là pour vous accompagner.
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-5">
          <div className="md:col-span-2 space-y-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold">Email</h3>
                <p className="text-sm text-muted-foreground">contact@gestionpro.africa</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold">Support</h3>
                <p className="text-sm text-muted-foreground">Disponible 7j/7 via WhatsApp</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet</FormLabel>
                        <FormControl>
                          <Input placeholder="Votre nom" {...field} className="rounded-xl border-none bg-background shadow-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="votre@email.com" {...field} className="rounded-xl border-none bg-background shadow-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="sujet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sujet</FormLabel>
                      <FormControl>
                        <Input placeholder="De quoi s'agit-il ?" {...field} className="rounded-xl border-none bg-background shadow-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Dites-nous tout..."
                          className="min-h-[150px] rounded-xl border-none bg-background shadow-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" variant="brand" className="w-full h-12 rounded-xl font-bold" loading={loading}>
                  Envoyer le message
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </Section>
  );
}
