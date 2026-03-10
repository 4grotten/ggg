import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Phone, Mail, Shield, Clock, User, FileText, ArrowRight, ChevronRight, Crown, Loader2, Calendar, CheckCircle, Hash } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/services/api/apiClient";
import { StaffMember } from "@/hooks/useAdminManagement";
import { format } from "date-fns";
import StaffNotificationSettings from "@/components/admin/StaffNotificationSettings";
import { useAuth } from "@/contexts/AuthContext";

interface AuditEntry {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  target_user_id: string;
  target_user_name: string;
  details: {
    acting_role: string;
    changes: Record<string, { было: any; стало: any }>;
  } | string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

const FIELD_LABELS_FALLBACK: Record<string, string> = {
  subscription_type: "Подписка",
  referral_level: "Реф. уровень",
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
  daily_usdt_send_limit: "USDT отправка (день)",
  monthly_usdt_send_limit: "USDT отправка (мес)",
  daily_usdt_receive_limit: "USDT получение (день)",
  monthly_usdt_receive_limit: "USDT получение (мес)",
  card_to_card_percent: "Комиссия Card→Card",
  bank_transfer_percent: "Комиссия банк. перевод",
  network_fee_percent: "Сетевая комиссия",
  currency_conversion_percent: "Конвертация",
  custom_settings_enabled: "Персональные настройки",
  first_name: "Имя",
  last_name: "Фамилия",
  gender: "Пол",
  language: "Язык",
};

export default function AdminStaffDetail() {
  const navigate = useNavigate();
  const { staffId } = useParams<{ staffId: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();

  const isCurrentUserRoot = user?.role === 'root';

  const { data: staffList } = useQuery({
    queryKey: ["admin-staff"],
    queryFn: async () => {
      const res = await apiRequest<StaffMember[] | { results: StaffMember[] }>("/admin/staff/");
      if (res.error || !res.data) return [];
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) return data.results;
      return [];
    },
  });

  const member = staffList?.find((s) => s.user_id === staffId);

  const { data: auditHistory = [], isLoading: auditLoading } = useQuery({
    queryKey: ["admin-audit-history", staffId],
    queryFn: async () => {
      const res = await apiRequest<AuditEntry[] | { results: AuditEntry[] }>(
        `/admin/audit-history/?admin_id=${staffId}`
      );
      if (res.error || !res.data) return [];
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray((res.data as any).results)) return (res.data as any).results;
      return [];
    },
    enabled: !!staffId,
  });

  // Build a clients map from audit target data for avatars
  const clientsMap = new Map<string, { avatar_url?: string; phone?: string }>();
  auditHistory.forEach((entry: any) => {
    if (entry.target_user_id) {
      clientsMap.set(String(entry.target_user_id), {
        avatar_url: entry.target_avatar || undefined,
        phone: entry.target_phone || entry.target_user_phone || undefined,
      });
    }
  });

  if (!staffId) {
    navigate("/settings/admin/admins");
    return null;
  }

