import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { DateWheelPicker } from "@/components/ui/date-wheel-picker";
import { CardTransactionsList } from "@/components/card/CardTransactionsList";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/services/api/apiClient";
import { BackendClientDetail } from "@/hooks/useAdminManagement";
import { Transaction as AppTransaction, TransactionGroup as AppTransactionGroup } from "@/types/transaction";

const TX_TYPE_LABELS: Record<string, string> = {
  topup: "Top Up", card_to_card: "Card → Card", bank_withdrawal: "Bank Withdrawal",
  crypto_to_card: "Crypto → Card", card_to_iban: "Card → IBAN", crypto_to_iban: "Crypto → IBAN",
  bank_topup: "Bank Top Up", crypto_topup: "Crypto Top Up", transfer_in: "Transfer In",
  transfer_out: "Transfer Out", card_payment: "Card Payment", fee: "Fee",
  bank_transfer: "Bank Transfer", bank_transfer_incoming: "Bank Transfer In",
  crypto_withdrawal: "Crypto Withdrawal", crypto_deposit: "Crypto Deposit",
  card_transfer: "Card Transfer", card_activation: "Card Activation",
  refund: "Refund", cashback: "Cashback",
};

type FilterType = "all" | "income" | "expenses" | "transfers";
type PeriodPreset = "allTime" | "today" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "custom";

interface ClientTransaction {
  id: string;
  user_id?: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at?: string;
  description?: string;
  merchant_name?: string;
  receiver_name?: string;
  sender_name?: string;
  sender_id?: string | null;
  receiver_id?: string | null;
  fee?: number;
  exchange_rate?: number | null;
  original_amount?: number | null;
  original_currency?: string | null;
  card_id?: string;
  metadata?: Record<string, unknown>;
}

interface TransactionGroup {
  date: string;
  rawDate: Date;
  transactions: ClientTransaction[];
}

const isIncome = (tx: ClientTransaction): boolean => {
  const t = tx.type.toLowerCase();
  return t.includes("topup") || t.includes("top_up") || t.includes("transfer_in") ||
    t.includes("incoming") || t === "refund" || t === "cashback" || t.includes("deposit");
};

const isExpense = (tx: ClientTransaction): boolean => {
  const t = tx.type.toLowerCase();
  return t.includes("withdrawal") || t.includes("transfer_out") || t.includes("payment") ||
    t === "fee" || t === "card_activation" || t.includes("card_to_") || t.includes("crypto_to_") ||
    t.includes("_to_iban") || t.includes("_to_card");
};

const isTransfer = (tx: ClientTransaction): boolean => {
  const t = tx.type.toLowerCase();
  return t.includes("transfer") || t.includes("card_to_") || t.includes("crypto_to_") ||
    t.includes("bank_") || t === "card_transfer";
};

