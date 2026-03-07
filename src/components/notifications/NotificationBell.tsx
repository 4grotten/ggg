import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  getAllNotifications,
  getUnreadCount,
  markAllRead,
  clearNotifications,
  type AppNotification,
} from "@/services/notificationService";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, string> = {
  transaction: "💳",
  profile: "👤",
  system: "🔔",
};

export function NotificationBell() {
  const { t } = useTranslation();
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(() => {
    setUnread(getUnreadCount());
    setNotifications(getAllNotifications());
  }, []);

  useEffect(() => {
    refresh();
    const onNew = () => refresh();
    const onRead = () => refresh();
    window.addEventListener("app-notification", onNew);
    window.addEventListener("app-notification-read", onRead);
    return () => {
      window.removeEventListener("app-notification", onNew);
      window.removeEventListener("app-notification-read", onRead);
    };
  }, [refresh]);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      markAllRead();
      setUnread(0);
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - ts;
    if (diff < 60_000) return t("notifications.justNow") || "Только что";
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)} ${t("notifications.minAgo") || "мин назад"}`;
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { day: "numeric", month: "short" });
  };

  return (
    <Drawer open={open} onOpenChange={handleOpen}>
      <DrawerTrigger asChild>
        <motion.button
          className="relative w-9 h-9 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted transition-colors"
          whileTap={{ scale: 0.9 }}
        >
          <Bell className="w-[18px] h-[18px] text-foreground" />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1"
              >
                {unread > 9 ? "9+" : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-base">
              {t("notifications.title") || "Уведомления"}
            </DrawerTitle>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-7"
                onClick={() => {
                  clearNotifications();
                  setNotifications([]);
                  setUnread(0);
                }}
              >
                {t("notifications.clearAll") || "Очистить"}
              </Button>
            )}
          </div>
        </DrawerHeader>
        <ScrollArea className="px-4 pb-6" style={{ maxHeight: "60vh" }}>
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              {t("notifications.empty") || "Нет уведомлений"}
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-3 rounded-xl border transition-colors",
                    n.read
                      ? "bg-muted/20 border-border/30"
                      : "bg-muted/40 border-border/50"
                  )}
                >
                  <div className="flex gap-2.5">
                    <span className="text-lg shrink-0 mt-0.5">
                      {typeIcons[n.type] || "🔔"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {n.body}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {formatTime(n.timestamp)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
