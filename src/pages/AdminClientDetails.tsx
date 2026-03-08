import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Phone, CreditCard, TrendingUp, Percent, Shield, Award, Save, ArrowUpDown, CheckCircle, Crown, Sparkles, RefreshCw, Mail, Globe, User, Wallet, Landmark, Bitcoin, Receipt, ChevronDown, ChevronUp, Calendar, RotateCcw } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { apiRequest, apiPost, apiPatch } from "@/services/api/apiClient";
import { BackendClientDetail } from "@/hooks/useAdminManagement";
import { CardTransactionsList } from "@/components/card/CardTransactionsList";
import { Transaction as AppTransaction, TransactionGroup as AppTransactionGroup } from "@/types/transaction";
import { ApiTransaction, mapApiTransactionToLocal } from "@/services/api/transactions";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";

// Referral levels configuration
const REFERRAL_LEVELS = [
  { id: "R1", name: "R1", icon: "🌱", color: "from-gray-400 to-gray-500", cardPercent: 15, txPercent: 0.05, minFriends: 0, maxFriends: 10, descKey: "r1Desc" },
  { id: "R2", name: "R2", icon: "🌿", color: "from-lime-400 to-lime-500", cardPercent: 20, txPercent: 0.1, minFriends: 10, maxFriends: 30, descKey: "r2Desc" },
  { id: "R3", name: "R3", icon: "💎", color: "from-blue-400 to-blue-500", cardPercent: 25, txPercent: 0.2, minFriends: 30, maxFriends: 50, descKey: "r3Desc" },
  { id: "R4", name: "R4", icon: "👑", color: "from-purple-400 to-purple-500", cardPercent: 30, txPercent: 0.3, minFriends: 50, maxFriends: 100, descKey: "r4Desc" },
  { id: "Partner", name: "Partner", icon: "🚀", color: "from-amber-400 to-amber-500", cardPercent: 35, txPercent: 0.5, minFriends: 100, maxFriends: Infinity, descKey: "partnerDesc" },
];

const SUBSCRIPTION_TYPES = [
  { id: "smart", icon: "🧠", color: "from-cyan-400 to-cyan-500", label: "Smart" },
  { id: "agent", icon: "🕵️", color: "from-teal-400 to-teal-500", label: "Agent" },
  { id: "pro", icon: "⚡", color: "from-blue-400 to-blue-500", label: "Pro" },
  { id: "vip", icon: "👑", color: "from-purple-400 to-purple-500", label: "VIP" },
  { id: "partner", icon: "🚀", color: "from-amber-400 to-amber-500", label: "Partner" },
];

const ROLE_OPTIONS = [
  { id: "root", icon: "🛡️", color: "from-amber-500 to-amber-600", label: "Root" },
  { id: "admin", icon: "⚙️", color: "from-red-400 to-red-500", label: "Admin" },
  { id: "user", icon: "👤", color: "from-blue-400 to-blue-500", label: "User" },
];

