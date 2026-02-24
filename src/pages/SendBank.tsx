import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, ArrowRight, ClipboardPaste, ChevronDown, Check, CreditCard, X, Wallet, Landmark, CheckCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { BANK_TRANSFER_FEE_PERCENT } from "@/lib/fees";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useCards, useBankAccounts, useCryptoWallets } from "@/hooks/useCards";
import { submitBankWithdrawal, submitCryptoToBank } from "@/services/api/transactions";
import { submitInternalTransfer } from "@/services/api/transactions";
import { getAuthToken } from "@/services/api/apiClient";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Check if IBAN exists in the system
const lookupIbanRecipient = async (iban: string): Promise<{ found: boolean; name: string | null; bankName: string | null }> => {
  const cleanIban = iban.replace(/\s/g, "");
  if (cleanIban.length < 15) return { found: false, name: null, bankName: null };
  try {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const endpoint = `/transactions/recipient-info/?iban=${cleanIban}`;
    const url = `${SUPABASE_URL}/functions/v1/cards-proxy?endpoint=${encodeURIComponent(endpoint)}`;
    const headers: HeadersInit = { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY };
    const token = getAuthToken();
    if (token) headers['x-backend-token'] = token;
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) return { found: false, name: null, bankName: null };
    const data = await res.json();
    if (data.recipient_name) {
      return { found: true, name: data.recipient_name, bankName: data.bank_name || 'EasyCard FZE' };
    }
    return { found: false, name: null, bankName: null };
  } catch {
    return { found: false, name: null, bankName: null };
  }
};

interface SourceOption {
  id: string;
  type: "card" | "bank" | "wallet";
  cardType?: "virtual" | "metal";
  name: string;
  subtitle: string;
  balance: number;
}

