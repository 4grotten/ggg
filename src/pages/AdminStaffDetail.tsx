import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Phone, Mail, Shield, Clock, User, FileText, ArrowRight, ChevronRight, Crown, Loader2, Calendar, CheckCircle } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/services/api/apiClient";
import { StaffMember } from "@/hooks/useAdminManagement";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

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

const FIELD_LABELS: Record<string, string> = {
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

function formatValue(val: any): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "Да" : "Нет";
  return String(val);
}

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffMins < 1) return "только что";
  if (diffMins < 60) return `${diffMins} мин. назад`;
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays === 1) return "вчера";
  if (diffDays < 30) return `${diffDays} дн. назад`;
  return format(date, "dd.MM.yyyy");
}

export default function AdminStaffDetail() {
  const navigate = useNavigate();
  const { staffId } = useParams<{ staffId: string }>();

  // Fetch staff list to get this member's info
  const { data: staffList } = useQuery({
    queryKey: ["admin-staff"],
    queryFn: async () => {
      const res = await apiRequest<StaffMember[]>("/admin/staff/");
      if (res.error || !res.data) return [];
      return res.data;
    },
  });

  const member = staffList?.find((s) => s.user_id === staffId);

  // Fetch audit history for this admin
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
      title={member?.full_name || "Детали"}
      showBackButton
      onBack={() => navigate(-1)}
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
                    <span>
                      {new Date(member.created_at).toLocaleDateString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
                {member.is_blocked && (
                  <Badge variant="destructive" className="mt-1.5 text-[10px]">
                    Заблокирован
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

        {/* Audit History */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <FileText className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">История изменений</h4>
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
              <p className="text-sm text-muted-foreground">Нет записей</p>
            </div>
          ) : (
            <div className="space-y-2">
              {auditHistory.map((entry: any, index: number) => {
                const details = typeof entry.details === "object" ? entry.details : null;
                const changes = details?.changes || {};
                const changeKeys = Object.keys(changes);
                const summary = changeKeys
                  .map((k) => FIELD_LABELS[k] || k)
                  .join(", ");

                return (
                  <motion.div
                    key={entry.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="rounded-2xl bg-card border border-border/50 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={() =>
                      navigate(`/settings/admin/audit/${entry.id || index}`, {
                        state: { auditItem: {
                          ...entry,
                          _enriched_admin_phone: member?.phone || '',
                          _enriched_admin_avatar: member?.avatar_url || null,
                          _enriched_admin_role: member?.role || 'admin',
                          _enriched_admin_id: entry.admin_id,
                          _enriched_target_id: entry.target_user_id,
                        } },
                      })
                    }
                  >
                    <div className="p-4 space-y-2">
                      {/* Target user + time */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {entry.target_user_name || "Пользователь"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              ID: {entry.target_user_id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[11px] text-muted-foreground">
                            {entry.created_at
                              ? formatRelativeTime(new Date(entry.created_at))
                              : ""}
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Action badge */}
                      <div className="flex items-center gap-2 pl-10">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {(entry.action || "update").replace(/_/g, " ").toLowerCase()}
                        </Badge>
                        {details?.acting_role && (
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            {details.acting_role}
                          </Badge>
                        )}
                      </div>

                      {/* Changes summary */}
                      {changeKeys.length > 0 && (
                        <div className="pl-10 space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Изменено: {summary}
                          </p>
                          {/* Show first 2 changes inline */}
                          {changeKeys.slice(0, 2).map((key) => {
                            const ch = changes[key];
                            return (
                              <div
                                key={key}
                                className="flex items-center gap-1.5 text-xs"
                              >
                                <span className="text-muted-foreground">
                                  {FIELD_LABELS[key] || key}:
                                </span>
                                <span className="line-through text-muted-foreground/70">
                                  {formatValue(ch?.было ?? ch?.old)}
                                </span>
                                <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                                <span className="text-primary font-medium">
                                  {formatValue(ch?.стало ?? ch?.new)}
                                </span>
                              </div>
                            );
                          })}
                          {changeKeys.length > 2 && (
                            <p className="text-[11px] text-primary">
                              +{changeKeys.length - 2} ещё...
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
