import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("public.offline");
  return { title: t("metaTitle") };
}

export default async function OfflinePage() {
  const t = await getTranslations("public.offline");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <WifiOff className="h-8 w-8" />
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight">{t("title")}</h1>
        <p className="max-w-sm text-sm font-medium text-muted-foreground">
          {t("text")}
        </p>
      </div>
      <Button asChild variant="brand" className="h-11 rounded-xl font-bold">
        <Link href="/">{t("retry")}</Link>
      </Button>
    </div>
  );
}