const SendBank = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  const { user } = useAuth();
  const { USDT_TO_AED_BUY } = useSettings();

  const { data: cardsData } = useCards();
  const { data: bankAccountsData } = useBankAccounts();
  const { data: cryptoWalletsData } = useCryptoWallets();

  // Check navigation state
  const isReferralWithdrawal = location.state?.isReferralWithdrawal || false;
  const referralBalance = location.state?.referralBalance || 0;
  const fromWallet = location.state?.fromWallet || false;

  const sourceOptions = useMemo<SourceOption[]>(() => {
    const options: SourceOption[] = [];

    // Cards from API
    const cards = cardsData?.data ?? [];
    cards.forEach((card) => {
      const last4 = (card as any).card_number?.slice(-4) || card.lastFourDigits || "****";
      options.push({
        id: card.id,
        type: "card",
        cardType: card.type as "virtual" | "metal",
        name: card.type === "metal" ? "Visa Metal" : "Visa Virtual",
        subtitle: `•••• ${last4}`,
        balance: typeof card.balance === "string" ? parseFloat(card.balance) : card.balance,
      });
    });

    // Bank account from API
    const bank = bankAccountsData?.data?.[0];
    if (bank) {
      const ibanLast = bank.iban?.slice(-4) || "0000";
      options.push({
        id: bank.id,
        type: "bank",
        name: t("send.bankAccountAed", "Банковский счёт AED"),
        subtitle: `IBAN •••• ${ibanLast}`,
        balance: parseFloat(bank.balance || "0"),
      });
    }

    // Crypto wallet from API
    const wallet = cryptoWalletsData?.data?.[0];
    if (wallet) {
      options.push({
        id: wallet.id,
        type: "wallet",
        name: t("drawer.usdtBalance", "USDT TRC20 Кошелек"),
        subtitle: "TRC20",
        balance: parseFloat(wallet.balance || "0"),
      });
    }

    return options;
  }, [cardsData, bankAccountsData, cryptoWalletsData, t]);
  
  const [step, setStep] = useState(1);
  const [selectedSource, setSelectedSource] = useState<SourceOption | null>(null);
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  
  // Use referral balance or source balance
  const isWalletSource = selectedSource?.type === "wallet";
  const availableBalance = isReferralWithdrawal ? referralBalance : (selectedSource?.balance ?? 0);
  const availableBalanceAed = isWalletSource ? availableBalance * USDT_TO_AED_BUY : availableBalance;

  // Set default source when data loads
  useEffect(() => {
    if (!selectedSource && sourceOptions.length > 0) {
      if (fromWallet) {
        const walletOption = sourceOptions.find(s => s.type === "wallet");
        setSelectedSource(walletOption || sourceOptions[0]);
      } else {
        const bankOption = sourceOptions.find(s => s.type === "bank");
        setSelectedSource(bankOption || sourceOptions[0]);
      }
    }
  }, [sourceOptions, selectedSource, fromWallet]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Step 1: IBAN
  const [iban, setIban] = useState("");
  const [ibanLookupLoading, setIbanLookupLoading] = useState(false);
  const [isSystemIban, setIsSystemIban] = useState(false);
  
  // Step 2: Recipient details
  const [recipientName, setRecipientName] = useState("");
  const [bankName, setBankName] = useState("");
  const [fieldsReadOnly, setFieldsReadOnly] = useState(false);
  
  // Step 3: Amount (in USDT when wallet, in AED otherwise)
  const [amountAED, setAmountAED] = useState("");
  const NETWORK_FEE_USDT = 5.90;

  const transferFee = amountAED ? (parseFloat(amountAED) * BANK_TRANSFER_FEE_PERCENT / 100).toFixed(2) : "0.00";
  const totalAmount = isWalletSource
    ? (amountAED ? (parseFloat(amountAED) + parseFloat(transferFee) + NETWORK_FEE_USDT).toFixed(2) : "0.00")
    : (amountAED ? (parseFloat(amountAED) + parseFloat(transferFee)).toFixed(2) : "0.00");

  const formatIban = (value: string) => {
    // Remove all non-alphanumeric characters
    const cleaned = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    // Add spaces every 4 characters
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    return formatted.slice(0, 29); // IBAN max length with spaces
  };

  const formatAmountInput = (value: string) => {
    // Remove everything except digits and decimal point
    const cleaned = value.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return amountAED;
    if (parts[1] && parts[1].length > 2) {
      return `${parts[0]}.${parts[1].slice(0, 2)}`;
    }
    return cleaned;
  };

  const formatDisplayAmount = (value: string) => {
    if (!value) return "";
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    const parts = value.split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (parts.length > 1) {
      return `${integerPart}.${parts[1]}`;
    }
    return integerPart;
  };

  const parseDisplayAmount = (value: string) => {
    return value.replace(/,/g, "");
  };

  const isStep1Valid = iban.replace(/\s/g, "").length >= 15;
  const isStep2Valid = recipientName.trim().length >= 2 && bankName.trim().length >= 2;
  const isStep3Valid = parseFloat(amountAED) > 0 && parseFloat(totalAmount) <= (isWalletSource ? availableBalance : availableBalanceAed);

  const handleNext = useCallback(async () => {
    // Step 1 → check IBAN in the system before moving to step 2
    if (step === 1) {
      setIbanLookupLoading(true);
      try {
        const result = await lookupIbanRecipient(iban);
        if (result.found && result.name) {
          setRecipientName(result.name);
          setBankName(result.bankName || 'EasyCard FZE');
          setIsSystemIban(true);
          setFieldsReadOnly(true);
          setStep(2);
        } else {
          setIsSystemIban(false);
          setFieldsReadOnly(false);
          setStep(2);
        }
      } catch {
        setIsSystemIban(false);
        setFieldsReadOnly(false);
        setStep(2);
      } finally {
        setIbanLookupLoading(false);
      }
      return;
    }

    if (step === 2) {
      setStep(3);
      return;
    }

    // Step 3 — submit the transfer
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const isWallet = selectedSource.type === "wallet";

      if (isWallet) {
        // Crypto-to-bank transfer
        const request = {
          from_wallet_id: selectedSource.id,
          to_iban: iban.replace(/\s/g, ""),
          amount_usdt: parseFloat(amountAED).toFixed(6),
        };

        const result = await submitCryptoToBank(request);

        if (result.success) {
          toast.success(t("send.transferSuccess", "Перевод отправлен"));
          queryClient.invalidateQueries({ queryKey: ["cards"] });
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          queryClient.invalidateQueries({ queryKey: ["cryptoWallets"] });
          navigate(isReferralWithdrawal ? "/partner" : "/");
        } else {
          toast.error(result.error || t("send.transferFailed", "Ошибка перевода"));
        }
      } else {
        // Regular bank withdrawal
        const baseRequest = {
          iban: iban.replace(/\s/g, ""),
          beneficiary_name: recipientName.trim(),
          bank_name: bankName.trim(),
          amount_aed: parseFloat(amountAED).toFixed(2),
        };

        const request = selectedSource.type === "card"
          ? { ...baseRequest, from_card_id: selectedSource.id }
          : selectedSource.type === "bank"
            ? { ...baseRequest, from_bank_account_id: selectedSource.id }
            : { ...baseRequest, from_card_id: (cardsData?.data?.[0]?.id || selectedSource.id) };

        const result = await submitBankWithdrawal(request);

        if (result.success) {
          toast.success(t("send.transferSuccess", "Перевод отправлен"));
          queryClient.invalidateQueries({ queryKey: ["cards"] });
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          queryClient.invalidateQueries({ queryKey: ["bankAccounts"] });
          navigate(isReferralWithdrawal ? "/partner" : "/");
        } else {
          toast.error(result.error || t("send.transferFailed", "Ошибка перевода"));
        }
      }
    } catch (err) {
      toast.error(t("send.transferFailed", "Ошибка перевода"));
    } finally {
      setIsSubmitting(false);
    }
  }, [step, isSubmitting, selectedSource, cardsData, iban, recipientName, bankName, amountAED, isReferralWithdrawal, navigate, queryClient, t]);

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate(-1);
    }
  };

  const getStepValid = () => {
    switch (step) {
      case 1: return isStep1Valid;
      case 2: return isStep2Valid;
      case 3: return isStep3Valid;
      default: return false;
    }
  };

  return (
    <>
      <MobileLayout
        header={
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">{t("send.back")}</span>
          </button>
        }
        rightAction={<div className="flex items-center gap-2"><ThemeSwitcher /><LanguageSwitcher /></div>}
      >
        <div className="px-4 py-6 pb-32 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">{t("send.sendLocalBankTransfer")}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t("send.stepOf", { step, total: 3 })}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Step 1: IBAN */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t("send.recipientIban")}
                </label>
                <div className="relative">
                  <Input
                    value={iban}
                    onChange={(e) => setIban(formatIban(e.target.value))}
                    placeholder="AE07 0331 2345 6789 0123 456"
                    className="h-14 rounded-2xl bg-secondary border-0 text-base font-mono pr-12"
                    inputMode="text"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        setIban(formatIban(text));
                      } catch (err) {
                        console.error("Failed to read clipboard");
                      }
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-background/50 transition-colors"
                    aria-label="Paste from clipboard"
                  >
                    <ClipboardPaste className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("send.enterIban")}
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Recipient Details */}
          {step === 2 && (
            <div className="space-y-6">
              {/* System IBAN badge */}
              {isSystemIban && (
                <div className="flex items-center gap-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-2xl px-4 py-3">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">
                    {t("send.ibanFoundInSystem", "IBAN найден в системе — данные заполнены автоматически")}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t("send.recipientName")}
                </label>
                <Input
                  value={recipientName}
                  onChange={(e) => !fieldsReadOnly && setRecipientName(e.target.value)}
                  readOnly={fieldsReadOnly}
                  placeholder="John Smith"
                  className={`h-14 rounded-2xl bg-secondary border-0 text-base ${fieldsReadOnly ? 'opacity-80' : ''}`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t("send.bankName")}
                </label>
                <Input
                  value={bankName}
                  onChange={(e) => !fieldsReadOnly && setBankName(e.target.value)}
                  readOnly={fieldsReadOnly}
                  placeholder="Emirates NBD"
                  className={`h-14 rounded-2xl bg-secondary border-0 text-base ${fieldsReadOnly ? 'opacity-80' : ''}`}
                />
              </div>
            </div>
          )}

          {/* Step 3: Amount */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Source Selection - Card or Referral Balance */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {isReferralWithdrawal ? t("partner.referralBalance", "Реферальный счёт") : t("send.fromSource", "Откуда")}
                </label>
                {isReferralWithdrawal ? (
                  <div className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">{t("partner.referralBalance", "Реферальный счёт")}</p>
                        <p className="text-sm text-muted-foreground">
                          {referralBalance.toFixed(2)} AED
                        </p>
                      </div>
                    </div>
                  </div>
                ) : selectedSource ? (
                  <button
                    onClick={() => setSourceDrawerOpen(true)}
                    className="w-full flex items-center justify-between p-4 bg-secondary rounded-2xl hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedSource.type === "bank"
                          ? "bg-purple-500"
                          : selectedSource.type === "wallet"
                            ? "bg-[#26A17B]"
                            : selectedSource.cardType === "metal" 
                              ? "bg-gradient-to-br from-zinc-400 to-zinc-600" 
                              : "bg-primary"
                      }`}>
                        {selectedSource.type === "bank" 
                          ? <Landmark className="w-5 h-5 text-primary-foreground" />
                          : selectedSource.type === "wallet"
                            ? <Wallet className="w-5 h-5 text-white" />
                            : <CreditCard className="w-5 h-5 text-primary-foreground" />
                        }
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">{selectedSource.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedSource.subtitle}
                          {selectedSource.balance > 0 && ` · ${selectedSource.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${selectedSource.type === "wallet" ? "USDT" : "AED"}`}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </button>
                ) : (
                  <div className="w-full p-4 bg-secondary rounded-2xl animate-pulse h-16" />
                )}
              </div>

              {/* Transfer Details Summary */}
              <div className="bg-secondary rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">{t("send.to")}</span>
                  <span className="font-medium">{recipientName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">{t("send.iban")}</span>
                  <span className="font-medium font-mono text-sm">{iban}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">{t("send.bank")}</span>
                  <span className="font-medium">{bankName}</span>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">
                    {t("send.amount")}
                  </label>
                  <span className="text-sm text-muted-foreground">
                    {t("send.available")}: <span className="font-medium text-foreground">
                      {isWalletSource 
                        ? `${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT`
                        : `${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} AED`
                      }
                    </span>
                  </span>
                </div>
                <div className="relative">
                  <Input
                    value={formatDisplayAmount(amountAED)}
                    onChange={(e) => setAmountAED(formatAmountInput(parseDisplayAmount(e.target.value)))}
                    placeholder="0.00"
                    className="h-14 rounded-2xl bg-secondary border-0 text-base pr-28"
                    inputMode="decimal"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (isWalletSource) {
                          const maxAmount = (availableBalance - NETWORK_FEE_USDT) / (1 + BANK_TRANSFER_FEE_PERCENT / 100);
                          setAmountAED(Math.max(0, maxAmount).toFixed(2));
                        } else {
                          const maxAmount = availableBalanceAed / (1 + BANK_TRANSFER_FEE_PERCENT / 100);
                          setAmountAED(maxAmount.toFixed(2));
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
                    >
                      MAX
                    </button>
                    <span className="text-muted-foreground font-medium">
                      {isWalletSource ? 'USDT' : 'AED'}
                    </span>
                  </div>
                </div>

                {/* Quick amount buttons */}
                <div className="flex gap-2">
                  {[500, 1000, 3000, 5000].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmountAED(val.toString())}
                      className="flex-1 py-2 rounded-xl bg-secondary text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
                    >
                      {val.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="bg-secondary rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("send.transferAmount")}</span>
                  <span className="font-medium">{parseFloat(amountAED || "0").toLocaleString('en-US', { minimumFractionDigits: 2 })} {isWalletSource ? 'USDT' : 'AED'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("send.transferFee")} ({BANK_TRANSFER_FEE_PERCENT}%)</span>
                  <span className="font-medium text-[#FFA000]">+{parseFloat(transferFee).toLocaleString('en-US', { minimumFractionDigits: 2 })} {isWalletSource ? 'USDT' : 'AED'}</span>
                </div>
                {isWalletSource && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("send.networkFee", "Сбор сети")}</span>
                    <span className="font-medium text-[#FFA000]">+{NETWORK_FEE_USDT.toFixed(2)} USDT</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-muted-foreground">{t("send.total")}</span>
                  <span className="font-semibold text-lg">{parseFloat(totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {isWalletSource ? 'USDT' : 'AED'}</span>
                </div>
              </div>

              {/* USDT Conversion Info — exchange rate for wallet source */}
              {isWalletSource && parseFloat(amountAED || "0") > 0 && (
                <div className="bg-primary/5 rounded-2xl p-4 space-y-2 border border-primary/10">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("send.exchangeRate", "Курс")}</span>
                    <span className="font-medium">1 USDT = {USDT_TO_AED_BUY} AED</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("send.recipientWillReceive", "Получатель получит")}</span>
                    <span className="font-semibold text-lg">{(parseFloat(amountAED || "0") * USDT_TO_AED_BUY).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED</span>
                  </div>
                </div>
              )}

              {parseFloat(totalAmount) > (isWalletSource ? availableBalance : availableBalanceAed) && (
                <div className="bg-red-500/10 rounded-2xl p-4">
                  <p className="text-sm text-red-500">
                    ⚠️ {t("send.insufficientBalanceWarning")}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="pt-4">
            <PoweredByFooter />
          </div>
        </div>

        {/* Fixed Continue Button */}
        <div className="fixed bottom-0 left-0 right-0 p-6 max-w-[800px] mx-auto">
          <Button
            onClick={handleNext}
            disabled={!getStepValid() || isSubmitting || ibanLookupLoading}
            className="w-full h-14 rounded-2xl text-base font-semibold bg-primary/90 hover:bg-primary active:scale-95 backdrop-blur-2xl border-2 border-white/50 shadow-lg transition-all"
          >
            {(isSubmitting || ibanLookupLoading) ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {ibanLookupLoading ? t("send.checkingIban", "Проверка IBAN...") : t("send.processing", "Обработка...")}
              </span>
            ) : step === 3 ? (
              `${t("send.continue")} ${isWalletSource ? (parseFloat(amountAED || "0") * USDT_TO_AED_BUY).toLocaleString('en-US', { minimumFractionDigits: 2 }) : parseFloat(amountAED || "0").toLocaleString('en-US', { minimumFractionDigits: 2 })} AED`
            ) : (
              <span className="flex items-center gap-2">
                {t("send.continue")}
                <ArrowRight className="w-5 h-5" />
              </span>
            )}
          </Button>
        </div>
      </MobileLayout>

      {/* Source Selection Drawer */}
      <Drawer open={sourceDrawerOpen} onOpenChange={setSourceDrawerOpen}>
        <DrawerContent className="bg-background/95 backdrop-blur-xl">
          <DrawerHeader className="relative flex items-center justify-center py-4">
            <DrawerTitle className="text-center text-base font-semibold">
              {t("send.selectSource", "Откуда перевести")}
            </DrawerTitle>
            <DrawerClose className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <X className="w-3.5 h-3.5 text-primary" />
            </DrawerClose>
          </DrawerHeader>
          
          <div className="px-4 pb-6">
            <div className="bg-muted/50 rounded-xl overflow-hidden">
              {sourceOptions.map((source, index) => (
                <button
                  key={source.id}
                  onClick={() => {
                    const wasWallet = selectedSource?.type === "wallet";
                    const isNowWallet = source.type === "wallet";
                    if (wasWallet !== isNowWallet) setAmountAED("");
                    setSelectedSource(source);
                    setSourceDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/80 transition-colors ${
                    index < sourceOptions.length - 1 ? 'border-b border-border/50' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    source.type === "bank"
                      ? "bg-purple-500"
                      : source.type === "wallet"
                        ? "bg-[#26A17B]"
                        : source.cardType === "metal" 
                          ? "bg-gradient-to-br from-zinc-400 to-zinc-600" 
                          : "bg-primary"
                  }`}>
                    {source.type === "bank" 
                      ? <Landmark className="w-5 h-5 text-primary-foreground" />
                      : source.type === "wallet"
                        ? <Wallet className="w-5 h-5 text-white" />
                        : <CreditCard className="w-5 h-5 text-primary-foreground" />
                    }
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-base font-medium text-foreground">{source.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {source.subtitle}
                      {source.balance > 0 && ` · ${source.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${source.type === "wallet" ? "USDT" : "AED"}`}
                    </p>
                  </div>
                  {selectedSource?.id === source.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default SendBank;
