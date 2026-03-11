import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/services/api/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, TrendingUp, RefreshCw, ChevronRight, ArrowLeft, ChevronDown, Check, X,
  ArrowRightLeft, Landmark, Bitcoin, CreditCard, Zap, Percent, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import aedCurrency from "@/assets/aed-currency.png";
import { UsdtIcon } from "@/components/icons/CryptoIcons";
import { format, subDays, subMonths, startOfWeek, parseISO } from "date-fns";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { DateWheelPicker } from "@/components/ui/date-wheel-picker";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
interface RevenueSummaryRaw {
  total_revenue: string | number;
  by_type?: Record<string, { total: string | number; count: number }>;
  by_fee_type?: Record<string, { total: string | number; count: number }>;
  by_currency?: Record<string, { total: string | number; count: number }>;
  by_category?: Record<string, { total: string | number; count: number }>;
  by_currency_and_type?: Record<string, Record<string, { total: string | number; count: number }>>;
  by_day?: Array<{ date: string; total: string | number }>;
}

interface ParsedSummary {
  totalRevenue: number;
  totalTransactions: number;
  byType: Record<string, { total: number; count: number }>;
  byCurrency: Record<string, { total: number; count: number }>;
  byCategory: Record<string, { total: number; count: number }>;
  byCurrencyAndType: Record<string, Record<string, { total: number; count: number }>>;
  byDay: Array<{ date: string; total: number }>;
}

interface RevenueTransaction {
  id: string;
  transaction_id?: string;
  fee_type: string;
  fee_amount: string | number;
  fee_currency: string;
  fee_percent: string | number | null;
  base_amount: string | number;
  base_currency: string;
  user_id: string;
  description: string | null;
  created_at: string;
}

type PeriodPreset = "allTime" | "today" | "thisWeek" | "month" | "threeMonths" | "year" | "custom";
type SubTab = "all" | "cards" | "banks" | "crypto" | "network" | "conversion";

