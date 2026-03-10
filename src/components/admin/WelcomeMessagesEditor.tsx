import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Save, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

export function WelcomeMessagesEditor() {
  const { t } = useTranslation();
  const [activeLang, setActiveLang] = useState("en");
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [originalMessages, setOriginalMessages] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("admin_settings")
      .select("key, description")
      .eq("category", "notifications")
      .like("key", "welcome_message_%");

    const msgs: Record<string, string> = {};
    data?.forEach((row) => {
      const lang = row.key.replace("welcome_message_", "");
      msgs[lang] = row.description || "";
    });
    setMessages(msgs);
    setOriginalMessages({ ...msgs });
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const key = `welcome_message_${activeLang}`;
      const text = messages[activeLang] || "";
      
      const { error } = await supabase
        .from("admin_settings")
        .update({ description: text })
        .eq("category", "notifications")
        .eq("key", key);

      if (error) throw error;

      setOriginalMessages((prev) => ({ ...prev, [activeLang]: text }));
      toast.success(t("admin.welcomeMessages.saved", "Сообщение сохранено"));
    } catch {
      toast.error(t("admin.welcomeMessages.saveError", "Ошибка сохранения"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      // Get current admin's phone from profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("user_id", user.id)
        .single();

      if (!profile?.phone) {
        toast.error(t("admin.welcomeMessages.noPhone", "Номер телефона не найден в профиле"));
        return;
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/send-welcome-whatsapp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: profile.phone,
            language: activeLang,
          }),
        }
      );

      if (!res.ok) throw new Error(await res.text());
      toast.success(t("admin.welcomeMessages.testSent", "Тестовое сообщение отправлено"));
    } catch (err) {
      console.error("Test welcome failed:", err);
      toast.error(t("admin.welcomeMessages.testError", "Ошибка отправки тестового сообщения"));
    } finally {
      setIsTesting(false);
    }
  };

  const hasChanges = messages[activeLang] !== originalMessages[activeLang];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Language chips */}
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setActiveLang(lang.code)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5",
              activeLang === lang.code
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>

      {/* Message textarea */}
      <Textarea
        value={messages[activeLang] || ""}
        onChange={(e) =>
          setMessages((prev) => ({ ...prev, [activeLang]: e.target.value }))
        }
        placeholder={t("admin.welcomeMessages.placeholder", "Введите приветственное сообщение...")}
        className="min-h-[200px] rounded-xl bg-background/50 text-sm leading-relaxed resize-y"
      />

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button
          onClick={handleTest}
          disabled={isTesting}
          variant="outline"
          className="rounded-xl gap-2"
          size="sm"
        >
          {isTesting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          {t("admin.welcomeMessages.test", "Тест")}
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="rounded-xl gap-2"
          size="sm"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {t("admin.welcomeMessages.save", "Сохранить")}
        </Button>
      </div>
    </div>
  );
}
