import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { DateWheelPicker } from "@/components/ui/date-wheel-picker";
import { Badge } from "@/components/ui/badge";
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
  type: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  description?: string;
  merchant_name?: string;
  receiver_name?: string;
  sender_name?: string;
  fee?: number;
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
        left: btnRect.left - containerRect.left + container.scrollLeft,
        width: btnRect.width,
      });
    }
  }, [activeAsset]);

  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    toast.success(t('toast.dataUpdated'));
  };

  const groups = useMemo((): TransactionGroup[] => {
    if (!client?.transactions) return [];
    const sorted = [...client.transactions].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const map = new Map<string, ClientTransaction[]>();
    for (const tx of sorted) {
      const d = new Date(tx.created_at);
      const key = format(d, "MMMM dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }
    return Array.from(map.entries()).map(([date, txs]) => ({
      date,
      rawDate: new Date(txs[0].created_at),
      transactions: txs,
    }));
  }, [client?.transactions]);

  const isAssetMatch = (tx: ClientTransaction, asset: AssetType): boolean => {
    if (asset === "all") return true;
    const t = tx.type.toLowerCase();
    const desc = (tx.description || "").toLowerCase();
    // Crypto takes priority — if it looks like crypto, it's crypto
    const isCrypto = t.includes("crypto") || t.includes("usdt") || desc.includes("usdt") || desc.includes("trc20") || desc.includes("crypto");
    if (asset === "crypto") return isCrypto;
    // Exclude crypto from card/other categories
    if (isCrypto) return false;
    if (asset === "virtual") return (t.includes("card") || t === "payment" || t === "topup" || t === "fee" || t === "card_activation" || t === "refund" || t === "cashback") && !desc.includes("metal");
    if (asset === "metal") return (t.includes("card") || t === "payment" || t === "topup" || t === "fee" || t === "refund" || t === "cashback") && desc.includes("metal");
    if (asset === "iban") return t.includes("iban") || t.includes("bank") || t.includes("transfer_in") || t.includes("transfer_out") || desc.includes("iban");
    return true;
  };

  const filteredGroups = useMemo(() => {
    return groups.map(group => {
      if (dateFrom && group.rawDate < startOfDay(dateFrom)) return { ...group, transactions: [] };
      if (dateTo && group.rawDate > endOfDay(dateTo)) return { ...group, transactions: [] };
      let txs = group.transactions;
      txs = txs.filter(tx => isAssetMatch(tx, activeAsset));
      if (activeFilter === "income") txs = txs.filter(isIncome);
      else if (activeFilter === "expenses") txs = txs.filter(isExpense);
      else if (activeFilter === "transfers") txs = txs.filter(isTransfer);
      return { ...group, transactions: txs };
    }).filter(g => g.transactions.length > 0);
  }, [groups, activeFilter, activeAsset, dateFrom, dateTo]);

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
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
            {([
              { key: "all" as AssetType, label: t("history.allAssets", "Все") },
              { key: "virtual" as AssetType, label: t("history.virtualCard", "Virtual") },
              { key: "metal" as AssetType, label: t("history.metalCard", "Metal") },
              { key: "iban" as AssetType, label: "IBAN" },
              { key: "crypto" as AssetType, label: t("history.crypto", "Крипто") },
            ]).map((opt) => (
              <motion.button
                key={opt.key}
                onClick={() => setActiveAsset(opt.key)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  activeAsset === opt.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                )}
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                {opt.label}
              </motion.button>
            ))}
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
          {isLoading ? (
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
                {filteredGroups.map((group) => (
                  <div key={group.date} className="mb-4">
                    <p className="text-xs text-muted-foreground font-medium mb-2">{group.date}</p>
                    <div className="space-y-1.5">
                      {group.transactions.map((tx) => {
                        const incoming = isIncome(tx);
                        return (
                          <div key={tx.id} className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{TX_TYPE_LABELS[tx.type] || tx.type}</p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {tx.description || tx.merchant_name || tx.receiver_name || tx.sender_name || "—"}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(tx.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <p className={cn("text-sm font-bold", incoming ? "text-emerald-500" : "text-destructive")}>
                                {incoming ? "+" : "-"}{tx.amount.toLocaleString()} {tx.currency}
                              </p>
                              <Badge
                                variant={tx.status === "completed" ? "default" : tx.status === "pending" ? "secondary" : "destructive"}
                                className="text-[8px]"
                              >
                                {tx.status}
                              </Badge>
                              {tx.fee != null && tx.fee > 0 && (
                                <p className="text-[10px] text-muted-foreground">Fee: {tx.fee} {tx.currency}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {!isLoading && filteredGroups.length === 0 && (
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