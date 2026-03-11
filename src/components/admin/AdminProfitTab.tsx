import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/services/api/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, TrendingUp, RefreshCw, ChevronRight,
  ArrowRightLeft, Landmark, Bitcoin, CreditCard, Zap, Percent, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format, subDays, startOfMonth, startOfYear } from "date-fns";

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

type PeriodPreset = "today" | "week" | "month" | "year" | "all";
type SubTab = "all" | "cards" | "banks" | "crypto" | "network" | "conversion";

// ─── Constants ───────────────────────────────────────────────
const FEE_META: Record<string, { label: string; icon: typeof DollarSign; colorClass: string }> = {
  card_transfer:       { label: "Переводы",       icon: CreditCard,    colorClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  card_to_card:        { label: "Переводы",       icon: CreditCard,    colorClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  bank_withdrawal:     { label: "Банк вывод",     icon: Landmark,      colorClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  bank_transfer:       { label: "Банк перевод",   icon: Landmark,      colorClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
  crypto_withdrawal:   { label: "Крипто вывод",   icon: Bitcoin,       colorClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  crypto_to_card:      { label: "Крипто → Карта", icon: Bitcoin,       colorClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  crypto_to_iban:      { label: "Крипто → IBAN",  icon: Bitcoin,       colorClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  top_up_crypto:       { label: "Крипто пополн.", icon: Bitcoin,       colorClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  top_up_bank:         { label: "Банк пополн.",   icon: Landmark,      colorClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  network_fee:         { label: "Сетевая комиссия", icon: Zap,         colorClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  currency_conversion: { label: "Конвертация",    icon: ArrowRightLeft, colorClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
  card_activation:     { label: "Активация карты", icon: CreditCard,   colorClass: "bg-teal-500/10 text-teal-600 dark:text-teal-400" },
};

const SUB_TABS: { value: SubTab; label: string; icon: typeof DollarSign }[] = [
  { value: "all",        label: "Всё",       icon: Layers },
  { value: "cards",      label: "Карты",     icon: CreditCard },
  { value: "banks",      label: "Банк",      icon: Landmark },
  { value: "crypto",     label: "Крипто",    icon: Bitcoin },
  { value: "network",    label: "Сеть",      icon: Zap },
  { value: "conversion", label: "Конверт.",  icon: ArrowRightLeft },
];

const num = (v: string | number | null | undefined): number => parseFloat(String(v ?? 0)) || 0;

// Map raw backend fee_type to tab category
const feeTypeToTab = (ft: string): SubTab => {
  if (["card_transfer", "card_to_card", "card_activation"].includes(ft)) return "cards";
  if (["bank_withdrawal", "bank_transfer", "top_up_bank"].includes(ft)) return "banks";
  if (["crypto_withdrawal", "crypto_to_card", "crypto_to_iban", "top_up_crypto"].includes(ft)) return "crypto";
  if (ft === "network_fee") return "network";
  if (["currency_conversion", "exchange_spread"].includes(ft)) return "conversion";
  return "all";
};

const fmtAmount = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getMeta = (type: string) => FEE_META[type] || { label: type, icon: DollarSign, colorClass: "bg-muted text-muted-foreground" };

// ─── Component ───────────────────────────────────────────────
export function AdminProfitTab() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ParsedSummary | null>(null);
  const [transactions, setTransactions] = useState<RevenueTransaction[]>([]);
  const [txCount, setTxCount] = useState(0);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingTx, setIsLoadingTx] = useState(true);
  const [period, setPeriod] = useState<PeriodPreset>("month");
  const [subTab, setSubTab] = useState<SubTab>("all");
  const [txOffset, setTxOffset] = useState(0);
  const [selectedTx, setSelectedTx] = useState<RevenueTransaction | null>(null);
  const TX_LIMIT = 50;

  const getStartDate = useCallback((p: PeriodPreset): string | null => {
    const now = new Date();
    switch (p) {
      case "today": return format(now, "yyyy-MM-dd");
      case "week":  return format(subDays(now, 7), "yyyy-MM-dd");
      case "month": return format(startOfMonth(now), "yyyy-MM-dd");
      case "year":  return format(startOfYear(now), "yyyy-MM-dd");
      case "all":   return null;
    }
  }, []);

  // ─── Fetch summary ─────────────────────────────────────────
  const fetchSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    const startDate = getStartDate(period);
    const qs = startDate ? `?start_date=${startDate}` : "";
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
      setSummary({
        totalRevenue: num(raw.total_revenue),
        totalTransactions: totalTx,
        byType,
        byDay,
      });
    }
    setIsLoadingSummary(false);
  }, [period, getStartDate]);

  // ─── Fetch transactions ────────────────────────────────────
  const fetchTransactions = useCallback(async (offset = 0) => {
    setIsLoadingTx(true);
    const params = new URLSearchParams();
    params.set("limit", String(TX_LIMIT));
    params.set("offset", String(offset));
    if (subTab !== "all") params.set("fee_type", subTab);
    const startDate = getStartDate(period);
    if (startDate) params.set("start_date", startDate);
    const res = await apiRequest<any>(
      `/transactions/admin/revenue/transactions/?${params.toString()}`,
      { method: "GET" },
      true
    );
    if (res.data) {
      const results: RevenueTransaction[] = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.results)
          ? res.data.results
          : [];
      const count = Array.isArray(res.data) ? res.data.length : (res.data.count ?? results.length);
      setTransactions(prev => offset === 0 ? results : [...prev, ...results]);
      setTxCount(count);
    }
    setIsLoadingTx(false);
  }, [subTab, period, getStartDate]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchTransactions(0); setTxOffset(0); }, [fetchTransactions]);

  const handleLoadMore = () => {
    const newOffset = txOffset + TX_LIMIT;
    setTxOffset(newOffset);
    fetchTransactions(newOffset);
  };

  // ─── Derived data (server-side filtered now) ────────────────
  const filteredTx = transactions;

  // Currency breakdown
  const currencyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    const source = subTab === "all" ? transactions : filteredTx;
    for (const tx of source) {
      const cur = tx.fee_currency || "AED";
      totals[cur] = (totals[cur] || 0) + num(tx.fee_amount);
    }
    return totals;
  }, [filteredTx, transactions, subTab]);

  // Sub-tab counts (map raw fee_type → tab category)
  const subTabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: transactions.length };
    for (const tx of transactions) {
      const tab = feeTypeToTab(tx.fee_type);
      if (tab !== "all") counts[tab] = (counts[tab] || 0) + 1;
    }
    return counts;
  }, [transactions]);

  const periodPresets: { value: PeriodPreset; label: string }[] = [
    { value: "today", label: "Сегодня" },
    { value: "week",  label: "Неделя" },
    { value: "month", label: "Месяц" },
    { value: "year",  label: "Год" },
    { value: "all",   label: "Всё время" },
  ];

  const sortedTypes = summary
    ? Object.entries(summary.byType).sort(([, a], [, b]) => b.total - a.total)
    : [];

  const handleTxClick = (tx: RevenueTransaction) => {
    if (tx.transaction_id) {
      navigate(`/transaction/${tx.transaction_id}?view_as=${tx.user_id}`);
    } else {
      setSelectedTx(selectedTx?.id === tx.id ? null : tx);
    }
  };

  return (
    <div className="space-y-4">
      {/* ─── Period Selector ──────────────────────────────────── */}
      <div className="flex gap-1.5 p-1 bg-muted/50 rounded-xl overflow-x-auto scrollbar-hide">
        {periodPresets.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              "flex-1 min-w-fit py-2 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
              period === p.value
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => { fetchSummary(); fetchTransactions(0); setTxOffset(0); }}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ─── Summary Cards ────────────────────────────────────── */}
      {isLoadingSummary ? (
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-white"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <DollarSign className="w-5 h-5 mb-1 opacity-80" />
              <p className="text-[10px] opacity-80 uppercase tracking-wide">Общий доход</p>
              <p className="text-xl font-bold mt-0.5">{fmtAmount(summary.totalRevenue)}</p>
              <p className="text-[10px] opacity-60 mt-0.5">AED</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <TrendingUp className="w-5 h-5 mb-1 opacity-80" />
              <p className="text-[10px] opacity-80 uppercase tracking-wide">Транзакций</p>
              <p className="text-xl font-bold mt-0.5">{summary.totalTransactions.toLocaleString()}</p>
              <p className="text-[10px] opacity-60 mt-0.5">с комиссией</p>
            </motion.div>
          </div>

          {/* Currency breakdown mini-cards */}
          {Object.keys(currencyTotals).length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {Object.entries(currencyTotals).sort(([,a],[,b]) => b - a).map(([cur, total]) => (
                <div key={cur} className="shrink-0 px-3 py-2 rounded-xl bg-card border border-border flex items-center gap-2">
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded",
                    cur === "USDT" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  )}>
                    {cur}
                  </span>
                  <span className="text-sm font-bold text-foreground">{fmtAmount(total)}</span>
                </div>
              ))}
            </div>
          )}

          {/* ─── Type Breakdown ────────────────────────────────── */}
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
                  <motion.div
                    key={type}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3"
                  >
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

      {/* ─── Sub-tabs (fee type filter) ───────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
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
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/20"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {count > 0 && (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full",
                  isActive ? "bg-primary-foreground/20" : "bg-muted"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Transactions List ────────────────────────────────── */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            {subTab === "all" ? "Все комиссии" : getMeta(subTab).label}
          </h3>
          <span className="text-xs text-muted-foreground">
            {filteredTx.length}{subTab === "all" ? ` / ${txCount}` : ""} записей
          </span>
        </div>
        <div className="divide-y divide-border">
          {isLoadingTx && transactions.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))
          ) : filteredTx.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Нет транзакций
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filteredTx.map((tx) => {
                const meta = getMeta(tx.fee_type);
                const Icon = meta.icon;
                const amount = num(tx.fee_amount);
                const baseAmount = num(tx.base_amount);
                const feePercent = num(tx.fee_percent);
                const isExpanded = selectedTx?.id === tx.id && !tx.transaction_id;

                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => handleTxClick(tx)}
                  >
                    <div className="px-4 py-3 flex items-center gap-3">
                      <div className={cn("shrink-0 w-9 h-9 rounded-xl flex items-center justify-center", meta.colorClass)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{meta.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {tx.created_at ? format(new Date(tx.created_at), "dd.MM.yyyy HH:mm") : "—"}
                          {feePercent > 0 && ` · ${feePercent}%`}
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

                    {/* Expanded receipt-like details (if no transaction_id for navigation) */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3 space-y-2 border-t border-border/50 pt-2 mx-4">
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
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
        {transactions.length < txCount && (
          <div className="px-4 py-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={handleLoadMore}
              disabled={isLoadingTx}
            >
              {isLoadingTx ? "Загрузка..." : `Загрузить ещё (${transactions.length}/${txCount})`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helper component ────────────────────────────────────────
function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className={cn("text-[11px] font-medium", highlight ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
        {value}
      </span>
    </div>
  );
}
