import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, MessageCircle, Mail, Bell, ExternalLink } from "lucide-react";
import { useUserNotificationSettings, UserNotificationSettings } from "@/hooks/useUserNotificationSettings";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

interface ChannelConfig {
  key: "whatsapp" | "telegram" | "email";
  valueField: keyof UserNotificationSettings;
  enabledField: keyof UserNotificationSettings;
  icon: React.ReactNode;
  gradient: string;
  label: string;
  placeholder: string;
}

const CHANNELS: ChannelConfig[] = [
  {
    key: "whatsapp",
    valueField: "whatsapp_number",
    enabledField: "whatsapp_enabled",
    icon: <MessageCircle className="w-4 h-4 text-white" />,
    gradient: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
    label: "WhatsApp",
    placeholder: "+971 50 123 4567",
  },
  {
    key: "telegram",
    valueField: "telegram_username",
    enabledField: "telegram_enabled",
    icon: (
      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    gradient: "linear-gradient(135deg, #2AABEE 0%, #229ED9 100%)",
    label: "Telegram",
    placeholder: "@username",
  },
  {
    key: "email",
    valueField: "email_address",
    enabledField: "email_enabled",
    icon: <Mail className="w-4 h-4 text-white" />,
    gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    label: "Email",
    placeholder: "user@example.com",
  },
];

interface Props {
  t: (key: string) => string;
  isPushEnabled: boolean;
  setIsPushEnabled: (v: boolean) => void;
}

export function UserNotificationChannels({ t, isPushEnabled, setIsPushEnabled }: Props) {
  const { settings, isLoading, updateSettings, isUpdating } = useUserNotificationSettings();
  const [editingChannel, setEditingChannel] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const getValue = (ch: ChannelConfig): string => {
    if (!settings) return "";
    const val = settings[ch.valueField];
    return val != null ? String(val) : "";
  };

  const getEnabled = (ch: ChannelConfig): boolean => {
    if (!settings) return false;
    return !!settings[ch.enabledField];
  };

  const handleToggle = (ch: ChannelConfig) => {
    const currentValue = getValue(ch);
    const currentEnabled = getEnabled(ch);

    if (!currentEnabled && !currentValue) {
      setEditingChannel(ch.key);
      toast.info(t("settings.enterContactFirst") || "Сначала укажите контакт");
      return;
    }

    updateSettings({ [ch.enabledField]: !currentEnabled });
    toast.success(
      !currentEnabled
        ? `${ch.label} ${t("settings.enabled") || "Вкл"}`
        : `${ch.label} ${t("settings.disabled") || "Выкл"}`
    );
  };

  const handleSaveValue = (ch: ChannelConfig) => {
    let value = drafts[ch.key]?.trim();
    if (!value) return;
    if (ch.key === "whatsapp") value = value.replace(/^\+/, "");
    if (ch.key === "telegram") value = value.replace(/^@+/, "@").replace(/^([^@])/, "@$1");
    updateSettings({ [ch.valueField]: value, [ch.enabledField]: true });
    setEditingChannel(null);
    toast.success(t("settings.saved") || "Сохранено");
  };

  const handlePushToggle = (checked: boolean) => {
    setIsPushEnabled(checked);
    localStorage.setItem("push_notifications_enabled", String(checked));
    if (checked) {
      if ("Notification" in window) {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            toast.success(t("toast.pushEnabled") || "PUSH уведомления включены");
          } else {
            toast.error(t("toast.pushDenied") || "Разрешение на уведомления отклонено");
            setIsPushEnabled(false);
            localStorage.setItem("push_notifications_enabled", "false");
          }
        });
      } else {
        toast.error(t("toast.pushNotSupported") || "Уведомления не поддерживаются");
        setIsPushEnabled(false);
        localStorage.setItem("push_notifications_enabled", "false");
      }
    } else {
      toast.success(t("toast.pushDisabled") || "PUSH уведомления выключены");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* PUSH Notifications */}
      <div className={cn(
        "p-3 rounded-xl border transition-colors",
        isPushEnabled ? "border-border/50 bg-muted/30" : "border-border/30 bg-muted/20 opacity-60"
      )}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #007AFF 0%, #5856D6 100%)" }}
          >
            <Bell className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              {t("settings.browserPush") || "Браузер PUSH"}
            </p>
            <p className="text-sm font-medium truncate">
              {isPushEnabled
                ? t("settings.enabled") || "Включено"
                : t("settings.disabled") || "Выключено"}
            </p>
          </div>
          <Switch checked={isPushEnabled} onCheckedChange={handlePushToggle} />
        </div>
      </div>

      {/* API Channels */}
      {CHANNELS.map((ch) => {
        const value = getValue(ch);
        const enabled = getEnabled(ch);
        const isEditing = editingChannel === ch.key;

        return (
          <div
            key={ch.key}
            className={cn(
              "p-3 rounded-xl border transition-colors",
              enabled ? "border-border/50 bg-muted/30" : "border-border/30 bg-muted/20 opacity-60"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: ch.gradient }}
              >
                {ch.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{ch.label}</p>
                {!isEditing ? (
                  <p
                    className="text-sm font-medium truncate cursor-pointer hover:underline"
                    onClick={() => {
                      setDrafts((d) => ({ ...d, [ch.key]: value }));
                      setEditingChannel(ch.key);
                    }}
                  >
                    {value || (t("settings.tapToSet") || "Нажмите чтобы задать")}
                  </p>
                ) : null}
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={() => handleToggle(ch)}
                disabled={isUpdating}
              />
            </div>

            {isEditing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-2 flex gap-2"
              >
                <Input
                  value={drafts[ch.key] || ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [ch.key]: e.target.value }))}
                  placeholder={ch.placeholder}
                  className="h-9 text-sm rounded-lg"
                  autoFocus
                />
                <Button
                  size="sm"
                  className="shrink-0 h-9 rounded-lg"
                  onClick={() => handleSaveValue(ch)}
                  disabled={!drafts[ch.key]?.trim() || isUpdating}
                >
                  {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t("settings.save") || "Сохранить"}
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
              <div className="mt-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/15">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  📌 {t("settings.telegramHint") || "Чтобы получать уведомления в Telegram:"}
                </p>
                <ol className="text-[11px] text-muted-foreground leading-relaxed mt-1 ml-4 list-decimal space-y-0.5">
                  <li>
                    {t("settings.telegramStep1") || "Перейдите в бот"}{" "}
                    <a
                      href={`https://t.me/${(settings?.tg_bot || "@uEasyCard_Bot").replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline font-semibold"
                    >
                      {settings?.tg_bot || "@uEasyCard_Bot"}
                    </a>
                  </li>
                  <li>
                    {t("settings.telegramStep2") || "Нажмите кнопку"}{" "}
                    <span className="font-semibold">Start</span>
                  </li>
                </ol>
              </div>
            )}
          </div>
        );
      })}

      {/* Info */}
      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          📌 {t("settings.pushHint") || "Для работы PUSH уведомлений необходимо разрешить уведомления в настройках браузера. На iOS добавьте приложение на домашний экран."}
        </p>
      </div>
    </div>
  );
}
