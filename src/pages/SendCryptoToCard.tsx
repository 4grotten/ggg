import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft, CreditCard, Check, ClipboardPaste, X, Loader2, CheckCircle2, AlertCircle, Wallet,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCryptoWallets } from "@/hooks/useCards";
import { getAuthToken } from "@/services/api/apiClient";
import { UsdtIcon, TronIcon } from "@/components/icons/CryptoIcons";
import { TOP_UP_CRYPTO_FEE } from "@/lib/fees";
import { useSettings } from "@/contexts/SettingsContext";
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Recipient info from API
const getRecipientName = async (
  cardNumber: string
): Promise<{ found: boolean; name: string | null; cardType?: string; avatarUrl?: string | null; isInternal?: boolean }> => {
  const clean = cardNumber.replace(/\s/g, "");
  if (clean.length !== 16) return { found: false, name: null };
  try {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const endpoint = `/transactions/recipient-info/?card_number=${clean}`;
    const url = `${SUPABASE_URL}/functions/v1/cards-proxy?endpoint=${encodeURIComponent(endpoint)}`;
    const headers: HeadersInit = { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY };
    const token = getAuthToken();
    if (token) headers["x-backend-token"] = token;
    const res = await fetch(url, { method: "GET", headers });
    let data;
    try {
      data = await res.json();
    } catch {
      return { found: false, name: null };
    }
    // Backend 404 is now proxied as 200 — check body for errors
    if (data.error || !data.recipient_name) {
      return { found: false, name: null };
    }
    if (data.recipient_name) {
      return {
        found: true,
        name: data.recipient_name,
        cardType: data.card_type,
        avatarUrl: data.avatar_url || null,
        isInternal: data.is_internal !== false,
      };
    }
    return { found: false, name: null };
  } catch {
    return { found: false, name: null };
  }
};

