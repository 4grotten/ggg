import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { CardTransactionsList } from "@/components/card/CardTransactionsList";
import { DateWheelPicker } from "@/components/ui/date-wheel-picker";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { TransactionGroup, Transaction } from "@/types/transaction";

// All transactions data
const allTransactionsData: Record<string, TransactionGroup[]> = {
  virtual: [
    {
      date: "January 17",
      totalSpend: 0,
      transactions: [
        { id: "23", merchant: "Bank Transfer", time: "14:30", amountUSDT: 28000.00, amountLocal: 28000.00, localCurrency: "AED", color: "#22C55E", type: "bank_transfer_incoming", status: "settled" },
        { id: "22", merchant: "Top up", time: "11:15", amountUSDT: 50410.96, amountLocal: 184000.00, localCurrency: "USDT", color: "#22C55E", type: "topup", status: "settled" },
      ],
    },
    {
      date: "January 12",
      totalSpend: 2420.00,
      transactions: [
        { id: "21", merchant: "Bank Transfer", time: "19:45", amountUSDT: 1890.00, amountLocal: 1890.00, localCurrency: "AED", color: "#8B5CF6", type: "bank_transfer", status: "settled" },
        { id: "20", merchant: "Stablecoin Send", time: "18:20", amountUSDT: 280.00, amountLocal: 1033.20, localCurrency: "AED", color: "#10B981", type: "crypto_withdrawal", status: "settled" },
        { id: "19", merchant: "Card Transfer", time: "16:45", amountUSDT: 50.00, amountLocal: 50.00, localCurrency: "AED", color: "#22C55E", type: "card_transfer", senderName: "ANNA JOHNSON", senderCard: "8834", status: "settled" },
      ],
    },
    {
      date: "January 10",
      totalSpend: 125.87,
      transactions: [
        { id: "1", merchant: "LIFE", time: "13:02", amountUSDT: 8.34, amountLocal: 29.87, localCurrency: "AED", color: "#3B82F6" },
        { id: "2", merchant: "ALAYA", time: "00:59", amountUSDT: 26.80, amountLocal: 96.00, localCurrency: "AED", color: "#22C55E" },
      ],
    },
    {
      date: "December 31",
      totalSpend: 22.06,
      transactions: [
        { id: "5", merchant: "CELLAR", time: "20:48", amountUSDT: 22.06, amountLocal: 79.00, localCurrency: "AED", color: "#EAB308" },
        { id: "6", merchant: "Top up", time: "20:46", amountUSDT: 194.10, amountLocal: 200.00, localCurrency: "USDT", color: "#22C55E", type: "topup", status: "settled" },
      ],
    },
    {
      date: "December 30",
      totalSpend: 678.58,
      transactions: [
        { id: "12", merchant: "RESTAURANT", time: "03:21", amountUSDT: 424.81, amountLocal: 418.53, localCurrency: "AED", color: "#EF4444" },
      ],
    },
    {
      date: "December 21",
      totalSpend: 204.55,
      transactions: [
        { id: "15", merchant: "Annual Card fee", time: "23:31", amountUSDT: 56.04, amountLocal: 204.55, localCurrency: "AED", color: "#CCFF00", type: "card_activation" },
        { id: "16", merchant: "Top up", time: "23:30", amountUSDT: 44.10, amountLocal: 50.00, localCurrency: "USDT", color: "#22C55E", type: "topup", status: "settled" },
      ],
    },
  ],
  metal: [
    {
      date: "January 12",
      totalSpend: 350.00,
      transactions: [
        { id: "17", merchant: "Card Transfer", time: "15:30", amountUSDT: 250.00, amountLocal: 250.00, localCurrency: "AED", color: "#007AFF", type: "card_transfer", recipientCard: "4521", status: "processing" },
        { id: "18", merchant: "Card Transfer", time: "12:15", amountUSDT: 100.00, amountLocal: 100.00, localCurrency: "AED", color: "#007AFF", type: "card_transfer", recipientCard: "8834", status: "settled" },
      ],
    },
    {
      date: "January 10",
      totalSpend: 193.60,
      transactions: [
        { id: "3", merchant: "Ongaku", time: "00:17", amountUSDT: 54.05, amountLocal: 193.60, localCurrency: "AED", color: "#F97316" },
      ],
    },
    {
      date: "January 02",
      totalSpend: 225.00,
      transactions: [
        { id: "4", merchant: "OPERA", time: "20:20", amountUSDT: 62.82, amountLocal: 225.00, localCurrency: "AED", color: "#A855F7" },
      ],
    },
    {
      date: "December 30",
      totalSpend: 996.50,
      transactions: [
        { id: "7", merchant: "BHPC", time: "20:16", amountUSDT: 125.64, amountLocal: 450.00, localCurrency: "AED", color: "#EAB308" },
        { id: "8", merchant: "Bhpc", time: "20:15", amountUSDT: 142.90, amountLocal: 140.78, localCurrency: "$", color: "#EC4899", type: "declined" },
        { id: "9", merchant: "Bhpc", time: "20:14", amountUSDT: 157.49, amountLocal: 155.16, localCurrency: "$", color: "#EC4899", type: "declined" },
        { id: "11", merchant: "Service CEO", time: "07:58", amountUSDT: 11.59, amountLocal: 41.50, localCurrency: "AED", color: "#06B6D4" },
        { id: "13", merchant: "Top up", time: "02:30", amountUSDT: 494.10, amountLocal: 500.00, localCurrency: "USDT", color: "#22C55E", type: "topup", status: "settled" },
      ],
    },
  ],
};

