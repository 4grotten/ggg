import { ArrowLeft, DollarSign, Percent, TrendingUp, Shield, RefreshCw, Users, Search, UserPlus, Trash2, Phone, Hash, Sparkles, Activity, Wallet, CreditCard, Zap, UsersRound, Calendar, Eye, CheckCircle, History, Settings, Key, Copy, Check, ChevronDown, Bot } from "lucide-react";
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
import { useState, useEffect, useCallback } from "react";
import { AdminSetting, AppRole } from "@/types/admin";
import { cn } from "@/lib/utils";
import { ClientDetailsDrawer } from "@/components/admin/ClientDetailsDrawer";
import { useOpenAISettings } from "@/hooks/useOpenAISettings";

// Settings field configuration with i18n keys
const exchangeRateFields = [
  { key: "usdt_to_aed_buy", labelKey: "usdtToAedBuy", suffix: "AED", icon: TrendingUp },
  { key: "usdt_to_aed_sell", labelKey: "usdtToAedSell", suffix: "AED", icon: TrendingUp },
  { key: "usd_to_aed_buy", labelKey: "usdToAedBuy", suffix: "AED", icon: DollarSign },
  { key: "usd_to_aed_sell", labelKey: "usdToAedSell", suffix: "AED", icon: DollarSign },
  { key: "aed_to_usd_buy", labelKey: "aedToUsdBuy", suffix: "USD", icon: DollarSign },
  { key: "aed_to_usd_sell", labelKey: "aedToUsdSell", suffix: "USD", icon: DollarSign },
];

const feeFields = [
  { key: "top_up_crypto_flat", labelKey: "topUpCryptoFlat", suffix: "USDT" },
  { key: "top_up_bank_percent", labelKey: "topUpBankPercent", suffix: "%" },
  { key: "card_to_card_percent", labelKey: "cardToCardPercent", suffix: "%" },
  { key: "bank_transfer_percent", labelKey: "bankTransferPercent", suffix: "%" },
  { key: "network_fee_percent", labelKey: "networkFeePercent", suffix: "%" },
  { key: "currency_conversion_percent", labelKey: "currencyConversionPercent", suffix: "%" },
  { key: "virtual_card_annual", labelKey: "virtualCardAnnual", suffix: "AED" },
  { key: "virtual_card_replacement", labelKey: "virtualCardReplacement", suffix: "AED" },
  { key: "metal_card_annual", labelKey: "metalCardAnnual", suffix: "AED" },
  { key: "metal_card_replacement", labelKey: "metalCardReplacement", suffix: "AED" },
  { key: "virtual_account_opening", labelKey: "virtualAccountOpening", suffix: "AED" },
];

const limitFields = [
  { key: "top_up_crypto_min", labelKey: "topUpCryptoMin", suffix: "USDT", group: "min" },
  { key: "top_up_bank_min", labelKey: "topUpBankMin", suffix: "AED", group: "min" },
  { key: "transfer_min", labelKey: "transferMin", suffix: "AED", group: "min" },
  { key: "withdrawal_min", labelKey: "withdrawalMin", suffix: "AED", group: "min" },
  { key: "top_up_crypto_max", labelKey: "topUpCryptoMax", suffix: "USDT", group: "max" },
  { key: "top_up_bank_max", labelKey: "topUpBankMax", suffix: "AED", group: "max" },
  { key: "transfer_max", labelKey: "transferMax", suffix: "AED", group: "max" },
  { key: "withdrawal_max", labelKey: "withdrawalMax", suffix: "AED", group: "max" },
  { key: "daily_top_up_limit", labelKey: "dailyTopUp", suffix: "AED", group: "daily" },
  { key: "daily_transfer_limit", labelKey: "dailyTransfer", suffix: "AED", group: "daily" },
  { key: "daily_withdrawal_limit", labelKey: "dailyWithdrawal", suffix: "AED", group: "daily" },
  { key: "monthly_top_up_limit", labelKey: "monthlyTopUp", suffix: "AED", group: "monthly" },
  { key: "monthly_transfer_limit", labelKey: "monthlyTransfer", suffix: "AED", group: "monthly" },
  { key: "monthly_withdrawal_limit", labelKey: "monthlyWithdrawal", suffix: "AED", group: "monthly" },
];

