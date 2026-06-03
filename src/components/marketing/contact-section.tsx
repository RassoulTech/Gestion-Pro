"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
 
import { motion } from "framer-motion";
 
import { Mail, Send } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/brand-icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Contactez <span className="text-shimmer">notre équipe.</span>
          </h2>
          <p className="mt-3 text-sm font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Besoin d&apos;un conseil, d&apos;une démonstration personnalisée ou d&apos;un accompagnement ? Nos experts sont là pour propulser votre commerce.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-5 items-start">
          {/* Contact Details */}
          <div className="md:col-span-2 space-y-4">
            {[
              {
                icon: <Mail className="h-6 w-6" />,
                iconWrap: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
                title: "Email direct",
                value: "dionemhd1@gmail.com",
                desc: "Réponse en moins de 24 heures",
                href: "mailto:dionemhd1@gmail.com"
              },
              {
                icon: <WhatsAppIcon className="h-7 w-7" />,
                iconWrap: "bg-[#25D366] text-white shadow-sm shadow-[#25D366]/30",
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
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-black/5 dark:border-white/10 shadow-sm",
                      card.iconWrap
                    )}
                  >
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
