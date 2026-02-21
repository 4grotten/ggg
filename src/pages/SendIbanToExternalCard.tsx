import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Landmark, ArrowRightLeft, Check, Loader2, ClipboardPaste, X, CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { useBankAccounts } from "@/hooks/useCards";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthToken } from "@/services/api/apiClient";
import aedCurrency from "@/assets/aed-currency.png";

// Format card number with spaces
const formatCardNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, "").slice(0, 16);
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(" ") : cleaned;
};

// Fetch recipient info
const getRecipientName = async (cardNumber: string): Promise<{ found: boolean; name: string | null; cardType?: string }> => {
  const cleanNumber = cardNumber.replace(/\s/g, "");
  if (cleanNumber.length !== 16) return { found: false, name: null };
  try {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const endpoint = `/transactions/recipient-info/?card_number=${cleanNumber}`;
    const url = `${SUPABASE_URL}/functions/v1/cards-proxy?endpoint=${encodeURIComponent(endpoint)}`;
    const headers: HeadersInit = { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY };
    const token = getAuthToken();
    if (token) headers['x-backend-token'] = token;
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) return { found: false, name: null };
    const data = await res.json();
    if (data.recipient_name) return { found: true, name: data.recipient_name, cardType: data.card_type };
    return { found: false, name: null };
  } catch {
    return { found: false, name: null };
  }
};

