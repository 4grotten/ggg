import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { MessageCircle, Send, Mail, Bell, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { apiGet, apiPut } from "@/services/api/apiClient";

interface Props {
  staffUserId: string;
  readOnly?: boolean;
}

interface NotifApiResponse {
  telegram_username: string | null;
  telegram_enabled: boolean;
  whatsapp_number: string | null;
  whatsapp_enabled: boolean;
  email_address: string | null;
  email_enabled: boolean;
  push_enabled?: boolean;
  push_token?: string | null;
}

const CHANNELS = [
  { key: "whatsapp" as const, valueField: "whatsapp_number" as const, enabledField: "whatsapp_enabled" as const, icon: MessageCircle, label: "WhatsApp", placeholder: "+971 50 123 4567", color: "text-green-500", bg: "bg-green-500/10 border-green-500/20" },
  { key: "telegram" as const, valueField: "telegram_username" as const, enabledField: "telegram_enabled" as const, icon: Send, label: "Telegram", placeholder: "@username", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
  { key: "email" as const, valueField: "email_address" as const, enabledField: "email_enabled" as const, icon: Mail, label: "Email", placeholder: "admin@example.com", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
];

export default function StaffNotificationSettings({ staffUserId, readOnly = false }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const pushStorageKey = `staff-push-enabled:${staffUserId}`;

  const [editingChannel, setEditingChannel] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ["staff-notifications", staffUserId],
    queryFn: async () => {
      const res = await apiGet<NotifApiResponse>(`/admin/notifications/settings/${staffUserId}/`);
      if (res.error) throw new Error(res.error.detail || res.error.message);
      return res.data;
    },
    enabled: !!staffUserId,
  });

  const updateMutation = useMutation({
    mutationFn: async (patch: Partial<NotifApiResponse>) => {
      const fullBody = {
        telegram_username: settings?.telegram_username || "",
        telegram_enabled: settings?.telegram_enabled || false,
        whatsapp_number: settings?.whatsapp_number || "",
        whatsapp_enabled: settings?.whatsapp_enabled || false,
        email_address: settings?.email_address || "",
        email_enabled: settings?.email_enabled || false,
        ...patch,
      };
      const res = await apiPut<NotifApiResponse>(`/admin/notifications/settings/${staffUserId}/`, fullBody);
      if (res.error) throw new Error(res.error.detail || res.error.message);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-notifications", staffUserId] });
      toast.success("Настройки сохранены");
      setEditingChannel(null);
    },
    onError: () => toast.error("Ошибка сохранения"),
  });

  const handleToggle = (ch: typeof CHANNELS[number]) => {
    if ('noValue' in ch && ch.noValue) {
      const nextValue = !pushEnabled;
      setPushEnabled(nextValue);
      localStorage.setItem(pushStorageKey, String(nextValue));
      toast.success(nextValue ? "Push включён" : "Push выключен");
      return;
    }

    if (!settings) return;
    updateMutation.mutate({ [ch.enabledField]: !settings[ch.enabledField] });
  };

  const handleSaveValue = (ch: typeof CHANNELS[number]) => {
    const value = drafts[ch.key]?.trim();
    if (!value) return;
    updateMutation.mutate({ [ch.valueField]: value });
  };

  const getChannelValue = (ch: typeof CHANNELS[number]): string => {
    if (!settings) return "";
    const val = settings[ch.valueField];
    if (val == null) return "";
    const str = String(val);
    if (ch.key === "whatsapp" && str && !str.startsWith("+")) return "+" + str;
    return str;
  };

  const getChannelEnabled = (ch: typeof CHANNELS[number]): boolean => {
    if ('noValue' in ch && ch.noValue) return pushEnabled;
    if (!settings) return false;
    return !!settings[ch.enabledField];
  };

  const activeCount = settings ? CHANNELS.filter(ch => getChannelEnabled(ch)).length : Number(pushEnabled);

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
            {activeCount} активных
          </Badge>
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
          CHANNELS.map((ch) => {
            const Icon = ch.icon;
            const value = getChannelValue(ch);
            const enabled = getChannelEnabled(ch);
            const isEditing = editingChannel === ch.key;

            return (
              <motion.div
                key={ch.key}
                layout
                className={cn(
                  "p-3 rounded-xl border transition-colors",
                  enabled ? ch.bg : "bg-muted/30 border-border/30 opacity-60"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-5 h-5 shrink-0", enabled ? ch.color : "text-muted-foreground")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">{ch.label}</p>
                    {'noValue' in ch && ch.noValue ? (
                      <p className="text-sm font-medium">
                        {enabled ? "Активно" : "Отключено"}
                      </p>
                    ) : !isEditing ? (
                      <p
                        className={cn("text-sm font-medium truncate", !readOnly && "cursor-pointer hover:underline")}
                        onClick={() => {
                          if (readOnly) return;
                          setEditingChannel(ch.key);
                          setDrafts(d => ({ ...d, [ch.key]: value }));
                        }}
                      >
                        {value || (readOnly ? "—" : "Нажмите чтобы задать")}
                      </p>
                    ) : null}
                  </div>
                  {!readOnly && (
                    <button onClick={() => handleToggle(ch)} className="shrink-0">
                      <Switch
                        checked={enabled}
                        onCheckedChange={() => {}}
                        className="pointer-events-none"
                      />
                    </button>
                  )}
                </div>

                {/* Inline edit */}
                {isEditing && !readOnly && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2 flex gap-2"
                  >
                    <Input
                      value={drafts[ch.key] || ""}
                      onChange={(e) => setDrafts(d => ({ ...d, [ch.key]: e.target.value }))}
                      placeholder={ch.placeholder}
                      className="h-9 text-sm rounded-lg"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      className="shrink-0 h-9 rounded-lg"
                      onClick={() => handleSaveValue(ch)}
                      disabled={!drafts[ch.key]?.trim() || updateMutation.isPending}
                    >
                      {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Сохранить"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 h-9 rounded-lg"
                      onClick={() => setEditingChannel(null)}
                    >
                      ✕
                    </Button>
                  </motion.div>
                )}

                {/* Telegram hint */}
                {ch.key === "telegram" && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/15">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      📌 Чтобы получать уведомления в Telegram:
                    </p>
                    <ol className="text-[11px] text-muted-foreground leading-relaxed mt-1 ml-4 list-decimal space-y-0.5">
                      <li>
                        Перейдите в бот{" "}
                        <a
                          href="https://t.me/uEasyCardLOGS_Bot"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline font-semibold"
                        >
                          @uEasyCardLOGS_Bot
                        </a>
                      </li>
                      <li>
                        Нажмите кнопку <span className="font-semibold">Start</span>
                      </li>
                    </ol>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