// ─── Constants ───────────────────────────────────────────────
const FEE_META_KEYS: Record<string, { labelKey: string; icon: typeof DollarSign; colorClass: string }> = {
  card_transfer:       { labelKey: "feeTransfers",        icon: CreditCard,    colorClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  card_to_card:        { labelKey: "feeTransfers",        icon: CreditCard,    colorClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  bank_withdrawal:     { labelKey: "feeBankWithdrawal",   icon: Landmark,      colorClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  bank_transfer:       { labelKey: "feeBankTransfer",     icon: Landmark,      colorClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
  crypto_withdrawal:   { labelKey: "feeCryptoWithdrawal", icon: Bitcoin,       colorClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  crypto_to_card:      { labelKey: "feeCryptoToCard",     icon: Bitcoin,       colorClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  crypto_to_iban:      { labelKey: "feeCryptoToIban",     icon: Bitcoin,       colorClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  top_up_crypto:       { labelKey: "feeCryptoTopUp",      icon: Bitcoin,       colorClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  top_up_bank:         { labelKey: "feeBankTopUp",        icon: Landmark,      colorClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  network_fee:         { labelKey: "feeNetworkFee",       icon: Zap,           colorClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  currency_conversion: { labelKey: "feeConversion",       icon: ArrowRightLeft, colorClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
  card_activation:     { labelKey: "feeCardActivation",   icon: CreditCard,    colorClass: "bg-teal-500/10 text-teal-600 dark:text-teal-400" },
  exchange_spread:     { labelKey: "feeExchangeSpread",   icon: ArrowRightLeft, colorClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
};

const SUB_TAB_KEYS: { value: SubTab; labelKey: string; icon: typeof DollarSign }[] = [
  { value: "all",        labelKey: "tabAll",        icon: Layers },
  { value: "cards",      labelKey: "tabTransfers",  icon: CreditCard },
  { value: "banks",      labelKey: "tabBank",       icon: Landmark },
  { value: "crypto",     labelKey: "tabCrypto",     icon: Bitcoin },
  { value: "network",    labelKey: "tabNetwork",    icon: Zap },
  { value: "conversion", labelKey: "tabConversion", icon: ArrowRightLeft },
];

const num = (v: string | number | null | undefined): number => parseFloat(String(v ?? 0)) || 0;
const fmtAmount = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const getMetaRaw = (type: string) => FEE_META_KEYS[type] || { labelKey: type, icon: DollarSign, colorClass: "bg-muted text-muted-foreground" };

const feeTypeToTab = (feeType: string): SubTab => {
  if (["card_transfer", "card_to_card", "card_activation"].includes(feeType)) return "cards";
  if (["bank_withdrawal", "bank_transfer", "top_up_bank"].includes(feeType)) return "banks";
  if (["crypto_withdrawal", "crypto_to_card", "crypto_to_iban", "top_up_crypto"].includes(feeType)) return "crypto";
  if (feeType === "network_fee") return "network";
  if (["currency_conversion", "exchange_spread"].includes(feeType)) return "conversion";
  return "all";
};

function formatDateHeader(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    return format(d, "dd.MM.yyyy");
  } catch {
    return dateStr;
  }
}

interface DateGroup {
  date: string;
  label: string;
  dayTotal: number;
  transactions: RevenueTransaction[];
}

// ─── Page Component ──────────────────────────────────────────
export default function AdminProfitPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const getMeta = (type: string) => {
    const raw = getMetaRaw(type);
    return { label: t(`profit.${raw.labelKey}`, raw.labelKey), icon: raw.icon, colorClass: raw.colorClass };
  };
  const [summary, setSummary] = useState<ParsedSummary | null>(null);
  const [transactions, setTransactions] = useState<RevenueTransaction[]>([]);
  const [txCount, setTxCount] = useState(0);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingTx, setIsLoadingTx] = useState(true);
  const [period, setPeriod] = useState<PeriodPreset>("today");
  const [subTab, setSubTab] = useState<SubTab>("all");
  const [txOffset, setTxOffset] = useState(0);
  const [selectedTx, setSelectedTx] = useState<RevenueTransaction | null>(null);
  const [isDateDrawerOpen, setIsDateDrawerOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [customDateField, setCustomDateField] = useState<"from" | "to" | null>(null);
  const [tempCustomFrom, setTempCustomFrom] = useState<Date | undefined>(undefined);
  const [tempCustomTo, setTempCustomTo] = useState<Date | undefined>(undefined);
  const [hasSelectedFrom, setHasSelectedFrom] = useState(false);
  const TX_LIMIT = 50;

  const today = new Date();

  const getStartDate = useCallback((p: PeriodPreset): string | null => {
    const now = new Date();
    switch (p) {
      case "today": return format(now, "yyyy-MM-dd");
      case "thisWeek": return format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      case "month": return format(subMonths(now, 1), "yyyy-MM-dd");
      case "threeMonths": return format(subMonths(now, 3), "yyyy-MM-dd");
      case "year": return format(subMonths(now, 12), "yyyy-MM-dd");
      case "custom": return dateFrom ? format(dateFrom, "yyyy-MM-dd") : null;
      case "allTime": return null;
    }
  }, [dateFrom]);

  const getEndDate = useCallback((p: PeriodPreset): string | null => {
    if (p === "custom" && dateTo) return format(dateTo, "yyyy-MM-dd");
    return null;
  }, [dateTo]);

  const fetchSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    const startDate = getStartDate(period);
    const endDate = getEndDate(period);
    let qs = startDate ? `?start_date=${startDate}` : "";
    if (endDate) qs += `${qs ? "&" : "?"}end_date=${endDate}`;
    const res = await apiRequest<RevenueSummaryRaw>(
      `/transactions/admin/revenue/summary/${qs}`,
      { method: "GET" },
      true
    );
    if (res.data) {
      const raw = res.data;
      const byTypeRaw = raw.by_type || raw.by_fee_type || {};
      const byType: Record<string, { total: number; count: number }> = {};
      let totalTx = 0;
      for (const [k, v] of Object.entries(byTypeRaw)) {
        byType[k] = { total: num(v.total), count: v.count || 0 };
        totalTx += v.count || 0;
      }

      const byCurrency: Record<string, { total: number; count: number }> = {};
      for (const [k, v] of Object.entries(raw.by_currency || {})) {
        byCurrency[k] = { total: num(v.total), count: v.count || 0 };
      }

      const byCategory: Record<string, { total: number; count: number }> = {};
      for (const [k, v] of Object.entries(raw.by_category || {})) {
        byCategory[k] = { total: num(v.total), count: v.count || 0 };
      }

      const byCurrencyAndType: Record<string, Record<string, { total: number; count: number }>> = {};
      for (const [cur, types] of Object.entries(raw.by_currency_and_type || {})) {
        byCurrencyAndType[cur] = {};
        for (const [ft, v] of Object.entries(types)) {
          byCurrencyAndType[cur][ft] = { total: num(v.total), count: v.count || 0 };
        }
      }

      const byDay = (raw.by_day || []).map(d => ({ date: d.date, total: num(d.total) }));
      setSummary({ totalRevenue: num(raw.total_revenue), totalTransactions: totalTx, byType, byCurrency, byCategory, byCurrencyAndType, byDay });
    }
    setIsLoadingSummary(false);
  }, [period, getStartDate, getEndDate]);

  const fetchTransactions = useCallback(async (offset = 0) => {
    setIsLoadingTx(true);
    const startDate = getStartDate(period);
    const endDate = getEndDate(period);
    const params = new URLSearchParams();
    params.set("limit", String(TX_LIMIT));
    params.set("offset", String(offset));
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    if (subTab !== "all") params.set("fee_type", subTab);

    const res = await apiRequest<any>(
      `/transactions/admin/revenue/transactions/?${params.toString()}`,
      { method: "GET" },
      true
    );
    if (res.data) {
      const results: RevenueTransaction[] = Array.isArray(res.data) ? res.data : Array.isArray(res.data.results) ? res.data.results : [];
      const count = Array.isArray(res.data) ? res.data.length : (res.data.count ?? results.length);
      setTransactions(prev => offset === 0 ? results : [...prev, ...results]);
      setTxCount(count);
    }
    setIsLoadingTx(false);
  }, [period, subTab, getStartDate, getEndDate]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchTransactions(0); setTxOffset(0); }, [fetchTransactions]);

  const handleLoadMore = () => {
    const newOffset = txOffset + TX_LIMIT;
    setTxOffset(newOffset);
    fetchTransactions(newOffset);
  };

  // ─── Derived data (front-side filtered + sorted) ───────────
  const filteredTx = useMemo(() => {
    const byTab = subTab === "all"
      ? transactions
      : transactions.filter((tx) => feeTypeToTab(tx.fee_type) === subTab);

    return [...byTab].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [transactions, subTab]);

  // Group transactions by date
  const dateGroups = useMemo((): DateGroup[] => {
    const groups: Record<string, { txs: RevenueTransaction[]; total: number }> = {};
    for (const tx of filteredTx) {
      const dateKey = tx.created_at ? format(new Date(tx.created_at), "yyyy-MM-dd") : "unknown";
      if (!groups[dateKey]) groups[dateKey] = { txs: [], total: 0 };
      groups[dateKey].txs.push(tx);
      groups[dateKey].total += num(tx.fee_amount);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, { txs, total }]) => ({
        date,
        label: formatDateHeader(date),
        dayTotal: total,
        transactions: txs,
      }));
  }, [filteredTx]);

  const subTabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: transactions.length };
    for (const tx of transactions) {
      const tab = feeTypeToTab(tx.fee_type);
      if (tab !== "all") counts[tab] = (counts[tab] || 0) + 1;
    }
    return counts;
  }, [transactions]);

  const formatDateRange = (from: Date | undefined, to: Date | undefined): string => {
    if (!from && !to) return "";
    const fmtStr = "dd.MM.yyyy";
    return `${from ? format(from, fmtStr) : "..."} - ${to ? format(to, fmtStr) : "..."}`;
  };

  const presetOptions: { key: PeriodPreset; label: string; dateRange: string }[] = [
    { key: "allTime", label: t("profit.allTime"), dateRange: "" },
    { key: "today", label: t("profit.today"), dateRange: formatDateRange(today, today) },
    { key: "thisWeek", label: t("profit.week"), dateRange: formatDateRange(startOfWeek(today, { weekStartsOn: 1 }), today) },
    { key: "month", label: t("profit.month"), dateRange: formatDateRange(subMonths(today, 1), today) },
    
    { key: "year", label: t("profit.year"), dateRange: formatDateRange(subMonths(today, 12), today) },
  ];

  const handlePresetSelect = (preset: PeriodPreset) => {
    setPeriod(preset);
    if (preset !== "custom") {
      setDateFrom(undefined);
      setDateTo(undefined);
      setIsDateDrawerOpen(false);
    }
  };

  const handleWheelDateChange = (date: Date) => {
    if (customDateField === "from") {
      setTempCustomFrom(date);
      setHasSelectedFrom(true);
      if (!tempCustomTo) setTempCustomTo(new Date());
    } else if (customDateField === "to") {
      setTempCustomTo(date);
    }
  };

  const handleCustomDateConfirm = () => {
    if (!tempCustomFrom || !tempCustomTo) return;
    setPeriod("custom");
    setDateFrom(tempCustomFrom);
    setDateTo(tempCustomTo);
    setCustomDateField(null);
    setIsDateDrawerOpen(false);
  };

  const getSelectedPeriodLabel = (): string => {
    if (period === "allTime") return t("profit.allTime");
    if (period === "custom" && dateFrom && dateTo) {
      return `${format(dateFrom, "dd.MM.yyyy")} - ${format(dateTo, "dd.MM.yyyy")}`;
    }
    const preset = presetOptions.find(p => p.key === period);
    return preset?.label || t("profit.allTime");
  };

  const sortedTypes = summary ? Object.entries(summary.byType).sort(([, a], [, b]) => b.total - a.total) : [];

  const handleTxClick = (tx: RevenueTransaction) => {
    if (tx.transaction_id) {
      navigate(`/transaction/${tx.transaction_id}?view_as=${tx.user_id}`);
    } else {
      setSelectedTx(selectedTx?.id === tx.id ? null : tx);
    }
  };

  return (
    <MobileLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background">
        {/* ─── Premium Header ────────────────────────────────────── */}
        <div className="sticky top-0 z-50">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
          <div className="relative px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate("/settings/admin")} className="shrink-0 rounded-xl bg-muted/50 hover:bg-muted">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <span className="text-base font-bold tracking-tight">Profit</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-muted-foreground">{user?.full_name || "Admin"}</span>
                    <Badge className="text-[9px] px-1.5 py-0 h-4 bg-amber-500 hover:bg-amber-600 text-white gap-0.5">
                      <Crown className="w-2.5 h-2.5" />Root
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <ThemeSwitcher />
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-24 space-y-4">
          {/* ─── Hero Revenue Block ─────────────────────────────── */}
          {isLoadingSummary ? (
            <Skeleton className="h-44 rounded-2xl" />
          ) : summary ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl p-5"
                style={{
                  background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
                }}
              >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
                  style={{ background: "radial-gradient(circle, #007AFF 0%, transparent 70%)" }} />
                <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-5"
                  style={{ background: "radial-gradient(circle, #27AE60 0%, transparent 70%)" }} />
                
                {/* Top row: refresh + label | date + tx count */}
                <div className="relative flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); fetchSummary(); fetchTransactions(0); setTxOffset(0); }}
                      className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 text-white/70" />
                    </button>
                    <span className="text-xs text-white/50 uppercase tracking-widest font-semibold">{t("profit.totalProfit")}</span>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsDateDrawerOpen(true); }}
                      className="flex items-center gap-1.5 text-sm text-[#007AFF] font-semibold"
                    >
                      {getSelectedPeriodLabel()}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Currency amounts from API by_currency, fallback to totalRevenue */}
                <div className="relative space-y-3">
                  {Object.keys(summary.byCurrency).length > 0 ? (
                    <>
                      {(() => {
                        const sorted = Object.entries(summary.byCurrency).sort(([,a],[,b]) => b.total - a.total);
                        return sorted.map(([cur, data], i) => (
                          <div key={cur} className="flex items-center gap-3">
                            {cur === "USDT" 
                              ? <UsdtIcon size={28} /> 
                              : <img src={aedCurrency} alt="AED" className="w-7 h-7 brightness-0 invert" />
                            }
                            <p className="text-2xl font-bold text-white tracking-tight font-mono">
                              {fmtAmount(data.total)}
                            </p>
                            <span className="text-2xl font-bold text-white/70">{cur}</span>
                            {i === sorted.length - 1 && (
                              <div className="ml-auto flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1">
                                <TrendingUp className="w-3.5 h-3.5 text-[#007AFF]" />
                                <span className="text-xs text-white/70 font-mono">{summary.totalTransactions} {t("profit.transactions")}</span>
                              </div>
                            )}
                          </div>
                        ));
                      })()}
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <img src={aedCurrency} alt="AED" className="w-7 h-7 brightness-0 invert" />
                      <p className="text-2xl font-bold text-white tracking-tight font-mono">{fmtAmount(summary.totalRevenue)}</p>
                      <span className="text-2xl font-bold text-white/70">AED</span>
                      <div className="ml-auto flex items-center gap-1.5 bg-white/5 rounded-lg px-2.5 py-1">
                        <TrendingUp className="w-3.5 h-3.5 text-[#007AFF]" />
                        <span className="text-xs text-white/70 font-mono">{summary.totalTransactions} {t("profit.transactions")}</span>
                      </div>
                    </div>
                  )}
                </div>

              </motion.div>

              {/* Type Breakdown */}
              {sortedTypes.length > 0 && (
                <div className="rounded-2xl bg-card border border-border p-4 space-y-2.5">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Percent className="w-4 h-4 text-primary" />
                    {t("profit.byFeeType")}
                  </h3>
                  {sortedTypes.map(([type, data], i) => {
                    const pct = summary.totalRevenue > 0 ? (data.total / summary.totalRevenue) * 100 : 0;
                    const meta = getMeta(type);
                    const Icon = meta.icon;
                    return (
                      <motion.div key={type} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-3">
                        <div className={cn("shrink-0 w-9 h-9 rounded-xl flex items-center justify-center", meta.colorClass)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-foreground truncate">{meta.label}</p>
                            <span className="text-xs font-bold text-foreground ml-2">{fmtAmount(data.total)} AED</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground w-8 text-right">{pct.toFixed(0)}%</span>
                            <span className="text-[10px] text-muted-foreground">{data.count} {t("profit.pcs")}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">{t("profit.noData")}</div>
          )}

          {/* ─── Sub-tabs (fee type filter) ─────────────────────── */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {SUB_TAB_KEYS.map(tab => {
              const count = subTabCounts[tab.value] || 0;
              const isActive = subTab === tab.value;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setSubTab(tab.value)}
                  className={cn(
                    "shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border",
                    isActive ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/20"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t(`profit.${tab.labelKey}`)}
                  {count > 0 && (
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", isActive ? "bg-primary-foreground/20" : "bg-muted")}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ─── Grouped Transactions ───────────────────────────── */}
          {isLoadingTx && transactions.length === 0 ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-card border border-border p-4 space-y-3">
                  <Skeleton className="h-4 w-32" />
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-28" /><Skeleton className="h-2.5 w-20" /></div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : dateGroups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">{t("profit.noTransactions")}</div>
          ) : (
            <div className="space-y-3">
              {dateGroups.map((group) => (
                <div key={group.date} className="rounded-2xl bg-card border border-border overflow-hidden">
                  {/* Date header with day total */}
                  <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-muted/30">
                    <span className="text-xs font-semibold text-foreground">{group.label}</span>
                    <span className="text-xs font-bold text-[#007AFF]">
                      +{fmtAmount(group.dayTotal)} AED
                    </span>
                  </div>
                  {/* Transactions in this day */}
                  <div className="divide-y divide-border">
                    {group.transactions.map((tx) => {
                      const meta = getMeta(tx.fee_type);
                      const Icon = meta.icon;
                      const amount = num(tx.fee_amount);
                      const baseAmount = num(tx.base_amount);
                      const feePercent = num(tx.fee_percent);
                      const isExpanded = selectedTx?.id === tx.id && !tx.transaction_id;

                      return (
                        <div key={tx.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => handleTxClick(tx)}>
                          <div className="px-4 py-3 flex items-center gap-3">
                            <div className={cn("shrink-0 w-9 h-9 rounded-xl flex items-center justify-center", meta.colorClass)}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{meta.label}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {tx.created_at ? format(new Date(tx.created_at), "HH:mm") : "—"}
                                {feePercent > 0 && ` · ${feePercent}%`}
                                {` · ID: ${tx.user_id}`}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                +{fmtAmount(amount)} {tx.fee_currency || "AED"}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {t("profit.from")} {fmtAmount(baseAmount)} {tx.base_currency || ""}
                              </p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          </div>

                          {/* Expanded details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="px-4 pb-3 space-y-1.5 border-t border-border/50 pt-2 mx-4">
                                  <DetailRow label={t("profit.feeType")} value={meta.label} />
                                  <DetailRow label={t("profit.feeAmount")} value={`${fmtAmount(amount)} ${tx.fee_currency || "AED"}`} highlight />
                                  <DetailRow label={t("profit.baseAmount")} value={`${fmtAmount(baseAmount)} ${tx.base_currency || ""}`} />
                                  {feePercent > 0 && <DetailRow label={t("profit.percent")} value={`${feePercent}%`} />}
                                  <DetailRow label={t("profit.userId")} value={tx.user_id} />
                                  <DetailRow label={t("profit.date")} value={tx.created_at ? format(new Date(tx.created_at), "dd.MM.yyyy HH:mm:ss") : "—"} />
                                  {tx.transaction_id && <DetailRow label={t("profit.transactionId")} value={tx.transaction_id.slice(0, 8) + "..."} />}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load more */}
          {transactions.length < txCount && (
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={handleLoadMore} disabled={isLoadingTx}>
              {isLoadingTx ? t("profit.loading") : `${t("profit.loadMore")} (${transactions.length}/${txCount})`}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Period Selection Drawer */}
      <Drawer open={isDateDrawerOpen} onOpenChange={setIsDateDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2 relative">
            <DrawerTitle>{t("profit.selectPeriod")}</DrawerTitle>
            <button
              onClick={() => setIsDateDrawerOpen(false)}
              className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-primary" />
            </button>
          </DrawerHeader>
          <div className="px-4 pb-8 overflow-y-auto">
            {customDateField ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button onClick={() => setCustomDateField(null)} className="text-sm text-muted-foreground">
                    {t("profit.back")}
                  </button>
                  <span className="text-sm font-medium">
                    {customDateField === "from" ? t("profit.startDate") : t("profit.endDate")}
                  </span>
                  <div className="w-12" />
                </div>
                <DateWheelPicker
                  value={customDateField === "from" ? tempCustomFrom : tempCustomTo}
                  onChange={handleWheelDateChange}
                  minYear={2020}
                  maxYear={new Date().getFullYear() + 1}
                />
                {customDateField === "from" && hasSelectedFrom && (
                  <button
                    onClick={() => setCustomDateField("to")}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium"
                  >
                    {t("profit.next")}
                  </button>
                )}
                {customDateField === "to" && tempCustomFrom && tempCustomTo && (
                  <button
                    onClick={handleCustomDateConfirm}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium"
                  >
                    {t("profit.apply")}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {presetOptions.map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => handlePresetSelect(preset.key)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl transition-colors flex items-center justify-between",
                      period === preset.key ? "bg-primary/10 border border-primary/30" : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    <div>
                      <p className="font-medium">{preset.label}</p>
                      {preset.dateRange && (
                        <p className="text-xs text-muted-foreground mt-0.5">{preset.dateRange}</p>
                      )}
                    </div>
                    {period === preset.key && <Check className="w-5 h-5 text-[#007AFF] shrink-0" />}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setTempCustomFrom(dateFrom);
                    setTempCustomTo(dateTo);
                    setHasSelectedFrom(!!dateFrom);
                    setCustomDateField("from");
                  }}
                  className={cn(
                    "w-full text-left p-4 rounded-xl transition-colors flex items-center justify-between",
                    period === "custom" ? "bg-primary/10 border border-primary/30" : "bg-secondary hover:bg-secondary/80"
                  )}
                >
                  <div>
                    <p className="font-medium">{t("profit.customPeriod")}</p>
                    {period === "custom" && dateFrom && dateTo && (
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDateRange(dateFrom, dateTo)}</p>
                    )}
                  </div>
                  {period === "custom" && <Check className="w-5 h-5 text-[#007AFF] shrink-0" />}
                </button>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </MobileLayout>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className={cn("text-[11px] font-medium", highlight ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>{value}</span>
    </div>
  );
}