type FilterType = "all" | "income" | "expenses" | "transfers";
type PeriodPreset = "allTime" | "today" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "custom";

const TransactionHistory = () => {
  const navigate = useNavigate();
  const { type } = useParams<{ type: string }>();
  const { t } = useTranslation();
  
  const cardType = (type === "metal" ? "metal" : "virtual") as "virtual" | "metal";
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [selectedPreset, setSelectedPreset] = useState<PeriodPreset>("allTime");
  const [isDateDrawerOpen, setIsDateDrawerOpen] = useState(false);
  const [customDateField, setCustomDateField] = useState<"from" | "to" | null>(null);
  const [tempCustomFrom, setTempCustomFrom] = useState<Date | undefined>(undefined);
  const [tempCustomTo, setTempCustomTo] = useState<Date | undefined>(undefined);
  const [hasSelectedFrom, setHasSelectedFrom] = useState(false);
  
  // Refs for sliding indicator
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<FilterType, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Update indicator position when active filter changes
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

  const filteredGroups = useMemo(() => {
    const groups = allTransactionsData[cardType] || [];
    
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
  }, [cardType, activeFilter, dateFrom, dateTo]);

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: "all", label: t("history.all") },
    { key: "income", label: t("history.income") },
    { key: "expenses", label: t("history.expenses") },
    { key: "transfers", label: t("history.transfers") },
  ];

  const today = new Date();
  
  const getPresetDates = (preset: PeriodPreset): { from: Date | undefined; to: Date | undefined } => {
    switch (preset) {
      case "allTime":
        return { from: undefined, to: undefined };
      case "today":
        return { from: today, to: today };
      case "thisWeek":
        return { from: startOfWeek(today, { weekStartsOn: 1 }), to: today };
      case "lastWeek":
        const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
        const lastWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
        return { from: lastWeekStart, to: lastWeekEnd };
      case "thisMonth":
        return { from: startOfMonth(today), to: today };
      case "lastMonth":
        const lastMonth = subMonths(today, 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      case "custom":
        return { from: tempCustomFrom, to: tempCustomTo };
      default:
        return { from: undefined, to: undefined };
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
    { key: "lastWeek", label: t("history.lastWeek"), dateRange: formatDateRange(startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }), endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 })) },
    { key: "thisMonth", label: t("history.thisMonth"), dateRange: formatDateRange(startOfMonth(today), today) },
    { key: "lastMonth", label: t("history.lastMonth"), dateRange: formatDateRange(startOfMonth(subMonths(today, 1)), endOfMonth(subMonths(today, 1))) },
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
      // Auto-set end date to today when selecting start date
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
        <div className="flex bg-secondary rounded-lg p-1">
          <button
            onClick={() => navigate("/card/virtual/history", { replace: true })}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
              cardType === "virtual" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Virtual
          </button>
          <button
            onClick={() => navigate("/card/metal/history", { replace: true })}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
              cardType === "metal" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Metal
          </button>
        </div>
      }
    >
      <PullToRefresh onRefresh={handleRefresh} className="h-full">
        <div className="px-4 py-6 space-y-4 pb-28">
          {/* Title with Period Selector */}
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">{t("history.title")}</h1>
            <button
              onClick={() => setIsDateDrawerOpen(true)}
              className="flex items-center gap-1.5 text-primary"
            >
              <span className="text-sm font-medium">{getSelectedPeriodLabel()}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
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
              key={`${cardType}-${activeFilter}-${dateFrom?.toISOString()}-${dateTo?.toISOString()}`}
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
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl transition-colors",
                      selectedPreset === preset.key
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    <div className="text-left">
                      <p className="font-medium">{preset.label}</p>
                      {preset.dateRange && (
                        <p className="text-xs text-muted-foreground mt-0.5">{preset.dateRange}</p>
                      )}
                    </div>
                    {selectedPreset === preset.key && (
                      <Check className="w-5 h-5 text-primary" />
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
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-xl transition-colors",
                    selectedPreset === "custom"
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-secondary hover:bg-secondary/80"
                  )}
                >
                  <div className="text-left">
                    <p className="font-medium">{t("history.customPeriod", "Свой период")}</p>
                    {selectedPreset === "custom" && dateFrom && dateTo && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDateRange(dateFrom, dateTo)}
                      </p>
                    )}
                  </div>
                  {selectedPreset === "custom" && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </button>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </MobileLayout>
  );
};

export default TransactionHistory;