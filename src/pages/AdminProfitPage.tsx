import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/services/api/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, TrendingUp, RefreshCw, ChevronRight, ArrowLeft, ChevronDown, Check,
  ArrowRightLeft, Landmark, Bitcoin, CreditCard, Zap, Percent, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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
  by_day?: Array<{ date: string; total: string | number }>;
}

interface ParsedSummary {
  totalRevenue: number;
  totalTransactions: number;
  byType: Record<string, { total: number; count: number }>;
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
type SubTab = "all" | "card_transfer" | "bank_withdrawal" | "crypto_withdrawal" | "network_fee" | "currency_conversion";

// ─── Constants ───────────────────────────────────────────────
const FEE_META: Record<string, { label: string; icon: typeof DollarSign; colorClass: string }> = {
  card_transfer:       { label: "Переводы",         icon: CreditCard,    colorClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  card_to_card:        { label: "Переводы",         icon: CreditCard,    colorClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  bank_withdrawal:     { label: "Банк вывод",       icon: Landmark,      colorClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  bank_transfer:       { label: "Банк перевод",     icon: Landmark,      colorClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
  crypto_withdrawal:   { label: "Крипто вывод",     icon: Bitcoin,       colorClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  top_up_crypto:       { label: "Крипто пополн.",   icon: Bitcoin,       colorClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  top_up_bank:         { label: "Банк пополн.",     icon: Landmark,      colorClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  network_fee:         { label: "Сетевая комиссия", icon: Zap,           colorClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  currency_conversion: { label: "Конвертация",      icon: ArrowRightLeft, colorClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
  card_activation:     { label: "Активация карты",  icon: CreditCard,    colorClass: "bg-teal-500/10 text-teal-600 dark:text-teal-400" },
};

const SUB_TABS: { value: SubTab; label: string; icon: typeof DollarSign }[] = [
  { value: "all",                label: "Всё",       icon: Layers },
  { value: "card_transfer",      label: "Переводы",  icon: CreditCard },
  { value: "bank_withdrawal",    label: "Банк",      icon: Landmark },
  { value: "crypto_withdrawal",  label: "Крипто",    icon: Bitcoin },
  { value: "network_fee",        label: "Сеть",      icon: Zap },
  { value: "currency_conversion", label: "Конверт.", icon: ArrowRightLeft },
];

const num = (v: string | number | null | undefined): number => parseFloat(String(v ?? 0)) || 0;
const fmtAmount = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const getMeta = (type: string) => FEE_META[type] || { label: type, icon: DollarSign, colorClass: "bg-muted text-muted-foreground" };

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
  const { user } = useAuth();
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
      const byDay = (raw.by_day || []).map(d => ({ date: d.date, total: num(d.total) }));
      setSummary({ totalRevenue: num(raw.total_revenue), totalTransactions: totalTx, byType, byDay });
    }
    setIsLoadingSummary(false);
  }, [period, getStartDate, getEndDate]);

  const fetchTransactions = useCallback(async (offset = 0) => {
    setIsLoadingTx(true);
    const startDate = getStartDate(period);
    const endDate = getEndDate(period);
    let qs = `?limit=${TX_LIMIT}&offset=${offset}`;
    if (startDate) qs += `&start_date=${startDate}`;
    if (endDate) qs += `&end_date=${endDate}`;
    const res = await apiRequest<any>(
      `/transactions/admin/revenue/transactions/${qs}`,
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
  }, [period, getStartDate, getEndDate]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchTransactions(0); setTxOffset(0); }, [fetchTransactions]);

  const handleLoadMore = () => {
    const newOffset = txOffset + TX_LIMIT;
    setTxOffset(newOffset);
    fetchTransactions(newOffset);
  };

  // ─── Derived data ──────────────────────────────────────────
  // First filter by selected period (client-side, since API may not filter)
  const periodFilteredTx = useMemo(() => {
    const startDate = getStartDate(period);
    const endDate = getEndDate(period);
    if (!startDate && !endDate) return transactions;
    return transactions.filter(tx => {
      if (!tx.created_at) return false;
      const txDate = format(new Date(tx.created_at), "yyyy-MM-dd");
      if (startDate && txDate < startDate) return false;
      if (endDate && txDate > endDate) return false;
      return true;
    });
  }, [transactions, period, getStartDate, getEndDate]);

  const filteredTx = useMemo(() => {
    if (subTab === "all") return periodFilteredTx;
    if (subTab === "card_transfer") return periodFilteredTx.filter(tx => tx.fee_type === "card_transfer" || tx.fee_type === "card_to_card");
    return periodFilteredTx.filter(tx => tx.fee_type === subTab);
  }, [periodFilteredTx, subTab]);

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

  const currencyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const tx of filteredTx) {
      const cur = tx.fee_currency || "AED";
      totals[cur] = (totals[cur] || 0) + num(tx.fee_amount);
    }
    return totals;
  }, [filteredTx]);

  const subTabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: periodFilteredTx.length };
    for (const tx of periodFilteredTx) {
      const type = tx.fee_type === "card_to_card" ? "card_transfer" : tx.fee_type;
      counts[type] = (counts[type] || 0) + 1;
    }
    return counts;
  }, [periodFilteredTx]);

  const formatDateRange = (from: Date | undefined, to: Date | undefined): string => {
    if (!from && !to) return "";
    const fmtStr = "dd.MM.yyyy";
    return `${from ? format(from, fmtStr) : "..."} - ${to ? format(to, fmtStr) : "..."}`;
  };

