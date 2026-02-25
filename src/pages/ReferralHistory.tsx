import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
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
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { MOCK_TRANSACTIONS } from "@/components/partner/ReferralTransactions";
import { ReferralHistoryList } from "@/components/partner/ReferralHistoryList";

type FilterType = "all" | "cards" | "transactions" | "withdrawals";
type PeriodPreset = "allTime" | "today" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "custom";

const ReferralHistory = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  
  const [activeFilter, setActiveFilter] = useState<FilterType>(() => {
    const p = searchParams.get("filter");
    return (["all", "cards", "transactions", "withdrawals"] as FilterType[]).includes(p as FilterType) ? p as FilterType : "all";
  });
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
  
  // Sync filter tab to URL search params so it persists across navigation
  useEffect(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (activeFilter !== "all") next.set("filter", activeFilter); else next.delete("filter");
      return next;
    }, { replace: true });
  }, [activeFilter, setSearchParams]);

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

  const today = new Date();

  const filteredTransactions = useMemo(() => {
    let filtered = [...MOCK_TRANSACTIONS];
    
    // Apply type filter
    if (activeFilter === "cards") {
      filtered = filtered.filter(tx => tx.type === "card");
    } else if (activeFilter === "transactions") {
      filtered = filtered.filter(tx => tx.type === "transaction");
    } else if (activeFilter === "withdrawals") {
      filtered = filtered.filter(tx => tx.type === "withdrawal");
    }
    
    // Apply date filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.dateTimestamp);
        if (dateFrom && txDate < startOfDay(dateFrom)) return false;
        if (dateTo && txDate > endOfDay(dateTo)) return false;
        return true;
      });
    }
    
    // Sort by date
    filtered.sort((a, b) => b.dateTimestamp - a.dateTimestamp);
    
    return filtered;
  }, [activeFilter, dateFrom, dateTo]);

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: "all", label: t("partner.filterAll", "Все") },
    { key: "cards", label: t("partner.filterCards", "Карты") },
    { key: "transactions", label: t("partner.filterTransactions", "Транзакции") },
    { key: "withdrawals", label: t("partner.filterWithdrawals", "Выводы") },
  ];

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
    { key: "allTime", label: t("history.allTime", "Всё время"), dateRange: "" },
    { key: "today", label: t("history.today", "Сегодня"), dateRange: formatDateRange(today, today) },
    { key: "thisWeek", label: t("history.thisWeek", "Эта неделя"), dateRange: formatDateRange(startOfWeek(today, { weekStartsOn: 1 }), today) },
    { key: "lastWeek", label: t("history.lastWeek", "Прошлая неделя"), dateRange: formatDateRange(startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }), endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 })) },
    { key: "thisMonth", label: t("history.thisMonth", "Этот месяц"), dateRange: formatDateRange(startOfMonth(today), today) },
    { key: "lastMonth", label: t("history.lastMonth", "Прошлый месяц"), dateRange: formatDateRange(startOfMonth(subMonths(today, 1)), endOfMonth(subMonths(today, 1))) },
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
      return t("history.allTime", "Всё время");
    }
    if (selectedPreset === "custom") {
      return `${format(dateFrom || new Date(), "dd.MM.yyyy")} - ${format(dateTo || new Date(), "dd.MM.yyyy")}`;
    }
    const preset = presetOptions.find(p => p.key === selectedPreset);
    return preset?.label || t("history.allTime", "Всё время");
  };

  return (
    <MobileLayout
      header={
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">{t("common.back", "Назад")}</span>
        </button>
      }
      title={t("partner.referralHistory", "Реферальная история")}
      rightAction={<LanguageSwitcher />}
    >
      <PullToRefresh onRefresh={handleRefresh} className="h-full">
        <div className="px-4 py-6 space-y-4 pb-28">
          {/* Period Selector */}
          <div className="flex items-center justify-end">
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
              key={`${activeFilter}-${dateFrom?.toISOString()}-${dateTo?.toISOString()}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ReferralHistoryList transactions={filteredTransactions} />
            </motion.div>
          </AnimatePresence>

          <PoweredByFooter />
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
                  minYear={2024}
                  maxYear={new Date().getFullYear()}
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

export default ReferralHistory;
