import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, RefreshCw, Users, UserPlus, Trash2, Phone, Hash, Shield, CheckCircle, History, Activity, TrendingUp } from "lucide-react";
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

const MOCK_ADMIN_HISTORY: AdminAction[] = [
  { id: '1', adminName: 'Александр Петров', adminPhone: '+971 58 533 3939', action: 'add_role', targetName: 'Мария Иванова', targetPhone: '+971 50 123 4567', details: 'Назначена роль "Модератор"', timestamp: new Date(Date.now() - 1000 * 60 * 15) },
  { id: '2', adminName: 'Дмитрий Козлов', adminPhone: '+996 555 214 242', action: 'update_setting', details: 'Изменён курс USDT → AED: 3.67 → 3.68', timestamp: new Date(Date.now() - 1000 * 60 * 45) },
  { id: '3', adminName: 'Александр Петров', adminPhone: '+971 58 533 3939', action: 'block_client', targetName: 'Иван Сидоров', targetPhone: '+971 55 987 6543', details: 'Клиент заблокирован: подозрительная активность', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
  { id: '4', adminName: 'Дмитрий Козлов', adminPhone: '+996 555 214 242', action: 'update_client', targetName: 'Анна Смирнова', targetPhone: '+971 52 456 7890', details: 'Повышен реферальный уровень: R1 → R2', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5) },
  { id: '5', adminName: 'Александр Петров', adminPhone: '+971 58 533 3939', action: 'remove_role', targetName: 'Олег Николаев', targetPhone: '+971 54 321 0987', details: 'Снята роль "Модератор"', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) },
  { id: '6', adminName: 'Дмитрий Козлов', adminPhone: '+996 555 214 242', action: 'update_setting', details: 'Изменена комиссия на пополнение: 1.5% → 1.2%', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) },
  { id: '7', adminName: 'Александр Петров', adminPhone: '+971 58 533 3939', action: 'unblock_client', targetName: 'Елена Волкова', targetPhone: '+971 56 789 0123', details: 'Клиент разблокирован после проверки', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) },
];

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
  const { t } = useTranslation();
  const { admins, isLoading: adminsLoading, searchUser, addAdmin, removeAdmin } = useAdminManagement();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<{
    user_id: string;
    phone: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("admin");
  const [isSearching, setIsSearching] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"admins" | "history">("admins");

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
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate("/settings/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">{t("admin.tabs.admins")}</h1>
              <p className="text-xs text-muted-foreground">{admins?.length || 0} {t("admin.roles.usersWithRoles")}</p>
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
                <GlassCard
                  title={t("admin.roles.addRole")}
                  description={t("admin.roles.searchByPhoneOrId")}
                  icon={UserPlus}
                  iconColor="text-blue-500"
                >
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder={t("admin.roles.searchPlaceholder")}
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
                </GlassCard>

                {/* Current Roles Card */}
                <GlassCard
                  title={t("admin.roles.currentRoles")}
                  description={`${admins?.length || 0} ${t("admin.roles.usersWithRoles")}`}
                  icon={Shield}
                  iconColor="text-blue-500"
                >
                  {adminsLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                    </div>
                  ) : admins && admins.length > 0 ? (
                    <div className="space-y-2">
                      {admins.map((admin, index) => (
                        <motion.div
                          key={admin.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50 border border-border/50 group hover:border-border transition-colors"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {admin.first_name || admin.last_name
                                ? `${admin.first_name || ""} ${admin.last_name || ""}`.trim()
                                : t("admin.roles.noName")}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {admin.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {admin.phone}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                {admin.user_id.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                          <Badge variant={getRoleBadgeVariant(admin.role)} className="shrink-0">
                            {getRoleLabel(admin.role)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeAdmin.mutate(admin.id)}
                            disabled={removeAdmin.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      ))}
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
                  description={`${MOCK_ADMIN_HISTORY.length} ${t("admin.history.actions")}`}
                  icon={History}
                  iconColor="text-violet-500"
                >
                  <div className="space-y-3">
                    {MOCK_ADMIN_HISTORY.map((action, index) => {
                      const ActionIcon = getActionIcon(action.action);
                      const colorClasses = getActionColor(action.action);
                      const [iconColor, bgColor] = colorClasses.split(' ');
                      return (
                        <motion.div
                          key={action.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", bgColor)}>
                                <ActionIcon className={cn("w-4 h-4", iconColor)} />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm font-medium">{action.adminName}</p>
                                  <Badge className="text-[9px] px-1.5 py-0 h-4 bg-primary hover:bg-primary text-primary-foreground">Admin</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{action.adminPhone}</p>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">{formatRelativeTime(action.timestamp)}</span>
                          </div>
                          <p className="text-sm text-foreground/80 pl-10">{action.details}</p>
                          {action.targetName && (
                            <div className="flex items-center gap-2 pl-10">
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background/50 text-xs">
                                <Users className="w-3 h-3 text-muted-foreground" />
                                <span className="font-medium">{action.targetName}</span>
                                {action.targetPhone && <span className="text-muted-foreground">{action.targetPhone}</span>}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
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
