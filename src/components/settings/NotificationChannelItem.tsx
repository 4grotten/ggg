import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface NotificationChannelItemProps {
  icon: React.ReactNode;
  gradient: string;
  label: string;
  storageKey: string;
  placeholder: string;
  t: (key: string) => string;
  hint?: React.ReactNode;
}

export function NotificationChannelItem({
  icon,
  gradient,
  label,
  storageKey,
  placeholder,
  t,
  hint,
}: NotificationChannelItemProps) {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(`${storageKey}_enabled`) === "true");
  const [value, setValue] = useState(() => localStorage.getItem(`${storageKey}_value`) || "");
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleToggle = (checked: boolean) => {
    if (checked && !value) {
      setIsEditing(true);
      toast.info(t("settings.enterContactFirst") || "Сначала укажите контакт");
      return;
    }
    setEnabled(checked);
    localStorage.setItem(`${storageKey}_enabled`, String(checked));
    toast.success(
      checked
        ? `${label} ${t("settings.enabled") || "Вкл"}`
        : `${label} ${t("settings.disabled") || "Выкл"}`
    );
  };

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setValue(trimmed);
    localStorage.setItem(`${storageKey}_value`, trimmed);
    setEnabled(true);
    localStorage.setItem(`${storageKey}_enabled`, "true");
    setIsEditing(false);
    toast.success(t("settings.saved") || "Сохранено");
  };

  return (
    <div className={`p-3 rounded-xl border transition-colors ${enabled ? "border-border/50 bg-muted/30" : "border-border/30 bg-muted/20 opacity-60"}`}>
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: gradient }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {!isEditing ? (
            <p
              className="text-sm font-medium truncate cursor-pointer hover:underline"
              onClick={() => {
                setDraft(value);
                setIsEditing(true);
              }}
            >
              {value || (t("settings.tapToSet") || "Нажмите чтобы задать")}
            </p>
          ) : null}
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} />
      </div>

      {isEditing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2 flex gap-2"
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            className="h-9 text-sm rounded-lg"
            autoFocus
          />
          <Button
            size="sm"
            className="shrink-0 h-9 rounded-lg"
            onClick={handleSave}
            disabled={!draft.trim()}
          >
            {t("settings.save") || "Сохранить"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0 h-9 rounded-lg"
            onClick={() => setIsEditing(false)}
          >
            ✕
          </Button>
        </motion.div>
      )}

      {hint}
    </div>
  );
}
