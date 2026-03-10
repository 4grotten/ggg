import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronDown, Download, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { CardTransactionsList } from "@/components/card/CardTransactionsList";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { DateWheelPicker } from "@/components/ui/date-wheel-picker";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { format, startOfDay, endOfDay, startOfWeek, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { TransactionGroup, Transaction } from "@/types/transaction";
import { StatementDownloadDrawer } from "@/components/history/StatementDownloadDrawer";
import { useApiTransactionGroups, useIbanTransactionGroups, useCryptoTransactionGroups, useCardTransactionGroups } from "@/hooks/useTransactions";
import { useQueryClient } from "@tanstack/react-query";
import { transactionKeys } from "@/hooks/useTransactions";
type FilterType = "all" | "income" | "expenses" | "transfers";
type AssetType = "all" | "virtual" | "metal" | "iban" | "crypto";
type PeriodPreset = "allTime" | "today" | "thisWeek" | "month" | "threeMonths" | "nineMonths" | "custom";

const TransactionHistory = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // Fetch real API data
  const { data: apiGroups, isLoading: apiLoading } = useApiTransactionGroups();
  const { data: ibanGroups, isLoading: ibanLoading } = useIbanTransactionGroups();
  const { data: cryptoGroups, isLoading: cryptoLoading } = useCryptoTransactionGroups();
  const { data: cardGroups, isLoading: cardLoading } = useCardTransactionGroups();
  
  const isLoading = apiLoading || ibanLoading || cryptoLoading || cardLoading;
  
  const [activeAsset, setActiveAsset] = useState<AssetType>(() => {
    const p = searchParams.get("asset");
    return (["all", "virtual", "metal", "iban", "crypto"] as AssetType[]).includes(p as AssetType) ? p as AssetType : "all";
  });
  const [activeFilter, setActiveFilter] = useState<FilterType>(() => {
    const p = searchParams.get("filter");
    return (["all", "income", "expenses", "transfers"] as FilterType[]).includes(p as FilterType) ? p as FilterType : "all";
  });
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [selectedPreset, setSelectedPreset] = useState<PeriodPreset>("allTime");
  const [isDateDrawerOpen, setIsDateDrawerOpen] = useState(false);
  const [customDateField, setCustomDateField] = useState<"from" | "to" | null>(null);
  const [tempCustomFrom, setTempCustomFrom] = useState<Date | undefined>(undefined);
  const [tempCustomTo, setTempCustomTo] = useState<Date | undefined>(undefined);
  const [hasSelectedFrom, setHasSelectedFrom] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  
  // Refs for filter sliding indicator
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<FilterType, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Refs for asset sliding indicator
  const assetContainerRef = useRef<HTMLDivElement>(null);
  const assetRefs = useRef<Map<AssetType, HTMLButtonElement>>(new Map());
  const [assetIndicatorStyle, setAssetIndicatorStyle] = useState({ left: 0, width: 0 });
  
  // Sync filter/asset to URL
  useEffect(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (activeFilter !== "all") next.set("filter", activeFilter); else next.delete("filter");
      if (activeAsset !== "all") next.set("asset", activeAsset); else next.delete("asset");
      return next;
    }, { replace: true });
  }, [activeFilter, activeAsset, setSearchParams]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Update filter indicator
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

  // Update asset indicator
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

  const parseTransactionDate = (dateStr: string): Date => {
    const currentYear = new Date().getFullYear();
    const months: Record<string, number> = {
      "January": 0, "February": 1, "March": 2, "April": 3,
      "May": 4, "June": 5, "July": 6, "August": 7,
      "September": 8, "October": 9, "November": 10, "December": 11
    };
    const parts = dateStr.split(" ");
    const month = months[parts[0]] ?? 0;
    const day = parseInt(parts[1]) || 1;
    const year = month > new Date().getMonth() ? currentYear - 1 : currentYear;
    return new Date(year, month, day);
  };

  const isIncomeTransaction = (tx: Transaction): boolean => {
    return tx.type === "topup" || 
           tx.type === "bank_transfer_incoming" || 
           (tx.type === "card_transfer" && !!tx.senderCard);
  };

  const isExpenseTransaction = (tx: Transaction): boolean => {
    return !tx.type || 
           tx.type === "declined" || 
           tx.type === "card_activation" ||
           tx.type === "bank_transfer" ||
           tx.type === "crypto_withdrawal";
  };

  const isTransferTransaction = (tx: Transaction): boolean => {
    return tx.type === "card_transfer" || 
           tx.type === "bank_transfer" || 
           tx.type === "bank_transfer_incoming" ||
           tx.type === "crypto_withdrawal";
  };

  // Asset filtering for mock data
  const isAssetMatch = (tx: Transaction, asset: AssetType): boolean => {
    if (asset === "all") return true;
    const txType = tx.type || "";
    if (asset === "crypto") {
      return txType.includes("crypto") || tx.localCurrency === "USDT";
    }
    if (asset === "iban") {
      return txType.includes("bank_transfer");
    }
    // virtual and metal use the data source directly
    return true;
  };

  const filteredGroups = useMemo(() => {
    // Get groups based on asset type
    let groups: TransactionGroup[] = [];
    if (activeAsset === "all") {
      // Merge virtual and metal
      const virtualGroups = allTransactionsData.virtual || [];
      const metalGroups = allTransactionsData.metal || [];
      const allGroups = [...virtualGroups, ...metalGroups];
      // Merge by date
      const dateMap = new Map<string, TransactionGroup>();
      for (const group of allGroups) {
        if (dateMap.has(group.date)) {
          const existing = dateMap.get(group.date)!;
          dateMap.set(group.date, {
            ...existing,
            totalSpend: existing.totalSpend + group.totalSpend,
            transactions: [...existing.transactions, ...group.transactions],
          });
        } else {
          dateMap.set(group.date, { ...group });
        }
      }
      groups = Array.from(dateMap.values());
    } else if (activeAsset === "virtual" || activeAsset === "metal") {
      groups = allTransactionsData[activeAsset] || [];
    } else {
      // For iban/crypto, filter from all data
      const virtualGroups = allTransactionsData.virtual || [];
      const metalGroups = allTransactionsData.metal || [];
      const allGroups = [...virtualGroups, ...metalGroups];
      const dateMap = new Map<string, TransactionGroup>();
      for (const group of allGroups) {
        const filtered = group.transactions.filter(tx => isAssetMatch(tx, activeAsset));
        if (filtered.length > 0) {
          const key = group.date;
          if (dateMap.has(key)) {
            const existing = dateMap.get(key)!;
            dateMap.set(key, {
              ...existing,
              transactions: [...existing.transactions, ...filtered],
            });
          } else {
            dateMap.set(key, { ...group, transactions: filtered });
          }
        }
      }
      groups = Array.from(dateMap.values());
    }

    // Sort groups by date
    groups.sort((a, b) => parseTransactionDate(b.date).getTime() - parseTransactionDate(a.date).getTime());
    
    return groups.map(group => {
      const groupDate = parseTransactionDate(group.date);
      
      if (dateFrom && groupDate < startOfDay(dateFrom)) {
        return { ...group, transactions: [] };
      }
      if (dateTo && groupDate > endOfDay(dateTo)) {
        return { ...group, transactions: [] };
      }
      
      let filteredTxs = group.transactions;
      if (activeFilter === "income") {
        filteredTxs = group.transactions.filter(isIncomeTransaction);
      } else if (activeFilter === "expenses") {
        filteredTxs = group.transactions.filter(isExpenseTransaction);
      } else if (activeFilter === "transfers") {
        filteredTxs = group.transactions.filter(isTransferTransaction);
      }
      
      return { ...group, transactions: filteredTxs };
    }).filter(group => group.transactions.length > 0);
  }, [activeAsset, activeFilter, dateFrom, dateTo]);

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: "all", label: t("history.all") },
    { key: "income", label: t("history.income") },
    { key: "expenses", label: t("history.expenses") },
    { key: "transfers", label: t("history.transfers") },
  ];

  const assetOptions: { key: AssetType; label: string }[] = [
    { key: "all", label: t("history.allAssets", "Все") },
    { key: "virtual", label: t("history.virtualCard", "Virtual") },
    { key: "metal", label: t("history.metalCard", "Metal") },
    { key: "iban", label: "IBAN" },
    { key: "crypto", label: t("history.crypto", "Крипто") },
  ];

  const today = new Date();
  
  const getPresetDates = (preset: PeriodPreset): { from: Date | undefined; to: Date | undefined } => {
    switch (preset) {
      case "allTime": return { from: undefined, to: undefined };
      case "today": return { from: today, to: today };
      case "thisWeek": return { from: startOfWeek(today, { weekStartsOn: 1 }), to: today };
      case "month": return { from: subMonths(today, 1), to: today };
      case "threeMonths": return { from: subMonths(today, 3), to: today };
      case "nineMonths": return { from: subMonths(today, 9), to: today };
      case "custom": return { from: tempCustomFrom, to: tempCustomTo };
      default: return { from: undefined, to: undefined };
    }
  };

  const formatDateRange = (from: Date | undefined, to: Date | undefined): string => {
    if (!from && !to) return "";
    const formatStr = "dd.MM.yyyy";
    const fromStr = from ? format(from, formatStr) : "...";
    const toStr = to ? format(to, formatStr) : "...";
    return `${fromStr} - ${toStr}`;
  };

  const presetOptions: { key: PeriodPreset; label: string; dateRange: string }[] = [
    { key: "allTime", label: t("history.allTime"), dateRange: "" },
    { key: "today", label: t("history.today"), dateRange: formatDateRange(today, today) },
    { key: "thisWeek", label: t("history.thisWeek"), dateRange: formatDateRange(startOfWeek(today, { weekStartsOn: 1 }), today) },
    { key: "month", label: t("history.month", "Месяц"), dateRange: formatDateRange(subMonths(today, 1), today) },
    { key: "threeMonths", label: t("history.threeMonths", "3 месяца"), dateRange: formatDateRange(subMonths(today, 3), today) },
    { key: "nineMonths", label: t("history.nineMonths", "9 месяцев"), dateRange: formatDateRange(subMonths(today, 9), today) },
  ];

  const handlePresetSelect = (preset: PeriodPreset) => {
    setSelectedPreset(preset);
    const { from, to } = getPresetDates(preset);
    setDateFrom(from);
    setDateTo(to);
    if (preset !== "custom") {
      setIsDateDrawerOpen(false);
    }
  };

  const handleCustomDateSelect = (field: "from" | "to") => {
    setCustomDateField(field);
  };

  const handleWheelDateChange = (date: Date) => {
    if (customDateField === "from") {
      setTempCustomFrom(date);
      setHasSelectedFrom(true);
      if (!tempCustomTo) {
        setTempCustomTo(new Date());
      }
    } else if (customDateField === "to") {
      setTempCustomTo(date);
    }
  };

  const handleCustomDateConfirm = () => {
    if (!tempCustomFrom || !tempCustomTo) return;
    setSelectedPreset("custom");
    setDateFrom(tempCustomFrom);
    setDateTo(tempCustomTo);
    setCustomDateField(null);
    setIsDateDrawerOpen(false);
  };

  const getSelectedPeriodLabel = (): string => {
    if (selectedPreset === "allTime") {
      return t("history.allTime");
    }
    if (selectedPreset === "custom") {
      return `${format(dateFrom || new Date(), "dd.MM.yyyy")} - ${format(dateTo || new Date(), "dd.MM.yyyy")}`;
    }
    const preset = presetOptions.find(p => p.key === selectedPreset);
    return preset?.label || t("history.allTime");
  };

  return (
    <MobileLayout
      header={
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">{t("common.back")}</span>
        </button>
      }
      rightAction={
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      }
    >
      <PullToRefresh onRefresh={handleRefresh} className="h-full">
        <div className="px-4 py-6 space-y-4 pb-28">
          {/* Title with Period Selector */}
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">{t("history.title")}</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsStatementOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                {t("statement.short", "Выписка")}
              </button>
              <button
                onClick={() => setIsDateDrawerOpen(true)}
                className="flex items-center gap-1.5 text-primary"
              >
                <span className="text-sm font-medium">{getSelectedPeriodLabel()}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Asset Category Tabs */}
          <div className="relative" ref={assetContainerRef}>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 relative">
              <motion.div
                className="absolute top-0 h-[calc(100%-4px)] bg-primary rounded-full z-0"
                animate={{ left: assetIndicatorStyle.left, width: assetIndicatorStyle.width }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
              {assetOptions.map((opt) => (
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

          {/* Filter Tabs - Telegram Style */}
          <div className="relative">
            <div 
              ref={tabsContainerRef}
              className="flex gap-0 overflow-x-auto pb-0 -mx-4 px-4 scrollbar-hide relative"
            >
              {/* Sliding indicator */}
              <motion.div
                className="absolute bottom-0 h-[3px] bg-primary rounded-full"
                animate={{
                  left: indicatorStyle.left,
                  width: indicatorStyle.width,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
              
              {filterOptions.map((option) => (
                <button
                  key={option.key}
                  ref={(el) => {
                    if (el) tabRefs.current.set(option.key, el);
                  }}
                  onClick={() => setActiveFilter(option.key)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative",
                    activeFilter === option.key
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {/* Bottom border */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-border/50 -mx-4" />
          </div>

          {/* Transactions List */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeAsset}-${activeFilter}-${dateFrom?.toISOString()}-${dateTo?.toISOString()}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <CardTransactionsList groups={filteredGroups} />
            </motion.div>
          </AnimatePresence>

          {/* Empty State */}
          {filteredGroups.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("history.noTransactions")}</p>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4">
            <PoweredByFooter />
          </div>
        </div>
      </PullToRefresh>

      {/* Period Selection Drawer */}
      <Drawer open={isDateDrawerOpen} onOpenChange={setIsDateDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle>{t("history.selectPeriod", "Выберите период")}</DrawerTitle>
          </DrawerHeader>
          
          <div className="px-4 pb-8 overflow-y-auto">
            {customDateField ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCustomDateField(null)}
                    className="text-sm text-muted-foreground"
                  >
                    {t("common.back", "Назад")}
                  </button>
                  <span className="text-sm font-medium">
                    {customDateField === "from" 
                      ? t("history.selectStartDate", "Выберите начальную дату")
                      : t("history.selectEndDate", "Выберите конечную дату")
                    }
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
                    {t("common.next", "Далее")}
                  </button>
                )}
                
                {customDateField === "to" && tempCustomFrom && tempCustomTo && (
                  <button
                    onClick={handleCustomDateConfirm}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium"
                  >
                    {t("common.apply", "Применить")}
                  </button>
                )}
              </div>
            ) : (
            <div className="space-y-2">
                {presetOptions.map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => handlePresetSelect(preset.key)}
                    className="w-full text-left p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <p className="font-medium">{preset.label}</p>
                    {preset.dateRange && (
                      <p className="text-xs text-muted-foreground mt-0.5">{preset.dateRange}</p>
                    )}
                  </button>
                ))}
                
                {/* Custom Period */}
                <button
                  onClick={() => {
                    setTempCustomFrom(dateFrom);
                    setTempCustomTo(dateTo);
                    setHasSelectedFrom(!!dateFrom);
                    handleCustomDateSelect("from");
                  }}
                  className="w-full text-left p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <p className="font-medium">{t("history.customPeriod", "Свой период")}</p>
                  {selectedPreset === "custom" && dateFrom && dateTo && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDateRange(dateFrom, dateTo)}
                    </p>
                  )}
                </button>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <StatementDownloadDrawer open={isStatementOpen} onOpenChange={setIsStatementOpen} />
    </MobileLayout>
  );
};

export default TransactionHistory;
