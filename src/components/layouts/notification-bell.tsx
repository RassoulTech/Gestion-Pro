"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/server/actions/notification.actions";

type Notif = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string | Date;
};

export function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = React.useState<Notif[]>([]);
  const [unread, setUnread] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const res = await getNotifications();
      if (res?.data) {
        setItems(res.data.items as Notif[]);
        setUnread(res.data.unread);
      }
    } catch {
      /* silencieux : la cloche ne doit jamais casser le header */
    }
  }, []);

  React.useEffect(() => {
    load();
    const id = setInterval(load, 45000);
    return () => clearInterval(id);
  }, [load]);

  async function handleItemClick(n: Notif) {
    setOpen(false);
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      markNotificationRead({ id: n.id }).catch(() => {});
    }
    if (n.link) router.push(n.link);
  }

  function handleMarkAll() {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
    markAllNotificationsRead().catch(() => {});
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) load();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notifications${unread > 0 ? ` (${unread} non lues)` : ""}`}
          className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <Bell className="h-4.5 w-4.5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-black leading-none text-brand-foreground ring-2 ring-card">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(92vw,340px)] overflow-hidden rounded-2xl border-border/60 p-0 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <p className="text-sm font-black">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Tout marquer lu
            </button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs font-semibold text-muted-foreground">
              Aucune notification pour le moment.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(n)}
                    className={cn(
                      "flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-accent",
                      !n.read && "bg-brand/[0.05]"
                    )}
                  >
                    <span className="flex items-start gap-2">
                      {!n.read && (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                      )}
                      <span className={cn("text-xs font-bold text-foreground", n.read && "pl-3.5")}>
                        {n.title}
                      </span>
                    </span>
                    <span className="pl-3.5 text-[11px] font-medium leading-snug text-muted-foreground line-clamp-2">
                      {n.message}
                    </span>
                    <span className="pl-3.5 text-[10px] font-semibold text-muted-foreground/70">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
