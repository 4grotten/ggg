import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, User, Shield, FileText, ArrowRight } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// Human-readable labels for known field keys
const FIELD_LABELS: Record<string, string> = {
  subscription_type: "Вид подписки",
  referral_level: "Реферальный уровень",
  role: "Роль",
  is_blocked: "Блокировка",
  is_vip: "VIP статус",
  is_verified: "Верификация",
  transfer_min: "Мин. перевод",
  transfer_max: "Макс. перевод",
  daily_transfer_limit: "Дневной лимит переводов",
  monthly_transfer_limit: "Месячный лимит переводов",
  withdrawal_min: "Мин. вывод",
  withdrawal_max: "Макс. вывод",
  daily_withdrawal_limit: "Дневной лимит вывода",
  monthly_withdrawal_limit: "Месячный лимит вывода",
  daily_usdt_send_limit: "Дневной лимит USDT (отправка)",
  monthly_usdt_send_limit: "Месячный лимит USDT (отправка)",
  daily_usdt_receive_limit: "Дневной лимит USDT (получение)",
  monthly_usdt_receive_limit: "Месячный лимит USDT (получение)",
  card_to_card_percent: "Комиссия Card→Card",
  bank_transfer_percent: "Комиссия банк. перевод",
  network_fee_percent: "Сетевая комиссия",
  currency_conversion_percent: "Комиссия конвертации",
  custom_settings_enabled: "Персональные настройки",
  first_name: "Имя",
  last_name: "Фамилия",
  gender: "Пол",
  language: "Язык",
  avatar_url: "Аватар",
  phone: "Телефон",
  email: "Email",
  full_name: "Полное имя",
};

function formatValue(val: any): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "Да" : "Нет";
  return String(val);
}

export default function AuditHistoryDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const item = location.state?.auditItem;

  if (!item) {
    return (
      <MobileLayout
        title="Детали изменения"
        showBackButton
        onBack={() => navigate(-1)}
      >
        <div className="px-4 py-20 text-center text-muted-foreground">
          Данные не найдены
        </div>
      </MobileLayout>
    );
  }

  const adminName = item.admin_name || item.performed_by_name || item.admin?.name || "Admin";
  const adminPhone = item.admin_phone || item.performed_by_phone || item.admin?.phone || "";
  const targetName = item.target_name || item.target_user_name || item.target?.name;
  const targetPhone = item.target_phone || item.target_user_phone || item.target?.phone;
  const actionType = item.action || item.action_type || "";
  const actingRole = item.acting_role || (typeof item.details === "object" ? item.details?.acting_role : null) || "admin";
  const timestamp = item.created_at || item.timestamp || item.date;

  // Parse changes from the item
  let changes: Record<string, { было: any; стало: any }> = {};
  const rawDetails = item.details;

  if (typeof rawDetails === "object" && rawDetails !== null) {
    if (rawDetails.changes && typeof rawDetails.changes === "object") {
      changes = rawDetails.changes;
    } else {
      // Maybe the details object itself has changes-like structure
      Object.entries(rawDetails).forEach(([key, val]) => {
        if (key === "acting_role") return;
        if (typeof val === "object" && val !== null && ("было" in (val as any) || "стало" in (val as any))) {
          changes[key] = val as { было: any; стало: any };
        }
      });
    }
  }

  // If description is a plain string
  const descriptionText = typeof item.description === "string" ? item.description : (typeof item.message === "string" ? item.message : null);

  const changeEntries = Object.entries(changes);

  return (
    <MobileLayout
      title="Детали изменения"
      showBackButton
      onBack={() => navigate(-1)}
    >
      <div className="px-4 pb-8 pt-4 space-y-5">
        {/* Header info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-border/50 overflow-hidden"
        >
          <div className="p-4 space-y-3">
            {/* Admin info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{adminName}</p>
                {adminPhone && <p className="text-xs text-muted-foreground">{adminPhone}</p>}
              </div>
              <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                {actingRole}
              </Badge>
            </div>

            {/* Timestamp */}
            {timestamp && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>{format(new Date(timestamp), "dd MMMM yyyy, HH:mm:ss", { locale: ru })}</span>
              </div>
            )}

            {/* Action type */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="w-3.5 h-3.5" />
              <span>Действие: <span className="font-medium text-foreground">{actionType || "update"}</span></span>
            </div>

            {/* Target user */}
            {targetName && (
              <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{targetName}</p>
                  {targetPhone && <p className="text-xs text-muted-foreground">{targetPhone}</p>}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Description text if available */}
        {descriptionText && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-card border border-border/50 p-4"
          >
            <p className="text-sm text-foreground/80">{descriptionText}</p>
          </motion.div>
        )}

        {/* Changes list */}
        {changeEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-semibold text-muted-foreground px-1">
              Изменённые параметры ({changeEntries.length})
            </h3>
            <div className="space-y-2">
              {changeEntries.map(([key, val], i) => {
                const label = FIELD_LABELS[key] || key;
                const oldVal = formatValue((val as any)?.было ?? (val as any)?.old ?? (val as any)?.from);
                const newVal = formatValue((val as any)?.стало ?? (val as any)?.new ?? (val as any)?.to);

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className="rounded-2xl bg-card border border-border/50 p-4 space-y-1.5"
                  >
                    <p className="text-sm font-medium">{label}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground line-through">{oldVal}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-primary font-medium">{newVal}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Raw data fallback if no changes parsed */}
        {changeEntries.length === 0 && !descriptionText && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-card border border-border/50 p-4"
          >
            <p className="text-xs text-muted-foreground mb-2">Данные изменения:</p>
            <pre className="text-xs text-foreground/70 whitespace-pre-wrap break-all">
              {JSON.stringify(item, null, 2)}
            </pre>
          </motion.div>
        )}
      </div>
    </MobileLayout>
  );
}
