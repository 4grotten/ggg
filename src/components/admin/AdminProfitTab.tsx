import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/services/api/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, TrendingUp, Calendar, RefreshCw, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format, subDays, startOfMonth, startOfYear } from "date-fns";

interface RevenueSummary {
  total_revenue: number;
  total_transactions: number;
  by_fee_type: Record<string, { total: number; count: number }>;
  period: { start_date: string; end_date: string };
}

interface RevenueTransaction {
  id: string;
  fee_type: string;
  fee_amount: number;
  fee_currency: string;
  fee_percent: number | null;
  base_amount: number;
  base_currency: string;
  user_id: string;
  description: string | null;
  created_at: string;
}

interface RevenueTransactionsResponse {
  count: number;
  results: RevenueTransaction[];
}

type PeriodPreset = "today" | "week" | "month" | "year" | "all";

const FEE_TYPE_LABELS: Record<string, string> = {
  top_up_crypto: "Крипто пополнение",
  top_up_bank: "Банк пополнение",
  card_to_card: "Карта → Карта",
  bank_transfer: "Банковский перевод",
  crypto_withdrawal: "Крипто вывод",
  bank_withdrawal: "Банк вывод",
  network_fee: "Сетевая комиссия",
  currency_conversion: "Конвертация валют",
  card_activation: "Активация карты",
};

const FEE_TYPE_COLORS: Record<string, string> = {
  top_up_crypto: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  top_up_bank: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  card_to_card: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  bank_transfer: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  crypto_withdrawal: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  bank_withdrawal: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  network_fee: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  currency_conversion: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  card_activation: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

export function AdminProfitTab() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [transactions, setTransactions] = useState<RevenueTransaction[]>([]);
  const [txCount, setTxCount] = useState(0);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingTx, setIsLoadingTx] = useState(true);
  const [period, setPeriod] = useState<PeriodPreset>("month");
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [txOffset, setTxOffset] = useState(0);
  const TX_LIMIT = 30;

  const getStartDate = useCallback((p: PeriodPreset): string | null => {
    const now = new Date();
    switch (p) {
      case "today": return format(now, "yyyy-MM-dd");
      case "week": return format(subDays(now, 7), "yyyy-MM-dd");
      case "month": return format(startOfMonth(now), "yyyy-MM-dd");
      case "year": return format(startOfYear(now), "yyyy-MM-dd");
      case "all": return null;
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    const startDate = getStartDate(period);
    const qs = startDate ? `?start_date=${startDate}` : "";
    const res = await apiRequest<RevenueSummary>(
      `/transactions/admin/revenue/summary/${qs}`,
      { method: "GET" },
      true
    );
    if (res.data) setSummary(res.data);
    setIsLoadingSummary(false);
  }, [period, getStartDate]);

  const fetchTransactions = useCallback(async (offset = 0) => {
    setIsLoadingTx(true);
    const res = await apiRequest<RevenueTransactionsResponse>(
      `/transactions/admin/revenue/transactions/?limit=${TX_LIMIT}&offset=${offset}`,
      { method: "GET" },
      true
    );
    console.log('[AdminProfitTab] raw response:', JSON.stringify(res.data).slice(0, 500));
    if (res.data) {
      const results = Array.isArray(res.data) 
        ? res.data 
        : Array.isArray((res.data as any).results) 
          ? (res.data as any).results 
          : [];
      const count = Array.isArray(res.data) ? res.data.length : ((res.data as any).count ?? results.length);
      setTransactions(prev => offset === 0 ? results : [...prev, ...results]);
      setTxCount(count);
    }
    setIsLoadingTx(false);
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchTransactions(0);
    setTxOffset(0);
  }, [fetchTransactions]);

  const handleLoadMore = () => {
    const newOffset = txOffset + TX_LIMIT;
    setTxOffset(newOffset);
    fetchTransactions(newOffset);
  };

  const periodPresets: { value: PeriodPreset; label: string }[] = [
    { value: "today", label: "Сегодня" },
    { value: "week", label: "Неделя" },
    { value: "month", label: "Месяц" },
    { value: "year", label: "Год" },
    { value: "all", label: "Всё время" },
  ];

  const sortedFeeTypes = summary?.by_fee_type
    ? Object.entries(summary.by_fee_type).sort(([, a], [, b]) => b.total - a.total)
    : [];

  const visibleFeeTypes = showAllTypes ? sortedFeeTypes : sortedFeeTypes.slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex gap-1.5 p-1 bg-muted/50 rounded-xl overflow-x-auto">
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
          onClick={() => fetchSummary()}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Summary Cards */}
      {isLoadingSummary ? (
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-white"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <DollarSign className="w-5 h-5 mb-2 opacity-80" />
            <p className="text-xs opacity-80">Общий доход</p>
            <p className="text-xl font-bold mt-0.5">
              {summary.total_revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] opacity-60 mt-0.5">AED</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <TrendingUp className="w-5 h-5 mb-2 opacity-80" />
            <p className="text-xs opacity-80">Транзакций</p>
            <p className="text-xl font-bold mt-0.5">
              {summary.total_transactions.toLocaleString()}
            </p>
            <p className="text-[10px] opacity-60 mt-0.5">с комиссией</p>
          </motion.div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Нет данных за выбранный период
        </div>
      )}

      {/* Fee Type Breakdown */}
      {summary && sortedFeeTypes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-card border border-border p-4 space-y-3"
        >
          <h3 className="text-sm font-semibold text-foreground">По типу комиссии</h3>
          <div className="space-y-2">
            {visibleFeeTypes.map(([type, data], i) => {
              const pct = summary.total_revenue > 0 ? (data.total / summary.total_revenue) * 100 : 0;
              return (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3"
                >
                  <div className={cn("shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold", FEE_TYPE_COLORS[type] || "bg-muted text-muted-foreground")}>
                    {pct.toFixed(0)}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{FEE_TYPE_LABELS[type] || type}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{data.count}</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                    {data.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </motion.div>
              );
            })}
          </div>
          {sortedFeeTypes.length > 4 && (
            <button
              onClick={() => setShowAllTypes(!showAllTypes)}
              className="flex items-center gap-1 text-xs text-primary hover:underline mx-auto"
            >
              {showAllTypes ? "Скрыть" : `Показать все (${sortedFeeTypes.length})`}
              {showAllTypes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </motion.div>
      )}

      {/* Recent Revenue Transactions */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Последние комиссии</h3>
          <span className="text-xs text-muted-foreground">{txCount} всего</span>
        </div>
        <div className="divide-y divide-border">
          {isLoadingTx && transactions.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Нет транзакций с комиссией
            </div>
          ) : (
            <AnimatePresence>
              {transactions.map((tx, i) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="px-4 py-3 flex items-center gap-3"
                >
                  <div className={cn("shrink-0 w-8 h-8 rounded-lg flex items-center justify-center", FEE_TYPE_COLORS[tx.fee_type] || "bg-muted text-muted-foreground")}>
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {FEE_TYPE_LABELS[tx.fee_type] || tx.fee_type}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {tx.created_at ? format(new Date(tx.created_at), "dd.MM.yyyy HH:mm") : "—"}
                      {tx.fee_percent != null && ` · ${tx.fee_percent}%`}
                      {tx.base_amount != null && ` · Base: ${tx.base_amount} ${tx.base_currency ?? ""}`}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    +{(tx.fee_amount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} {tx.fee_currency ?? ""}
                  </span>
                </motion.div>
              ))}
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
