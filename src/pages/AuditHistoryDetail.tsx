import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, User, Shield, FileText, ArrowRight, Crown, Hash, Phone } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
  daily_top_up_limit: "Дневной лимит пополнения",
  monthly_top_up_limit: "Месячный лимит пополнения",
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

// Fields that represent monetary amounts
const MONETARY_FIELDS = new Set([
  "transfer_min", "transfer_max", "daily_transfer_limit", "monthly_transfer_limit",
  "withdrawal_min", "withdrawal_max", "daily_withdrawal_limit", "monthly_withdrawal_limit",
  "daily_top_up_limit", "monthly_top_up_limit",
  "daily_usdt_send_limit", "monthly_usdt_send_limit",
  "daily_usdt_receive_limit", "monthly_usdt_receive_limit",
]);

const USDT_FIELDS = new Set([
  "daily_usdt_send_limit", "monthly_usdt_send_limit",
  "daily_usdt_receive_limit", "monthly_usdt_receive_limit",
]);

const PERCENT_FIELDS = new Set([
  "card_to_card_percent", "bank_transfer_percent",
  "network_fee_percent", "currency_conversion_percent",
]);

function formatValue(val: any, fieldKey?: string, tFn?: (key: string, fallback?: string) => string): string {
  if (val === null || val === undefined) {
    return tFn?.('admin.audit.detail.notSet', 'Не задано') || 'Не задано';
  }
  if (typeof val === "boolean") return val ? (tFn?.('admin.audit.detail.yes', 'Да') || 'Да') : (tFn?.('admin.audit.detail.no', 'Нет') || 'Нет');

  const num = Number(val);
  if (fieldKey && !isNaN(num)) {
    if (PERCENT_FIELDS.has(fieldKey)) {
      return `${num.toFixed(2)}%`;
    }
    if (MONETARY_FIELDS.has(fieldKey)) {
      const currency = USDT_FIELDS.has(fieldKey) ? "USDT" : "AED";
      return `${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
    }
    // Generic number formatting for other numeric fields
    if (typeof val === "number" || (typeof val === "string" && /^\d+(\.\d+)?$/.test(val.trim()))) {
      return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  }

  return String(val);
}

export default function AuditHistoryDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const item = location.state?.auditItem;

  if (!item) {
    return (
      <MobileLayout
        title={t('admin.audit.detail.title', 'Детали изменения')}
        showBackButton
        onBack={() => navigate(-1)}
        rightAction={<div className="flex items-center gap-1"><ThemeSwitcher /><LanguageSwitcher /></div>}
      >
        <div className="px-4 py-20 text-center text-muted-foreground">
          {t('admin.audit.detail.notFound', 'Данные не найдены')}
        </div>
      </MobileLayout>
    );
  }

  const adminName = item.admin_name || item.performed_by_name || item.admin?.name || "Admin";
  const adminPhone = item._enriched_admin_phone || item.admin_phone || item.performed_by_phone || item.admin?.phone || "";
  const adminAvatar = item._enriched_admin_avatar || item.admin_avatar || null;
  const adminId = item._enriched_admin_id || item.admin_id || "";
  const targetName = item.target_name || item.target_user_name || item.target?.name;
  const targetPhone = item._enriched_target_phone || item.target_phone || item.target_user_phone || item.target?.phone;
  const targetAvatar = item._enriched_target_avatar || item.target_avatar || null;
  const targetId = item._enriched_target_id || item.target_user_id || item.target_id || "";
  const actionType = item.action || item.action_type || "";
  const actingRole = item._enriched_admin_role || item.acting_role || (typeof item.details === "object" ? item.details?.acting_role : null) || "admin";
  const timestamp = item.created_at || item.timestamp || item.date;

  // Parse changes from the item
  let changes: Record<string, { было: any; стало: any }> = {};
  const rawDetails = item.details;

  if (typeof rawDetails === "object" && rawDetails !== null) {
    if (rawDetails.changes && typeof rawDetails.changes === "object") {
      changes = rawDetails.changes;
    } else if (actionType.toLowerCase().includes('unblock') || actionType.toLowerCase().includes('block')) {
      // BLOCK_USER / UNBLOCK_USER have {new_value: bool} without changes object
      const newVal = rawDetails.new_value;
      if (typeof newVal === "boolean") {
        changes = {
          is_blocked: {
            было: !newVal,
            стало: newVal,
          }
        };
      }
    } else if (actionType.toLowerCase().includes('update_admin_setting')) {
      // UPDATE_ADMIN_SETTING has {key, category, old_value, new_value, description, category_label}
      const settingDesc = rawDetails.description || rawDetails.key || 'setting';
      changes = {
        [settingDesc]: {
          было: rawDetails.old_value,
          стало: rawDetails.new_value,
        }
      };
    } else {
      // Maybe the details object itself has changes-like structure
      Object.entries(rawDetails).forEach(([key, val]) => {
        if (key === "acting_role" || key === "target_name") return;
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
      title={t('admin.audit.detail.title', 'Детали изменения')}
      showBackButton
      onBack={() => navigate(-1)}
      rightAction={<div className="flex items-center gap-1"><ThemeSwitcher /><LanguageSwitcher /></div>}
    >
      <div className="px-4 pb-8 pt-4 space-y-5">
        {/* Header info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-border/50 overflow-hidden"
        >
          <div className="p-4 space-y-4">
            {/* Admin info */}
            <div>
              {!actionType.toLowerCase().includes('admin_panel_login') && (
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{t('admin.audit.whoChanged', 'Кто изменил')}</p>
              )}
              <div className="flex items-center gap-3">
                <Avatar className="w-14 h-14 rounded-xl shrink-0">
                  <AvatarImage src={adminAvatar || undefined} alt={adminName} />
                  <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-semibold">
                    {adminName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold truncate">{adminName}</p>
                    {actingRole === 'root' ? (
                      <Badge className="text-[9px] px-1.5 py-0 h-4 bg-amber-500 hover:bg-amber-600 text-white gap-0.5 shrink-0">
                        <Crown className="w-2.5 h-2.5" />Root
                      </Badge>
                    ) : (
                      <Badge className="text-[9px] px-1.5 py-0 h-4 bg-primary hover:bg-primary text-primary-foreground shrink-0 capitalize">
                        {actingRole}
                      </Badge>
                    )}
                  </div>
                  {adminPhone && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{adminPhone}</p>
                    </div>
                  )}
                  {adminId && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Hash className="w-3 h-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground font-mono">UID:{adminId}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Timestamp & Action */}
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              {timestamp && (
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span><span className="font-bold">{format(new Date(timestamp), "dd.MM.yyyy")}</span>{' '}{format(new Date(timestamp), "HH:mm:ss")}</span>
                </div>
              )}
              {(() => {
                const at = actionType.toLowerCase();
                const actionKey = actionType === 'UPDATE_USER_DATA' ? 'updateUserData'
                  : at.includes('admin_panel_login') ? 'adminPanelLogin'
                  : at.includes('view_transaction_history') ? 'viewTransactionHistory'
                  : at.includes('update_admin_setting') ? 'updateAdminSetting'
                  : at.includes('unblock') ? 'unblockClient'
                  : at.includes('block') ? 'blockClient'
                  : at.includes('update') ? 'updateClient'
                  : at.includes('add_role') ? 'addRole'
                  : at.includes('remove_role') ? 'removeRole'
                  : 'updateSetting';
                const isBlock = at.includes('block') && !at.includes('unblock');
                const isUnblock = at.includes('unblock');
                const isView = at.includes('view_transaction_history');
                const isLogin = at.includes('admin_panel_login');
                const isSettingUpdate = at.includes('update_admin_setting');
                const actionColorClass = isBlock ? 'text-destructive' : isUnblock ? 'text-emerald-500' : isView ? 'text-blue-400' : isLogin ? 'text-amber-400' : isSettingUpdate ? 'text-violet-500' : 'text-green-500';
                return (
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{t('admin.audit.detail.action', 'Действие')}: <span className={cn("font-medium", actionColorClass)}>{String(t(`admin.audit.actions.${actionKey}`, actionType || "update"))}</span></span>
                  </div>
                );
              })()}
            </div>

            {/* Target user - hide for admin_panel_login */}
            {targetName && !actionType.toLowerCase().includes('admin_panel_login') && !actionType.toLowerCase().includes('update_admin_setting') && (
              <div className="pt-3 border-t border-border/30">
                <p className="text-[10px] uppercase tracking-wider text-green-500 font-semibold mb-2">{t('admin.audit.changedFor', 'Кому изменили')}</p>
                <div className="flex items-center gap-3">
                  <Avatar className="w-11 h-11 rounded-xl shrink-0">
                    <AvatarImage src={targetAvatar || undefined} alt={targetName} />
                    <AvatarFallback className="rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 text-xs font-semibold">
                      {targetName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{targetName}</p>
                    {targetPhone && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{targetPhone}</p>
                      </div>
                    )}
                    {targetId && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Hash className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground font-mono">UID:{targetId}</p>
                      </div>
                    )}
                  </div>
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

        {/* Setting update category badge */}
        {actionType.toLowerCase().includes('update_admin_setting') && rawDetails && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-2"
          >
            <span className="inline-flex items-center text-xs px-3 py-1.5 rounded-xl font-medium bg-violet-500/20 border border-violet-500/30 text-violet-400">
              {rawDetails.category_label || rawDetails.category || ''}
            </span>
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
              {t('admin.audit.detail.changedParams', 'Изменённые параметры')} ({changeEntries.length})
            </h3>
            <div className="space-y-2">
              {changeEntries.map(([key, val], i) => {
                const label = t(`admin.audit.fields.${key}`, FIELD_LABELS[key] || key);
                const oldVal = formatValue((val as any)?.было ?? (val as any)?.old ?? (val as any)?.from, key, (k, f) => String(t(k, f)));
                const newVal = formatValue((val as any)?.стало ?? (val as any)?.new ?? (val as any)?.to, key, (k, f) => String(t(k, f)));

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className="rounded-2xl bg-card border border-border/50 p-4 space-y-2"
                  >
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="text-destructive/70 line-through">{oldVal}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-primary font-semibold">{newVal}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* View action info card */}
        {changeEntries.length === 0 && !descriptionText && actionType.toLowerCase().includes('view_transaction_history') && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-card border border-border/50 p-4 space-y-2"
          >
            <p className="text-sm font-semibold text-foreground">{t('admin.audit.actions.viewTransactionHistory', 'Просмотр истории транзакций')}</p>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{adminName}</span>
              {actingRole === 'root' && <Badge className="text-[8px] px-1 py-0 h-3.5 bg-amber-500 hover:bg-amber-600 text-white gap-0.5 ml-1 inline-flex align-middle"><Crown className="w-2 h-2" />Root</Badge>}
              {actingRole !== 'root' && <Badge className="text-[8px] px-1 py-0 h-3.5 bg-primary hover:bg-primary text-primary-foreground ml-1 inline-flex align-middle capitalize">{actingRole}</Badge>}
              {' '}{t('admin.audit.detail.viewedHistoryAction', 'просмотрел историю транзакций пользователя')}{' '}
              <span className="font-semibold text-foreground">{targetName}</span>
            </p>
            {timestamp && (
              <p className="text-xs text-muted-foreground">
                {format(new Date(timestamp), "dd.MM.yyyy")} в {format(new Date(timestamp), "HH:mm:ss")}
              </p>
            )}
          </motion.div>
        )}

        {/* Admin panel login info card */}
        {changeEntries.length === 0 && !descriptionText && actionType.toLowerCase().includes('admin_panel_login') && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-card border border-border/50 p-4 space-y-3"
          >
            <p className="text-sm font-semibold text-foreground">{t('admin.audit.actions.adminPanelLogin', 'Вход в админ-панель')}</p>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{adminName}</span>
              {actingRole === 'root' && <Badge className="text-[8px] px-1 py-0 h-3.5 bg-amber-500 hover:bg-amber-600 text-white gap-0.5 ml-1 inline-flex align-middle"><Crown className="w-2 h-2" />Root</Badge>}
              {actingRole !== 'root' && <Badge className="text-[8px] px-1 py-0 h-3.5 bg-primary hover:bg-primary text-primary-foreground ml-1 inline-flex align-middle capitalize">{actingRole}</Badge>}
              {' '}{t('admin.audit.detail.loggedInAction', 'вошёл в административную панель')}
            </p>
            {/* Device details */}
            {typeof item.details === 'object' && item.details && (
              <div className="space-y-1.5 pt-2 border-t border-border/30">
                {item.details.browser && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-muted-foreground/60">🌐</span>
                    <span>{t('admin.audit.detail.browser', 'Браузер')}:</span>
                    <span className="text-foreground font-medium">{item.details.browser}</span>
                  </div>
                )}
                {item.details.os && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-muted-foreground/60">💻</span>
                    <span>{t('admin.audit.detail.os', 'ОС')}:</span>
                    <span className="text-foreground font-medium">{item.details.os}</span>
                  </div>
                )}
                {item.details.device && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-muted-foreground/60">📱</span>
                    <span>{t('admin.audit.detail.device', 'Устройство')}:</span>
                    <span className="text-foreground font-medium">{item.details.device}</span>
                  </div>
                )}
                {item.details.screen && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-muted-foreground/60">🖥</span>
                    <span>{t('admin.audit.detail.screen', 'Экран')}:</span>
                    <span className="text-foreground font-medium">{item.details.screen}</span>
                  </div>
                )}
                {item.details.language && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-muted-foreground/60">🌍</span>
                    <span>{t('admin.audit.detail.lang', 'Язык')}:</span>
                    <span className="text-foreground font-medium">{item.details.language}</span>
                  </div>
                )}
              </div>
            )}
            {item.ip_address && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-muted-foreground/60">📍</span>
                <span>IP:</span>
                <span className="text-foreground font-medium font-mono">{item.ip_address}</span>
              </div>
            )}
            {timestamp && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>Дата: <span className="font-bold">{format(new Date(timestamp), "dd.MM.yyyy")}</span> в {format(new Date(timestamp), "HH:mm:ss")}</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Raw data fallback if no changes parsed */}
        {changeEntries.length === 0 && !descriptionText && !actionType.toLowerCase().includes('view_transaction_history') && !actionType.toLowerCase().includes('admin_panel_login') && !actionType.toLowerCase().includes('update_admin_setting') && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-card border border-border/50 p-4"
          >
            <p className="text-xs text-muted-foreground mb-2">{t('admin.audit.detail.rawData', 'Данные изменения')}:</p>
            <pre className="text-xs text-foreground/70 whitespace-pre-wrap break-all">
              {JSON.stringify(item, null, 2)}
            </pre>
          </motion.div>
        )}
      </div>
    </MobileLayout>
  );
}
