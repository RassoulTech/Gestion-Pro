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

const EASE = [0.16, 1, 0.3, 1] as const;

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
    <Section id="contact" className="relative overflow-hidden bg-zinc-50/30 dark:bg-zinc-950/20 py-24 md:py-32">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-600/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-5xl z-10 relative">
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-4.5 py-1.5 text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-4">
            Une question ?
          </span>
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Contactez <span className="text-shimmer">notre équipe.</span>
          </h2>
          <p className="mt-4 text-base font-semibold text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Besoin d&apos;un conseil, d&apos;une démonstration personnalisée ou d&apos;un accompagnement ? Nos experts sont là pour propulser votre commerce.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-5 items-start">
          {/* Contact Details */}
          <div className="md:col-span-2 space-y-4">
            {[
              {
                icon: <Mail className="h-6 w-6 text-orange-600 dark:text-orange-400" />,
                title: "Email direct",
                value: "dionemhd1@gmail.com",
                desc: "Réponse en moins de 24 heures",
                href: "mailto:dionemhd1@gmail.com"
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-emerald-600 dark:text-emerald-400">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.437 0 9.862-4.41 9.865-9.85.002-2.636-1.02-5.115-2.879-6.979C16.398 1.912 13.926.887 11.3.887 5.86.887 1.439 5.3 1.436 10.74c0 1.562.415 3.09 1.202 4.457l-1.018 3.719 3.824-.997c1.336.727 2.766 1.096 4.203 1.096zM17.65 14.15c-.3-.15-1.785-.88-2.062-.98-.278-.1-.48-.15-.68.15-.2.3-.77.98-.945 1.18-.175.2-.35.225-.65.075-.3-.15-1.27-.47-2.42-1.49-.89-.8-1.5-1.78-1.675-2.08-.175-.3-.02-.46.13-.61.135-.13.3-.35.45-.52.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.68-1.64-.93-2.24-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.525.075-.8 0-.275-.3-1.05-1.025-1.44-1.95-.36-.85-.15-1.52.075-1.7.35-.3.6-.525.9-.9.1-.125.175-.25.25-.425.075-.175.04-.325-.02-.475-.06-.15-.58-1.4-.8-1.92-.215-.52-.46-.45-.63-.45h-.54c-.18 0-.475.067-.723.342-.248.275-.945.925-.945 2.25s.965 2.6 1.1 2.775c.135.175 1.9 2.9 4.6 4.075.64.28 1.14.448 1.53.573.645.205 1.23.175 1.69.107.514-.077 1.785-.73 2.037-1.435.252-.705.252-1.31.176-1.435-.075-.125-.275-.2-.575-.35z" />
                  </svg>
                ),
                title: "Support WhatsApp",
                value: "+221 77 383 13 64",
                desc: "Conseillers disponibles 7j/7",
                href: "https://wa.me/221773831364"
              }
            ].map((card, idx) => (
              <motion.a
                key={idx}
                href={card.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, ease: EASE, delay: idx * 0.15 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="block p-6 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl hover:border-zinc-300 dark:hover:border-zinc-700/80 shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/20 dark:border-zinc-700/20 shadow-inner">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-zinc-900 dark:text-zinc-50 text-sm">{card.title}</h3>
                    <p className="font-black text-base text-zinc-800 dark:text-zinc-200 mt-0.5">{card.value}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5">{card.desc}</p>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>

          {/* Form */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: EASE }}
            className="md:col-span-3 p-8 md:p-10 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl shadow-lg"
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Nom complet</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Votre nom" 
                            {...field} 
                            className="h-12 rounded-2xl border-none bg-zinc-100/50 dark:bg-zinc-950/40 px-5 text-sm font-bold transition-all focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50" 
                          />
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
                        <FormLabel className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="votre@email.com" 
                            {...field} 
                            className="h-12 rounded-2xl border-none bg-zinc-100/50 dark:bg-zinc-950/40 px-5 text-sm font-bold transition-all focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50" 
                          />
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
                      <FormLabel className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Sujet</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="De quoi s'agit-il ?" 
                          {...field} 
                          className="h-12 rounded-2xl border-none bg-zinc-100/50 dark:bg-zinc-950/40 px-5 text-sm font-bold transition-all focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50" 
                        />
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
                      <FormLabel className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Dites-nous tout..."
                          className="min-h-[140px] rounded-2xl border-none bg-zinc-100/50 dark:bg-zinc-950/40 p-5 text-sm font-bold transition-all focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  variant="brand" 
                  className="w-full h-14 rounded-2xl font-black text-base shadow-xl shadow-orange-600/20 bg-orange-600 text-white hover:bg-orange-700 border-none transition-all duration-300" 
                  loading={loading}
                >
                  Envoyer le message
                  <Send className="ml-2 h-4.5 w-4.5" />
                </Button>
              </form>
            </Form>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
