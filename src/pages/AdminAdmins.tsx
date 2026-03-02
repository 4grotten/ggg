import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, RefreshCw, Users, UserPlus, Trash2, Phone, Hash, Shield, CheckCircle, History, Activity, TrendingUp, Loader2, ChevronRight, Crown } from "lucide-react";
import { apiGet } from "@/services/api/apiClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminManagement } from "@/hooks/useAdminManagement";
import { AppRole } from "@/types/admin";
import { cn } from "@/lib/utils";

// --- Types & helpers (same as AdminPanel) ---

interface AdminAction {
  id: string;
  adminName: string;
  adminPhone: string;
  action: 'add_role' | 'remove_role' | 'update_setting' | 'update_client' | 'block_client' | 'unblock_client';
  targetName?: string;
  targetPhone?: string;
  details: string;
  timestamp: Date;
}

const MOCK_ADMIN_HISTORY: AdminAction[] = [];

const getActionIcon = (action: AdminAction['action']) => {
  switch (action) {
    case 'add_role': return UserPlus;
    case 'remove_role': return Trash2;
    case 'update_setting': return TrendingUp;
    case 'update_client': return Users;
    case 'block_client': return Shield;
    case 'unblock_client': return CheckCircle;
    default: return Activity;
  }
};

const getActionColor = (action: AdminAction['action']) => {
  switch (action) {
    case 'add_role': return 'text-green-500 bg-green-500/10';
    case 'remove_role': return 'text-red-500 bg-red-500/10';
    case 'update_setting': return 'text-blue-500 bg-blue-500/10';
    case 'update_client': return 'text-violet-500 bg-violet-500/10';
    case 'block_client': return 'text-orange-500 bg-orange-500/10';
    case 'unblock_client': return 'text-emerald-500 bg-emerald-500/10';
    default: return 'text-muted-foreground bg-muted';
  }
};

