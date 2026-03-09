import { useState, useEffect } from "react";
import { Download, Loader2, CheckCircle, CreditCard, Landmark, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useWalletSummary, useBankAccounts, useCryptoWallets } from "@/hooks/useCards";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthToken } from "@/services/api/apiClient";
import { subMonths, subYears, format } from "date-fns";


type PeriodOption = "1m" | "3m" | "6m" | "9m" | "1y";

interface AssetItem {
  id: string;
  label: string;
  sublabel?: string;
  type: "card" | "iban" | "crypto";
}

interface StatementDownloadDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StatementDownloadDrawer = ({ open, onOpenChange }: StatementDownloadDrawerProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: walletData } = useWalletSummary();
  const { data: bankData } = useBankAccounts();
  const { data: cryptoData } = useCryptoWallets();

  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>("1m");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Build asset list from live data
  useEffect(() => {
    const items: AssetItem[] = [];
    const wd = walletData?.data;

    // Cards from wallet summary
    if (wd?.cards && Array.isArray(wd.cards)) {
      for (const card of wd.cards) {
        const mask = card.card_number ? `•••• ${String(card.card_number).slice(-4)}` : "";
        const cardType = card.type || "Virtual";
        items.push({
          id: `card_${card.id || card.card_number}`,
          label: `${cardType} ${mask}`,
          sublabel: card.balance !== undefined ? `${parseFloat(String(card.balance)).toFixed(2)} ${card.currency || "AED"}` : undefined,
          type: "card",
        });
      }
    }

    // IBAN / physical account
    if (wd?.physical_account) {
      const acc = wd.physical_account;
      const iban = acc.iban ? `${String(acc.iban).slice(0, 4)}••••${String(acc.iban).slice(-4)}` : "IBAN";
      items.push({
        id: `iban_main`,
        label: `IBAN ${iban}`,
        sublabel: acc.balance !== undefined ? `${parseFloat(String(acc.balance)).toFixed(2)} ${acc.currency || "AED"}` : undefined,
        type: "iban",
      });
    }

    // Bank accounts
    if (bankData) {
      const accounts = Array.isArray(bankData) ? bankData : (bankData as any)?.results || [];
      for (const acc of accounts) {
        const iban = acc.iban ? `${String(acc.iban).slice(0, 4)}••••${String(acc.iban).slice(-4)}` : "Bank";
        if (items.some(i => i.label.includes(iban))) continue;
        items.push({
          id: `bank_${acc.id || acc.iban}`,
          label: `IBAN ${iban}`,
          sublabel: acc.balance !== undefined ? `${parseFloat(String(acc.balance)).toFixed(2)} ${acc.currency || "AED"}` : undefined,
          type: "iban",
        });
      }
    }

    // Crypto wallets
    // Crypto wallets (including USDT)

    // Crypto wallets
    if (cryptoData) {
      const wallets = Array.isArray(cryptoData) ? cryptoData : (cryptoData as any)?.results || [];
      for (const w of wallets) {
        const token = w.token || "USDT";
        // Skip if USDT already added
        if (token === "USDT" && items.some(i => i.id === "usdt_wallet")) continue;
        const addr = w.address ? `${String(w.address).slice(0, 6)}••${String(w.address).slice(-4)}` : "";
        items.push({
          id: `crypto_${w.id || w.address}`,
          label: `${token} ${w.network || "TRC20"}`,
          sublabel: w.balance !== undefined ? `${parseFloat(String(w.balance)).toFixed(2)} ${token}` : addr,
          type: "crypto",
        });
      }
    }

    setAssets(items);
    // Select all by default
    setSelectedAssets(new Set(items.map(i => i.id)));
  }, [walletData, bankData, cryptoData]);

  const toggleAsset = (id: string) => {
    setSelectedAssets(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedAssets.size === assets.length) {
      setSelectedAssets(new Set());
    } else {
      setSelectedAssets(new Set(assets.map(a => a.id)));
    }
  };

  const periodOptions: { key: PeriodOption; label: string }[] = [
    { key: "1m", label: t("statement.1month", "1 мес") },
    { key: "3m", label: t("statement.3months", "3 мес") },
    { key: "6m", label: t("statement.6months", "6 мес") },
    { key: "9m", label: t("statement.9months", "9 мес") },
    { key: "1y", label: t("statement.1year", "1 год") },
  ];

  const getDateRange = (period: PeriodOption): { start: string; end: string } => {
    const now = new Date();
    const end = format(now, "yyyy-MM-dd");
    let start: Date;
    switch (period) {
      case "1m": start = subMonths(now, 1); break;
      case "3m": start = subMonths(now, 3); break;
      case "6m": start = subMonths(now, 6); break;
      case "9m": start = subMonths(now, 9); break;
      case "1y": start = subYears(now, 1); break;
    }
    return { start: format(start, "yyyy-MM-dd"), end };
  };

  const handleDownload = async () => {
    if (selectedAssets.size === 0) {
      toast.error(t("statement.selectAtLeastOne", "Выберите хотя бы один счёт"));
      return;
    }

    setIsDownloading(true);
    setIsDone(false);

    try {
      const token = getAuthToken();
      if (!token) {
        toast.error(t("common.authRequired", "Необходима авторизация"));
        return;
      }

      const { start, end } = getDateRange(selectedPeriod);
      const userName = user?.full_name || "";

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            backend_token: token,
            start_date: start,
            end_date: end,
            user_name: userName,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || t("statement.downloadError", "Ошибка генерации отчёта"));
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fileDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      a.download = `uEasyCard_Statement_${fileDate}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsDone(true);
      toast.success(t("statement.downloaded", "Выписка скачана!"));
    } catch (error) {
      console.error("Statement download error:", error);
      toast.error(error instanceof Error ? error.message : t("statement.downloadError", "Ошибка скачивания"));
    } finally {
      setIsDownloading(false);
    }
  };

  const getAssetIcon = (type: AssetItem["type"]) => {
    switch (type) {
      case "card": return <CreditCard className="w-4 h-4 text-primary" />;
      case "iban": return <Landmark className="w-4 h-4 text-primary" />;
      case "crypto": return <Wallet className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <Drawer open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setIsDone(false); } }}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle>{t("statement.title", "Скачать выписку")}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-8 space-y-5 overflow-y-auto">
          {/* Account selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {t("statement.accounts", "Счета и кошельки")}
              </p>
              <button
                onClick={toggleAll}
                className="text-xs text-primary font-medium"
              >
                {selectedAssets.size === assets.length
                  ? t("statement.deselectAll", "Снять все")
                  : t("statement.selectAll", "Выбрать все")}
              </button>
            </div>

            <div className="space-y-1">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => toggleAsset(asset.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-colors",
                    selectedAssets.has(asset.id)
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-secondary hover:bg-secondary/80 border border-transparent"
                  )}
                >
                  <Checkbox
                    checked={selectedAssets.has(asset.id)}
                    className="pointer-events-none"
                  />
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {getAssetIcon(asset.type)}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{asset.label}</p>
                    {asset.sublabel && (
                      <p className="text-xs text-muted-foreground">{asset.sublabel}</p>
                    )}
                  </div>
                </button>
              ))}

              {assets.length === 0 && (
                <div className="text-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t("common.loading", "Загрузка...")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Period selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t("statement.period", "Период")}
            </p>
            <div className="flex gap-2 flex-wrap">
              {periodOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSelectedPeriod(opt.key)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    selectedPeriod === opt.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Download button */}
          <motion.button
            onClick={handleDownload}
            disabled={isDownloading || isDone || selectedAssets.size === 0}
            className={cn(
              "w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-medium text-sm transition-all",
              isDone
                ? "bg-success/15 text-success border border-success/20"
                : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]",
              (isDownloading || selectedAssets.size === 0) && "opacity-60 cursor-not-allowed"
            )}
            whileTap={{ scale: isDone ? 1 : 0.97 }}
          >
            {isDownloading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isDone ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {isDownloading
              ? t("statement.generating", "Генерация...")
              : isDone
                ? t("statement.done", "Скачано!")
                : t("statement.download", "Скачать выписку")}
          </motion.button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
