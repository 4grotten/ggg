import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle, Send, Mail, Bell, Plus, Trash2, Check, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  staffUserId: string;
  readOnly?: boolean;
}

interface NotifSetting {
  id: string;
  staff_user_id: string;
  channel: "whatsapp" | "telegram" | "email";
  contact_value: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

const CHANNELS = [
  { key: "whatsapp" as const, icon: MessageCircle, label: "WhatsApp", placeholder: "+971 50 123 4567", color: "text-green-500", bg: "bg-green-500/10 border-green-500/20" },
  { key: "telegram" as const, icon: Send, label: "Telegram", placeholder: "@username или +971...", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
  { key: "email" as const, icon: Mail, label: "Email", placeholder: "admin@example.com", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
];

const MOCK_SETTINGS: NotifSetting[] = [
  { id: "mock-wa", staff_user_id: "", channel: "whatsapp", contact_value: "+971 50 XXX XXXX", is_enabled: true, created_at: "", updated_at: "" },
  { id: "mock-tg", staff_user_id: "", channel: "telegram", contact_value: "@username", is_enabled: false, created_at: "", updated_at: "" },
  { id: "mock-email", staff_user_id: "", channel: "email", contact_value: "admin@example.com", is_enabled: true, created_at: "", updated_at: "" },
];

export default function StaffNotificationSettings({ staffUserId, readOnly = false }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState<string | null>(null);

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["staff-notifications", staffUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_notification_settings")
        .select("*")
        .eq("staff_user_id", staffUserId);
      if (error) throw error;
      return (data || []) as NotifSetting[];
    },
    enabled: !!staffUserId,
  });

  const upsertMutation = useMutation({
    mutationFn: async ({ channel, contact_value }: { channel: string; contact_value: string }) => {
      const existing = settings.find((s) => s.channel === channel);
      if (existing) {
        const { error } = await supabase
          .from("staff_notification_settings")
          .update({ contact_value, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("staff_notification_settings")
          .insert({ staff_user_id: staffUserId, channel, contact_value });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-notifications", staffUserId] });
      toast.success("Контакт сохранён");
      setAdding(null);
    },
    onError: () => toast.error("Ошибка сохранения"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from("staff_notification_settings")
        .update({ is_enabled, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-notifications", staffUserId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("staff_notification_settings")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-notifications", staffUserId] });
      toast.success("Контакт удалён");
    },
    onError: () => toast.error("Ошибка удаления"),
  });

  const handleSave = (channel: string) => {
    const value = drafts[channel]?.trim();
    if (!value) return;
    upsertMutation.mutate({ channel, contact_value: value });
  };

  // Show mock data when no real settings exist
  const displaySettings = settings.length > 0 ? settings : (isLoading ? [] : MOCK_SETTINGS);
  const isMockData = settings.length === 0 && !isLoading;

  const configuredChannels = displaySettings.map((s) => s.channel);
  const availableChannels = CHANNELS.filter((c) => !configuredChannels.includes(c.key));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl bg-gradient-to-br from-card via-card to-muted/30 border border-border/50 overflow-hidden"
    >
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h4 className="font-semibold text-sm">Рассылка логов</h4>
          {readOnly && (
            <Badge variant="outline" className="text-[10px] ml-1 text-muted-foreground border-muted-foreground/30">Только просмотр</Badge>
          )}
          <Badge variant="secondary" className="text-[10px] ml-auto">
            {displaySettings.filter((s) => s.is_enabled).length} активных
          </Badge>
          {isMockData && (
            <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">Пример</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Настройте каналы для отправки истории действий
        </p>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Existing channels */}
            <AnimatePresence mode="popLayout">
              {displaySettings.map((setting) => {
                const ch = CHANNELS.find((c) => c.key === setting.channel)!;
                const Icon = ch.icon;
                return (
                  <motion.div
                    key={setting.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                      setting.is_enabled ? ch.bg : "bg-muted/30 border-border/30 opacity-60",
                      isMockData && "opacity-50"
                    )}
                  >
                    <Icon className={cn("w-5 h-5 shrink-0", setting.is_enabled ? ch.color : "text-muted-foreground")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">{ch.label}</p>
                      <p className="text-sm font-medium truncate">{setting.contact_value}</p>
                    </div>
                    {!readOnly && !isMockData && (
                      <>
                        <button
                          onClick={() => toggleMutation.mutate({ id: setting.id, is_enabled: !setting.is_enabled })}
                          className="shrink-0"
                        >
                          {setting.is_enabled ? (
                            <ToggleRight className="w-6 h-6 text-primary" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(setting.id)}
                          className="shrink-0 p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Add new channel - only for root */}
            {!readOnly && availableChannels.length > 0 && !adding && (
              <div className="flex flex-wrap gap-2 pt-1">
                {availableChannels.map((ch) => {
                  const Icon = ch.icon;
                  return (
                    <button
                      key={ch.key}
                      onClick={() => {
                        setAdding(ch.key);
                        setDrafts((d) => ({ ...d, [ch.key]: "" }));
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors hover:scale-[1.02] active:scale-[0.98]",
                        ch.bg
                      )}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <Icon className={cn("w-3.5 h-3.5", ch.color)} />
                      {ch.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Adding form - only for root */}
            {!readOnly && adding && (() => {
              const ch = CHANNELS.find((c) => c.key === adding)!;
              const Icon = ch.icon;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("p-3 rounded-xl border space-y-2", ch.bg)}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", ch.color)} />
                    <span className="text-sm font-medium">{ch.label}</span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={drafts[adding] || ""}
                      onChange={(e) => setDrafts((d) => ({ ...d, [adding]: e.target.value }))}
                      placeholder={ch.placeholder}
                      className="h-9 text-sm rounded-lg"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      className="shrink-0 h-9 rounded-lg gap-1"
                      onClick={() => handleSave(adding)}
                      disabled={!drafts[adding]?.trim() || upsertMutation.isPending}
                    >
                      {upsertMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Сохранить
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 h-9 rounded-lg"
                      onClick={() => setAdding(null)}
                    >
                      Отмена
                    </Button>
                  </div>
                </motion.div>
              );
            })()}

            {settings.length === 0 && !adding && (
              <div className="text-center py-4">
                <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">Каналы рассылки не настроены</p>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