  const isRoot = member?.role === "root";
  const initials = (member?.full_name || "??")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <MobileLayout
      title={member?.full_name || t('admin.audit.detail.title', 'Детали')}
      showBackButton
      onBack={() => navigate(-1)}
      rightAction={<div className="flex items-center gap-1"><ThemeSwitcher /><LanguageSwitcher /></div>}
    >
      <div className="px-4 pb-8 pt-4 space-y-5">
        {/* Profile Card */}
        {!member ? (
          <Skeleton className="h-48 w-full rounded-2xl" />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-muted/30 border border-border/50"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary" />

            <div className="p-5 flex items-start gap-4">
              <div className="relative shrink-0 flex flex-col items-center">
                <Avatar className="w-20 h-20 rounded-2xl shadow-lg ring-2 ring-primary/20">
                  <AvatarImage src={member.avatar_url || undefined} alt={member.full_name} className="object-cover" />
                  <AvatarFallback className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {member.is_verified && (
                  <div className="absolute top-[60px] right-[-4px] w-6 h-6 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-xl truncate">{member.full_name}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-muted-foreground font-mono">ID: {member.user_id}</span>
                  <Badge
                    className={cn(
                      "text-[10px] px-2 py-0.5 capitalize gap-1 border-0",
                      isRoot
                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    )}
                  >
                    {isRoot && <Crown className="w-3 h-3" />}
                    {member.role}
                  </Badge>
                </div>
                {member.created_at && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{format(new Date(member.created_at), "dd.MM.yyyy")}</span>
                  </div>
                )}
                {member.is_blocked && (
                  <Badge variant="destructive" className="mt-1.5 text-[10px]">
                    {t('admin.clients.blocked', 'Заблокирован')}
                  </Badge>
                )}
              </div>
            </div>

            {/* Contact buttons */}
            <div className="px-5 pb-4 flex items-center gap-2 border-t border-border/30 pt-3">
              {member.phone && (
                <a href={`tel:${member.phone}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full rounded-xl gap-2 text-xs h-9 hover:bg-muted hover:text-foreground">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    {member.phone}
                  </Button>
                </a>
              )}
              {member.email && (
                <a href={`mailto:${member.email}`} className="flex-1 min-w-0">
                  <Button variant="outline" size="sm" className="w-full rounded-xl gap-2 text-xs h-9 truncate hover:bg-muted hover:text-foreground">
                    <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </Button>
                </a>
              )}
            </div>
          </motion.div>
        )}

        {/* Notification Settings - always visible, readOnly for non-root */}
        {staffId && (
          <StaffNotificationSettings staffUserId={staffId} readOnly={!isCurrentUserRoot} />
        )}

        {/* Audit History */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <FileText className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">{t('admin.history.title', 'История изменений')}</h4>
            {!auditLoading && (
              <Badge variant="secondary" className="text-xs ml-auto">
                {auditHistory.length}
              </Badge>
            )}
          </div>

          {auditLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : auditHistory.length === 0 ? (
            <div className="rounded-2xl bg-muted/30 border border-border/50 p-8 text-center">
              <FileText className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{t('admin.history.empty', 'Нет записей')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(() => {
                let lastDateLabel = '';

                return auditHistory.map((entry: any, index: number) => {
                  const rawDet = typeof entry.details === "object" ? entry.details : null;
                  const actionType = (entry.action || entry.action_type || '').toLowerCase();
                  const isBlockAction = actionType.includes('block') && !actionType.includes('unblock');
                  const isUnblockAction = actionType.includes('unblock');
                  const isViewHistory = actionType.includes('view_transaction_history');
                  const isAdminLogin = actionType.includes('admin_panel_login');

                  const hasChanges = (rawDet?.changes && typeof rawDet.changes === 'object') || isBlockAction || isUnblockAction || isViewHistory || isAdminLogin;
                  const keys = rawDet?.changes ? Object.keys(rawDet.changes) : (
                    (isBlockAction || isUnblockAction) ? ['is_blocked'] :
                    isViewHistory ? ['view_transaction_history'] :
                    isAdminLogin ? ['admin_panel_login'] : []
                  );
                  const targetName = entry.target_user_name || entry.target_name || entry.target?.name;
                  const targetUserId = entry.target_user_id || entry.target_id;
                  const targetClient = targetUserId ? clientsMap.get(String(targetUserId)) : null;
                  const targetPhone = entry.target_phone || entry.target_user_phone || entry.target?.phone;
                  const timestamp = entry.created_at || entry.timestamp || entry.date;

                  // Date separator
                  let showDateSeparator = false;
                  let dateLabel = '';
                  if (timestamp) {
                    const d = new Date(timestamp);
                    dateLabel = format(d, 'dd.MM.yyyy');
                    if (dateLabel !== lastDateLabel) {
                      showDateSeparator = true;
                      lastDateLabel = dateLabel;
                    }
                  }

                  return (
                    <div key={`audit-${entry.id || index}`}>
                      {showDateSeparator && (
                        <div className="py-2 pt-4 first:pt-0">
                          <span className="text-base font-semibold text-primary">{dateLabel}</span>
                        </div>
                      )}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.05, 0.5) }}
                        className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2 cursor-pointer active:scale-[0.98] transition-transform"
                        onClick={() =>
                          navigate(`/settings/admin/audit/${entry.id || index}`, {
                            state: { auditItem: {
                              ...entry,
                              _enriched_admin_phone: member?.phone || '',
                              _enriched_admin_avatar: member?.avatar_url || null,
                              _enriched_admin_role: member?.role || 'admin',
                              _enriched_admin_id: entry.admin_id,
                              _enriched_target_id: targetUserId,
                              _enriched_target_phone: targetClient?.phone || targetPhone,
                              _enriched_target_avatar: targetClient?.avatar_url || null,
                            } },
                          })
                        }
                      >
                        {/* Who changed label - hide for admin_panel_login */}
                        {!isAdminLogin && (
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 ml-0.5">
                            {t('admin.audit.whoChanged', 'Кто изменил')}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-9 h-9 rounded-xl shrink-0">
                              <AvatarImage src={member?.avatar_url || undefined} alt={member?.full_name || 'Admin'} />
                              <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-xs font-medium">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium">{member?.full_name || entry.admin_name || 'Admin'}</p>
                                {isRoot ? (
                                  <Badge className="text-[9px] px-1.5 py-0 h-4 bg-amber-500 hover:bg-amber-600 text-white gap-0.5">
                                    <Crown className="w-2.5 h-2.5" />Root
                                  </Badge>
                                ) : (
                                  <Badge className="text-[9px] px-1.5 py-0 h-4 bg-primary hover:bg-primary text-primary-foreground">Admin</Badge>
                                )}
                              </div>
                              {member?.phone && <p className="text-xs text-muted-foreground">{member.phone}</p>}
                            </div>
                          </div>
                          {timestamp && (
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs text-muted-foreground">
                                <span className="font-bold">{format(new Date(timestamp), 'dd.MM.yyyy')}</span>
                                {' '}
                                <span className="font-normal">{format(new Date(timestamp), 'HH:mm')}</span>
                              </span>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Target client block with changes */}
                        {(() => {
                          if (targetName || hasChanges) {
                            // For admin_panel_login, skip target user block
                            if (isAdminLogin) {
                              return (
                                <div className="mt-3 ml-11 rounded-2xl bg-gradient-to-br from-card to-muted/30 border border-border/40 overflow-hidden">
                                  <div className="px-4 py-3 space-y-2">
                                    <div className="flex flex-wrap gap-1.5">
                                      <span className="inline-flex items-center text-[11px] px-2.5 py-1 rounded-lg font-medium backdrop-blur-sm bg-amber-500/20 border border-amber-500/30 text-amber-400">
                                        {t('admin.audit.actions.adminPanelLogin', 'Вход в админ-панель')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <div className="mt-3 ml-11 rounded-2xl bg-gradient-to-br from-card to-muted/30 border border-border/40 overflow-hidden">
                                {/* Target user label */}
                                <div className="px-4 pt-3 pb-1">
                                  <p className="text-[11px] uppercase tracking-wider text-green-500 font-semibold">
                                    {t('admin.audit.changedFor', 'Кому изменили')}
                                  </p>
                                </div>
                                {targetName && (
                                  <div className="flex items-center gap-3 px-4 py-3 border-b border-border/20">
                                    <Avatar className="w-10 h-10 rounded-xl shrink-0 ring-2 ring-primary/10">
                                      <AvatarImage src={targetClient?.avatar_url || undefined} alt={targetName} />
                                      <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-[11px] font-semibold">
                                        {targetName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold truncate">{targetName}</p>
                                        {targetUserId && (
                                          <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded-md">UID:{targetUserId}</span>
                                        )}
                                      </div>
                                      {targetPhone && (
                                        <p className="text-xs text-muted-foreground mt-0.5">{targetPhone}</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {/* Changes section */}
                                {hasChanges && keys.length > 0 && (
                                  <div className="px-4 py-3 space-y-2">
                                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                                      {t('admin.audit.changedData', 'Были изменены данные')}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {keys.map((k) => {
                                        const isViewHistoryChange = k === 'view_transaction_history';
                                        const isUnblockChange = k === 'is_blocked' && (
                                          isUnblockAction ||
                                          (rawDet?.changes?.is_blocked?.стало === false) ||
                                          (rawDet?.changes?.is_blocked?.new === false) ||
                                          (rawDet?.changes?.is_blocked?.to === false)
                                        );
                                        const isBlockChange = k === 'is_blocked' && !isUnblockChange;

                                        return (
                                          <span
                                            key={k}
                                            className={cn(
                                              "inline-flex items-center text-[11px] px-2.5 py-1 rounded-lg font-medium backdrop-blur-sm",
                                              isViewHistoryChange
                                                ? "bg-blue-500/20 border border-blue-500/30 text-blue-400"
                                                : isUnblockChange
                                                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-500"
                                                  : isBlockChange
                                                    ? "bg-destructive/20 border border-destructive/30 text-destructive"
                                                    : "bg-primary/20 border border-primary/20 text-primary-foreground"
                                            )}
                                          >
                                            {isViewHistoryChange
                                              ? t('admin.audit.actions.viewTransactionHistory', 'Просмотр истории транзакций')
                                              : isUnblockChange
                                                ? t('admin.audit.fields.is_unblocked', 'Разблокировка')
                                                : isBlockChange
                                                  ? t('admin.audit.fields.is_blocked', 'Блокировка')
                                                  : t(`admin.audit.fields.${k}`, FIELD_LABELS_FALLBACK[k] || k)}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </motion.div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