// Submit bank-to-external-card transfer
const submitBankToCardTransfer = async (
  bankAccountId: string,
  receiverCardNumber: string,
  amount: string
): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const url = `${SUPABASE_URL}/functions/v1/cards-proxy?endpoint=${encodeURIComponent('/transactions/transfer/bank-to-card/')}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
  const token = getAuthToken();
  if (token) headers['x-backend-token'] = token;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from_bank_account_id: bankAccountId,
        receiver_card_number: receiverCardNumber,
        amount,
      }),
    });
    const data = await response.json();
    if (response.ok && (data.transaction_id || data.id)) {
      return { success: true, transactionId: data.transaction_id || data.id };
    }
    return { success: false, error: data.detail || data.message || data.error || `HTTP ${response.status}` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
};

type Step = "card" | "amount" | "confirm";

const SendIbanToExternalCard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: bankAccountsData, isLoading: bankLoading } = useBankAccounts();

  const bankAccount = bankAccountsData?.data?.[0];
  const bankAccountId = bankAccount?.id || "";
  const bankBalance = parseFloat(bankAccount?.balance || "0");
  const bankIban = bankAccount?.iban || "";

  const [step, setStep] = useState<Step>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [recipientCardType, setRecipientCardType] = useState<string | null>(null);
  const [recipientNotFound, setRecipientNotFound] = useState(false);
  const [isCheckingRecipient, setIsCheckingRecipient] = useState(false);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);

  const cleanCardNumber = cardNumber.replace(/\s/g, "");
  const isCardValid = cleanCardNumber.length === 16;
  const amountNum = parseFloat(amount) || 0;

  const calculation = useMemo(() => {
    if (amountNum <= 0) return null;
    return { amount: amountNum, insufficientBalance: amountNum > bankBalance };
  }, [amountNum, bankBalance]);

  const quickAmounts = [100, 500, 1000, 5000];

  // Check recipient when card number is complete
  useEffect(() => {
    if (isCardValid) {
      setIsCheckingRecipient(true);
      setRecipientNotFound(false);
      getRecipientName(cardNumber).then((result) => {
        if (result.found && result.name) {
          setRecipientName(result.name);
          setRecipientCardType(result.cardType || null);
          setRecipientNotFound(false);
        } else {
          setRecipientName(null);
          setRecipientCardType(null);
          setRecipientNotFound(true);
        }
        setIsCheckingRecipient(false);
      });
    } else {
      setRecipientName(null);
      setRecipientCardType(null);
      setRecipientNotFound(false);
    }
  }, [cardNumber, isCardValid]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCardNumber(formatCardNumber(text));
    } catch { /* noop */ }
  };

  const handleNext = () => {
    if (step === "card" && isCardValid && recipientName) setStep("amount");
    else if (step === "amount" && amountNum > 0 && !calculation?.insufficientBalance) setStep("confirm");
  };

  const handleBack = () => {
    if (step === "amount") setStep("card");
    else if (step === "confirm") setStep("amount");
    else navigate(-1);
  };

  const handleConfirm = async () => {
    if (!bankAccountId || !recipientName || amountNum <= 0) return;
    setIsSubmitting(true);
    try {
      const result = await submitBankToCardTransfer(bankAccountId, cleanCardNumber, amountNum.toFixed(2));
      if (result.success) {
        setTransferSuccess(true);
        queryClient.invalidateQueries({ queryKey: ["cards"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        toast.success(t("sendIban.transferSuccess", "Перевод выполнен"), {
          description: `${amountNum.toFixed(2)} AED → ${recipientName}`,
        });
        setTimeout(() => navigate("/account"), 2000);
      } else {
        toast.error(t("sendIban.transferFailed", "Ошибка перевода"), { description: result.error });
      }
    } catch {
      toast.error(t("sendIban.transferFailed", "Ошибка перевода"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (transferSuccess) {
    return (
      <MobileLayout
        header={<div className="flex items-center gap-3"><h1 className="text-lg font-semibold">IBAN → EasyCard</h1></div>}
        rightAction={<div className="flex items-center gap-2"><ThemeSwitcher /><LanguageSwitcher /></div>}
      >
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 space-y-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-full bg-[#27AE60]/20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-[#27AE60]" />
          </motion.div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold">{t("sendIban.transferSuccess", "Перевод выполнен")}</h2>
            <p className="text-muted-foreground">{amountNum.toFixed(2)} AED → {recipientName}</p>
            <p className="text-xs text-muted-foreground">•••• {cleanCardNumber.slice(-4)}</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      header={
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">IBAN → EasyCard</h1>
        </div>
      }
      rightAction={<div className="flex items-center gap-2"><ThemeSwitcher /><LanguageSwitcher /></div>}
    >
      <div className="px-4 py-6 space-y-4 pb-32">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          {(["card", "amount", "confirm"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step === s ? "bg-primary text-primary-foreground"
                : (["card", "amount", "confirm"] as Step[]).indexOf(step) > i ? "bg-[#27AE60] text-white"
                : "bg-secondary text-muted-foreground"
              }`}>
                {(["card", "amount", "confirm"] as Step[]).indexOf(step) > i ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < 2 && <div className={`w-8 h-0.5 ${(["card", "amount", "confirm"] as Step[]).indexOf(step) > i ? "bg-[#27AE60]" : "bg-secondary"}`} />}
            </div>
          ))}
        </div>

        {/* Source: Bank Account */}
        <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
          <div className="flex items-center gap-2 mb-1">
            <Landmark className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("sendIban.fromAccount", "С банковского счёта")}</p>
          </div>
          <div className="flex items-center gap-2">
            <img src={aedCurrency} alt="AED" className="w-8 h-8 dark:invert dark:brightness-200" />
            <span className="text-2xl font-bold">{bankBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-sm text-muted-foreground">AED</span>
          </div>
          {bankIban && <p className="text-xs text-muted-foreground mt-1 font-mono">IBAN: {bankIban.slice(0, 4)} ···· {bankIban.slice(-4)}</p>}
        </div>

        <div className="flex justify-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* Step 1: Card Number */}
        {step === "card" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground px-1">{t("send.recipientCardNumber", "Номер карты получателя")}</p>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="0000 0000 0000 0000"
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-muted/50 border border-border/50 text-lg font-mono tracking-wider outline-none focus:border-primary/50 transition-colors text-foreground placeholder:text-muted-foreground/40"
                  maxLength={19}
                />
                <button onClick={handlePaste} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-secondary transition-colors">
                  <ClipboardPaste className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Recipient check */}
            <AnimatePresence>
              {isCheckingRecipient && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">{t("send.checkingRecipient", "Проверка получателя...")}</span>
                </motion.div>
              )}

              {recipientName && !isCheckingRecipient && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#27AE60]/10 border border-[#27AE60]/20">
                  <div className="w-10 h-10 rounded-full bg-[#27AE60]/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-[#27AE60]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{recipientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {recipientCardType ? `${recipientCardType} · ` : ""}•••• {cleanCardNumber.slice(-4)}
                    </p>
                  </div>
                </motion.div>
              )}

              {recipientNotFound && !isCheckingRecipient && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <span className="text-sm text-destructive">{t("send.recipientNotFound", "Карта не найдена в системе EasyCard")}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Next button */}
            {recipientName && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <button onClick={handleNext}
                  className="w-full py-4 rounded-2xl font-semibold text-base bg-primary text-primary-foreground active:scale-[0.98] transition-all">
                  {t("send.continue", "Продолжить")}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Step 2: Amount */}
        {step === "amount" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Recipient badge */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#27AE60]/10 border border-[#27AE60]/20">
              <div className="w-10 h-10 rounded-full bg-[#27AE60]/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#27AE60]" />
              </div>
              <div>
                <p className="text-sm font-semibold">{recipientName}</p>
                <p className="text-xs text-muted-foreground">•••• {cleanCardNumber.slice(-4)}</p>
              </div>
            </div>

            {/* Amount input */}
            <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("sendIban.enterAmount", "Сумма перевода (AED)")}</p>
              <div className="flex items-center gap-2">
                <img src={aedCurrency} alt="AED" className="w-7 h-7 dark:invert dark:brightness-200" />
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 text-2xl font-bold bg-transparent outline-none text-foreground placeholder:text-muted-foreground/40"
                />
                <span className="text-sm text-muted-foreground">AED</span>
              </div>
              <div className="flex gap-2">
                {quickAmounts.map((qa) => (
                  <button key={qa} onClick={() => setAmount(qa.toString())}
                    className="flex-1 py-2 rounded-xl text-sm font-medium bg-secondary/80 hover:bg-secondary transition-colors text-foreground">
                    {qa.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {calculation?.insufficientBalance && (
              <p className="text-xs text-destructive text-center">{t("sendIban.insufficientBalance", "Недостаточно средств на счёте")}</p>
            )}

            {amountNum > 0 && !calculation?.insufficientBalance && (
              <button onClick={handleNext}
                className="w-full py-4 rounded-2xl font-semibold text-base bg-primary text-primary-foreground active:scale-[0.98] transition-all">
                {t("send.continue", "Продолжить")}
              </button>
            )}
          </motion.div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("sendIban.from", "Откуда")}</span>
                <span className="font-medium">{t("sendIban.bankAccount", "Банковский счёт")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("sendIban.to", "Куда")}</span>
                <span className="font-medium">•••• {cleanCardNumber.slice(-4)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("send.recipient", "Получатель")}</span>
                <span className="font-medium">{recipientName}</span>
              </div>
              <div className="h-px bg-border/50" />
              <div className="flex justify-between text-base">
                <span className="font-semibold">{t("sendIban.transferAmount", "Сумма")}</span>
                <span className="font-bold text-primary">{amountNum.toLocaleString("en-US", { minimumFractionDigits: 2 })} AED</span>
              </div>
            </div>

            <button onClick={handleConfirm} disabled={isSubmitting}
              className="w-full py-4 rounded-2xl font-semibold text-base bg-primary text-primary-foreground active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
              {isSubmitting ? t("sendIban.processing", "Обработка...") : t("sendIban.confirm", "Подтвердить перевод")}
            </button>
          </motion.div>
        )}
      </div>
    </MobileLayout>
  );
};

export default SendIbanToExternalCard;