export default function AdminClientTransactionHistory() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { t } = useTranslation();

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [activeAsset, setActiveAsset] = useState<AssetType>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [selectedPreset, setSelectedPreset] = useState<PeriodPreset>("allTime");
  const [isDateDrawerOpen, setIsDateDrawerOpen] = useState(false);
  const [customDateField, setCustomDateField] = useState<"from" | "to" | null>(null);
  const [tempCustomFrom, setTempCustomFrom] = useState<Date | undefined>(undefined);
  const [tempCustomTo, setTempCustomTo] = useState<Date | undefined>(undefined);
  const [hasSelectedFrom, setHasSelectedFrom] = useState(false);

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<FilterType, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  type AssetType = "all" | "virtual" | "metal" | "iban" | "crypto";
  const assetContainerRef = useRef<HTMLDivElement>(null);
  const assetRefs = useRef<Map<AssetType, HTMLButtonElement>>(new Map());
  const [assetIndicatorStyle, setAssetIndicatorStyle] = useState({ left: 0, width: 0 });

  // Build query params for the transactions API
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    // Map asset filter to API type/card_type params
    if (activeAsset === "virtual") { params.set("type", "card"); params.set("card_type", "virtual"); }
    else if (activeAsset === "metal") { params.set("type", "card"); params.set("card_type", "metal"); }
    else if (activeAsset === "iban") { params.set("type", "bank"); }
    else if (activeAsset === "crypto") { params.set("type", "crypto"); }
    // Date filters
    if (dateFrom) params.set("start_date", format(dateFrom, "yyyy-MM-dd"));
    if (dateTo) params.set("end_date", format(dateTo, "yyyy-MM-dd"));
    params.set("limit", "100");
    return params.toString();
  };

  // Fetch transactions from dedicated endpoint
  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ["admin-client-transactions", userId, activeAsset, dateFrom?.toISOString(), dateTo?.toISOString()],
    queryFn: async () => {
      if (!userId) throw new Error("No user ID");
      const qs = buildQueryParams();
      const res = await apiRequest<ClientTransaction[]>(`/transactions/admin/user/${userId}/transactions/?${qs}`, {}, true);
      if (res.error || !res.data) {
        const msg = res.error?.detail || res.error?.message || "Failed";
        if (msg.includes('Connection refused') || msg.includes('tcp connect error')) return [];
        throw new Error(msg);
      }
      return res.data;
    },
    enabled: !!userId,
  });

  // Fetch client info (for header display only)
  const { data: client } = useQuery({
    queryKey: ["admin-client-detail", userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user ID");
      const res = await apiRequest<BackendClientDetail>(`/admin/users/${userId}/detail/`);
      if (res.error || !res.data) throw new Error(res.error?.detail || "Failed");
      return res.data;
    },
    enabled: !!userId,
  });

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const activeTab = tabRefs.current.get(activeFilter);
    const container = tabsContainerRef.current;
    if (activeTab && container) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      setIndicatorStyle({
        left: tabRect.left - containerRect.left + container.scrollLeft,
        width: tabRect.width,
      });
    }
  }, [activeFilter]);

  useEffect(() => {
    const activeBtn = assetRefs.current.get(activeAsset);
    const container = assetContainerRef.current;
    if (activeBtn && container) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setAssetIndicatorStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [activeAsset]);

  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    toast.success(t('toast.dataUpdated'));
  };

  const mapTypeToAppType = (type: string): AppTransaction["type"] => {
    const t = type.toLowerCase();
    if (t === "topup" || t === "top_up" || t === "bank_topup" || t === "crypto_topup") return "topup";
    if (t === "card_to_card" || t === "card_transfer") return "card_transfer";
    if (t === "bank_withdrawal" || t === "bank_transfer") return "bank_transfer";
    if (t === "bank_transfer_incoming" || t === "transfer_in") return "bank_transfer_incoming";
    if (t === "crypto_to_card") return "crypto_to_card";
    if (t === "crypto_to_iban" || t === "card_to_iban") return "crypto_to_iban" as any;
    if (t === "crypto_to_crypto") return "crypto_withdrawal";
    if (t === "crypto_withdrawal" || t === "crypto_send") return "crypto_withdrawal";
    if (t === "crypto_deposit") return "crypto_deposit";
    if (t === "card_activation") return "card_activation" as any;
    if (t === "card_payment" || t === "payment") return "payment";
    if (t === "declined") return "declined" as any;
    if (t === "fee") return "payment";
    if (t === "refund" || t === "cashback") return "topup";
    return "payment";
  };

  const mapToAppTransaction = (tx: ClientTransaction): AppTransaction => {
    const d = new Date(tx.created_at);
    const incoming = isIncome(tx);
    const mappedType = mapTypeToAppType(tx.type);
    
    // Build metadata with direction info for CardTransactionsList icon logic
    const metadata: Record<string, unknown> = {
      ...(tx.metadata || {}),
      originalApiType: tx.type,
      isIncoming: incoming,
    };

    return {
      id: tx.id,
      merchant: TX_TYPE_LABELS[tx.type] || tx.type,
      time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      amountUSDT: tx.amount,
      amountLocal: tx.amount,
      localCurrency: tx.currency,
      color: incoming ? "#22C55E" : "#007AFF",
      type: mappedType,
      status: tx.status === "completed" ? "settled" : tx.status === "pending" ? "processing" : undefined,
      recipientName: tx.receiver_name,
      senderName: tx.sender_name,
      description: tx.description || TX_TYPE_LABELS[tx.type] || tx.type,
      fee: tx.fee,
      metadata,
      createdAt: tx.created_at,
    };
  };

  const groups = useMemo((): TransactionGroup[] => {
    if (!transactions || transactions.length === 0) return [];
    const sorted = [...transactions].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const map = new Map<string, ClientTransaction[]>();
    for (const tx of sorted) {
      const d = new Date(tx.created_at);
      const key = format(d, "dd.MM.yyyy");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }
    return Array.from(map.entries()).map(([date, txs]) => ({
      date,
      rawDate: new Date(txs[0].created_at),
      transactions: txs,
    }));
  }, [transactions]);

  const isAssetMatch = (tx: ClientTransaction, asset: AssetType): boolean => {
    if (asset === "all") return true;
    const t = tx.type.toLowerCase();
    const desc = (tx.description || "").toLowerCase();
    const isCrypto = t.includes("crypto") || t.includes("usdt") || desc.includes("usdt") || desc.includes("trc20") || desc.includes("crypto");
    if (asset === "crypto") return isCrypto;
    if (isCrypto) return false;
    if (asset === "virtual") return (t.includes("card") || t === "payment" || t === "topup" || t === "fee" || t === "card_activation" || t === "refund" || t === "cashback") && !desc.includes("metal");
    if (asset === "metal") return (t.includes("card") || t === "payment" || t === "topup" || t === "fee" || t === "refund" || t === "cashback") && desc.includes("metal");
    if (asset === "iban") return t.includes("iban") || t.includes("bank") || t.includes("transfer_in") || t.includes("transfer_out") || desc.includes("iban");
    return true;
  };

  const filteredGroups = useMemo((): AppTransactionGroup[] => {
    return groups.map(group => {
      let txs = group.transactions;
      // Client-side filter by income/expense/transfer type
      if (activeFilter === "income") txs = txs.filter(isIncome);
      else if (activeFilter === "expenses") txs = txs.filter(isExpense);
      else if (activeFilter === "transfers") txs = txs.filter(isTransfer);
      if (txs.length === 0) return null;
      const appTxs = txs.map(mapToAppTransaction);
      const totalSpend = appTxs.filter(t => !isIncome(txs.find(x => x.id === t.id)!)).reduce((s, t) => s + t.amountLocal, 0);
      return { date: group.date, totalSpend, transactions: appTxs };
    }).filter(Boolean) as AppTransactionGroup[];
  }, [groups, activeFilter]);

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: "all", label: t("history.all") },
    { key: "income", label: t("history.income") },
    { key: "expenses", label: t("history.expenses") },
    { key: "transfers", label: t("history.transfers") },
  ];

  const today = new Date();

  const getPresetDates = (preset: PeriodPreset) => {
    switch (preset) {
      case "allTime": return { from: undefined, to: undefined };
      case "today": return { from: today, to: today };
      case "thisWeek": return { from: startOfWeek(today, { weekStartsOn: 1 }), to: today };
      case "lastWeek": return { from: startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }), to: endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }) };
      case "thisMonth": return { from: startOfMonth(today), to: today };
      case "lastMonth": return { from: startOfMonth(subMonths(today, 1)), to: endOfMonth(subMonths(today, 1)) };
      case "custom": return { from: tempCustomFrom, to: tempCustomTo };
      default: return { from: undefined, to: undefined };
    }
  };

  const formatDateRange = (from: Date | undefined, to: Date | undefined): string => {
    if (!from && !to) return "";
    const f = "dd.MM.yyyy";
    return `${from ? format(from, f) : "..."} - ${to ? format(to, f) : "..."}`;
  };

  const presetOptions = [
    { key: "allTime" as PeriodPreset, label: t("history.allTime"), dateRange: "" },
    { key: "today" as PeriodPreset, label: t("history.today"), dateRange: formatDateRange(today, today) },
    { key: "thisWeek" as PeriodPreset, label: t("history.thisWeek"), dateRange: formatDateRange(startOfWeek(today, { weekStartsOn: 1 }), today) },
    { key: "lastWeek" as PeriodPreset, label: t("history.lastWeek"), dateRange: formatDateRange(startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }), endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 })) },
    { key: "thisMonth" as PeriodPreset, label: t("history.thisMonth"), dateRange: formatDateRange(startOfMonth(today), today) },
    { key: "lastMonth" as PeriodPreset, label: t("history.lastMonth"), dateRange: formatDateRange(startOfMonth(subMonths(today, 1)), endOfMonth(subMonths(today, 1))) },
  ];

  const handlePresetSelect = (preset: PeriodPreset) => {
    setSelectedPreset(preset);
    const { from, to } = getPresetDates(preset);
    setDateFrom(from); setDateTo(to);
    if (preset !== "custom") setIsDateDrawerOpen(false);
  };

  const handleWheelDateChange = (date: Date) => {
    if (customDateField === "from") {
      setTempCustomFrom(date); setHasSelectedFrom(true);
      if (!tempCustomTo) setTempCustomTo(new Date());
    } else if (customDateField === "to") {
      setTempCustomTo(date);
    }
  };

  const handleCustomDateConfirm = () => {
    if (!tempCustomFrom || !tempCustomTo) return;
    setSelectedPreset("custom");
    setDateFrom(tempCustomFrom); setDateTo(tempCustomTo);
    setCustomDateField(null); setIsDateDrawerOpen(false);
  };

  const getSelectedPeriodLabel = (): string => {
    if (selectedPreset === "allTime") return t("history.allTime");
    if (selectedPreset === "custom") return `${format(dateFrom || new Date(), "dd.MM.yyyy")} - ${format(dateTo || new Date(), "dd.MM.yyyy")}`;
    return presetOptions.find(p => p.key === selectedPreset)?.label || t("history.allTime");
  };

  return (
    <MobileLayout
      header={
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">{t("common.back")}</span>
        </button>
      }
      rightAction={<LanguageSwitcher />}
    >
      <PullToRefresh onRefresh={handleRefresh} className="h-full">
        <div className="px-4 py-6 space-y-4 pb-28">
          {/* Title + Period */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {client && (
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/20 shrink-0">
                  {client.avatar_url ? (
                    <img src={client.avatar_url} alt={client.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-sm">
                      {(client.full_name || "?").charAt(0)}
                    </div>
                  )}
                </div>
              )}
              <div>
                <h1 className="text-lg font-semibold">{t("history.title")}</h1>
                {client && <p className="text-xs text-muted-foreground">{client.full_name} · ID {client.user_id}</p>}
              </div>
            </div>
            <button onClick={() => setIsDateDrawerOpen(true)} className="flex items-center gap-1.5 text-primary">
              <span className="text-sm font-medium">{getSelectedPeriodLabel()}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Asset Category */}
          <div className="relative" ref={assetContainerRef}>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 relative">
              <motion.div
                className="absolute top-0 h-[calc(100%-4px)] bg-primary rounded-full z-0"
                animate={{ left: assetIndicatorStyle.left, width: assetIndicatorStyle.width }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
              {([
                { key: "all" as AssetType, label: t("history.allAssets", "Все") },
                { key: "virtual" as AssetType, label: t("history.virtualCard", "Virtual") },
                { key: "metal" as AssetType, label: t("history.metalCard", "Metal") },
                { key: "iban" as AssetType, label: "IBAN" },
                { key: "crypto" as AssetType, label: t("history.crypto", "Крипто") },
              ]).map((opt) => (
                <button
                  key={opt.key}
                  ref={(el) => { if (el) assetRefs.current.set(opt.key, el); }}
                  onClick={() => setActiveAsset(opt.key)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors relative z-10",
                    activeAsset === opt.key
                      ? "text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="relative">
            <div ref={tabsContainerRef} className="flex gap-0 overflow-x-auto pb-0 -mx-4 px-4 scrollbar-hide relative">
              <motion.div
                className="absolute bottom-0 h-[3px] bg-primary rounded-full"
                animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
              {filterOptions.map((option) => (
                <button
                  key={option.key}
                  ref={(el) => { if (el) tabRefs.current.set(option.key, el); }}
                  onClick={() => setActiveFilter(option.key)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative",
                    activeFilter === option.key ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-border/50 -mx-4" />
          </div>

          {/* Transactions */}
          {txLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />)}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeFilter}-${dateFrom?.toISOString()}-${dateTo?.toISOString()}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <CardTransactionsList groups={filteredGroups} />
              </motion.div>
            </AnimatePresence>
          )}

          {!txLoading && filteredGroups.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("history.noTransactions")}</p>
            </div>
          )}

          <div className="pt-4"><PoweredByFooter /></div>
        </div>
      </PullToRefresh>

      {/* Period Drawer */}
      <Drawer open={isDateDrawerOpen} onOpenChange={setIsDateDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle>{t("history.selectPeriod", "Выберите период")}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 overflow-y-auto">
            {customDateField ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button onClick={() => setCustomDateField(null)} className="text-sm text-muted-foreground">{t("common.back", "Назад")}</button>
                  <span className="text-sm font-medium">
                    {customDateField === "from" ? t("history.selectStartDate", "Начальная дата") : t("history.selectEndDate", "Конечная дата")}
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
                  <button onClick={() => setCustomDateField("to")} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium">
                    {t("common.next", "Далее")}
                  </button>
                )}
                {customDateField === "to" && tempCustomFrom && tempCustomTo && (
                  <button onClick={handleCustomDateConfirm} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium">
                    {t("common.apply", "Применить")}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {presetOptions.map((preset) => (
                  <button key={preset.key} onClick={() => handlePresetSelect(preset.key)} className="w-full text-left p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                    <p className="font-medium">{preset.label}</p>
                    {preset.dateRange && <p className="text-xs text-muted-foreground mt-0.5">{preset.dateRange}</p>}
                  </button>
                ))}
                <button
                  onClick={() => { setTempCustomFrom(dateFrom); setTempCustomTo(dateTo); setHasSelectedFrom(!!dateFrom); setCustomDateField("from"); }}
                  className="w-full text-left p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <p className="font-medium">{t("history.customPeriod", "Свой период")}</p>
                  {selectedPreset === "custom" && dateFrom && dateTo && (
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDateRange(dateFrom, dateTo)}</p>
                  )}
                </button>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </MobileLayout>
  );
}