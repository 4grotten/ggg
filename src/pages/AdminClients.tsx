import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, RefreshCw, UsersRound, Phone, Hash, CreditCard, Wallet, Zap, Users, Shield, CheckCircle, Sparkles, Filter, X } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAdminManagement, BackendClient } from "@/hooks/useAdminManagement";

type RoleFilter = "all" | "admin" | "moderator" | "user";
type VerificationFilter = "all" | "verified" | "unverified";
type AssetsFilter = "all" | "has_cards" | "has_accounts" | "has_crypto";

export default function AdminClients() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { clients, clientsLoading, clientsError, searchClients, refetchClients } = useAdminManagement();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>("all");
  const [assetsFilter, setAssetsFilter] = useState<AssetsFilter>("all");
  const [showFilters, setShowFilters] = useState(false);


  // Filtered + searched clients
  const displayedClients = useMemo(() => {
    if (!clients) return [];
    let result = [...clients];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.replace(/\s+/g, "").toLowerCase();
      result = result.filter((c) => {
        const phone = (c.phone || "").replace(/\s+/g, "").replace(/^\+/, "").toLowerCase();
        const name = (c.full_name || "").toLowerCase();
        const uid = (c.user_id || "").toLowerCase();
        return phone.includes(q) || name.includes(q) || uid.includes(q);
      });
    }

    // Role filter
    if (roleFilter !== "all") {
      result = result.filter((c) => (c.role || "user") === roleFilter);
    }

    // Verification
    if (verificationFilter === "verified") {
      result = result.filter((c) => c.is_verified);
    } else if (verificationFilter === "unverified") {
      result = result.filter((c) => !c.is_verified);
    }

    // Assets
    if (assetsFilter === "has_cards") {
      result = result.filter((c) => (c.cards_count || 0) > 0);
    } else if (assetsFilter === "has_accounts") {
      result = result.filter((c) => (c.accounts_count || 0) > 0);
    } else if (assetsFilter === "has_crypto") {
      result = result.filter((c) => (c.crypto_wallets_count || 0) > 0);
    }

    return result;
  }, [clients, searchQuery, roleFilter, verificationFilter, assetsFilter]);

  const activeFiltersCount = [
    roleFilter !== "all",
    verificationFilter !== "all",
    assetsFilter !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setRoleFilter("all");
    setVerificationFilter("all");
    setAssetsFilter("all");
  };

  const handleOpenClientDetails = (client: BackendClient) => {
    navigate(`/settings/admin/clients/details/${client.user_id}`);
  };

  const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted/60 text-muted-foreground hover:bg-muted"
      )}
    >
      {label}
    </button>
  );

  return (
    <MobileLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-50">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
          <div className="relative px-4 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/settings/admin")} className="shrink-0 rounded-xl bg-muted/50 hover:bg-muted">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold">{t("admin.clients.title", "Клиенты")}</h1>
                <p className="text-xs text-muted-foreground">{displayedClients.length} {t("admin.roles.usersWithRoles", "пользователей")}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => refetchClients()} className="rounded-xl bg-muted/50 hover:bg-muted">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="px-4 pb-6 space-y-4">
          {/* Search + Filter toggle */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени, телефону, ID…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-card border-border/50"
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={cn("h-11 w-11 rounded-xl relative", showFilters && "bg-primary text-primary-foreground")}
            >
              <Filter className="w-4 h-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>

          {/* Filters panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Фильтры</span>
                    {activeFiltersCount > 0 && (
                      <button onClick={clearFilters} className="text-xs text-primary flex items-center gap-1">
                        <X className="w-3 h-3" /> Сбросить
                      </button>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">Роль</p>
                    <div className="flex gap-1.5 flex-wrap">
                      <FilterChip label="Все" active={roleFilter === "all"} onClick={() => setRoleFilter("all")} />
                      <FilterChip label="Админ" active={roleFilter === "admin"} onClick={() => setRoleFilter("admin")} />
                      <FilterChip label="Модератор" active={roleFilter === "moderator"} onClick={() => setRoleFilter("moderator")} />
                      <FilterChip label="Пользователь" active={roleFilter === "user"} onClick={() => setRoleFilter("user")} />
                    </div>
                  </div>

                  {/* Verification */}
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">Верификация</p>
                    <div className="flex gap-1.5 flex-wrap">
                      <FilterChip label="Все" active={verificationFilter === "all"} onClick={() => setVerificationFilter("all")} />
                      <FilterChip label="✅ Верифицирован" active={verificationFilter === "verified"} onClick={() => setVerificationFilter("verified")} />
                      <FilterChip label="⏳ Не верифицирован" active={verificationFilter === "unverified"} onClick={() => setVerificationFilter("unverified")} />
                    </div>
                  </div>

                  {/* Assets */}
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">Активы</p>
                    <div className="flex gap-1.5 flex-wrap">
                      <FilterChip label="Все" active={assetsFilter === "all"} onClick={() => setAssetsFilter("all")} />
                      <FilterChip label="💳 Есть карты" active={assetsFilter === "has_cards"} onClick={() => setAssetsFilter("has_cards")} />
                      <FilterChip label="🏦 Есть счета" active={assetsFilter === "has_accounts"} onClick={() => setAssetsFilter("has_accounts")} />
                      <FilterChip label="₿ Есть крипто" active={assetsFilter === "has_crypto"} onClick={() => setAssetsFilter("has_crypto")} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Client list */}
          {clientsError ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <X className="w-8 h-8 text-destructive" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold text-sm">Ошибка загрузки</p>
                <p className="text-xs text-muted-foreground max-w-[250px]">Сервер недоступен. Попробуйте позже.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchClients()} className="rounded-xl gap-2">
                <RefreshCw className="w-4 h-4" />
                Повторить
              </Button>
            </div>
          ) : clientsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-2xl" />
              ))}
            </div>
          ) : displayedClients.length > 0 ? (
            <div className="space-y-3">
              {displayedClients.map((client, index) => (
                <motion.div
                  key={client.user_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => handleOpenClientDetails(client)}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-muted/20 border border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer active:scale-[0.98] group"
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/60 via-primary/30 to-transparent" />

                  <div className="p-4">
                    {/* Top row: avatar + name + ID */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-primary/20 bg-muted">
                          {client.avatar_url ? (
                            <img src={client.avatar_url} alt={client.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                              <UsersRound className="w-5 h-5 text-primary" />
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-card" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{(client.full_name && client.full_name !== "None None" && client.full_name.trim()) ? client.full_name : "Без имени"}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {client.user_id.length > 8 ? `${client.user_id.slice(0, 8)}…` : client.user_id}
                          </span>
                          {client.limits?.custom_settings_enabled && (
                            <Badge className="bg-cyan-500/10 text-cyan-500 border-0 text-[9px] px-1.5 py-0 h-4">Custom</Badge>
                          )}
                          {(client.role || "user") === "admin" && (
                            <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4 border-0">Admin</Badge>
                          )}
                          {(client.role || "user") === "moderator" && (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 border-0">Mod</Badge>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Phone */}
                    {client.phone && (
                      <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-2.5 py-1.5 mb-3 w-fit">
                        <Phone className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-medium">{client.phone}</span>
                      </div>
                    )}

                    {/* Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                      {client.is_verified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">
                          <CheckCircle className="w-3 h-3" /> Верифицирован
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-medium">
                          <Shield className="w-3 h-3" /> Не верифицирован
                        </span>
                      )}
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                        (client.role || "user") === "admin" ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                        (client.role || "user") === "moderator" ? "bg-violet-500/10 text-violet-600 dark:text-violet-400" :
                        "bg-muted text-muted-foreground"
                      )}>
                        <Users className="w-3 h-3" />
                        {(client.role || "user") === "admin" ? "Админ" : (client.role || "user") === "moderator" ? "Модератор" : "Пользователь"}
                      </span>
                      {client.referral_level && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-medium">
                          <Sparkles className="w-3 h-3" /> {client.referral_level}
                        </span>
                      )}
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="bg-muted/30 rounded-xl px-2.5 py-2 text-center">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <CreditCard className="w-3 h-3 text-blue-500" />
                          <span className="text-[10px] text-muted-foreground">Карты</span>
                        </div>
                        <p className="text-sm font-bold">{client.cards_count || 0}</p>
                      </div>
                      <div className="bg-muted/30 rounded-xl px-2.5 py-2 text-center">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <Wallet className="w-3 h-3 text-emerald-500" />
                          <span className="text-[10px] text-muted-foreground">Счета</span>
                        </div>
                        <p className="text-sm font-bold">{client.accounts_count || 0}</p>
                      </div>
                      <div className="bg-muted/30 rounded-xl px-2.5 py-2 text-center">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span className="text-[10px] text-muted-foreground">Крипто</span>
                        </div>
                        <p className="text-sm font-bold">{client.crypto_wallets_count || 0}</p>
                      </div>
                    </div>

                    {/* Balances */}
                    <div className="flex items-center gap-3 pt-2 border-t border-border/30">
                      <div className="flex-1">
                        <p className="text-[10px] text-muted-foreground">Карты + Счёт</p>
                        <p className="text-sm font-bold text-foreground">
                          {((client.total_cards_balance || 0) + (client.total_bank_balance || 0)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-muted-foreground font-normal">AED</span>
                        </p>
                      </div>
                      <div className="w-px h-6 bg-border/50" />
                      <div className="flex-1">
                        <p className="text-[10px] text-muted-foreground">Крипто</p>
                        <p className="text-sm font-bold text-foreground">
                          {(client.total_crypto_balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-muted-foreground font-normal">USDT</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 text-muted-foreground">
              <UsersRound className="w-14 h-14 mb-3 opacity-20" />
              <p className="text-sm font-medium">{searchQuery || activeFiltersCount > 0 ? "Ничего не найдено" : "Нет клиентов"}</p>
              {activeFiltersCount > 0 && (
                <Button variant="link" onClick={clearFilters} className="mt-1 text-xs">Сбросить фильтры</Button>
              )}
            </div>
          )}
        </div>
      </motion.div>

    </MobileLayout>
  );
}
