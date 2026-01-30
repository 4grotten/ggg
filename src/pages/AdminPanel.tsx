import { ArrowLeft, DollarSign, Percent, TrendingUp, Shield, RefreshCw, Users, Search, UserPlus, Trash2, Phone, Hash, Sparkles, Activity, Wallet, CreditCard, Zap, UsersRound, Calendar, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminManagement } from "@/hooks/useAdminManagement";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { useState, useEffect } from "react";
import { AdminSetting, AppRole } from "@/types/admin";
import { cn } from "@/lib/utils";

// Settings field configuration
const exchangeRateFields = [
  { key: "usdt_to_aed_buy", label: "USDT → AED (покупка)", suffix: "AED", icon: TrendingUp },
  { key: "usdt_to_aed_sell", label: "USDT → AED (продажа)", suffix: "AED", icon: TrendingUp },
  { key: "usd_to_aed_buy", label: "USD → AED (покупка)", suffix: "AED", icon: DollarSign },
  { key: "usd_to_aed_sell", label: "USD → AED (продажа)", suffix: "AED", icon: DollarSign },
  { key: "aed_to_usd_buy", label: "AED → USD (покупка)", suffix: "USD", icon: DollarSign },
  { key: "aed_to_usd_sell", label: "AED → USD (продажа)", suffix: "USD", icon: DollarSign },
];

const feeFields = [
  { key: "top_up_crypto_flat", label: "Крипто пополнение (фикс)", suffix: "USDT" },
  { key: "top_up_bank_percent", label: "Банковское пополнение", suffix: "%" },
  { key: "card_to_card_percent", label: "Перевод карта → карта", suffix: "%" },
  { key: "bank_transfer_percent", label: "Банковский перевод", suffix: "%" },
  { key: "network_fee_percent", label: "Сетевая комиссия", suffix: "%" },
  { key: "currency_conversion_percent", label: "Конвертация валюты", suffix: "%" },
  { key: "virtual_card_annual", label: "Виртуальная карта (год)", suffix: "AED" },
  { key: "virtual_card_replacement", label: "Замена виртуальной карты", suffix: "AED" },
  { key: "metal_card_annual", label: "Металлическая карта (год)", suffix: "AED" },
  { key: "metal_card_replacement", label: "Замена металлической карты", suffix: "AED" },
  { key: "virtual_account_opening", label: "Открытие виртуального счёта", suffix: "AED" },
];

const limitFields = [
  { key: "top_up_crypto_min", label: "Мин. крипто пополнение", suffix: "USDT", group: "min" },
  { key: "top_up_bank_min", label: "Мин. банковское пополнение", suffix: "AED", group: "min" },
  { key: "transfer_min", label: "Мин. перевод", suffix: "AED", group: "min" },
  { key: "withdrawal_min", label: "Мин. вывод", suffix: "AED", group: "min" },
  { key: "top_up_crypto_max", label: "Макс. крипто пополнение", suffix: "USDT", group: "max" },
  { key: "top_up_bank_max", label: "Макс. банковское пополнение", suffix: "AED", group: "max" },
  { key: "transfer_max", label: "Макс. перевод", suffix: "AED", group: "max" },
  { key: "withdrawal_max", label: "Макс. вывод", suffix: "AED", group: "max" },
  { key: "daily_top_up_limit", label: "Дневной лимит пополнения", suffix: "AED", group: "daily" },
  { key: "daily_transfer_limit", label: "Дневной лимит переводов", suffix: "AED", group: "daily" },
  { key: "daily_withdrawal_limit", label: "Дневной лимит вывода", suffix: "AED", group: "daily" },
  { key: "monthly_top_up_limit", label: "Месячный лимит пополнения", suffix: "AED", group: "monthly" },
  { key: "monthly_transfer_limit", label: "Месячный лимит переводов", suffix: "AED", group: "monthly" },
  { key: "monthly_withdrawal_limit", label: "Месячный лимит вывода", suffix: "AED", group: "monthly" },
];

interface SettingsFieldProps {
  setting: AdminSetting;
  label: string;
  suffix: string;
  onUpdate: (key: string, value: number) => void;
  isPending: boolean;
  isMissing?: boolean;
  index: number;
}

