import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Wallet, ChevronRight, ArrowRightLeft, Check, Landmark, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { CardMiniature } from "@/components/dashboard/CardMiniature";
import { useSettings } from "@/contexts/SettingsContext";
import { UsdtIcon } from "@/components/icons/CryptoIcons";
import { useCards } from "@/hooks/useCards";
import { useBankAccounts, useCryptoWallets } from "@/hooks/useCards";
import { Card } from "@/types/card";
import { useAuth } from "@/contexts/AuthContext";
import { submitInternalTransfer } from "@/services/api/transactions";
import { useQueryClient } from "@tanstack/react-query";

type Destination = "card" | "account";

const TopUpFromUsdtBalance = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const settings = useSettings();
  const { data: cardsData } = useCards();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch crypto wallets to get the from_id
  const { data: cryptoWalletsData } = useCryptoWallets();
  // Fetch bank accounts to get the to_id for "account" destination
  const { data: bankAccountsData } = useBankAccounts();

  const cryptoWalletId = cryptoWalletsData?.data?.[0]?.id;
  const cryptoBalance = parseFloat(cryptoWalletsData?.data?.[0]?.balance || '0');
  const bankAccountId = bankAccountsData?.data?.[0]?.id;

  const uid = user?.id?.toString() ?? "000";
  const beneficiaryName = user?.full_name || "—";
  const accountNumber = `1234567890${uid}`;
  const iban = `AE07033123456789012${uid}`;

  const [destination, setDestination] = useState<Destination | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [amount, setAmount] = useState("");

  const cards = cardsData?.data ?? [];
  const amountNum = parseFloat(amount) || 0;

  const calculation = useMemo(() => {
    if (amountNum <= 0) return null;

    const commissionPercent = settings.CARD_TO_CARD_FEE_PERCENT; // 1%
    const networkFee = settings.TOP_UP_CRYPTO_FEE; // 5.90 USDT
    const rate = settings.USDT_TO_AED_SELL; // 1 USDT = 3.69 AED
    const commission = amountNum * (commissionPercent / 100);
    const totalUsdt = amountNum + commission + networkFee;
    const receiveAed = amountNum * rate;

    return {
      amountUsdt: amountNum,
      commissionPercent,
      commission,
      networkFee,
      totalUsdt,
      rate,
      receiveAed,
      insufficientBalance: totalUsdt > cryptoBalance,
    };
  }, [amountNum, settings]);

  const quickAmounts = [10, 25, 50, 100];

  const isReadyToConfirm =
    destination &&
    amountNum > 0 &&
    calculation &&
    !calculation.insufficientBalance &&
    (destination === "account" || selectedCard);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!isReadyToConfirm || !cryptoWalletId) return;
    
    // Determine to_type and to_id based on destination
    const toType = destination === "card" ? "card" : "bank";
    const toId = destination === "card" ? selectedCard!.id : bankAccountId;
    
    if (!toId) {
      toast.error(t("topUpUsdt.noDestinationAccount", "Счёт назначения не найден"));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await submitInternalTransfer({
        from_type: "crypto",
        from_id: cryptoWalletId,
        to_type: toType,
        to_id: toId,
        amount: amountNum.toFixed(2),
      });
      
      if (result.success && result.data) {
        toast.success(t("topUpUsdt.transferSuccess", "Перевод выполнен успешно"), {
          description: `${result.data.credited_amount} AED`,
        });
        
        // Invalidate caches
        queryClient.invalidateQueries({ queryKey: ['cards'] });
        
        navigate("/");
      } else {
        toast.error(t("topUpUsdt.transferFailed", "Ошибка перевода"), {
          description: result.error,
        });
      }
    } catch {
      toast.error(t("topUpUsdt.transferFailed", "Ошибка перевода"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectDestination = (dest: Destination) => {
    setDestination(dest);
    setSelectedCard(null);
    setAmount("");
  };

  const showAmountInput = destination === "account" || (destination === "card" && selectedCard);

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
            {t("topUpUsdt.title", "Пополнение с USDT")}
          </h1>
        </div>
      }
      rightAction={<div className="flex items-center gap-2"><ThemeSwitcher /><LanguageSwitcher /></div>}
    >
      <div className="px-4 py-6 space-y-4 pb-32">
        {/* Available USDT Balance */}
        <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
          <div className="flex items-center gap-2 mb-1">
            <UsdtIcon size={16} />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {t("topUpUsdt.availableBalance", "Доступный баланс")}
            </p>
          </div>
          <p className="text-2xl font-bold">
            <span className="text-[#26A17B]">$</span>
            {cryptoBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
            <span className="text-sm text-muted-foreground">USDT</span>
          </p>
        </div>

        {/* Destination selector */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground px-1">
            {t("topUpUsdt.selectDestination", "Куда перевести")}
          </p>
          <div className="bg-muted/50 rounded-xl overflow-hidden border border-border/50">
            <button
              onClick={() => handleSelectDestination("card")}
              className={`w-full flex items-center gap-3 px-4 py-4 transition-colors border-b border-border/50 ${
                destination === "card" ? "bg-primary/10" : "hover:bg-muted/80"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  destination === "card" ? "bg-primary" : "bg-muted"
                }`}
              >
                <CreditCard
                  className={`w-5 h-5 ${
                    destination === "card" ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                />
              </div>
              <div className="flex-1 text-left">
                <p className="text-base font-medium text-foreground">
                  {t("topUpUsdt.toCard", "На карту")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("topUpUsdt.toCardDesc", "Пополнить баланс карты")}
                </p>
              </div>
              {destination === "card" ? (
                <Check className="w-5 h-5 text-primary" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
              )}
            </button>

            <button
              onClick={() => handleSelectDestination("account")}
              className={`w-full flex items-center gap-3 px-4 py-4 transition-colors ${
                destination === "account" ? "bg-primary/10" : "hover:bg-muted/80"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  destination === "account" ? "bg-primary" : "bg-muted"
                }`}
              >
                <Wallet
                  className={`w-5 h-5 ${
                    destination === "account" ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                />
              </div>
              <div className="flex-1 text-left">
                <p className="text-base font-medium text-foreground">
                  {t("topUpUsdt.toAccount", "На счёт")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("topUpUsdt.toAccountDesc", "Зачислить на основной счёт")}
                </p>
              </div>
              {destination === "account" ? (
                <Check className="w-5 h-5 text-primary" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
              )}
            </button>
          </div>
        </div>

        {/* Card selector - shown when "На карту" is selected */}
        <AnimatePresence>
          {destination === "card" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <p className="text-sm font-medium text-muted-foreground px-1">
                {t("topUpUsdt.selectCard", "Выберите карту")}
              </p>
              <div className="bg-muted/50 rounded-xl overflow-hidden border border-border/50">
                {cards.map((card, index) => (
                  <button
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                      index < cards.length - 1 ? "border-b border-border/50" : ""
                    } ${selectedCard?.id === card.id ? "bg-primary/10" : "hover:bg-muted/80"}`}
                  >
                    <div className="w-12 shrink-0">
                      <CardMiniature type={card.type} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-foreground">{card.name}</p>
                      <p className="text-xs text-muted-foreground">
                        •••• {card.lastFourDigits} · {card.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })} AED
                      </p>
                    </div>
                    {selectedCard?.id === card.id && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                ))}
                {cards.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    {t("topUpUsdt.noCards", "Нет активных карт")}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Account bank details - shown when "На счёт" is selected */}
        <AnimatePresence>
          {destination === "account" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Landmark className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold">
                    {t("topUpUsdt.accountDetails", "Реквизиты счёта")}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("topUpUsdt.beneficiary", "Получатель")}</span>
                    <span className="font-medium text-foreground">{beneficiaryName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("topUpUsdt.accountNumber", "Номер счёта")}</span>
                    <span className="font-mono text-xs font-medium text-foreground">{accountNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IBAN</span>
                    <span className="font-mono text-xs font-medium text-foreground">{iban}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("topUpUsdt.bank", "Банк")}</span>
                    <span className="font-medium text-foreground">Emirates NBD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("topUpUsdt.currency", "Валюта")}</span>
                    <span className="font-medium text-foreground">AED</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Amount input - shown after destination + card (if card) are selected */}
        <AnimatePresence>
          {showAmountInput && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("topUpUsdt.enterAmount", "Сумма перевода (USDT)")}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl text-[#26A17B] font-bold">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 text-2xl font-bold bg-transparent outline-none text-foreground placeholder:text-muted-foreground/40"
                  />
                  <span className="text-sm text-muted-foreground">USDT</span>
                </div>

                {/* Quick amounts */}
                <div className="flex gap-2">
                  {quickAmounts.map((qa) => (
                    <button
                      key={qa}
                      onClick={() => setAmount(qa.toString())}
                      className="flex-1 py-2 rounded-xl text-sm font-medium bg-secondary/80 hover:bg-secondary transition-colors text-foreground"
                    >
                      {qa}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculation */}
              {calculation && amountNum > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowRightLeft className="w-4 h-4 text-primary" />
                    <p className="text-sm font-semibold">
                      {t("topUpUsdt.calculation", "Калькуляция")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("topUpUsdt.transferAmount", "Сумма перевода")}
                      </span>
                      <span className="font-medium">
                        {calculation.amountUsdt.toFixed(2)} USDT
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("topUpUsdt.exchangeRate", "Курс обмена")}
                      </span>
                      <span className="font-medium">
                        1 USDT = {calculation.rate} AED
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("topUpUsdt.commission", "Комиссия")} ({calculation.commissionPercent}%)
                      </span>
                      <span className="font-medium">
                        {calculation.commission.toFixed(2)} USDT
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("topUpUsdt.networkFee", "Сетевая комиссия")}
                      </span>
                      <span className="font-medium">
                        {calculation.networkFee.toFixed(2)} USDT
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                      <span className="text-muted-foreground">
                        {t("topUpUsdt.totalDeducted", "Итого списано")}
                      </span>
                      <span className="font-semibold">
                        {calculation.totalUsdt.toFixed(2)} USDT
                      </span>
                    </div>
                    {destination === "card" && selectedCard && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t("topUpUsdt.destinationCard", "Карта зачисления")}
                        </span>
                        <span className="font-medium">
                          {selectedCard.name} •••• {selectedCard.lastFourDigits}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-base pt-2 border-t border-border/50">
                      <span className="font-semibold">
                        {t("topUpUsdt.youReceive", "Вы получите")}
                      </span>
                      <span className="font-bold text-primary">
                        {calculation.receiveAed.toFixed(2)} AED
                      </span>
                    </div>
                  </div>

                  {calculation.insufficientBalance && (
                    <p className="text-xs text-destructive text-center pt-1">
                      {t(
                        "topUpUsdt.insufficientBalance",
                        "Недостаточно средств на USDT балансе"
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
            {isSubmitting ? t("topUpUsdt.processing", "Обработка...") : t("topUpUsdt.confirm", "Подтвердить перевод")}
          </button>
        </div>
      )}
    </MobileLayout>
  );
};

export default TopUpFromUsdtBalance;