/** Format a numeric string as "50,000.00"; on focus return raw number */
const formatLimitValue = (val: string): string => {
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const rawLimitValue = (val: string): string => {
  const cleaned = val.replace(/,/g, "");
  // Strip trailing zeros: "50005.000000" → "50005"
  const num = parseFloat(cleaned);
  if (isNaN(num)) return cleaned;
  return String(num);
};

const isIncomeTx = (type: string): boolean => {
  const t = type.toLowerCase();
  return t.includes("topup") || t.includes("top_up") || t.includes("transfer_in") ||
    t.includes("incoming") || t === "refund" || t === "cashback" || t.includes("deposit");
};

export default function AdminClientDetails() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const settings = useSettings();

  const [showResetAlert, setShowResetAlert] = useState<'fees' | 'rates' | 'limits' | null>(null);

  const doReset = (type: 'fees' | 'rates' | 'limits') => {
    if (type === 'fees') {
      setFees({
        topUpPercent: String(settings.NETWORK_FEE_PERCENT),
        transferPercent: String(settings.CARD_TO_CARD_FEE_PERCENT),
        withdrawPercent: String(settings.BANK_TRANSFER_FEE_PERCENT),
        conversionPercent: String(settings.CURRENCY_CONVERSION_FEE_PERCENT),
      });
    } else if (type === 'rates') {
      setRates({
        usdtAedBuy: String(settings.USDT_TO_AED_BUY),
        usdtAedSell: String(settings.USDT_TO_AED_SELL),
        usdAedBuy: String(settings.USD_TO_AED_BUY),
        usdAedSell: String(settings.USD_TO_AED_SELL),
      });
    } else {
      setLimits({
        dailyTopUp: String(settings.DAILY_TOP_UP_LIMIT),
        monthlyTopUp: String(settings.MONTHLY_TOP_UP_LIMIT),
        dailyTransfer: String(settings.DAILY_TRANSFER_LIMIT),
        monthlyTransfer: String(settings.MONTHLY_TRANSFER_LIMIT),
        dailyWithdraw: String(settings.DAILY_WITHDRAWAL_LIMIT),
        monthlyWithdraw: String(settings.MONTHLY_WITHDRAWAL_LIMIT),
        singleTransaction: String(settings.TRANSFER_MAX_AMOUNT),
        transferMin: String(settings.TRANSFER_MIN_AMOUNT),
        withdrawalMin: String(settings.WITHDRAWAL_MIN_AMOUNT),
        withdrawalMax: String(settings.WITHDRAWAL_MAX_AMOUNT),
        dailyUsdtSend: String(settings.DAILY_CRYPTO_SEND_LIMIT),
        monthlyUsdtSend: String(settings.MONTHLY_CRYPTO_SEND_LIMIT),
        dailyUsdtReceive: String(settings.DAILY_CRYPTO_RECEIVE_LIMIT),
        monthlyUsdtReceive: String(settings.MONTHLY_CRYPTO_RECEIVE_LIMIT),
      });
    }
    toast.success(t("admin.clients.resetSuccess", "Сброшено к общим настройкам"));
  };

  const handleResetClick = (type: 'fees' | 'rates' | 'limits') => {
    setShowResetAlert(type);
  };

  const handleConfirmReset = () => {
    if (showResetAlert) doReset(showResetAlert);
    setShowResetAlert(null);
  };

  // Fetch full client detail from backend
  const { data: client, isLoading } = useQuery({
    queryKey: ["admin-client-detail", userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user ID");
      const res = await apiRequest<BackendClientDetail>(`/admin/users/${userId}/detail/`);
      if (res.error || !res.data) throw new Error(res.error?.detail || "Failed");
      return res.data;
    },
    enabled: !!userId,
  });

  // Fetch all client transactions (paginated) for accurate "last 3" and full preview
  const { data: clientTransactions = [] } = useQuery({
    queryKey: ["admin-client-transactions-preview", userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user ID");

      const pageSize = 100;
      let offset = 0;
      let hasMore = true;
      const all: any[] = [];

      while (hasMore) {
        const params = new URLSearchParams();
        params.set("limit", String(pageSize));
        if (offset > 0) params.set("offset", String(offset));

        const res = await apiRequest<any[] | Record<string, unknown>>(
          `/transactions/admin/user/${userId}/transactions/?${params.toString()}`,
          {},
          true
        );

        if (res.error || !res.data) {
          const msg = res.error?.detail || res.error?.message || "Failed";
          if (msg.includes("Connection refused") || msg.includes("tcp connect error")) return [];
          throw new Error(msg);
        }

        let page: any[] = [];
        if (Array.isArray(res.data)) page = res.data;
        else if (Array.isArray((res.data as any).results)) page = (res.data as any).results;
        else if (Array.isArray((res.data as any).transactions)) page = (res.data as any).transactions;

        all.push(...page);
        hasMore = page.length === pageSize;
        offset += pageSize;
      }

      return all;
    },
    enabled: !!userId,
  });

  const [selectedLevel, setSelectedLevel] = useState("R1");
  const [selectedSubscription, setSelectedSubscription] = useState("smart");
  const [selectedRole, setSelectedRole] = useState("user");
  const [isVIP, setIsVIP] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showBlockAlert, setShowBlockAlert] = useState(false);
  const [pendingBlockValue, setPendingBlockValue] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showVerifyAlert, setShowVerifyAlert] = useState(false);
  const [pendingVerifyValue, setPendingVerifyValue] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showAllTx, setShowAllTx] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [expandedWallet, setExpandedWallet] = useState<string | null>(null);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [showTxHistoryAlert, setShowTxHistoryAlert] = useState(false);
  const [focusedLimitKey, setFocusedLimitKey] = useState<string | null>(null);

  const defaultFees = useMemo(() => ({
    topUpPercent: String(settings.NETWORK_FEE_PERCENT),
    transferPercent: String(settings.CARD_TO_CARD_FEE_PERCENT),
    withdrawPercent: String(settings.BANK_TRANSFER_FEE_PERCENT),
    conversionPercent: String(settings.CURRENCY_CONVERSION_FEE_PERCENT),
  }), [settings]);

  const defaultRates = useMemo(() => ({
    usdtAedBuy: String(settings.USDT_TO_AED_BUY),
    usdtAedSell: String(settings.USDT_TO_AED_SELL),
    usdAedBuy: String(settings.USD_TO_AED_BUY),
    usdAedSell: String(settings.USD_TO_AED_SELL),
  }), [settings]);

  const defaultLimits = useMemo(() => ({
    dailyTopUp: String(settings.DAILY_TOP_UP_LIMIT),
    monthlyTopUp: String(settings.MONTHLY_TOP_UP_LIMIT),
    dailyTransfer: String(settings.DAILY_TRANSFER_LIMIT),
    monthlyTransfer: String(settings.MONTHLY_TRANSFER_LIMIT),
    dailyWithdraw: String(settings.DAILY_WITHDRAWAL_LIMIT),
    monthlyWithdraw: String(settings.MONTHLY_WITHDRAWAL_LIMIT),
    singleTransaction: String(settings.TRANSFER_MAX_AMOUNT),
    transferMin: String(settings.TRANSFER_MIN_AMOUNT),
    withdrawalMin: String(settings.WITHDRAWAL_MIN_AMOUNT),
    withdrawalMax: String(settings.WITHDRAWAL_MAX_AMOUNT),
    dailyUsdtSend: String(settings.DAILY_CRYPTO_SEND_LIMIT),
    monthlyUsdtSend: String(settings.MONTHLY_CRYPTO_SEND_LIMIT),
    dailyUsdtReceive: String(settings.DAILY_CRYPTO_RECEIVE_LIMIT),
    monthlyUsdtReceive: String(settings.MONTHLY_CRYPTO_RECEIVE_LIMIT),
  }), [settings]);

  const [limits, setLimits] = useState(defaultLimits);
  const [fees, setFees] = useState(defaultFees);
  const [rates, setRates] = useState(defaultRates);

  const queryClient = useQueryClient();

  // Initial values for change detection
  const initialValues = useRef({
    selectedLevel: "R1",
    selectedSubscription: "smart",
    selectedRole: "user",
    isVIP: false,
    isBlocked: false,
    limits: defaultLimits,
    fees: defaultFees,
    rates: defaultRates,
  });

  // Initialize state from backend data
  useEffect(() => {
    if (!client) return;
    
    // Set root-level fields
    setIsVIP(client.is_vip ?? false);
    setIsBlocked(client.is_blocked ?? false);
    setIsVerified(client.is_verified ?? client.verification_status === 'verified' ?? false);
    if (client.role) setSelectedRole(client.role);
    if (client.subscription_type) setSelectedSubscription(client.subscription_type === 'default' ? 'smart' : client.subscription_type);
    if (client.referral_level) {
      // Strip "(DEFAULT)" suffix if present
      const level = client.referral_level.replace(/\(DEFAULT\)/i, '').trim();
      const match = REFERRAL_LEVELS.find(l => l.id.toLowerCase() === level.toLowerCase());
      if (match) setSelectedLevel(match.id);
    }

    // Use limits_and_settings if available, fallback to limits
    const l = client.limits_and_settings || client.limits;
    
    // Only use personal values if custom_settings_enabled is true AND the value is not null
    const isCustom = !!(l as any)?.custom_settings_enabled;
    
    // Helper: use personal value only when custom settings are ON and value is a real non-null number
    const customVal = (v: string | null | undefined, fallback: string): string => {
      if (!isCustom || v == null || v === '') return fallback;
      const num = parseFloat(String(v));
      if (isNaN(num)) return fallback;
      return String(num);
    };

    const newFees = {
      topUpPercent: customVal(l?.network_fee_percent, defaultFees.topUpPercent),
      transferPercent: customVal(l?.card_to_card_percent, defaultFees.transferPercent),
      withdrawPercent: customVal(l?.bank_transfer_percent, defaultFees.withdrawPercent),
      conversionPercent: customVal(l?.currency_conversion_percent, defaultFees.conversionPercent),
    };
    const newLimits = {
      dailyTopUp: customVal(l?.daily_top_up_limit, defaultLimits.dailyTopUp),
      monthlyTopUp: customVal(l?.monthly_top_up_limit, defaultLimits.monthlyTopUp),
      dailyTransfer: customVal(l?.daily_transfer_limit, defaultLimits.dailyTransfer),
      monthlyTransfer: customVal(l?.monthly_transfer_limit, defaultLimits.monthlyTransfer),
      dailyWithdraw: customVal(l?.daily_withdrawal_limit, defaultLimits.dailyWithdraw),
      monthlyWithdraw: customVal(l?.monthly_withdrawal_limit, defaultLimits.monthlyWithdraw),
      singleTransaction: customVal(l?.transfer_max, defaultLimits.singleTransaction),
      transferMin: customVal(l?.transfer_min, defaultLimits.transferMin),
      withdrawalMin: customVal(l?.withdrawal_min, defaultLimits.withdrawalMin),
      withdrawalMax: customVal(l?.withdrawal_max, defaultLimits.withdrawalMax),
      dailyUsdtSend: customVal(l?.daily_usdt_send_limit, defaultLimits.dailyUsdtSend),
      monthlyUsdtSend: customVal(l?.monthly_usdt_send_limit, defaultLimits.monthlyUsdtSend),
      dailyUsdtReceive: customVal(l?.daily_usdt_receive_limit, defaultLimits.dailyUsdtReceive),
      monthlyUsdtReceive: customVal(l?.monthly_usdt_receive_limit, defaultLimits.monthlyUsdtReceive),
    };
    const la = l as any;
    const newRates = {
      usdtAedBuy: customVal(la?.usdt_to_aed_buy, defaultRates.usdtAedBuy),
      usdtAedSell: customVal(la?.usdt_to_aed_sell, defaultRates.usdtAedSell),
      usdAedBuy: customVal(la?.usd_to_aed_buy, defaultRates.usdAedBuy),
      usdAedSell: customVal(la?.usd_to_aed_sell, defaultRates.usdAedSell),
    };
    setFees(newFees);
    setLimits(newLimits);
    setRates(newRates);
    initialValues.current = { 
      ...initialValues.current, 
      fees: newFees, 
      limits: newLimits,
      rates: newRates,
      isVIP: client.is_vip ?? false,
      isBlocked: client.is_blocked ?? false,
      selectedRole: client.role || 'user',
      selectedSubscription: client.subscription_type === 'default' ? 'smart' : (client.subscription_type || 'smart'),
      selectedLevel: selectedLevel,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, defaultFees, defaultLimits, defaultRates]);

  // Mutation to save personal limits/fees
  const saveLimitsMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("No user ID");
      const body: Record<string, unknown> = {
        role: selectedRole,
        subscription_type: selectedSubscription,
        referral_level: selectedLevel.toLowerCase(),
        is_blocked: isBlocked,
        is_vip: isVIP,
        custom_settings_enabled: true,
        card_to_card_percent: fees.transferPercent,
        bank_transfer_percent: fees.withdrawPercent,
        network_fee_percent: fees.topUpPercent,
        currency_conversion_percent: fees.conversionPercent,
        daily_top_up_limit: limits.dailyTopUp,
        monthly_top_up_limit: limits.monthlyTopUp,
        daily_transfer_limit: limits.dailyTransfer,
        monthly_transfer_limit: limits.monthlyTransfer,
        daily_withdrawal_limit: limits.dailyWithdraw,
        monthly_withdrawal_limit: limits.monthlyWithdraw,
        transfer_min: limits.transferMin,
        transfer_max: limits.singleTransaction,
        withdrawal_min: limits.withdrawalMin,
        withdrawal_max: limits.withdrawalMax,
        daily_usdt_send_limit: limits.dailyUsdtSend,
        monthly_usdt_send_limit: limits.monthlyUsdtSend,
        daily_usdt_receive_limit: limits.dailyUsdtReceive,
        monthly_usdt_receive_limit: limits.monthlyUsdtReceive,
      };
      const res = await apiRequest(`/admin/users/${userId}/limits/`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (res.error) throw new Error(res.error?.detail || res.error?.message || "Failed to save");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client-detail", userId] });
      toast.success(t("admin.clients.settingsSaved"));
      // Update initial values so change detection resets
      initialValues.current = { ...initialValues.current, fees: { ...fees }, limits: { ...limits }, selectedRole, selectedSubscription, selectedLevel, isVIP, isBlocked };
    },
    onError: (err) => {
      toast.error(`${t("admin.clients.error")}: ${err.message}`);
    },
  });

  const getChanges = (): { label: string; from: string; to: string }[] => {
    const changes: { label: string; from: string; to: string }[] = [];
    const init = initialValues.current;

    if (selectedRole !== init.selectedRole) changes.push({ label: t("admin.clients.roleLabel"), from: init.selectedRole, to: selectedRole });
    if (selectedLevel !== init.selectedLevel) changes.push({ label: t("admin.clients.referralLevel"), from: init.selectedLevel, to: selectedLevel });
    if (selectedSubscription !== init.selectedSubscription) changes.push({ label: t("admin.clients.subscriptionType"), from: init.selectedSubscription, to: selectedSubscription });
    if (isVIP !== init.isVIP) changes.push({ label: "VIP", from: init.isVIP ? t("common.yes") : t("common.no"), to: isVIP ? t("common.yes") : t("common.no") });
    if (isBlocked !== init.isBlocked) changes.push({ label: t("admin.clients.blockStatus"), from: init.isBlocked ? t("common.yes") : t("common.no"), to: isBlocked ? t("common.yes") : t("common.no") });

    const feeLabels: Record<string, string> = { topUpPercent: t("admin.clients.topUp"), transferPercent: t("admin.clients.transfers"), withdrawPercent: t("admin.clients.withdrawal"), conversionPercent: t("admin.clients.conversion") };
    for (const key of Object.keys(fees) as (keyof typeof fees)[]) {
      if (fees[key] !== init.fees[key]) changes.push({ label: `${t("admin.clients.personalFees")}: ${feeLabels[key]}`, from: `${init.fees[key]}%`, to: `${fees[key]}%` });
    }

    const limitLabels: Record<string, string> = { dailyTopUp: "Daily Top Up", monthlyTopUp: "Monthly Top Up", dailyTransfer: "Daily Transfer", monthlyTransfer: "Monthly Transfer", dailyWithdraw: "Daily Withdraw", monthlyWithdraw: "Monthly Withdraw", singleTransaction: t("admin.clients.maxTransfer"), transferMin: t("admin.clients.minTransfer"), withdrawalMin: t("admin.clients.minWithdrawal"), withdrawalMax: t("admin.clients.maxWithdrawal"), dailyUsdtSend: "Daily USDT Send", monthlyUsdtSend: "Monthly USDT Send", dailyUsdtReceive: "Daily USDT Receive", monthlyUsdtReceive: "Monthly USDT Receive" };
    for (const key of Object.keys(limits) as (keyof typeof limits)[]) {
      const suffix = key.includes("Usdt") ? "USDT" : "AED";
      if (limits[key] !== init.limits[key]) changes.push({ label: `${t("admin.clients.personalLimits")}: ${limitLabels[key]}`, from: `${init.limits[key]} ${suffix}`, to: `${limits[key]} ${suffix}` });
    }

    const rateLabels: Record<string, string> = { usdtAedBuy: "USDT→AED Buy", usdtAedSell: "USDT→AED Sell", usdAedBuy: "USD→AED Buy", usdAedSell: "USD→AED Sell" };
    for (const key of Object.keys(rates) as (keyof typeof rates)[]) {
      if (rates[key] !== init.rates[key]) changes.push({ label: rateLabels[key], from: init.rates[key], to: rates[key] });
    }

    return changes;
  };

  const handleSaveClick = () => {
    const changes = getChanges();
    if (changes.length === 0) {
      toast.info(t("admin.clients.noChanges"));
      return;
    }
    setShowSaveAlert(true);
  };

  const handleConfirmSave = () => {
    setShowSaveAlert(false);
    saveLimitsMutation.mutate();
  };

  const txGroups = useMemo((): AppTransactionGroup[] => {
    const fallbackTx = client?.transactions ?? [];
    const sourceTransactions = clientTransactions.length > 0 ? clientTransactions : fallbackTx;
    if (!sourceTransactions || sourceTransactions.length === 0) return [];

    const sortedAll = [...sourceTransactions].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const txList = showAllTx ? sortedAll : sortedAll.slice(0, 3);

    const map = new Map<string, AppTransaction[]>();
    for (const tx of txList) {
      const toNum = (v: unknown): number => {
        if (typeof v === 'number') return v;
        if (typeof v === 'string') { const n = parseFloat(v); return isNaN(n) ? 0 : n; }
        return 0;
      };

      const raw = tx as any;
      const normalizedTx: ApiTransaction = {
        id: String(tx.id),
        type: tx.type || 'payment',
        amount: toNum(tx.amount),
        currency: tx.currency || 'AED',
        status: tx.status || 'completed',
        created_at: tx.created_at,
        merchant_name: raw.merchant_name || null,
        merchant_category: raw.merchant_category || null,
        description: tx.description || null,
        card_id: raw.card_id || null,
        fee: tx.fee != null ? toNum(tx.fee) : null,
        exchange_rate: tx.exchange_rate != null ? String(tx.exchange_rate) : null,
        original_amount: tx.original_amount != null ? toNum(tx.original_amount) : null,
        original_currency: tx.original_currency || null,
        reference_id: raw.reference_id || null,
        sender_card: raw.sender_card || tx.sender_name || null,
        recipient_card: raw.recipient_card || null,
        sender_name: tx.sender_name || null,
        receiver_name: tx.receiver_name || null,
        direction: raw.direction || (tx.sender_id && String(tx.sender_id) === userId ? 'outbound' : tx.receiver_id && String(tx.receiver_id) === userId ? 'inbound' : undefined),
        operation: raw.operation || null,
        metadata: raw.metadata || null,
      };

      const mapped = mapApiTransactionToLocal(normalizedTx);
      const incoming = !!(mapped.metadata as any)?.isIncoming;

      const d = new Date(tx.created_at);
      const key = format(d, "dd.MM.yyyy");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({
        ...mapped,
        id: String(tx.id),
        status: tx.status === "completed" ? "settled" : tx.status === "pending" ? "processing" : mapped.status,
        metadata: {
          ...(mapped.metadata || {}),
          ...(raw.metadata || {}),
          isIncoming: incoming,
          originalApiType: tx.type,
        },
      });
    }
    return Array.from(map.entries()).map(([date, txs]) => ({
      date,
      totalSpend: txs.filter(t => !(t.metadata as any)?.isIncoming).reduce((s, t) => s + t.amountLocal, 0),
      transactions: txs,
    }));
  }, [client?.transactions, clientTransactions, showAllTx, userId]);

  if (!userId) {
    navigate("/settings/admin/clients");
    return null;
  }

  if (isLoading) {
    return (
      <MobileLayout title={t("admin.clients.settingsTitle")} showBackButton onBack={() => navigate(-1)}>
        <div className="px-4 pt-4 space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      </MobileLayout>
    );
  }

  if (!client) {
    return (
      <MobileLayout title={t("admin.clients.settingsTitle")} showBackButton onBack={() => navigate(-1)}>
        <div className="px-4 pt-20 text-center text-muted-foreground">{t("admin.clients.clientNotFound")}</div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      title={client.full_name || t("admin.clients.settingsTitle")}
      showBackButton
      onBack={() => navigate(-1)}
      rightAction={
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      }
    >
      <div className="px-4 pb-8 pt-4 space-y-6">
        {/* Client Header Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-muted/30 border border-border/50">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary" />
          
          {/* Top section: Avatar + Name + ID + Role + Badges */}
          <div className="p-5 flex items-start gap-4">
            <div className="relative shrink-0 flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg ring-2 ring-primary/20">
                {client.avatar_url ? (
                  <img src={client.avatar_url} alt={client.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-2xl">
                    {(client.full_name || "?").charAt(0)}
                  </div>
                )}
              </div>
              {client.is_verified && (
                <div className="absolute top-[60px] right-[-4px] w-6 h-6 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              {client.gender && (
                <div className="flex items-center justify-center gap-1 mt-2 text-[11px] text-muted-foreground">
                  <User className="w-3 h-3" />
                  <span className="capitalize">{client.gender}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap justify-center">
                {isVIP && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] px-2.5 py-0.5 border-0 shadow-sm">
                    <Crown className="w-3 h-3 mr-1" /> VIP
                  </Badge>
                )}
                {isBlocked && (
                  <Badge variant="destructive" className="text-[10px] px-2.5 py-0.5 shadow-sm">
                    {t("admin.clients.blocked")}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xl truncate">{client.full_name}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-muted-foreground font-mono">ID: {client.user_id}</span>
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 capitalize">
                  {client.role}
                </Badge>
              </div>
              {client.language && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                  <Globe className="w-3.5 h-3.5" />
                  <span className="uppercase">{client.language}</span>
                </div>
              )}
              {client.created_at && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{t("admin.clients.registrationDate")}: {new Date(client.created_at).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact buttons */}
          <div className="px-5 pb-4 pt-0 flex items-center gap-2 border-t border-border/30 mt-0 pt-3">
            {client.phone && (
              <a href={`tel:${client.phone}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full rounded-xl gap-2 text-xs h-9 hover:bg-muted hover:text-foreground">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  {client.phone}
                </Button>
              </a>
            )}
            {client.email && (
              <a href={`mailto:${client.email}`} className="flex-1 min-w-0">
                <Button variant="outline" size="sm" className="w-full rounded-xl gap-2 text-xs h-9 truncate hover:bg-muted hover:text-foreground">
                  <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">{client.email}</span>
                </Button>
              </a>
            )}
          </div>

          {/* Block toggle - moved under user data */}
          <div className="px-5 pb-4 flex items-center justify-between border-t border-border/30 pt-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium">{t("admin.clients.blockStatus")}</span>
            </div>
            <Switch checked={isBlocked} onCheckedChange={(val) => {
              setPendingBlockValue(val);
              setShowBlockAlert(true);
            }} />
          </div>

          {/* Block confirmation alert */}
          <AlertDialog open={showBlockAlert} onOpenChange={setShowBlockAlert}>
            <AlertDialogContent className="max-w-[320px] rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base">
                  {pendingBlockValue ? t("admin.clients.blockUserTitle") : t("admin.clients.unblockUserTitle")}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm space-y-2">
                  <span className="block">
                    {pendingBlockValue
                      ? t("admin.clients.blockUserDesc", { name: client?.full_name || '' })
                      : t("admin.clients.unblockUserDesc", { name: client?.full_name || '' })}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {t("admin.clients.whoChanged", "Кто изменил")}: <span className="font-medium">{currentUser?.full_name || '—'}</span> · <span className="font-medium capitalize">{(currentUser as any)?.role || 'admin'}</span>
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {t("admin.clients.changedFor", "Кому изменил")}: <span className="font-medium">{client?.full_name || '—'}</span>
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row gap-3">
                <AlertDialogCancel className="flex-1 rounded-xl mt-0">{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white"
                  onClick={() => {
                    setIsBlocked(pendingBlockValue);
                    setShowBlockAlert(false);
                    apiPost('/admin/audit-history/log/', {
                      action: pendingBlockValue ? 'BLOCK_USER' : 'UNBLOCK_USER',
                      target_user_id: userId,
                      details: { target_name: client?.full_name || '', new_value: pendingBlockValue },
                    }).catch(() => {});
                  }}
                >
                  {pendingBlockValue ? t("admin.clients.block") : t("admin.clients.unblock")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Financial Summary */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">{t("admin.clients.financialSummary")}</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { 
                label: t("admin.clients.cardsLabel"), 
                value: client.cards?.reduce((s, c) => s + c.balance, 0) || 0, 
                count: client.cards?.length || 0, 
                currency: "AED",
                icon: <CreditCard className="w-4 h-4" />,
              },
              { 
                label: t("admin.clients.bankAccountsShort"), 
                value: client.accounts?.reduce((s, a) => s + a.balance, 0) || 0, 
                count: client.accounts?.length || 0, 
                currency: "AED",
                icon: <Landmark className="w-4 h-4" />,
              },
              { 
                label: t("admin.clients.cryptoShort"), 
                value: client.wallets?.reduce((s, w) => s + w.balance, 0) || 0, 
                count: client.wallets?.length || 0, 
                currency: "USDT",
                icon: <Bitcoin className="w-4 h-4" />,
              },
              { 
                label: t("admin.clients.transactionsLabel"), 
                value: null, 
                count: clientTransactions.length || client.transactions?.length || 0, 
                currency: "",
                icon: <Receipt className="w-4 h-4" />,
              },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  {item.icon}
                  <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
                  <Badge variant="secondary" className="text-[10px] ml-auto">{item.count}</Badge>
                </div>
                {item.value !== null ? (
                  <p className="text-sm font-bold text-emerald-500">{item.value.toLocaleString()} {item.currency}</p>
                ) : (
                  <p className="text-sm font-bold">{item.count} {t("admin.clients.items")}</p>
                )}
              </div>
            ))}
          </div>
          {/* Total */}
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{t("admin.clients.totalBalanceAed")}</span>
              <span className="text-lg font-bold text-primary">
                {((client.cards?.reduce((s, c) => s + c.balance, 0) || 0) + (client.accounts?.reduce((s, a) => s + a.balance, 0) || 0)).toLocaleString()} AED
              </span>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        {(() => {
          const fallbackTx = client.transactions ?? [];
          const sourceTransactions = clientTransactions.length > 0 ? clientTransactions : fallbackTx;
          const totalCount = sourceTransactions.length;

          if (totalCount === 0) return null;

          return (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">{t("admin.clients.transactionHistory")}</h4>
                <span className="text-xs text-muted-foreground">{t("admin.clients.lastTransactions")}</span>
              </div>
              <CardTransactionsList groups={txGroups} viewAsUserId={userId} />
              {showAllTx && totalCount > 3 && (
                <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowAllTx(false)}>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  {t("admin.clients.collapse")}
                </Button>
              )}
              <Button
                variant="default"
                className="w-full rounded-xl mt-2"
                onClick={() => setShowTxHistoryAlert(true)}
              >
                <Receipt className="w-4 h-4 mr-2" />
                {t("admin.clients.fullHistory")}
              </Button>
            </div>
          );
        })()}

        {client.cards && client.cards.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">{t("admin.clients.cards")}</h4>
              <Badge variant="secondary" className="text-[10px]">{client.cards.length}</Badge>
            </div>
            <div className="space-y-2">
              {client.cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
                  className="w-full text-left p-3 rounded-xl bg-muted/30 border border-border/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                        card.type === 'metal' ? "bg-gradient-to-br from-gray-600 to-gray-800" : "bg-gradient-to-br from-blue-500 to-blue-700"
                      )}>
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{card.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          •••• {card.last_four_digits || "****"} · <span className="capitalize">{card.status}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-emerald-500">{card.balance.toLocaleString()} AED</p>
                      <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", expandedCard === card.id && "rotate-180")} />
                    </div>
                  </div>
                  {expandedCard === card.id && (
                    <div className="mt-3 pt-3 border-t border-border/30 grid grid-cols-2 gap-2 text-xs">
                      {card.card_number && <div className="col-span-2"><span className="text-muted-foreground">{t("admin.clients.cardNumber")}:</span> <span className="font-mono">{card.card_number}</span></div>}
                      {card.cardholder_name && <div className="col-span-2"><span className="text-muted-foreground">{t("admin.clients.cardholder")}:</span> {card.cardholder_name}</div>}
                      {card.expiry_date && <div><span className="text-muted-foreground">{t("admin.clients.expiry")}:</span> {card.expiry_date}</div>}
                      <div><span className="text-muted-foreground">{t("admin.clients.type")}:</span> <span className="capitalize">{card.type}</span></div>
                      <div><span className="text-muted-foreground">{t("admin.clients.status")}:</span> <Badge variant={card.status === "active" ? "default" : "destructive"} className="text-[10px]">{card.status === "active" ? t("admin.clients.active") : card.status}</Badge></div>
                      <div><span className="text-muted-foreground">{t("admin.clients.balanceLabel")}:</span> {card.balance.toLocaleString()} AED</div>
                      {card.last_four_digits && <div><span className="text-muted-foreground">{t("admin.clients.last4")}:</span> {card.last_four_digits}</div>}
                      <div className="col-span-2"><span className="text-muted-foreground">ID:</span> <span className="font-mono text-[10px]">{card.id}</span></div>
                      <div className="col-span-2"><span className="text-muted-foreground">{t("admin.clients.created")}:</span> {new Date(card.created_at).toLocaleString()}</div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bank Accounts */}
        {client.accounts && client.accounts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">{t("admin.clients.bankAccounts")}</h4>
              <Badge variant="secondary" className="text-[10px]">{client.accounts.length}</Badge>
            </div>
            <div className="space-y-2">
              {client.accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => setExpandedAccount(expandedAccount === acc.id ? null : acc.id)}
                  className="w-full text-left p-3 rounded-xl bg-muted/30 border border-border/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{acc.bank_name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{acc.iban.slice(0, 8)}••••</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-emerald-500">{acc.balance.toLocaleString()} AED</p>
                      <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", expandedAccount === acc.id && "rotate-180")} />
                    </div>
                  </div>
                  {expandedAccount === acc.id && (
                    <div className="mt-3 pt-3 border-t border-border/30 space-y-1.5 text-xs">
                      <div><span className="text-muted-foreground">IBAN:</span> <span className="font-mono">{acc.iban}</span></div>
                      <div><span className="text-muted-foreground">{t("admin.clients.bank")}:</span> {acc.bank_name}</div>
                      <div><span className="text-muted-foreground">{t("admin.clients.beneficiary")}:</span> {acc.beneficiary}</div>
                      <div><span className="text-muted-foreground">{t("admin.clients.balanceLabel")}:</span> {acc.balance.toLocaleString()} AED</div>
                      <div><span className="text-muted-foreground">{t("admin.clients.status")}:</span> <Badge variant={acc.is_active ? "default" : "destructive"} className="text-[10px]">{acc.is_active ? t("admin.clients.active") : t("admin.clients.inactive")}</Badge></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Crypto Wallets */}
        {client.wallets && client.wallets.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Bitcoin className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">{t("admin.clients.cryptoWallets")}</h4>
              <Badge variant="secondary" className="text-[10px]">{client.wallets.length}</Badge>
            </div>
            <div className="space-y-2">
              {client.wallets.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setExpandedWallet(expandedWallet === w.id ? null : w.id)}
                  className="w-full text-left p-3 rounded-xl bg-muted/30 border border-border/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{w.token} ({w.network})</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">{w.address.slice(0, 10)}••••{w.address.slice(-6)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-emerald-500">{w.balance.toLocaleString()} {w.token}</p>
                      <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", expandedWallet === w.id && "rotate-180")} />
                    </div>
                  </div>
                  {expandedWallet === w.id && (
                    <div className="mt-3 pt-3 border-t border-border/30 space-y-1.5 text-xs">
                      <div><span className="text-muted-foreground">{t("admin.clients.network")}:</span> {w.network}</div>
                      <div><span className="text-muted-foreground">{t("admin.clients.token")}:</span> {w.token}</div>
                      <div className="break-all"><span className="text-muted-foreground">{t("admin.clients.address")}:</span> <span className="font-mono text-[10px]">{w.address}</span></div>
                      <div><span className="text-muted-foreground">{t("admin.clients.balanceLabel")}:</span> {w.balance.toLocaleString()} {w.token}</div>
                      <div><span className="text-muted-foreground">{t("admin.clients.status")}:</span> <Badge variant={w.is_active ? "default" : "destructive"} className="text-[10px]">{w.is_active ? t("admin.clients.active") : t("admin.clients.inactive")}</Badge></div>
                      <div><span className="text-muted-foreground">{t("admin.clients.created")}:</span> {new Date(w.created_at).toLocaleString()}</div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}




        {/* Role Selector */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">{t("admin.clients.roleLabel")}</h4>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ROLE_OPTIONS.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={cn(
                  "relative p-3 rounded-xl border-2 transition-all duration-200 text-center",
                  selectedRole === role.id
                    ? "border-primary bg-primary/10"
                    : "border-border/50 bg-muted/30 hover:border-border"
                )}
              >
                <div className={cn("w-10 h-10 mx-auto rounded-xl bg-gradient-to-br flex items-center justify-center text-xl", role.color)}>
                  {role.icon}
                </div>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <span className="font-semibold text-sm">{role.label}</span>
                  {selectedRole === role.id && <CheckCircle className="w-3.5 h-3.5 text-primary" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Subscription Type */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">{t("admin.clients.subscriptionType")}</h4>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {SUBSCRIPTION_TYPES.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubscription(sub.id)}
                className={cn(
                  "relative p-3 rounded-xl border-2 transition-all duration-200 text-center",
                  selectedSubscription === sub.id
                    ? "border-primary bg-primary/10"
                    : "border-border/50 bg-muted/30 hover:border-border"
                )}
              >
                <div className={cn("w-10 h-10 mx-auto rounded-xl bg-gradient-to-br flex items-center justify-center text-xl", sub.color)}>
                  {sub.icon}
                </div>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <span className="font-semibold text-xs">{sub.label}</span>
                  {selectedSubscription === sub.id && <CheckCircle className="w-3.5 h-3.5 text-primary" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Referral Level */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">{t("admin.clients.referralLevel")}</h4>
          </div>
          <div className="space-y-2">
            {REFERRAL_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                className={cn(
                  "relative w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left",
                  selectedLevel === level.id
                    ? "border-primary bg-primary/10"
                    : "border-border/50 bg-muted/30 hover:border-border"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl shrink-0", level.color)}>
                    {level.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm">{level.name}</span>
                      {selectedLevel === level.id && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                          {t("admin.clients.current")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{t(`admin.clients.levels.${level.descKey}`)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <CreditCard className="w-3 h-3 text-primary" />
                      <span className="text-sm font-bold text-primary">{level.cardPercent}%</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <TrendingUp className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{level.txPercent}%</span>
                    </div>
                  </div>
                  {selectedLevel === level.id && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{t("admin.clients.friendsRequired")}: {level.minFriends}{level.maxFriends !== Infinity ? `–${level.maxFriends}` : '+'}</span>
                  <span>Card {level.cardPercent}% · TX {level.txPercent}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Personal Fees */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">{t("admin.clients.personalFees")}</h4>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => handleResetClick('fees')}>
              <RotateCcw className="w-3.5 h-3.5" />
              {t("admin.clients.reset", "Сбросить")}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "topUpPercent", label: t("admin.clients.topUp") },
              { key: "transferPercent", label: t("admin.clients.transfers") },
              { key: "withdrawPercent", label: t("admin.clients.withdrawal") },
              { key: "conversionPercent", label: t("admin.clients.conversion") },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={fees[key as keyof typeof fees]}
                    onChange={(e) => setFees({ ...fees, [key]: e.target.value })}
                    className="pr-8 rounded-xl"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Exchange Rates */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">{t("admin.clients.personalRates")}</h4>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => handleResetClick('rates')}>
              <RotateCcw className="w-3.5 h-3.5" />
              {t("admin.clients.reset", "Сбросить")}
            </Button>
          </div>
          <div className="space-y-3">
            {[
              { pair: "USDT → AED", buyKey: "usdtAedBuy", sellKey: "usdtAedSell" },
              { pair: "USD → AED", buyKey: "usdAedBuy", sellKey: "usdAedSell" },
            ].map(({ pair, buyKey, sellKey }) => (
              <div key={pair} className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pair}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground">{t("admin.clients.buyRate")}</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={rates[buyKey as keyof typeof rates]}
                      onChange={(e) => setRates({ ...rates, [buyKey]: e.target.value })}
                      className="text-xs rounded-xl h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground">{t("admin.clients.sellRate")}</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={rates[sellKey as keyof typeof rates]}
                      onChange={(e) => setRates({ ...rates, [sellKey]: e.target.value })}
                      className="text-xs rounded-xl h-9"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Limits */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">{t("admin.clients.personalLimits")}</h4>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => handleResetClick('limits')}>
              <RotateCcw className="w-3.5 h-3.5" />
              {t("admin.clients.reset", "Сбросить")}
            </Button>
          </div>

          <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("admin.clients.dailyLimits")}</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "dailyTopUp", label: t("admin.clients.topUp") },
                { key: "dailyTransfer", label: t("admin.clients.transfers") },
                { key: "dailyWithdraw", label: t("admin.clients.withdrawal") },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">{label}</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={focusedLimitKey === key ? limits[key as keyof typeof limits] : formatLimitValue(limits[key as keyof typeof limits])}
                      onChange={(e) => setLimits(prev => ({ ...prev, [key]: rawLimitValue(e.target.value) }))}
                      onFocus={() => setFocusedLimitKey(key)}
                      onBlur={() => setFocusedLimitKey(null)}
                      className="text-xs pr-10 rounded-xl h-9"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">AED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("admin.clients.monthlyLimits")}</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "monthlyTopUp", label: t("admin.clients.topUp") },
                { key: "monthlyTransfer", label: t("admin.clients.transfers") },
                { key: "monthlyWithdraw", label: t("admin.clients.withdrawal") },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">{label}</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={focusedLimitKey === key ? limits[key as keyof typeof limits] : formatLimitValue(limits[key as keyof typeof limits])}
                      onChange={(e) => setLimits(prev => ({ ...prev, [key]: rawLimitValue(e.target.value) }))}
                      onFocus={() => setFocusedLimitKey(key)}
                      onBlur={() => setFocusedLimitKey(null)}
                      className="text-xs pr-10 rounded-xl h-9"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">AED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* USDT Limits */}
          <div className="p-4 rounded-2xl bg-[#26A17B]/5 border border-[#26A17B]/20 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">💰 USDT — {t("admin.clients.dailyLimits", "Дневные лимиты")}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "dailyUsdtSend", label: t("admin.clients.usdtSend") },
                { key: "dailyUsdtReceive", label: t("admin.clients.usdtReceive") },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">{label}</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={focusedLimitKey === key ? limits[key as keyof typeof limits] : formatLimitValue(limits[key as keyof typeof limits])}
                      onChange={(e) => setLimits(prev => ({ ...prev, [key]: rawLimitValue(e.target.value) }))}
                      onFocus={() => setFocusedLimitKey(key)}
                      onBlur={() => setFocusedLimitKey(null)}
                      className="text-xs pr-14 rounded-xl h-9"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">USDT</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#26A17B]/5 border border-[#26A17B]/20 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">💰 USDT — {t("admin.clients.monthlyLimits", "Месячные лимиты")}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "monthlyUsdtSend", label: t("admin.clients.usdtSend") },
                { key: "monthlyUsdtReceive", label: t("admin.clients.usdtReceive") },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">{label}</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={focusedLimitKey === key ? limits[key as keyof typeof limits] : formatLimitValue(limits[key as keyof typeof limits])}
                      onChange={(e) => setLimits(prev => ({ ...prev, [key]: rawLimitValue(e.target.value) }))}
                      onFocus={() => setFocusedLimitKey(key)}
                      onBlur={() => setFocusedLimitKey(null)}
                      className="text-xs pr-14 rounded-xl h-9"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">USDT</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transfer & Withdrawal Min/Max */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("admin.clients.minMaxAmounts")}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "transferMin", label: t("admin.clients.minTransfer") },
                { key: "singleTransaction", label: t("admin.clients.maxTransfer") },
                { key: "withdrawalMin", label: t("admin.clients.minWithdrawal") },
                { key: "withdrawalMax", label: t("admin.clients.maxWithdrawal") },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">{label}</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={focusedLimitKey === key ? limits[key as keyof typeof limits] : formatLimitValue(limits[key as keyof typeof limits])}
                      onChange={(e) => setLimits(prev => ({ ...prev, [key]: rawLimitValue(e.target.value) }))}
                      onFocus={() => setFocusedLimitKey(key)}
                      onBlur={() => setFocusedLimitKey(null)}
                      className="text-xs pr-10 rounded-xl h-9"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">AED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSaveClick}
          disabled={saveLimitsMutation.isPending}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold"
        >
          {saveLimitsMutation.isPending ? (
            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          {saveLimitsMutation.isPending ? t("admin.clients.saving") : t("admin.clients.saveChanges")}
        </Button>
      </div>

      {/* Confirmation Alert */}
      <AlertDialog open={showSaveAlert} onOpenChange={setShowSaveAlert}>
        <AlertDialogContent className="max-w-[90vw] w-auto min-w-[320px] rounded-2xl backdrop-blur-md bg-background/95 border border-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">{t("admin.clients.confirmChanges")}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">{t("admin.clients.followingParamsChanged")}</p>
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {getChanges().map((change, i) => (
                    <div key={i} className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-muted/50 border border-border/50">
                      <span className="text-xs font-medium text-foreground">{change.label}</span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground line-through">{change.from}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-semibold text-primary">{change.to}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 mt-4">
            <AlertDialogCancel className="flex-1 mt-0 h-11 rounded-2xl">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave} className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground font-semibold">
              <Save className="w-4 h-4 mr-1.5" />
              {t("admin.clients.saveChanges")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transaction History Logging Alert */}
      <AlertDialog open={showTxHistoryAlert} onOpenChange={setShowTxHistoryAlert}>
        <AlertDialogContent className="max-w-[320px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">
              ⚠️ {t("admin.clients.txHistoryAlertTitle", "Внимание")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground space-y-2">
              <span className="block">
                {t("admin.clients.txHistoryAlertDesc", "При входе в историю транзакций это действие будет записано в систему логирования. Все Админы и Root будут проинформированы. Запись останется в истории аудита.")}
              </span>
              <span className="block text-xs text-muted-foreground">
                {t("admin.clients.whoEntered", "Кто входил")}: <span className="font-medium">{currentUser?.full_name || '—'}</span> · <span className="font-medium capitalize">{(currentUser as any)?.role || 'admin'}</span>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3">
            <AlertDialogCancel className="flex-1 mt-0">
              {t("common.cancel", "Отмена")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 bg-red-500 hover:bg-red-600"
              onClick={() => {
                setShowTxHistoryAlert(false);
                apiPost('/admin/audit-history/log/', {
                  action: 'VIEW_TRANSACTION_HISTORY',
                  target_user_id: userId,
                  details: { page: 'transaction_history', target_name: client?.full_name || '' },
                }).catch(() => {});
                navigate(`/settings/admin/clients/details/${userId}/history`);
              }}
            >
              {t("admin.clients.txHistoryAlertConfirm", "Продолжить")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation Alert */}
      <AlertDialog open={!!showResetAlert} onOpenChange={(open) => !open && setShowResetAlert(null)}>
        <AlertDialogContent className="max-w-[320px] rounded-2xl backdrop-blur-md bg-background/95 border border-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-primary" />
              {t("admin.clients.resetAlertTitle", "Сброс к общим настройкам")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {t("admin.clients.resetAlertDesc", "Персональные значения будут заменены на общие из настроек системы. Изменения вступят в силу только после нажатия «Сохранить изменения».")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3">
            <AlertDialogCancel className="flex-1 mt-0 h-11 rounded-2xl">{t("common.cancel", "Отмена")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReset} className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground font-semibold">
              <RotateCcw className="w-4 h-4 mr-1.5" />
              {t("admin.clients.reset", "Сбросить")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
}