function SettingsField({ setting, label, suffix, onUpdate, isPending, isMissing, index }: SettingsFieldProps) {
  const [localValue, setLocalValue] = useState(setting.value.toString());
  const [isDirty, setIsDirty] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setLocalValue(setting.value.toString());
    setIsDirty(false);
  }, [setting.value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    setIsDirty(e.target.value !== setting.value.toString());
  };

  const handleSave = () => {
    const numValue = parseFloat(localValue);
    if (!isNaN(numValue)) {
      onUpdate(setting.key, numValue);
    }
  };

  return (
    <div
      className={cn(
        "group relative p-4 rounded-2xl transition-all duration-300",
        "bg-gradient-to-br from-muted/50 to-muted/30",
        "border border-border/50",
        isFocused && "ring-2 ring-primary/30 border-primary/50",
        isDirty && "border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-amber-500/5"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Label 
            htmlFor={setting.key} 
            className="text-sm font-medium text-foreground/80 flex items-center gap-2"
          >
            {label}
            {isMissing && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-500 border-amber-500/30">
                новое
              </Badge>
            )}
          </Label>
          
          <div className="flex items-center gap-2 mt-2">
            <div className="relative flex-1">
              <Input
                id={setting.key}
                type="number"
                step="0.01"
                value={localValue}
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={cn(
                  "pr-14 h-11 bg-background/50 border-border/50 rounded-xl",
                  "focus:bg-background transition-colors",
                  "text-base font-medium"
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                {suffix}
              </span>
            </div>
            
            <AnimatePresence>
              {isDirty && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, width: 0 }}
                  animate={{ opacity: 1, scale: 1, width: 'auto' }}
                  exit={{ opacity: 0, scale: 0.8, width: 0 }}
                >
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isPending}
                    className="h-11 px-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  >
                    {isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

interface GlassCardProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  icon: React.ElementType;
  iconColor?: string;
  className?: string;
}

function GlassCard({ children, title, description, icon: Icon, iconColor = "text-primary", className }: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl",
        "bg-gradient-to-br from-card/80 to-card/60",
        "backdrop-blur-xl border border-border/50",
        "shadow-xl shadow-black/5",
        className
      )}
    >
      {/* Decorative gradient orb */}
      <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 blur-3xl" />
      
      <div className="relative p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center",
            "bg-gradient-to-br from-primary/20 to-primary/10"
          )}>
            <Icon className={cn("w-6 h-6", iconColor)} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { settings, isLoading, updateSetting, getSettingsByCategory } = useAdminSettings();
  const { admins, isLoading: adminsLoading, clients, clientsLoading, searchUser, searchClients, addAdmin, removeAdmin } = useAdminManagement();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<{
    user_id: string;
    phone: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("admin");
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("rates");
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [filteredClients, setFilteredClients] = useState<typeof clients>(undefined);
  const [isClientSearching, setIsClientSearching] = useState(false);

  const handleUpdate = (category: string) => (key: string, value: number) => {
    updateSetting.mutate({ category, key, value });
  };

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
      {
        onSuccess: () => {
          setSearchQuery("");
          setSearchResult(null);
        },
      }
    );
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case "admin": return "destructive";
      case "moderator": return "secondary";
      default: return "outline";
    }
  };

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case "admin": return "Администратор";
      case "moderator": return "Модератор";
      default: return "Пользователь";
    }
  };

  // Access denied screen
  if (!roleLoading && !isAdmin) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center mb-6"
          >
            <Shield className="w-12 h-12 text-destructive" />
          </motion.div>
          <h1 className="text-xl font-semibold text-center mb-2">Доступ запрещён</h1>
          <p className="text-muted-foreground text-center mb-6">
            У вас нет прав для доступа к административной панели
          </p>
          <Button onClick={() => navigate("/settings")} className="rounded-xl">
            Вернуться в настройки
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const renderSettingsGroup = (
    category: string,
    fields: { key: string; label: string; suffix: string }[]
  ) => {
    const categorySettings = getSettingsByCategory(category);
    
    if (categorySettings.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin mb-2 opacity-50" />
          <p className="text-sm">Загрузка настроек...</p>
        </div>
      );
    }
    
    return fields.map((field, index) => {
      const setting = categorySettings.find((s) => s.key === field.key);
      const settingToUse: AdminSetting = setting || {
        id: `temp-${field.key}`,
        category: category as 'exchange_rates' | 'fees' | 'limits',
        key: field.key,
        value: 0,
        description: null,
        updated_at: new Date().toISOString(),
        updated_by: null,
      };

      return (
        <SettingsField
          key={field.key}
          setting={settingToUse}
          label={field.label}
          suffix={field.suffix}
          onUpdate={handleUpdate(category)}
          isPending={updateSetting.isPending}
          isMissing={!setting}
          index={index}
        />
      );
    });
  };

  const handleClientSearch = async () => {
    if (!clientSearchQuery.trim()) {
      setFilteredClients(undefined);
      return;
    }
    setIsClientSearching(true);
    try {
      const results = await searchClients(clientSearchQuery.trim());
      setFilteredClients(results);
    } finally {
      setIsClientSearching(false);
    }
  };

  const displayedClients = filteredClients !== undefined ? filteredClients : clients;

  const tabConfig = [
    { value: "rates", label: "Курсы", icon: TrendingUp },
    { value: "fees", label: "Комиссии", icon: Percent },
    { value: "limits", label: "Лимиты", icon: Wallet },
    { value: "clients", label: "Клиенты", icon: UsersRound },
    { value: "admins", label: "Админы", icon: Users },
  ];

  return (
    <MobileLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-background"
      >
        {/* Premium Header */}
        <div className="sticky top-0 z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background/80 backdrop-blur-xl" />
          <div className="relative px-4 py-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/settings")}
                className="shrink-0 rounded-xl bg-muted/50 hover:bg-muted"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Админ-панель
                  </h1>
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  Управление системой
                </p>
              </div>
              
              <div className="flex items-center gap-1">
                <ThemeSwitcher />
                <LanguageSwitcher />
              </div>
            </div>

            {/* Stats Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide"
            >
              {[
                { label: "Курсов", value: exchangeRateFields.length, icon: Activity, color: "text-emerald-500" },
                { label: "Комиссий", value: feeFields.length, icon: CreditCard, color: "text-violet-500" },
                { label: "Лимитов", value: limitFields.length, icon: Wallet, color: "text-orange-500" },
                { label: "Клиентов", value: clients?.length || 0, icon: UsersRound, color: "text-cyan-500" },
                { label: "Админов", value: admins?.length || 0, icon: Shield, color: "text-blue-500" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 shrink-0"
                >
                  <stat.icon className={cn("w-4 h-4", stat.color)} />
                  <span className="text-xs font-medium">{stat.value}</span>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-24">
          {isLoading || roleLoading ? (
            <div className="space-y-4 mt-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-3xl" />
              ))}
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Custom Tab Switcher with sliding indicator */}
              <div className="relative h-14 p-1.5 bg-muted/50 rounded-2xl mb-6">
                {/* Animated sliding background */}
                <motion.div
                  className="absolute top-1.5 bottom-1.5 rounded-xl bg-background shadow-lg"
                  initial={false}
                  animate={{
                    left: `calc(${tabConfig.findIndex(t => t.value === activeTab) * 20}% + 6px)`,
                    width: 'calc(20% - 6px)',
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
                
                {/* Tab buttons */}
                <div className="relative grid grid-cols-5 h-full">
                  {tabConfig.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => setActiveTab(tab.value)}
                      className={cn(
                        "relative z-10 flex flex-col items-center justify-center gap-0.5 h-full rounded-xl transition-colors",
                        activeTab === tab.value ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      <tab.icon className={cn(
                        "w-4 h-4 transition-colors",
                        activeTab === tab.value ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className="text-[10px] font-medium">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content without layout animations */}

              {/* Exchange Rates Tab */}
              <TabsContent value="rates" className="mt-0">
                <GlassCard
                  title="Курсы валют"
                  description="Курсы покупки и продажи"
                  icon={TrendingUp}
                  iconColor="text-emerald-500"
                >
                  {renderSettingsGroup("exchange_rates", exchangeRateFields)}
                </GlassCard>
              </TabsContent>

              {/* Fees Tab */}
              <TabsContent value="fees" className="mt-0">
                <GlassCard
                  title="Комиссии"
                  description="Все типы комиссий"
                  icon={Percent}
                  iconColor="text-violet-500"
                >
                  {renderSettingsGroup("fees", feeFields)}
                </GlassCard>
              </TabsContent>

              {/* Limits Tab */}
              <TabsContent value="limits" className="mt-0 space-y-4">
                <GlassCard title="Минимальные суммы" icon={Wallet} iconColor="text-orange-500">
                  {renderSettingsGroup("limits", limitFields.filter((f) => f.group === "min"))}
                </GlassCard>
                
                <GlassCard title="Максимальные суммы" icon={Wallet} iconColor="text-orange-500">
                  {renderSettingsGroup("limits", limitFields.filter((f) => f.group === "max"))}
                </GlassCard>
                
                <GlassCard title="Дневные лимиты" icon={Activity} iconColor="text-amber-500">
                  {renderSettingsGroup("limits", limitFields.filter((f) => f.group === "daily"))}
                </GlassCard>
                
                <GlassCard title="Месячные лимиты" icon={Activity} iconColor="text-amber-500">
                  {renderSettingsGroup("limits", limitFields.filter((f) => f.group === "monthly"))}
                </GlassCard>
              </TabsContent>

              {/* Clients Tab */}
              <TabsContent value="clients" className="mt-0 space-y-4">
                <GlassCard
                  title="Клиенты"
                  description={`${displayedClients?.length || 0} пользователей`}
                  icon={UsersRound}
                  iconColor="text-cyan-500"
                >
                  {/* Search */}
                  <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Поиск по имени или телефону..."
                        value={clientSearchQuery}
                        onChange={(e) => {
                          setClientSearchQuery(e.target.value);
                          if (!e.target.value.trim()) setFilteredClients(undefined);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleClientSearch()}
                        className="pl-10 h-11 rounded-xl bg-background/50"
                      />
                    </div>
                    <Button
                      size="icon"
                      onClick={handleClientSearch}
                      disabled={isClientSearching}
                      className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600"
                    >
                      {isClientSearching ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Mock User Card */}
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 text-primary-foreground font-bold text-lg">
                      А
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">Александр Иванов</p>
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-emerald-500">
                          VIP
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          +971 50 123 4567
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          15.01.2025
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-emerald-500">12,450 AED</p>
                      <p className="text-[10px] text-muted-foreground">Баланс</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 rounded-xl text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Clients List */}
                  {clientsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                      ))}
                    </div>
                  ) : displayedClients && displayedClients.length > 0 ? (
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                      {displayedClients.map((client) => (
                        <div
                          key={client.id}
                          className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50 border border-border/50 hover:border-border transition-colors"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 flex items-center justify-center shrink-0">
                            <UsersRound className="w-5 h-5 text-cyan-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {client.first_name || client.last_name
                                ? `${client.first_name || ""} ${client.last_name || ""}`.trim()
                                : "Без имени"}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {client.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {client.phone}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(client.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8 text-muted-foreground">
                      <UsersRound className="w-12 h-12 mb-2 opacity-30" />
                      <p className="text-sm">
                        {clientSearchQuery ? "Клиенты не найдены" : "Нет зарегистрированных клиентов"}
                      </p>
                    </div>
                  )}
                </GlassCard>
              </TabsContent>

              {/* Admins Tab */}
              <TabsContent value="admins" className="mt-0 space-y-4">
                {/* Add Admin Card */}
                <GlassCard
                  title="Добавить роль"
                  description="Поиск по телефону или ID"
                  icon={UserPlus}
                  iconColor="text-blue-500"
                >
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="+971... или UUID"
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
                      {isSearching ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <AnimatePresence>
                    {searchResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                              <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {searchResult.first_name || searchResult.last_name
                                  ? `${searchResult.first_name || ""} ${searchResult.last_name || ""}`.trim()
                                  : "Без имени"}
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
                                <SelectItem value="admin">Администратор</SelectItem>
                                <SelectItem value="moderator">Модератор</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              onClick={handleAddAdmin}
                              disabled={addAdmin.isPending}
                              className="h-11 px-6 rounded-xl bg-gradient-to-r from-primary to-primary/80"
                            >
                              {addAdmin.isPending ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                "Добавить"
                              )}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {searchQuery && !searchResult && !isSearching && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-muted-foreground text-center py-2"
                    >
                      Пользователь не найден
                    </motion.p>
                  )}
                </GlassCard>

                {/* Current Admins List */}
                <GlassCard
                  title="Текущие роли"
                  description={`${admins?.length || 0} пользователей с ролями`}
                  icon={Shield}
                  iconColor="text-blue-500"
                >
                  {adminsLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                      ))}
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
                                : "Без имени"}
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
                          <Badge 
                            variant={getRoleBadgeVariant(admin.role)}
                            className="shrink-0"
                          >
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
                      <p className="text-sm">Нет пользователей с ролями</p>
                    </div>
                  )}
                </GlassCard>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </motion.div>
    </MobileLayout>
  );
}
