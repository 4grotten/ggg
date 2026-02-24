import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Landmark, ArrowRightLeft, Check, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { CardMiniature } from "@/components/dashboard/CardMiniature";
import { useSettings } from "@/contexts/SettingsContext";
import { useBankAccounts, useWalletSummary } from "@/hooks/useCards";
import { Card } from "@/types/card";
import { useAuth } from "@/contexts/AuthContext";
import { submitInternalTransfer } from "@/services/api/transactions";
import aedCurrency from "@/assets/aed-currency.png";

const SendIbanToCard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const settings = useSettings();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: walletData } = useWalletSummary();
  const { data: bankAccountsData, isLoading: bankLoading } = useBankAccounts();

  const bankAccount = bankAccountsData?.data?.[0];
  const bankAccountId = bankAccount?.id;
  const bankBalance = parseFloat(bankAccount?.balance || "0");
  const bankIban = bankAccount?.iban || "";

  // Use wallet summary cards (they have UUID ids needed for internal transfers)
  const cards: Card[] = (walletData?.data?.cards || []).map(c => ({
    id: c.id,
    type: (c.type === 'metal' ? 'metal' : 'virtual') as Card['type'],
    name: c.type === 'metal' ? 'Visa Metal' : 'Visa Virtual',
    isActive: true,
    balance: parseFloat(c.balance) || 0,
    lastFourDigits: c.card_number?.slice(-4),
  }));
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amountNum = parseFloat(amount) || 0;

  const calculation = useMemo(() => {
    if (amountNum <= 0) return null;
    return {
      amount: amountNum,
      insufficientBalance: amountNum > bankBalance,
    };
  }, [amountNum, bankBalance]);

  const quickAmounts = [100, 500, 1000, 5000];

  const isReadyToConfirm =
    selectedCard &&
    amountNum > 0 &&
    calculation &&
    !calculation.insufficientBalance &&
    bankAccountId;

  const handleConfirm = async () => {
    if (!isReadyToConfirm || !bankAccountId || !selectedCard) return;

    setIsSubmitting(true);

    try {
      const result = await submitInternalTransfer({
        from_type: "bank",
        from_id: bankAccountId,
        to_type: "card",
        to_id: selectedCard.id,
        amount: amountNum.toFixed(2),
      });

      if (result.success && result.data) {
        toast.success(t("sendIban.transferSuccess", "Перевод выполнен"), {
          description: `${result.data.credited_amount} AED → ${selectedCard.name}`,
        });
        queryClient.invalidateQueries({ queryKey: ["cards"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        navigate("/account");
      } else {
        toast.error(t("sendIban.transferFailed", "Ошибка перевода"), {
          description: result.error,
        });
      }
    } catch {
      toast.error(t("sendIban.transferFailed", "Ошибка перевода"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileLayout
      header={
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">
            {t("sendIban.title", "Со счёта на карту")}
          </h1>
        </div>
      }
      rightAction={
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      }
    >
      <div className="px-4 py-6 space-y-4 pb-32">
        {/* Source: Bank Account */}
        <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
          <div className="flex items-center gap-2 mb-1">
            <Landmark className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {t("sendIban.fromAccount", "С банковского счёта")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <img
              src={aedCurrency}
              alt="AED"
              className="w-8 h-8 dark:invert dark:brightness-200"
            />
            <span className="text-2xl font-bold">
              {bankBalance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-sm text-muted-foreground">AED</span>
          </div>
          {bankIban && (
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              IBAN: {bankIban.slice(0, 4)} ···· {bankIban.slice(-4)}
            </p>
          )}
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* Destination: Select Card */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground px-1">
            {t("sendIban.selectCard", "Выберите карту")}
          </p>
          <div className="bg-muted/50 rounded-xl overflow-hidden border border-border/50">
            {cards.map((card, index) => (
              <button
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                  index < cards.length - 1 ? "border-b border-border/50" : ""
                } ${
                  selectedCard?.id === card.id
                    ? "bg-primary/10"
                    : "hover:bg-muted/80"
                }`}
              >
                <div className="w-12 shrink-0">
                  <CardMiniature type={card.type} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">
                    {card.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    •••• {card.lastFourDigits} ·{" "}
                    {card.balance.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    AED
                  </p>
                </div>
                {selectedCard?.id === card.id && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </button>
            ))}
            {cards.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                {t("sendIban.noCards", "Нет активных карт")}
              </div>
            )}
          </div>
        </div>

        {/* Amount input */}
        <AnimatePresence>
          {selectedCard && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("sendIban.enterAmount", "Сумма перевода (AED)")}
                </p>
                <div className="flex items-center gap-2">
                  <img
                    src={aedCurrency}
                    alt="AED"
                    className="w-7 h-7 dark:invert dark:brightness-200"
                  />
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

                {/* Quick amounts */}
                <div className="flex gap-2">
                  {quickAmounts.map((qa) => (
                    <button
                      key={qa}
                      onClick={() => setAmount(qa.toString())}
                      className="flex-1 py-2 rounded-xl text-sm font-medium bg-secondary/80 hover:bg-secondary transition-colors text-foreground"
                    >
                      {qa.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              {calculation && amountNum > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("sendIban.from", "Откуда")}
                      </span>
                      <span className="font-medium">
                        {t("sendIban.bankAccount", "Банковский счёт")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("sendIban.to", "Куда")}
                      </span>
                      <span className="font-medium">
                        {selectedCard.name} •••• {selectedCard.lastFourDigits}
                      </span>
                    </div>
                    <div className="flex justify-between text-base pt-2 border-t border-border/50">
                      <span className="font-semibold">
                        {t("sendIban.transferAmount", "Сумма")}
                      </span>
                      <span className="font-bold text-primary">
                        {amountNum.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        AED
                      </span>
                    </div>
                  </div>

                  {calculation.insufficientBalance && (
                    <p className="text-xs text-destructive text-center pt-1">
                      {t(
                        "sendIban.insufficientBalance",
                        "Недостаточно средств на счёте"
                      )}
                    </p>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed Bottom Button */}
      {isReadyToConfirm && amountNum > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 max-w-[800px] mx-auto">
          <button
            onClick={handleConfirm}
            disabled={calculation?.insufficientBalance || isSubmitting}
            className="w-full py-4 rounded-2xl font-semibold text-base transition-all backdrop-blur-2xl disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-primary-foreground active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
            {isSubmitting
              ? t("sendIban.processing", "Обработка...")
              : t("sendIban.confirm", "Подтвердить перевод")}
          </button>
        </div>
      )}
    </MobileLayout>
  );
};

export default SendIbanToCard;