// Submit crypto-to-card transfer
const submitCryptoToCard = async (
  fromWalletId: string,
  receiverCardNumber: string,
  amountUsdt: string
): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const url = `${SUPABASE_URL}/functions/v1/cards-proxy?endpoint=${encodeURIComponent("/transactions/transfer/crypto-to-card/")}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
  const token = getAuthToken();
  if (token) headers["x-backend-token"] = token;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        from_wallet_id: fromWalletId,
        receiver_card_number: receiverCardNumber,
        amount_usdt: amountUsdt,
      }),
    });
    const data = await response.json();
    if (response.ok && data.transaction_id) {
      return { success: true, transactionId: data.transaction_id };
    }
    return { success: false, error: data.detail || data.message || data.error || `HTTP ${response.status}` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
};

const formatCardNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, "").slice(0, 16);
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(" ") : cleaned;
};

type Step = "card" | "amount" | "confirm";

const SendCryptoToCard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const settings = useSettings();

  const { data: cryptoWalletsData, isLoading: walletsLoading } = useCryptoWallets();
  const wallet = cryptoWalletsData?.data?.[0];
  const walletBalance = wallet ? parseFloat(String(wallet.balance)) : 0;
  const walletId = wallet?.id || "";

  const [step, setStep] = useState<Step>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [recipientCardType, setRecipientCardType] = useState<string | null>(null);
  const [recipientAvatarUrl, setRecipientAvatarUrl] = useState<string | null>(null);
  const [isInternal, setIsInternal] = useState<boolean | null>(null);
  const [recipientNotFound, setRecipientNotFound] = useState(false);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  const cleanCardNumber = cardNumber.replace(/\s/g, "");
  const isCardValid = cleanCardNumber.length === 16;
  const numericAmount = parseFloat(amount.replace(/,/g, "")) || 0;
  
  const COMMISSION_PERCENT = 1; // 1%
  const NETWORK_FEE = TOP_UP_CRYPTO_FEE; // 5.90 USDT
  const commission = numericAmount * (COMMISSION_PERCENT / 100);
  const totalDebitUsdt = numericAmount + commission + NETWORK_FEE;
  const isAmountValid = numericAmount > 0 && totalDebitUsdt <= walletBalance;
  
  // Exchange rate USDT → AED
  const usdtToAed = settings.USDT_TO_AED_SELL || 3.67;
  const recipientGetsAed = numericAmount * usdtToAed;

  // Check recipient
  useEffect(() => {
    if (!isCardValid) {
      setRecipientName(null);
      setRecipientCardType(null);
      setRecipientAvatarUrl(null);
      setRecipientNotFound(false);
      setIsInternal(null);
      return;
    }
    setIsLoading(true);
    setRecipientNotFound(false);
    getRecipientName(cardNumber).then((result) => {
      if (result.found && result.name) {
        setRecipientName(result.name);
        setRecipientCardType(result.cardType || null);
        setRecipientAvatarUrl(result.avatarUrl || null);
        setIsInternal(result.isInternal ?? true);
        setRecipientNotFound(false);
      } else {
        setRecipientName(null);
        setRecipientCardType(null);
        setRecipientAvatarUrl(null);
        setIsInternal(false);
        setRecipientNotFound(true);
      }
      setIsLoading(false);
    });
  }, [cardNumber, isCardValid]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCardNumber(formatCardNumber(text));
    } catch {}
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9.]/g, "");
    const parts = value.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    if (parts[0]) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    setAmount(parts.join("."));
  };

  const handleNext = () => {
    if (step === "card" && isCardValid && recipientName) {
      setStep("amount");
    } else if (step === "amount" && isAmountValid) {
      setStep("confirm");
    }
  };

  const handleBack = () => {
    if (step === "amount") setStep("card");
    else if (step === "confirm") setStep("amount");
    else navigate(-1);
  };

  const handleConfirm = async () => {
    if (!walletId) return;
    setIsSubmitting(true);
    setTransferError(null);
    try {
      const res = await submitCryptoToCard(walletId, cleanCardNumber, numericAmount.toFixed(2));
      if (res.success) {
        setTransferSuccess(true);
        queryClient.invalidateQueries({ queryKey: ["cards"] });
        queryClient.invalidateQueries({ queryKey: ["crypto-wallets"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        toast({ title: t("send.transferSuccess"), description: `${numericAmount.toFixed(2)} USDT → ${recipientName || cleanCardNumber}` });
        setTimeout(() => navigate("/wallet"), 2000);
      } else {
        setTransferError(res.error || t("send.transferFailed"));
        toast({ variant: "destructive", title: t("send.transferFailed"), description: res.error });
      }
    } catch {
      setTransferError(t("send.transferFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const recipientBadge = isInternal === true ? (
    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 font-medium">EasyCard</span>
  ) : isInternal === false ? (
    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-600 font-medium">{t("send.externalCard", "Внешняя карта")}</span>
  ) : null;

  return (
    <MobileLayout
      header={
        <button onClick={handleBack} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">{t("send.back")}</span>
        </button>
      }
      rightAction={<div className="flex items-center gap-2"><ThemeSwitcher /><LanguageSwitcher /></div>}
    >
      <div className="px-4 py-6 pb-32 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t("send.cryptoToCard", "Крипто → Карта")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("send.cryptoToCardDesc", "Отправить USDT на карту EasyCard или внешнюю карту")}</p>
        </div>

        {/* Source wallet */}
        <motion.div
          className="rounded-xl bg-[#26A17B]/10 border border-[#26A17B]/20 p-4 flex items-center gap-3"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-10 h-10 rounded-full bg-[#26A17B]/20 flex items-center justify-center">
            <UsdtIcon size={20} />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">USDT TRC20</p>
            <p className="text-xs text-muted-foreground">{t("send.fromSource", "Откуда")}</p>
          </div>
          <div className="text-right">
            <p className="font-bold">{walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground">USDT</p>
          </div>
        </motion.div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          {(["card", "amount", "confirm"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step === s ? "bg-[#007AFF] text-white" : (["card","amount","confirm"].indexOf(step) > i ? "bg-green-500 text-white" : "bg-secondary text-muted-foreground")
              }`}>
                {["card","amount","confirm"].indexOf(step) > i ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < 2 && <div className={`w-8 h-0.5 ${["card","amount","confirm"].indexOf(step) > i ? "bg-green-500" : "bg-secondary"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Card */}
        {step === "card" && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("send.recipientCardNumber")}</label>
              <div className="relative">
                <Input
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="0000 0000 0000 0000"
                  className="h-14 text-lg font-mono pr-12 rounded-xl"
                  maxLength={19}
                />
                <button onClick={handlePaste} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-secondary transition-colors">
                  <ClipboardPaste className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Recipient verification */}
            {isLoading && (
              <div className="bg-secondary rounded-xl p-4 flex items-center gap-3 animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-muted-foreground text-sm">{t("send.checkingRecipient", "Проверка получателя…")}</span>
              </div>
            )}

            {recipientName && !isLoading && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                {recipientAvatarUrl ? (
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={recipientAvatarUrl} />
                    <AvatarFallback>{recipientName.charAt(0)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{recipientName}</p>
                    {recipientBadge}
                  </div>
                  {recipientCardType && <p className="text-xs text-muted-foreground">{recipientCardType}</p>}
                </div>
              </motion.div>
            )}

            {recipientNotFound && !isLoading && isCardValid && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{t("send.cardNotFound", "Карта не найдена")}</p>
                  <p className="text-xs text-muted-foreground">{t("send.cardNotFoundDesc", "Карта не найдена в сети EasyCard. Перевод возможен только на карты EasyCard.")}</p>
                </div>
              </motion.div>
            )}

            <Button onClick={handleNext} disabled={!isCardValid || isLoading || !recipientName}
              className="w-full h-12 rounded-xl bg-[#007AFF] hover:bg-[#0066DD] text-white font-medium">
              {t("common.continue")}
            </Button>
          </div>
        )}

        {/* Step 2: Amount */}
        {step === "amount" && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("send.amount")}</label>
              <div className="relative">
                <Input
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className="h-14 text-2xl font-bold text-center rounded-xl"
                  inputMode="decimal"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>{t("send.available")}: {walletBalance.toFixed(2)} USDT</span>
                <button onClick={() => {
                  // MAX: subtract fees so total doesn't exceed balance
                  const maxRaw = (walletBalance - NETWORK_FEE) / (1 + COMMISSION_PERCENT / 100);
                  const maxAmount = Math.max(0, Math.floor(maxRaw * 100) / 100);
                  setAmount(maxAmount.toFixed(2));
                }} className="text-primary font-medium">MAX</button>
              </div>
            </div>

            {numericAmount > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-secondary/50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{t("send.amount")}</span><span>{numericAmount.toFixed(2)} USDT</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("send.exchangeRate", "Курс обмена")}</span><span>1 USDT = {usdtToAed.toFixed(2)} AED</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("send.recipientGets", "Получатель получит")}</span><span className="font-semibold text-green-600">{recipientGetsAed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED</span></div>
                <div className="h-px bg-border" />
                <div className="flex justify-between"><span className="text-muted-foreground">{t("send.fee")} ({COMMISSION_PERCENT}%)</span><span>{commission.toFixed(2)} USDT</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("send.networkFee", "Сбор сети")}</span><span>{NETWORK_FEE.toFixed(2)} USDT</span></div>
                <div className="h-px bg-border" />
                <div className="flex justify-between font-semibold"><span>{t("send.totalDebit", "Итого к списанию")}</span><span>{totalDebitUsdt.toFixed(2)} USDT</span></div>
              </motion.div>
            )}

            {numericAmount > walletBalance && (
              <p className="text-destructive text-sm text-center">{t("send.insufficientBalance")}</p>
            )}

            <Button onClick={handleNext} disabled={!isAmountValid}
              className="w-full h-12 rounded-xl bg-[#007AFF] hover:bg-[#0066DD] text-white font-medium">
              {t("common.continue")}
            </Button>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && (
          <div className="space-y-4 animate-fade-in">
            {transferSuccess ? (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-4 py-8">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-xl font-bold">{t("send.transferSuccess")}</h2>
                <p className="text-muted-foreground text-center text-sm">{numericAmount.toFixed(2)} USDT → {recipientName || cardNumber}</p>
              </motion.div>
            ) : (
              <>
                <div className="bg-secondary/50 rounded-xl p-5 space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("send.from", "От")}</span><span className="font-medium">USDT TRC20</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("send.recipient")}</span>
                    <div className="text-right">
                      <span className="font-medium">{recipientName || t("send.externalCard", "Внешняя карта")}</span>
                      {recipientBadge && <div className="mt-0.5">{recipientBadge}</div>}
                    </div>
                  </div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("send.recipientCardNumber")}</span><span className="font-mono">{cardNumber}</span></div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("send.amount")}</span><span>{numericAmount.toFixed(2)} USDT</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("send.exchangeRate", "Курс")}</span><span>1 USDT = {usdtToAed.toFixed(2)} AED</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("send.recipientGets", "Получатель получит")}</span><span className="font-semibold text-green-600">{recipientGetsAed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED</span></div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("send.fee")} ({COMMISSION_PERCENT}%)</span><span>{commission.toFixed(2)} USDT</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("send.networkFee", "Сбор сети")}</span><span>{NETWORK_FEE.toFixed(2)} USDT</span></div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between font-bold text-base"><span>{t("send.totalDebit", "Итого")}</span><span>{totalDebitUsdt.toFixed(2)} USDT</span></div>
                </div>

                {transferError && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <p className="text-sm text-destructive">{transferError}</p>
                  </div>
                )}

                <Button onClick={handleConfirm} disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-[#007AFF] hover:bg-[#0066DD] text-white font-medium">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t("common.confirm")}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default SendCryptoToCard;
