import { useState, useEffect } from "react";
import { Download, Loader2, CheckCircle, CreditCard, Landmark, Wallet, Send, MessageCircle, Mail, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { useUserNotificationSettings } from "@/hooks/useUserNotificationSettings";
import { useNavigate } from "react-router-dom";

type PeriodOption = "1m" | "3m" | "6m" | "9m" | "1y";
type DeliveryChannel = "download" | "telegram" | "whatsapp" | "email";
type DrawerStep = "form" | "delivery" | "done";

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
  const navigate = useNavigate();
  const { data: walletData } = useWalletSummary();
  const { data: bankData } = useBankAccounts();
  const { data: cryptoData } = useCryptoWallets();
  const { settings: notifSettings, isLoading: notifLoading } = useUserNotificationSettings();

  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>("1m");
  const [isDownloading, setIsDownloading] = useState(false);
  const [step, setStep] = useState<DrawerStep>("form");
  const [selectedChannels, setSelectedChannels] = useState<Set<DeliveryChannel>>(new Set(["download"]));
  const [isSending, setIsSending] = useState(false);
  const [showNotifSetup, setShowNotifSetup] = useState(false);

  // Build asset list from live data
  useEffect(() => {
    const items: AssetItem[] = [];
    const wd = walletData?.data;

    if (wd?.cards && Array.isArray(wd.cards)) {
      for (const card of wd.cards) {
        const mask = card.card_number ? `•••• ${String(card.card_number).slice(-4)}` : "";
        const rawType = card.type || "Virtual";
        const cardType = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
        items.push({
          id: `card_${card.id || card.card_number}`,
          label: `${cardType} ${mask}`,
          sublabel: card.balance !== undefined ? `${parseFloat(String(card.balance)).toFixed(2)} ${card.currency || "AED"}` : undefined,
          type: "card",
        });
      }
    }

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

    let usdtAdded = false;
    const rawWallet = walletData as any;
    const usdtBalance = rawWallet?.data?.usdt_balance ?? rawWallet?.usdt_balance;

    if (cryptoData) {
      const wallets = Array.isArray(cryptoData) ? cryptoData : (cryptoData as any)?.results || [];
      for (const w of wallets) {
        const token = w.token || "USDT";
        if (token === "USDT" && !usdtAdded) {
          items.push({
            id: "usdt_wallet",
            label: t("statement.usdtWallet", "Кошелёк USDT"),
            sublabel: w.balance !== undefined ? `${parseFloat(String(w.balance)).toFixed(2)} USDT` : undefined,
            type: "crypto",
          });
          usdtAdded = true;
        } else if (token !== "USDT") {
          const addr = w.address ? `${String(w.address).slice(0, 6)}••${String(w.address).slice(-4)}` : "";
          items.push({
            id: `crypto_${w.id || w.address}`,
            label: `${token} ${w.network || "TRC20"}`,
            sublabel: w.balance !== undefined ? `${parseFloat(String(w.balance)).toFixed(2)} ${token}` : addr,
            type: "crypto",
          });
        }
      }
    }

    if (!usdtAdded) {
      items.push({
        id: "usdt_wallet",
        label: t("statement.usdtWallet", "Кошелёк USDT"),
        sublabel: usdtBalance !== undefined ? `${parseFloat(String(usdtBalance)).toFixed(2)} USDT` : "USDT",
        type: "crypto",
      });
    }

    setAssets(items);
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
    { key: "1m", label: t("statement.1month", "1 Мес") },
    { key: "3m", label: t("statement.3months", "3 Мес") },
    { key: "6m", label: t("statement.6months", "6 Мес") },
    { key: "9m", label: t("statement.9months", "9 Мес") },
    { key: "1y", label: t("statement.1year", "1 Год") },
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

  // Build available delivery channels
  const getDeliveryChannels = () => {
    const channels: { key: DeliveryChannel; label: string; sublabel?: string; icon: React.ReactNode; enabled: boolean; configured: boolean }[] = [
      {
        key: "download",
        label: t("statement.deliveryDownload", "Скачать файл"),
        sublabel: "HTML",
        icon: <Download className="w-4 h-4" />,
        enabled: true,
        configured: true,
      },
    ];

    if (notifSettings) {
      const tgUser = notifSettings.telegram_username;
      const tgDisplay = tgUser ? (tgUser.startsWith("@") ? tgUser : `@${tgUser}`) : null;
      
      channels.push({
        key: "telegram",
        label: "Telegram",
        sublabel: tgUser
          ? (notifSettings.telegram_enabled ? tgDisplay! : t("statement.channelDisabled", "Отключен"))
          : t("statement.notConfigured", "Не настроен"),
        icon: <Send className="w-4 h-4" />,
        enabled: notifSettings.telegram_enabled && !!tgUser,
        configured: !!tgUser,
      });

      channels.push({
        key: "whatsapp",
        label: "WhatsApp",
        sublabel: notifSettings.whatsapp_number
          ? (notifSettings.whatsapp_enabled ? notifSettings.whatsapp_number : t("statement.channelDisabled", "Отключен"))
          : t("statement.notConfigured", "Не настроен"),
        icon: <MessageCircle className="w-4 h-4" />,
        enabled: notifSettings.whatsapp_enabled && !!notifSettings.whatsapp_number,
        configured: !!notifSettings.whatsapp_number,
      });

      channels.push({
        key: "email",
        label: "Email",
        sublabel: notifSettings.email_address
          ? (notifSettings.email_enabled ? notifSettings.email_address : t("statement.channelDisabled", "Отключен"))
          : t("statement.notConfigured", "Не настроен"),
        icon: <Mail className="w-4 h-4" />,
        enabled: notifSettings.email_enabled && !!notifSettings.email_address,
        configured: !!notifSettings.email_address,
      });
    }

    return channels;
  };

  const hasAnyChannel = notifSettings && (
    notifSettings.telegram_username ||
    notifSettings.whatsapp_number ||
    notifSettings.email_address
  );

  const handleProceedToDelivery = () => {
    if (selectedAssets.size === 0) {
      toast.error(t("statement.selectAtLeastOne", "Выберите хотя бы один счёт"));
      return;
    }
    // Auto-select all enabled channels
    const channels = getDeliveryChannels();
    const enabledKeys = channels.filter(c => c.enabled).map(c => c.key);
    setSelectedChannels(new Set(enabledKeys));
    setStep("delivery");
  };

  const buildRequestBody = () => {
    const token = getAuthToken();
    const { start, end } = getDateRange(selectedPeriod);
    const userName = user?.full_name || "";

    const selectedAssetTypes: string[] = [];
    for (const id of selectedAssets) {
      if (id.startsWith("card_")) selectedAssetTypes.push("card");
      else if (id.startsWith("iban_") || id.startsWith("bank_")) selectedAssetTypes.push("iban");
      else if (id === "usdt_wallet" || id.startsWith("crypto_")) selectedAssetTypes.push("crypto");
    }
    const uniqueAssetTypes = [...new Set(selectedAssetTypes)];

    return { token, start, end, userName, uniqueAssetTypes };
  };

  const handleDownloadFile = async () => {
    setIsDownloading(true);
    try {
      const { token, start, end, userName, uniqueAssetTypes } = buildRequestBody();
      if (!token) {
        toast.error(t("common.authRequired", "Необходима авторизация"));
        return;
      }

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
            asset_filter: uniqueAssetTypes,
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

      setStep("done");
      toast.success(t("statement.downloaded", "Выписка скачана!"));
    } catch (error) {
      console.error("Statement download error:", error);
      toast.error(error instanceof Error ? error.message : t("statement.downloadError", "Ошибка скачивания"));
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleChannel = (key: DeliveryChannel) => {
    setSelectedChannels(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSendSelected = async () => {
    if (selectedChannels.size === 0) {
      toast.error(t("statement.selectAtLeastOne", "Выберите хотя бы один способ"));
      return;
    }

    setIsSending(true);
    try {
      const { token, start, end, userName, uniqueAssetTypes } = buildRequestBody();
      if (!token) {
        toast.error(t("common.authRequired", "Необходима авторизация"));
        return;
      }

      const channels = [...selectedChannels];

      // If only download selected, just download
      if (channels.length === 1 && channels[0] === "download") {
        await handleDownloadFile();
        return;
      }

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
            asset_filter: uniqueAssetTypes,
            delivery_channels: channels.filter(c => c !== "download"),
            also_download: channels.includes("download"),
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || t("statement.sendError", "Ошибка отправки"));
      }

      // If download was also selected, download the blob
      if (channels.includes("download")) {
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
      }

      setStep("done");
      toast.success(t("statement.downloaded", "Выписка отправлена!"));
    } catch (error) {
      console.error("Statement send error:", error);
      toast.error(error instanceof Error ? error.message : t("statement.sendError", "Ошибка отправки"));
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      setTimeout(() => {
        setStep("form");
        setSelectedChannels(new Set(["download"]));
      }, 300);
    }
  };

  const getAssetIcon = (type: AssetItem["type"]) => {
    switch (type) {
      case "card": return <CreditCard className="w-4 h-4 text-primary" />;
      case "iban": return <Landmark className="w-4 h-4 text-primary" />;
      case "crypto": return <Wallet className="w-4 h-4 text-primary" />;
    }
  };

  const deliveryChannels = getDeliveryChannels();

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle>
            {step === "delivery"
              ? t("statement.deliveryTitle", "Куда отправить?")
              : step === "done"
                ? t("statement.doneTitle", "Готово!")
                : t("statement.title", "Скачать выписку")}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-8 space-y-5 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* STEP 1: Form */}
            {step === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                {/* Account selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("statement.accounts", "Выбрать вид активов")}
                    </p>
                    <button onClick={toggleAll} className="text-xs text-primary font-medium">
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
                        <Checkbox checked={selectedAssets.has(asset.id)} className="pointer-events-none" />
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

                {/* Next button */}
                <motion.button
                  onClick={handleProceedToDelivery}
                  disabled={selectedAssets.size === 0}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-medium text-sm transition-all",
                    "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]",
                    selectedAssets.size === 0 && "opacity-60 cursor-not-allowed"
                  )}
                  whileTap={{ scale: 0.97 }}
                >
                  <Download className="w-5 h-5" />
                  {t("statement.next", "Продолжить")}
                </motion.button>
              </motion.div>
            )}

            {/* STEP 2: Delivery channel selection */}
            {step === "delivery" && (
              <motion.div
                key="delivery"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground">
                  {t("statement.chooseDelivery", "Выберите способ получения выписки")}
                </p>

                <div className="space-y-1">
                  {deliveryChannels.map((ch) => (
                    <button
                      key={ch.key}
                      onClick={() => {
                        if (ch.enabled) toggleChannel(ch.key);
                        else if (!ch.configured) {
                          handleClose(false);
                          setTimeout(() => navigate("/settings"), 300);
                        }
                      }}
                      disabled={isSending || isDownloading}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-colors border",
                        ch.enabled && selectedChannels.has(ch.key)
                          ? "bg-primary/10 border-primary/20"
                          : ch.enabled
                            ? "bg-secondary hover:bg-secondary/80 border-transparent"
                            : "bg-secondary/50 border-transparent opacity-60"
                      )}
                    >
                      <Checkbox
                        checked={selectedChannels.has(ch.key)}
                        disabled={!ch.enabled}
                        className="pointer-events-none"
                      />
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        ch.key === "telegram" ? "bg-[#26A5E4]/15 text-[#26A5E4]" :
                        ch.key === "whatsapp" ? "bg-[#25D366]/15 text-[#25D366]" :
                        ch.key === "email" ? "bg-orange-500/15 text-orange-500" :
                        "bg-primary/10 text-primary"
                      )}>
                        {ch.icon}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-sm font-medium">{ch.label}</p>
                        {ch.sublabel && (
                          <p className="text-xs text-muted-foreground">{ch.sublabel}</p>
                        )}
                      </div>
                      {!ch.configured && (
                        <span className="text-xs text-primary font-medium">
                          {t("statement.setup", "Настроить")}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Send button */}
                <motion.button
                  onClick={handleSendSelected}
                  disabled={selectedChannels.size === 0 || isSending || isDownloading}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-medium text-sm transition-all",
                    "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]",
                    (selectedChannels.size === 0 || isSending) && "opacity-60 cursor-not-allowed"
                  )}
                  whileTap={{ scale: 0.97 }}
                >
                  {isSending || isDownloading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  {isSending || isDownloading
                    ? t("statement.generating", "Генерация...")
                    : t("statement.send", "Отправить")}
                </motion.button>

                {/* Back button */}
                <button
                  onClick={() => setStep("form")}
                  className="w-full text-center text-sm text-muted-foreground py-2"
                >
                  {t("common.back", "Назад")}
                </button>
              </motion.div>
            )}

            {/* STEP 3: Done */}
            {step === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5 text-center py-4"
              >
                <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("statement.doneMessage", "Выписка успешно сформирована")}
                </p>

                {/* If no channels configured, suggest after successful download */}
                {!hasAnyChannel && !notifLoading && (
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {t("statement.setupHint", "Хотите получать выписки в Telegram, WhatsApp или Email?")}
                    </p>
                    <button
                      onClick={() => {
                        handleClose(false);
                        setTimeout(() => navigate("/settings"), 300);
                      }}
                      className="flex items-center gap-2 text-sm text-primary font-medium mx-auto"
                    >
                      <Settings className="w-4 h-4" />
                      {t("statement.setupNotifications", "Настроить уведомления")}
                    </button>
                  </div>
                )}

                <motion.button
                  onClick={() => handleClose(false)}
                  className="w-full py-3.5 rounded-xl font-medium text-sm bg-secondary text-foreground hover:bg-secondary/80"
                  whileTap={{ scale: 0.97 }}
                >
                  {t("common.close", "Закрыть")}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
