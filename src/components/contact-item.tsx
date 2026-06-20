import type { ComponentType, SVGProps } from "react";
import { Mail, Phone, Globe, MapPin } from "lucide-react";
import {
  WhatsAppIcon,
  TelegramIcon,
  FacebookIcon,
  InstagramIcon,
  XIcon,
  LinkedInIcon,
  GitHubIcon,
} from "@/components/icons/brand-icons";
import { cn } from "@/lib/utils";

/**
 * Single source of truth for displaying a contact info line (icon + value +
 * link). Used by the public boutique page, the footer, the contact section,
 * and the dashboard parametres. Guarantees every channel uses its proper icon
 * and a working link.
 */

export type ContactKind =
  | "email"
  | "phone"
  | "whatsapp"
  | "website"
  | "address"
  | "facebook"
  | "instagram"
  | "linkedin"
  | "twitter"
  | "github"
  | "telegram";

type ContactConfig = {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  buildHref: (value: string) => string;
  external: boolean;
  /** Whether the visible value should be the raw value (true) or the formatted one (false). */
  rawDisplay?: boolean;
};

function sanitizePhone(v: string): string {
  return v.replace(/[^\d+]/g, "");
}

function normalizeUrl(v: string): string {
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v.replace(/^\/+/, "")}`;
}

function normalizeHandle(prefix: string, v: string): string {
  const trimmed = v.trim().replace(/^@/, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // If user typed e.g. "facebook.com/maboutique" keep it; otherwise prefix domain
  if (trimmed.includes("/")) return normalizeUrl(trimmed);
  return `${prefix}${trimmed}`;
}

const CONFIG: Record<ContactKind, ContactConfig> = {
  email: {
    Icon: Mail,
    buildHref: (v) => `mailto:${v.trim()}`,
    external: false,
  },
  phone: {
    Icon: Phone,
    buildHref: (v) => `tel:${sanitizePhone(v)}`,
    external: false,
  },
  whatsapp: {
    Icon: WhatsAppIcon,
    buildHref: (v) => `https://wa.me/${sanitizePhone(v).replace(/^\+/, "")}`,
    external: true,
  },
  website: {
    Icon: Globe,
    buildHref: normalizeUrl,
    external: true,
  },
  address: {
    Icon: MapPin,
    buildHref: (v) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v)}`,
    external: true,
  },
  facebook: {
    Icon: FacebookIcon,
    buildHref: (v) => normalizeHandle("https://facebook.com/", v),
    external: true,
  },
  instagram: {
    Icon: InstagramIcon,
    buildHref: (v) => normalizeHandle("https://instagram.com/", v),
    external: true,
  },
  linkedin: {
    Icon: LinkedInIcon,
    buildHref: (v) => normalizeHandle("https://linkedin.com/in/", v),
    external: true,
  },
  twitter: {
    Icon: XIcon,
    buildHref: (v) => normalizeHandle("https://x.com/", v),
    external: true,
  },
  github: {
    Icon: GitHubIcon,
    buildHref: (v) => normalizeHandle("https://github.com/", v),
    external: true,
  },
  telegram: {
    Icon: TelegramIcon,
    buildHref: (v) => normalizeHandle("https://t.me/", v),
    external: true,
  },
};

const BRAND_COLOR: Partial<Record<ContactKind, string>> = {
  whatsapp: "text-emerald-600 dark:text-emerald-400",
  email: "text-zinc-600 dark:text-zinc-300",
  phone: "text-zinc-600 dark:text-zinc-300",
  website: "text-blue-600 dark:text-blue-400",
  address: "text-rose-600 dark:text-rose-400",
  facebook: "text-blue-600 dark:text-blue-400",
  instagram: "text-pink-600 dark:text-pink-400",
  linkedin: "text-sky-700 dark:text-sky-400",
  twitter: "text-zinc-900 dark:text-zinc-100",
  github: "text-zinc-900 dark:text-zinc-100",
  telegram: "text-sky-500 dark:text-sky-400",
};

interface ContactItemProps {
  kind: ContactKind;
  value: string;
  /** Override the visible text. Defaults to `value`. */
  label?: string;
  /** When false, render an inline span instead of a link. */
  asLink?: boolean;
  className?: string;
  iconClassName?: string;
  href?: string;
}

export function buildContactHref(kind: ContactKind, value: string): string {
  return CONFIG[kind].buildHref(value);
}

export function ContactItem({
  kind,
  value,
  label,
  asLink = true,
  className,
  iconClassName,
  href: customHref,
}: ContactItemProps) {
  const cfg = CONFIG[kind];
  const Icon = cfg.Icon;
  const display = label ?? value;
  const iconColor = BRAND_COLOR[kind];

  const inner = (
    <>
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          iconColor,
          iconClassName
        )}
      />
      <span className="truncate">{display}</span>
    </>
  );

  const baseCls = cn(
    "inline-flex items-center gap-1.5 text-xs font-semibold",
    asLink
      ? "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
      : "text-zinc-500 dark:text-zinc-400",
    className
  );

  if (!asLink) {
    return <span className={baseCls}>{inner}</span>;
  }

  const resolvedHref = customHref ?? cfg.buildHref(value);
  const external = cfg.external;

  return (
    <a
      href={resolvedHref}
      className={baseCls}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
    >
      {inner}
    </a>
  );
}