// Mock admin action history
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
  {
    id: '1',
    adminName: 'Александр Петров',
    adminPhone: '+971 58 533 3939',
    action: 'add_role',
    targetName: 'Мария Иванова',
    targetPhone: '+971 50 123 4567',
    details: 'Назначена роль "Модератор"',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 минут назад
  },
  {
    id: '2',
    adminName: 'Дмитрий Козлов',
    adminPhone: '+996 555 214 242',
    action: 'update_setting',
    details: 'Изменён курс USDT → AED: 3.67 → 3.68',
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 минут назад
  },
  {
    id: '3',
    adminName: 'Александр Петров',
    adminPhone: '+971 58 533 3939',
    action: 'block_client',
    targetName: 'Иван Сидоров',
    targetPhone: '+971 55 987 6543',
    details: 'Клиент заблокирован: подозрительная активность',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 часа назад
  },
  {
    id: '4',
    adminName: 'Дмитрий Козлов',
    adminPhone: '+996 555 214 242',
    action: 'update_client',
    targetName: 'Анна Смирнова',
    targetPhone: '+971 52 456 7890',
    details: 'Повышен реферальный уровень: R1 → R2',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 часов назад
  },
  {
    id: '5',
    adminName: 'Александр Петров',
    adminPhone: '+971 58 533 3939',
    action: 'remove_role',
    targetName: 'Олег Николаев',
    targetPhone: '+971 54 321 0987',
    details: 'Снята роль "Модератор"',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 день назад
  },
  {
    id: '6',
    adminName: 'Дмитрий Козлов',
    adminPhone: '+996 555 214 242',
    action: 'update_setting',
    details: 'Изменена комиссия на пополнение: 1.5% → 1.2%',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 дня назад
  },
  {
    id: '7',
    adminName: 'Александр Петров',
    adminPhone: '+971 58 533 3939',
    action: 'unblock_client',
    targetName: 'Елена Волкова',
    targetPhone: '+971 56 789 0123',
    details: 'Клиент разблокирован после проверки',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 дня назад
  },
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
  const { status: openaiStatus, isLoading: openaiLoading, isVerifying, isUpdatingModel, fetchStatus: fetchOpenAIStatus, verifyApiKey, updateModel } = useOpenAISettings();
  
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
  const [activeAdminsSubTab, setActiveAdminsSubTab] = useState<"admins" | "history">("admins");
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [filteredClients, setFilteredClients] = useState<typeof clients>(undefined);
  const [isClientSearching, setIsClientSearching] = useState(false);
  const [clientDrawerOpen, setClientDrawerOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{
    id: string;
    name: string;
    phone: string;
    avatarUrl?: string;
    isVerified: boolean;
    cardsCount: number;
    referralLevel: string | null;
    balance: number;
    registrationDate: string;
    role?: 'admin' | 'moderator' | 'user';
    accountsCount?: number;
    cryptoWalletsCount?: number;
    totalCryptoBalance?: number;
  } | null>(null);
  
  // OpenAI settings state
  const [newApiKey, setNewApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  
  // Fetch OpenAI status when system tab is active
  useEffect(() => {
    if (activeTab === "system" && !openaiStatus && !openaiLoading) {
      fetchOpenAIStatus();
    }
  }, [activeTab, openaiStatus, openaiLoading, fetchOpenAIStatus]);
  
  // Sync selected model with status
  useEffect(() => {
    if (openaiStatus?.currentModel && !selectedModel) {
      setSelectedModel(openaiStatus.currentModel);
    }
  }, [openaiStatus?.currentModel, selectedModel]);
  
  const handleCopyApiKey = useCallback(() => {
    if (openaiStatus?.maskedKey) {
      navigator.clipboard.writeText(openaiStatus.maskedKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  }, [openaiStatus?.maskedKey]);
  
  const handleVerifyAndSaveKey = useCallback(async () => {
    if (!newApiKey.trim()) return;
    const isValid = await verifyApiKey(newApiKey);
    if (isValid) {
      setNewApiKey("");
      // Note: The key needs to be updated via Lovable secrets management
      // This just validates the key
    }
  }, [newApiKey, verifyApiKey]);
  
  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModel(modelId);
    updateModel(modelId);
  }, [updateModel]);

  // Client data type for drawer
  interface ClientCardData {
    id: string;
    name: string;
    phone: string;
    avatarUrl?: string;
    isVerified: boolean;
    cardsCount: number;
    referralLevel: string | null;
    balance: number;
    registrationDate: string;
    role?: 'admin' | 'moderator' | 'user';
    accountsCount?: number;
    cryptoWalletsCount?: number;
    totalCryptoBalance?: number;
  }

  const handleOpenClientDetails = (client: ClientCardData) => {
    setSelectedClient(client);
    setClientDrawerOpen(true);
  };

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
      case "admin": return t("admin.roles.admin");
      case "moderator": return t("admin.roles.moderator");
      default: return t("admin.roles.user");
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
          <h1 className="text-xl font-semibold text-center mb-2">{t("admin.accessDenied")}</h1>
          <p className="text-muted-foreground text-center mb-6">
            {t("admin.accessDeniedDesc")}
          </p>
          <Button onClick={() => navigate("/settings")} className="rounded-xl">
            {t("admin.backToSettings")}
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const renderSettingsGroup = (
    category: string,
    fields: { key: string; labelKey: string; suffix: string }[]
  ) => {
    const categorySettings = getSettingsByCategory(category);
    
    // Map category to translation namespace
    const translationNs = category === 'exchange_rates' ? 'exchangeRates' : category;
    
    if (categorySettings.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin mb-2 opacity-50" />
          <p className="text-sm">{t("admin.common.loading")}</p>
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

      // Get translated label
      const label = t(`admin.${translationNs}.${field.labelKey}`);

      return (
        <SettingsField
          key={field.key}
          setting={settingToUse}
          label={label}
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
    { value: "rates", label: t("admin.tabs.rates"), icon: TrendingUp },
    { value: "fees", label: t("admin.tabs.fees"), icon: Percent },
    { value: "limits", label: t("admin.tabs.limits"), icon: Wallet },
    { value: "clients", label: t("admin.tabs.clients"), icon: UsersRound, link: "/settings/admin/clients" },
    { value: "admins", label: t("admin.tabs.admins"), icon: Users },
    { value: "system", label: t("admin.system.title", "Система"), icon: Settings },
  ];

  return (
    <MobileLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-background"
      >
        {/* Premium Header - Only title is sticky with high z-index */}
        <div className="sticky top-0 z-50">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
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
                    {t("admin.title")}
                  </h1>
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {t("admin.subtitle")}
                </p>
              </div>
              
              <div className="flex items-center gap-1">
                <ThemeSwitcher />
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>

        {/* Content - Stats and Tabs scroll with content, lower z-index */}
        <div className="px-4 pb-24">
          {/* Stats Bar - scrolls with content */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide"
          >
            {[
              { label: t("admin.stats.rates"), value: exchangeRateFields.length, icon: Activity, color: "text-emerald-500" },
              { label: t("admin.stats.fees"), value: feeFields.length, icon: CreditCard, color: "text-violet-500" },
              { label: t("admin.stats.limits"), value: limitFields.length, icon: Wallet, color: "text-orange-500" },
              { label: t("admin.stats.clients"), value: clients?.length || 0, icon: UsersRound, color: "text-cyan-500" },
              { label: t("admin.stats.admins"), value: admins?.length || 0, icon: Shield, color: "text-blue-500" },
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
          {isLoading || roleLoading ? (
            <div className="space-y-4 mt-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-3xl" />
              ))}
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Custom Tab Switcher with sliding indicator and horizontal scroll */}
              <div className="relative mb-6 mt-4">
                {/* Mobile: scrollable, Desktop: full width */}
                <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                  <div className="relative h-16 p-1.5 bg-muted/50 rounded-2xl min-w-max md:min-w-0 md:w-full">
                    {/* Desktop sliding indicator */}
                    <motion.div
                      className="absolute top-1.5 bottom-1.5 rounded-xl bg-background shadow-lg hidden md:block"
                      initial={false}
                      animate={{
                        left: `calc(${tabConfig.findIndex(t => t.value === activeTab)} * (100% / ${tabConfig.length}) + 6px)`,
                        width: `calc(100% / ${tabConfig.length} - 12px)`,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                    {/* Mobile sliding indicator */}
                    <motion.div
                      className="absolute top-1.5 bottom-1.5 rounded-xl bg-background shadow-lg md:hidden"
                      initial={false}
                      animate={{
                        left: `calc(${tabConfig.findIndex(t => t.value === activeTab)} * 128px + 6px)`,
                        width: '122px',
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                    
                    {/* Tab buttons - flex on mobile, grid on desktop */}
                    <div className="relative flex md:grid md:grid-cols-6 h-full">
                      {tabConfig.map((tab) => (
                        <button
                          key={tab.value}
                          onClick={() => 'link' in tab && tab.link ? navigate(tab.link) : setActiveTab(tab.value)}
                          className={cn(
                            "relative z-10 flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-colors px-3",
                            "w-32 shrink-0 md:w-auto",
                            activeTab === tab.value ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          <tab.icon className={cn(
                            "w-5 h-5 transition-colors shrink-0",
                            activeTab === tab.value ? "text-primary" : "text-muted-foreground"
                          )} />
                          <span className="text-[10px] font-medium leading-tight text-center">{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab content without layout animations */}

              <TabsContent value="rates" className="mt-0">
                <GlassCard
                  title={t("admin.exchangeRates.title")}
                  description={t("admin.exchangeRates.description")}
                  icon={TrendingUp}
                  iconColor="text-emerald-500"
                >
                  {renderSettingsGroup("exchange_rates", exchangeRateFields)}
                </GlassCard>
              </TabsContent>

              <TabsContent value="fees" className="mt-0">
                <GlassCard
                  title={t("admin.fees.title")}
                  description={t("admin.fees.description")}
                  icon={Percent}
                  iconColor="text-violet-500"
                >
                  {renderSettingsGroup("fees", feeFields)}
                </GlassCard>
              </TabsContent>

              <TabsContent value="limits" className="mt-0 space-y-4">
                <GlassCard title={t("admin.limits.minLimits")} icon={Wallet} iconColor="text-orange-500">
                  {renderSettingsGroup("limits", limitFields.filter((f) => f.group === "min"))}
                </GlassCard>
                
                <GlassCard title={t("admin.limits.maxLimits")} icon={Wallet} iconColor="text-orange-500">
                  {renderSettingsGroup("limits", limitFields.filter((f) => f.group === "max"))}
                </GlassCard>
                
                <GlassCard title={t("admin.limits.dailyLimits")} icon={Activity} iconColor="text-amber-500">
                  {renderSettingsGroup("limits", limitFields.filter((f) => f.group === "daily"))}
                </GlassCard>
                
                <GlassCard title={t("admin.limits.monthlyLimits")} icon={Activity} iconColor="text-amber-500">
                  {renderSettingsGroup("limits", limitFields.filter((f) => f.group === "monthly"))}
                </GlassCard>
              </TabsContent>

              <TabsContent value="clients" className="mt-0">
                {/* Redirects to /settings/admin/clients */}
              </TabsContent>

              {/* Admins Tab */}
              <TabsContent value="admins" className="mt-0 space-y-4">
                {/* Sub-tabs for Admins section */}
                <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
                  <button
                    onClick={() => setActiveAdminsSubTab("admins")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                      activeAdminsSubTab === "admins"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Users className="w-4 h-4" />
                    {t("admin.subtabs.admins")}
                  </button>
                  <button
                    onClick={() => setActiveAdminsSubTab("history")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                      activeAdminsSubTab === "history"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <History className="w-4 h-4" />
                    {t("admin.subtabs.history")}
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {activeAdminsSubTab === "admins" ? (
                    <motion.div
                      key="admins-subtab"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
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
                                    {addAdmin.isPending ? (
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                      t("admin.roles.add")
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
                            {t("admin.roles.userNotFound")}
                          </motion.p>
                        )}
                      </GlassCard>

                      <GlassCard
                        title={t("admin.roles.currentRoles")}
                        description={`${admins?.length || 0} ${t("admin.roles.usersWithRoles")}`}
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
                                {/* Header: Admin info + time */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "w-8 h-8 rounded-lg flex items-center justify-center",
                                      bgColor
                                    )}>
                                      <ActionIcon className={cn("w-4 h-4", iconColor)} />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-medium">{action.adminName}</p>
                                        <Badge className="text-[9px] px-1.5 py-0 h-4 bg-blue-500 hover:bg-blue-500 text-white">
                                          Admin
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground">{action.adminPhone}</p>
                                    </div>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {formatRelativeTime(action.timestamp)}
                                  </span>
                                </div>
                                
                                {/* Action details */}
                                <p className="text-sm text-foreground/80 pl-10">
                                  {action.details}
                                </p>
                                
                                {/* Target user if exists */}
                                {action.targetName && (
                                  <div className="flex items-center gap-2 pl-10">
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background/50 text-xs">
                                      <Users className="w-3 h-3 text-muted-foreground" />
                                      <span className="font-medium">{action.targetName}</span>
                                      {action.targetPhone && (
                                        <span className="text-muted-foreground">{action.targetPhone}</span>
                                      )}
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
              </TabsContent>

              <TabsContent value="system" className="mt-0 space-y-4">
                <GlassCard
                  title={t("admin.system.title")}
                  description={t("admin.system.description")}
                  icon={Settings}
                  iconColor="text-slate-500"
                >
                  <div className="space-y-4">
                    {/* Maintenance Mode */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t("admin.system.maintenance")}</p>
                          <p className="text-xs text-muted-foreground">{t("admin.system.maintenanceDesc")}</p>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                          {t("admin.system.disabled")}
                        </div>
                      </div>
                    </div>

                    {/* Registration */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t("admin.system.registration")}</p>
                          <p className="text-xs text-muted-foreground">{t("admin.system.registrationDesc")}</p>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                          {t("admin.system.enabled")}
                        </div>
                      </div>
                    </div>

                    {/* KYC Requirement */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t("admin.system.kyc")}</p>
                          <p className="text-xs text-muted-foreground">{t("admin.system.kycDesc")}</p>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                          {t("admin.system.enabled")}
                        </div>
                      </div>
                    </div>

                    {/* 2FA Requirement */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t("admin.system.twoFactor")}</p>
                          <p className="text-xs text-muted-foreground">{t("admin.system.twoFactorDesc")}</p>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-medium">
                          {t("admin.system.optional")}
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard
                  title={t("admin.notifications.title")}
                  description={t("admin.notifications.description")}
                  icon={Activity}
                  iconColor="text-blue-500"
                >
                  <div className="space-y-4">
                    {/* Email notifications */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t("admin.notifications.email")}</p>
                          <p className="text-xs text-muted-foreground">{t("admin.notifications.emailDesc")}</p>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                          {t("admin.notifications.enabledMultiple")}
                        </div>
                      </div>
                    </div>

                    {/* Push notifications */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t("admin.notifications.push")}</p>
                          <p className="text-xs text-muted-foreground">{t("admin.notifications.pushDesc")}</p>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                          {t("admin.notifications.enabledMultiple")}
                        </div>
                      </div>
                    </div>

                    {/* SMS notifications */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t("admin.notifications.sms")}</p>
                          <p className="text-xs text-muted-foreground">{t("admin.notifications.smsDesc")}</p>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-slate-500/10 text-slate-500 text-xs font-medium">
                          {t("admin.notifications.disabledMultiple")}
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard
                  title={t("admin.ai.title")}
                  description={t("admin.ai.description")}
                  icon={Bot}
                  iconColor="text-emerald-500"
                >
                  <div className="space-y-4">
                    {/* API Key Status */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-muted-foreground" />
                          <p className="text-sm font-medium">{t("admin.ai.apiKey")}</p>
                        </div>
                        <div className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium",
                          openaiStatus?.hasKey 
                            ? "bg-emerald-500/10 text-emerald-500" 
                            : "bg-red-500/10 text-red-500"
                        )}>
                          {openaiLoading ? "..." : openaiStatus?.hasKey ? t("admin.ai.keyValid") : t("admin.ai.keyInvalid")}
                        </div>
                      </div>
                      
                      {/* Current key display */}
                      {openaiStatus?.hasKey && openaiStatus.maskedKey && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex-1 px-3 py-2 rounded-lg bg-background/50 font-mono text-sm text-muted-foreground">
                            {showApiKey ? openaiStatus.maskedKey : "sk-••••••••••••"}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            <Eye className={cn("w-4 h-4", showApiKey && "text-primary")} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg"
                            onClick={handleCopyApiKey}
                          >
                            {copiedKey ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      )}
                      
                      {/* New API key input */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          {openaiStatus?.hasKey ? t("admin.ai.apiKey") : t("admin.ai.apiKey")}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="password"
                            placeholder={t("admin.ai.apiKeyPlaceholder")}
                            value={newApiKey}
                            onChange={(e) => setNewApiKey(e.target.value)}
                            className="flex-1 h-10 rounded-lg bg-background/50"
                          />
                          <Button
                            onClick={handleVerifyAndSaveKey}
                            disabled={!newApiKey.trim() || isVerifying}
                            className="h-10 px-4 rounded-lg"
                          >
                            {isVerifying ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              t("admin.ai.verify")
                            )}
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {t("admin.ai.apiKeyHint")}
                        </p>
                      </div>
                    </div>
                    
                    {/* Model Selection */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm font-medium">{t("admin.ai.modelSelection")}</p>
                      </div>
                      
                      <Select
                        value={selectedModel}
                        onValueChange={handleModelChange}
                        disabled={isUpdatingModel}
                      >
                        <SelectTrigger className="w-full h-11 rounded-xl bg-background/50">
                          <span className="truncate">
                            {openaiStatus?.availableModels?.find(m => m.id === selectedModel)?.name || t("admin.ai.selectModel")}
                          </span>
                        </SelectTrigger>
                        <SelectContent className="max-h-[400px]">
                          {(openaiStatus?.availableModels || []).map((model) => (
                            <SelectItem 
                              key={model.id} 
                              value={model.id}
                              className="py-3 px-4"
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium">{model.name}</span>
                                <span className="text-xs leading-relaxed text-orange-400">{model.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {isUpdatingModel && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          {t("admin.ai.saving")}
                        </p>
                      )}
                    </div>
                  </div>
                </GlassCard>

                <GlassCard
                  title={t("admin.integrations.title")}
                  description={t("admin.integrations.description")}
                  icon={Zap}
                  iconColor="text-yellow-500"
                >
                  <div className="space-y-4">
                    {/* API Status */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t("admin.integrations.publicApi")}</p>
                          <p className="text-xs text-muted-foreground">{t("admin.integrations.publicApiDesc")}</p>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                          {t("admin.integrations.active")}
                        </div>
                      </div>
                    </div>

                    {/* Webhooks */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t("admin.integrations.webhooks")}</p>
                          <p className="text-xs text-muted-foreground">{t("admin.integrations.webhooksDesc")}</p>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                          {t("admin.integrations.activeMultiple")}
                        </div>
                      </div>
                    </div>

                    {/* Rate limiting */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t("admin.integrations.rateLimiting")}</p>
                          <p className="text-xs text-muted-foreground">{t("admin.integrations.rateLimitingDesc")}</p>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-medium">
                          1000{t("admin.integrations.perMinute")}
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </motion.div>
      {/* Client Details Drawer */}
      <ClientDetailsDrawer
        open={clientDrawerOpen}
        onOpenChange={setClientDrawerOpen}
        client={selectedClient}
      />
    </MobileLayout>
  );
}