const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} мин. назад`;
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays === 1) return 'вчера';
  return `${diffDays} дн. назад`;
};

const FIELD_LABELS_FALLBACK: Record<string, string> = {
  subscription_type: "Подписка", role: "Роль", referral_level: "Реф. уровень",
  is_blocked: "Блокировка", is_vip: "VIP", is_verified: "Верификация",
  transfer_min: "Мин. перевод", transfer_max: "Макс. перевод",
  daily_transfer_limit: "Дн. лимит переводов", monthly_transfer_limit: "Мес. лимит переводов",
  withdrawal_min: "Мин. вывод", withdrawal_max: "Макс. вывод",
  daily_withdrawal_limit: "Дн. лимит вывода", monthly_withdrawal_limit: "Мес. лимит вывода",
  daily_top_up_limit: "Дн. лимит пополнения", monthly_top_up_limit: "Мес. лимит пополнения",
  daily_usdt_send_limit: "Дн. USDT отправка", monthly_usdt_send_limit: "Мес. USDT отправка",
  daily_usdt_receive_limit: "Дн. USDT получение", monthly_usdt_receive_limit: "Мес. USDT получение",
  card_to_card_percent: "Card→Card %", bank_transfer_percent: "Банк. перевод %",
  network_fee_percent: "Сетевая комиссия %", currency_conversion_percent: "Конвертация %",
  custom_settings_enabled: "Персональные настройки",
  first_name: "Имя", last_name: "Фамилия", gender: "Пол", language: "Язык",
  avatar_url: "Аватар", phone: "Телефон", email: "Email", full_name: "Полное имя",
};

interface GlassCardProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  icon: React.ElementType;
  iconColor?: string;
}

function GlassCard({ children, title, description, icon: Icon, iconColor = "text-primary" }: GlassCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-xl border border-border/50 shadow-xl shadow-black/5">
      <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 blur-3xl" />
      <div className="relative p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
            <Icon className={cn("w-6 h-6", iconColor)} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}

export default function AdminAdmins() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const { admins, isLoading: adminsLoading, staff, staffLoading, clients, searchUser, addAdmin, removeAdmin } = useAdminManagement();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<{
    user_id: string;
    phone: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("admin");
  const [isSearching, setIsSearching] = useState(false);
  
  // Persist active sub-tab in URL so navigating back restores it
  const activeSubTab = (searchParams.get("tab") === "history" ? "history" : "admins") as "admins" | "history";
  const setActiveSubTab = useCallback((tab: "admins" | "history") => {
    setSearchParams({ tab }, { replace: true });
  }, [setSearchParams]);

  // Real audit history from API with pagination — cached in state, only fetch once
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const auditLoadedRef = useRef(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const historyBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeSubTab === "history" && !auditLoadedRef.current) {
      auditLoadedRef.current = true;
      setAuditLoading(true);
      setVisibleCount(20);
      apiGet<any>("/admin/audit-history/")
        .then((res) => {
          if (res.data) {
            const items = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
            setAuditHistory(items);
          }
        })
        .catch(() => {})
        .finally(() => setAuditLoading(false));
    }
  }, [activeSubTab]);

  // Pull-to-refresh: fetch only new items and prepend
  const refreshAuditHistory = useCallback(async () => {
    const res = await apiGet<any>("/admin/audit-history/");
    if (res.data) {
      const items = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
      setAuditHistory(items);
    }
  }, []);

  // Infinite scroll for audit history
  useEffect(() => {
    if (activeSubTab !== "history" || !historyBottomRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < auditHistory.length) {
          setVisibleCount((prev) => Math.min(prev + 20, auditHistory.length));
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(historyBottomRef.current);
    return () => observer.disconnect();
  }, [activeSubTab, visibleCount, auditHistory.length]);

  // Build a map of staff user_id -> staff member for avatars/roles
  const staffMap = useMemo(() => {
    const map = new Map<string, typeof staff extends (infer T)[] ? T : never>();
    staff?.forEach((s) => map.set(s.user_id, s));
    return map;
  }, [staff]);

  // Build a map of clients by user_id for target user avatars
  const clientsMap = useMemo(() => {
    const map = new Map<string, { avatar_url: string | null; full_name: string; phone?: string }>();
    clients?.forEach((c) => map.set(c.user_id, { avatar_url: c.avatar_url, full_name: c.full_name, phone: c.phone }));
    // Also add staff members
    staff?.forEach((s) => map.set(s.user_id, { avatar_url: s.avatar_url, full_name: s.full_name, phone: s.phone }));
    return map;
  }, [clients, staff]);

  const handleSearchUser = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResult(null);
    try {
      const result = await searchUser(searchQuery.trim());
      setSearchResult(result);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddAdmin = () => {
    if (!searchResult) return;
    addAdmin.mutate(
      { userId: searchResult.user_id, role: selectedRole },
      { onSuccess: () => { setSearchQuery(""); setSearchResult(null); } }
    );
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case "admin": return "destructive" as const;
      case "moderator": return "default" as const;
      default: return "secondary" as const;
    }
  };

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case "admin": return t("admin.roles.admin");
      case "moderator": return t("admin.roles.moderator");
      default: return t("admin.roles.user");
    }
  };

  return (
    <MobileLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-background"
      >
        {/* Header */}
        <div className="sticky top-0 z-50">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
          <div className="relative px-4 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 rounded-xl bg-muted/50 hover:bg-muted">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold">{t("admin.tabs.admins")}</h1>
                <p className="text-xs text-muted-foreground">{staff?.length || 0} {t("admin.roles.usersWithRoles")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4 pb-24">
          {/* Sub-tabs */}
          <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
            <button
              onClick={() => setActiveSubTab("admins")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                activeSubTab === "admins" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="w-4 h-4" />
              {t("admin.subtabs.admins")}
            </button>
            <button
              onClick={() => setActiveSubTab("history")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                activeSubTab === "history" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <History className="w-4 h-4" />
              {t("admin.subtabs.history")}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeSubTab === "admins" ? (
              <motion.div
                key="admins-subtab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Add Role Card */}
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Поиск Админов и Ротов по номеру телефона, UID и по имени"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearchUser()}
                        className="pl-10 h-12 rounded-xl bg-background/50"
                      />
                    </div>
                    <Button
                      size="icon"
                      onClick={handleSearchUser}
                      disabled={isSearching || !searchQuery.trim()}
                      className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80"
                    >
                      {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>

                  <AnimatePresence>
                    {searchResult && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                              <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {searchResult.first_name || searchResult.last_name
                                  ? `${searchResult.first_name || ""} ${searchResult.last_name || ""}`.trim()
                                  : t("admin.roles.noName")}
                              </p>
                              {searchResult.phone && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {searchResult.phone}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                              <SelectTrigger className="flex-1 h-11 rounded-xl bg-background/50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">{t("admin.roles.admin")}</SelectItem>
                                <SelectItem value="moderator">{t("admin.roles.moderator")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              onClick={handleAddAdmin}
                              disabled={addAdmin.isPending}
                              className="h-11 px-6 rounded-xl bg-gradient-to-r from-primary to-primary/80"
                            >
                              {addAdmin.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : t("admin.roles.add")}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {searchQuery && !searchResult && !isSearching && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground text-center py-2">
                      {t("admin.roles.userNotFound")}
                    </motion.p>
                  )}
                </div>

                {/* Staff from API */}
                <GlassCard
                  title={t("admin.roles.currentRoles")}
                  description={`${staff?.length || 0} ${t("admin.roles.usersWithRoles")}`}
                  icon={Shield}
                  iconColor="text-blue-500"
                >
                  {staffLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                    </div>
                  ) : staff && staff.length > 0 ? (
                    <div className="space-y-2">
                      {staff.map((member, index) => {
                        const isRoot = member.role === 'root';
                        const initials = member.full_name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2);
                        return (
                          <motion.div
                            key={member.user_id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50 border border-border/50 group hover:border-border transition-colors cursor-pointer active:scale-[0.98]"
                            onClick={() => navigate(`/settings/admin/staff/${member.user_id}`)}
                          >
                            <Avatar className="w-14 h-14 rounded-2xl shrink-0">
                              <AvatarImage src={member.avatar_url || undefined} alt={member.full_name} />
                              <AvatarFallback className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-medium">
                                {initials || '??'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{member.full_name}</p>
                              <p className="text-[10px] text-muted-foreground/60 font-mono truncate">ID: {member.user_id}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {member.phone}
                                </span>
                                {member.email && (
                                  <span className="truncate">{member.email}</span>
                                )}
                              </div>
                            </div>
                            <Badge
                              variant={isRoot ? "destructive" : "default"}
                              className={cn("shrink-0 gap-1", isRoot && "bg-amber-500 hover:bg-amber-600")}
                            >
                              {isRoot && <Crown className="w-3 h-3" />}
                              {isRoot ? 'Root' : 'Admin'}
                            </Badge>
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mb-2 opacity-30" />
                      <p className="text-sm">{t("admin.roles.noUsersWithRoles")}</p>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            ) : (
              <motion.div
                key="history-subtab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <GlassCard
                  title={t("admin.history.title")}
                  description={auditLoading ? "Загрузка..." : `${Math.min(visibleCount, auditHistory.length)} из ${auditHistory.length} ${t("admin.history.actions")}`}
                  icon={History}
                  iconColor="text-violet-500"
                >
                  <div className="space-y-3">
                    {/* Real audit history from API */}
                    {auditLoading && (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    )}
                    {(() => {
                      const visibleItems = auditHistory.slice(0, visibleCount);
                      let lastDateLabel = '';

                      return visibleItems.map((item: any, index: number) => {
                        const actionType = (item.action || item.action_type || '').toLowerCase();
                        let mappedAction: AdminAction['action'] = 'update_setting';
                        if (actionType.includes('add_role') || actionType.includes('role_add')) mappedAction = 'add_role';
                        else if (actionType.includes('remove_role') || actionType.includes('role_remove')) mappedAction = 'remove_role';
                        else if (actionType.includes('block')) mappedAction = 'block_client';
                        else if (actionType.includes('unblock')) mappedAction = 'unblock_client';
                        else if (actionType.includes('client') || actionType.includes('user')) mappedAction = 'update_client';

                        const ActionIcon = getActionIcon(mappedAction);
                        const colorClasses = getActionColor(mappedAction);
                        const [iconColor, bgColor] = colorClasses.split(' ');
                        const adminName = item.admin_name || item.performed_by_name || item.admin?.name || 'Admin';
                        const adminPhone = item.admin_phone || item.performed_by_phone || item.admin?.phone || '';
                        const staffMember = staffMap.get(String(item.admin_id));
                        const adminRole = staffMember?.role || (item.details?.acting_role);
                        const rawDetails = item.description || item.details || item.message || item;
                        const details = typeof rawDetails === 'object' ? JSON.stringify(rawDetails) : String(rawDetails);
                        const targetName = item.target_name || item.target_user_name || item.target?.name;
                        const targetUserId = item.target_user_id || item.target_id;
                        const targetClient = targetUserId ? clientsMap.get(String(targetUserId)) : null;
                        const targetPhone = item.target_phone || item.target_user_phone || item.target?.phone;
                        const timestamp = item.created_at || item.timestamp || item.date;

                        // Date separator logic
                        let showDateSeparator = false;
                        let dateLabel = '';
                        if (timestamp) {
                          const d = new Date(timestamp);
                          dateLabel = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
                          if (dateLabel !== lastDateLabel) {
                            showDateSeparator = true;
                            lastDateLabel = dateLabel;
                          }
                        }

                        return (
                          <div key={`api-${item.id || index}`}>
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
                              onClick={() => navigate(`/settings/admin/audit/${item.id || index}`, { state: { auditItem: {
                                ...item,
                                _enriched_admin_phone: staffMember?.phone || adminPhone,
                                _enriched_admin_avatar: staffMember?.avatar_url || null,
                                _enriched_admin_role: adminRole,
                                _enriched_target_phone: targetClient?.phone || targetPhone,
                                _enriched_target_avatar: targetClient?.avatar_url || null,
                                _enriched_target_id: targetUserId,
                                _enriched_admin_id: item.admin_id,
                              } } })}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-9 h-9 rounded-xl shrink-0">
                                    <AvatarImage src={staffMember?.avatar_url || undefined} alt={adminName} />
                                    <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-xs font-medium">
                                      {adminName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <p className="text-sm font-medium">{adminName}</p>
                                      {adminRole === 'root' ? (
                                        <Badge className="text-[9px] px-1.5 py-0 h-4 bg-amber-500 hover:bg-amber-600 text-white gap-0.5">
                                          <Crown className="w-2.5 h-2.5" />Root
                                        </Badge>
                                      ) : (
                                        <Badge className="text-[9px] px-1.5 py-0 h-4 bg-primary hover:bg-primary text-primary-foreground">Admin</Badge>
                                      )}
                                    </div>
                                    {adminPhone && <p className="text-xs text-muted-foreground">{adminPhone}</p>}
                                  </div>
                                </div>
                                {timestamp && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-xs text-muted-foreground">
                                      <span className="font-bold">{new Date(timestamp).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                      {' '}
                                      <span className="font-normal">{new Date(timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              {(() => {
                                const rawDet = item.details;
                                if (typeof rawDet === 'object' && rawDet?.changes) {
                                  const keys = Object.keys(rawDet.changes);
                                  return (
                                    <div className="flex flex-wrap gap-1.5 pl-11 pt-1">
                                      {keys.map((k) => (
                                        <span
                                          key={k}
                                          className="inline-block text-[11px] px-2.5 py-1 rounded-lg bg-primary/20 border border-primary/30 text-primary-foreground font-medium"
                                        >
                                          {t(`admin.audit.fields.${k}`, FIELD_LABELS_FALLBACK[k] || k)}
                                        </span>
                                      ))}
                                    </div>
                                  );
                                }
                                return <p className="text-sm text-foreground/80 pl-11">{details}</p>;
                              })()}
                              {targetName && (
                                <div className="flex items-center gap-2 pl-11">
                                  <Avatar className="w-7 h-7 rounded-lg shrink-0">
                                    <AvatarImage src={targetClient?.avatar_url || undefined} alt={targetName} />
                                    <AvatarFallback className="rounded-lg bg-muted text-[10px] font-medium">
                                      {targetName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background/50 text-xs">
                                    <span className="font-medium">{targetName}</span>
                                    {targetUserId && <span className="text-muted-foreground font-mono">UID:{targetUserId}</span>}
                                    {targetPhone && <span className="text-muted-foreground">{targetPhone}</span>}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          </div>
                        );
                      });
                    })()}

                    {/* Scroll sentinel for infinite pagination */}
                    {visibleCount < auditHistory.length && (
                      <div ref={historyBottomRef} className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground ml-2">Загрузка ещё...</span>
                      </div>
                    )}
                    {visibleCount >= auditHistory.length && auditHistory.length > 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">Показано {auditHistory.length} записей</p>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </MobileLayout>
  );
}