  const presetOptions: { key: PeriodPreset; label: string; dateRange: string }[] = [
    { key: "allTime", label: "За всё время", dateRange: "" },
    { key: "today", label: "Сегодня", dateRange: formatDateRange(today, today) },
    { key: "thisWeek", label: "Неделя", dateRange: formatDateRange(startOfWeek(today, { weekStartsOn: 1 }), today) },
    { key: "month", label: "Месяц", dateRange: formatDateRange(subMonths(today, 1), today) },
    { key: "threeMonths", label: "3 месяца", dateRange: formatDateRange(subMonths(today, 3), today) },
    { key: "year", label: "Год", dateRange: formatDateRange(subMonths(today, 12), today) },
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
    if (period === "allTime") return "За всё время";
    if (period === "custom" && dateFrom && dateTo) {
      return `${format(dateFrom, "dd.MM.yyyy")} - ${format(dateTo, "dd.MM.yyyy")}`;
    }
    const preset = presetOptions.find(p => p.key === period);
    return preset?.label || "За всё время";
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
        {/* ─── Sticky Header ────────────────────────────────────── */}
        <div className="sticky top-0 z-50">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
          <div className="relative px-4 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/settings/admin")} className="shrink-0 rounded-xl bg-muted/50 hover:bg-muted">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold truncate">💵 Profit</span>
                  <Badge className="text-[9px] px-1.5 py-0 h-4 bg-amber-500 hover:bg-amber-600 text-white gap-0.5 shrink-0">
                    <Crown className="w-2.5 h-2.5" />Root
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">Доходы платформы</p>
              </div>
              <div className="flex items-center gap-1">
                <ThemeSwitcher />
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-24 space-y-4">
          {/* Title with Period Selector */}
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">💵 Profit</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { fetchSummary(); fetchTransactions(0); setTxOffset(0); }}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsDateDrawerOpen(true)}
                className="flex items-center gap-1.5 text-[#007AFF]"
              >
                <span className="text-sm font-medium">{getSelectedPeriodLabel()}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ─── Summary Cards ──────────────────────────────────── */}
          {isLoadingSummary ? (
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </div>
          ) : summary ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-white">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <DollarSign className="w-5 h-5 mb-1 opacity-80" />
                  <p className="text-[10px] opacity-80 uppercase tracking-wide">Общий доход</p>
                  <p className="text-xl font-bold mt-0.5">{fmtAmount(summary.totalRevenue)}</p>
                  <p className="text-[10px] opacity-60 mt-0.5">AED</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <TrendingUp className="w-5 h-5 mb-1 opacity-80" />
                  <p className="text-[10px] opacity-80 uppercase tracking-wide">Транзакций</p>
                  <p className="text-xl font-bold mt-0.5">{summary.totalTransactions.toLocaleString()}</p>
                  <p className="text-[10px] opacity-60 mt-0.5">с комиссией</p>
                </motion.div>
              </div>

              {/* Currency breakdown */}
              {Object.keys(currencyTotals).length > 0 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {Object.entries(currencyTotals).sort(([,a],[,b]) => b - a).map(([cur, total]) => (
                    <div key={cur} className="shrink-0 px-3 py-2 rounded-xl bg-card border border-border flex items-center gap-2">
                      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded",
                        cur === "USDT" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-[#007AFF]/10 text-[#007AFF]"
                      )}>
                        {cur}
                      </span>
                      <span className="text-sm font-bold text-foreground">{fmtAmount(total)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Type Breakdown */}
              {sortedTypes.length > 0 && (
                <div className="rounded-2xl bg-card border border-border p-4 space-y-2.5">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Percent className="w-4 h-4 text-primary" />
                    По типу комиссии
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
                            <span className="text-[10px] text-muted-foreground">{data.count} шт</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">Нет данных за выбранный период</div>
          )}

          {/* ─── Sub-tabs (fee type filter) ─────────────────────── */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {SUB_TABS.map(tab => {
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
                  {tab.label}
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
            <div className="text-center py-12 text-muted-foreground text-sm">Нет транзакций</div>
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
                                из {fmtAmount(baseAmount)} {tx.base_currency || ""}
                              </p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          </div>

                          {/* Expanded details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="px-4 pb-3 space-y-1.5 border-t border-border/50 pt-2 mx-4">
                                  <DetailRow label="Тип комиссии" value={meta.label} />
                                  <DetailRow label="Сумма комиссии" value={`${fmtAmount(amount)} ${tx.fee_currency || "AED"}`} highlight />
                                  <DetailRow label="Базовая сумма" value={`${fmtAmount(baseAmount)} ${tx.base_currency || ""}`} />
                                  {feePercent > 0 && <DetailRow label="Процент" value={`${feePercent}%`} />}
                                  <DetailRow label="User ID" value={tx.user_id} />
                                  <DetailRow label="Дата" value={tx.created_at ? format(new Date(tx.created_at), "dd.MM.yyyy HH:mm:ss") : "—"} />
                                  {tx.transaction_id && <DetailRow label="ID транзакции" value={tx.transaction_id.slice(0, 8) + "..."} />}
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
          {transactions.length < txCount && subTab === "all" && (
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={handleLoadMore} disabled={isLoadingTx}>
              {isLoadingTx ? "Загрузка..." : `Загрузить ещё (${transactions.length}/${txCount})`}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Period Selection Drawer */}
      <Drawer open={isDateDrawerOpen} onOpenChange={setIsDateDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle>Выберите период</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 overflow-y-auto">
            {customDateField ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button onClick={() => setCustomDateField(null)} className="text-sm text-muted-foreground">
                    Назад
                  </button>
                  <span className="text-sm font-medium">
                    {customDateField === "from" ? "Начальная дата" : "Конечная дата"}
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
                    Далее
                  </button>
                )}
                {customDateField === "to" && tempCustomFrom && tempCustomTo && (
                  <button
                    onClick={handleCustomDateConfirm}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium"
                  >
                    Применить
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
                    <p className="font-medium">Свой период</p>
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
