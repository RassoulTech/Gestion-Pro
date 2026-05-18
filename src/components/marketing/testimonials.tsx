import { Section, SectionHeader } from "./section";
import { cn, getInitials } from "@/lib/utils";
import {
  FadeInStagger,
  FadeInItem,
} from "@/components/layouts/motion-wrapper";

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  location: string;
};

const testimonials: Testimonial[] = [
  {
    quote:
      "Avant GestionPro, je perdais 2 heures chaque soir à recompter le stock. Aujourd'hui, je ferme la boutique et tout est déjà calculé.",
    name: "Awa Traoré",
    role: "Gérante, Beauté d'Afrique",
    location: "Dakar, Sénégal",
  },
  {
    quote:
      "Le POS marche même quand la connexion est faible. Mes caissières ont été à l'aise en moins d'une journée.",
    name: "Amadou Diallo",
    role: "Propriétaire, Diallo Électronique",
    location: "Thiès, Sénégal",
  },
  {
    quote:
      "Avec 4 boutiques à suivre, j'avais besoin d'une vue d'ensemble claire. Les rapports m'évitent des allers-retours toute la journée.",
    name: "Mariam Koné",
    role: "Directrice, Réseau MK Cosmétiques",
    location: "Abidjan, Côte d'Ivoire",
  },
];

export function Testimonials() {
  return (
    <Section id="temoignages" tone="default" size="lg">
      <SectionHeader
        eyebrow="Témoignages"
        title="Ils gagnent du temps chaque jour."
        subtitle="Des commerçants comme vous, dans des contextes très différents — un même outil au quotidien."
      />

      <FadeInStagger className="mt-12 grid gap-5 sm:mt-16 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t, i) => (
          <FadeInItem
            key={t.name}
            className={cn(
              "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm",
              "transition-[transform,box-shadow,border-color] duration-300 ease-out",
              "hover:-translate-y-1.5 hover:border-brand/30 hover:shadow-xl hover:shadow-foreground/[0.05]",
              "sm:p-7 lg:p-8",
              i === 2 && "sm:col-span-2 lg:col-span-1"
            )}
          >
            {/* Gradient top accent au hover */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
            <blockquote className="flex-1">
              <p className="text-base leading-relaxed text-foreground sm:text-[15px]">
                <span aria-hidden="true" className="mr-0.5 text-brand">“</span>
                {t.quote}
                <span aria-hidden="true" className="ml-0.5 text-brand">”</span>
              </p>
            </blockquote>

            <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4 sm:mt-6 sm:pt-5">
              <span
                aria-hidden="true"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground sm:h-10 sm:w-10"
              >
                {getInitials(t.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-foreground">
                  {t.name}
                </p>
                <p className="line-clamp-2 break-words text-xs text-muted-foreground sm:line-clamp-1">
                  {t.role} · {t.location}
                </p>
              </div>
            </figcaption>
          </FadeInItem>
        ))}
      </FadeInStagger>
    </Section>
  );
}
