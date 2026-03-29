import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { UsdtIcon, TronIcon } from "@/components/icons/CryptoIcons";
import { useCryptoWallets } from "@/hooks/useCards";
import sbpLogo from "@/assets/sbp-logo.png";

const EXCHANGE_RATE = 92.5; // 1 USDT = 92.5 RUB (placeholder)

const formatNumber = (value: string): string => {
  if (!value) return "";
  const parts = value.split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
};

const parseFormattedNumber = (value: string): string => {
  return value.replace(/,/g, "");
};

const SendUsdtToRub = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: cryptoWalletsData } = useCryptoWallets();
  const cryptoWallets = Array.isArray((cryptoWalletsData as any)?.data) ? (cryptoWalletsData as any).data : [];
  const usdtWallet = cryptoWallets.find((w: any) => w.token === 'USDT' || w.token === 'usdt');
  const WALLET_BALANCE = usdtWallet ? parseFloat(usdtWallet.balance) : 0;

  const [usdtDisplay, setUsdtDisplay] = useState("");
  const [usdtRaw, setUsdtRaw] = useState("");
  const [rubDisplay, setRubDisplay] = useState("");
  const [rubRaw, setRubRaw] = useState("");

  const numericUsdt = parseFloat(usdtRaw) || 0;
  const numericRub = parseFloat(rubRaw) || 0;
  const isValid = numericUsdt > 0 && numericUsdt <= WALLET_BALANCE;

  const handleUsdtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = parseFormattedNumber(e.target.value);
    if (input && !/^\d*\.?\d{0,2}$/.test(input)) return;
    setUsdtRaw(input);
    setUsdtDisplay(formatNumber(input));
    const num = parseFloat(input) || 0;
    const rub = num > 0 ? num * EXCHANGE_RATE : 0;
    const rubStr = rub > 0 ? rub.toFixed(2) : "";
    setRubRaw(rubStr);
    setRubDisplay(rub > 0 ? formatNumber(rubStr) : "");
  };

  const handleRubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = parseFormattedNumber(e.target.value);
    if (input && !/^\d*\.?\d{0,2}$/.test(input)) return;
    setRubRaw(input);
    setRubDisplay(formatNumber(input));
    const num = parseFloat(input) || 0;
    const usdt = num > 0 ? num / EXCHANGE_RATE : 0;
    const usdtStr = usdt > 0 ? usdt.toFixed(2) : "";
    setUsdtRaw(usdtStr);
    setUsdtDisplay(usdt > 0 ? formatNumber(usdtStr) : "");
  };

  const handleQuickAmount = (amount: number) => {
    const str = amount.toString();
    setUsdtRaw(str);
    setUsdtDisplay(formatNumber(str));
    const rub = (amount * EXCHANGE_RATE).toFixed(2);
    setRubRaw(rub);
    setRubDisplay(formatNumber(rub));
  };

  const handleContinue = () => {
    if (!isValid) return;
    // TODO: navigate to confirmation/payment page
    navigate(-1);
  };

  const quickAmounts = [50, 100, 500, 1000];
  const hasValue = numericUsdt > 0;
  const exceedsBalance = numericUsdt > WALLET_BALANCE;

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
            {t("sendUsdtToRub.title", "Отправить USDT в Рубли")}
          </h1>
        </div>
      }
      rightAction={<LanguageSwitcher />}
    >
      <div className="px-4 py-6 space-y-4 pb-32">
        {/* Wallet balance */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
            <UsdtIcon size={16} />
            <span className="text-sm font-medium">
              {formatNumber(WALLET_BALANCE.toFixed(2))} USDT
            </span>
            <span className="text-sm text-muted-foreground">доступно</span>
          </div>
        </motion.div>

        {/* Exchange rate badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
            <span className="text-sm text-muted-foreground">
              1 USDT = {EXCHANGE_RATE.toLocaleString("en-US")} ₽
            </span>
          </div>
        </motion.div>

        {/* You send - USDT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-2xl bg-muted/50 border border-border/50"
        >
          <p className="text-sm text-muted-foreground mb-3">
            {t("sendUsdtToRub.youSend", "Вы отправляете")}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/80 border border-border/50 shrink-0">
              <div className="w-6 h-6 rounded-full bg-[#26A17B] flex items-center justify-center">
                <span className="text-white text-xs font-bold">₮</span>
              </div>
              <span className="text-sm font-medium">USDT</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={usdtDisplay}
              onChange={handleUsdtChange}
              placeholder="0.00"
              className={`flex-1 text-right text-3xl font-bold bg-transparent outline-none min-w-0 ml-3 ${
                exceedsBalance
                  ? "text-destructive"
                  : hasValue
                  ? "text-[#22C55E]"
                  : "text-muted-foreground/40"
              } placeholder:text-muted-foreground/40`}
            />
          </div>
          {exceedsBalance && (
            <p className="text-xs text-destructive mt-2 text-right">
              Недостаточно средств
            </p>
          )}
        </motion.div>

        {/* You receive - RUB */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl bg-muted/50 border border-border/50"
        >
          <p className="text-sm text-muted-foreground mb-3">
            {t("sendUsdtToRub.youReceive", "Вы получаете")}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/80 border border-border/50 shrink-0">
              <span className="text-lg leading-none">🇷🇺</span>
              <span className="text-sm font-medium">RUB</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={rubDisplay}
              onChange={handleRubChange}
              placeholder="0.00"
              className={`flex-1 text-right text-3xl font-bold bg-transparent outline-none min-w-0 ml-3 ${
                hasValue ? "text-[#22C55E]" : "text-muted-foreground/40"
              } placeholder:text-muted-foreground/40`}
            />
          </div>
        </motion.div>

        {/* Quick amounts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-4 gap-2"
        >
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => handleQuickAmount(amount)}
              className="py-2.5 rounded-xl bg-muted/50 border border-border/50 text-sm font-medium text-foreground hover:bg-muted/80 active:scale-95 transition-all"
            >
              {amount.toLocaleString("en-US")}
            </button>
          ))}
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <div className="w-9 h-9 rounded-full bg-[#26A17B]/15 flex items-center justify-center shrink-0">
              <span className="text-[#26A17B] text-sm font-bold">₮</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                {t("sendUsdtToRub.network", "Сеть")}
              </p>
              <p className="text-sm font-medium">Tether (TRC20)</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-white">
              <img src={sbpLogo} alt="СБП" className="w-7 h-7 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                {t("sendUsdtToRub.destination", "Получатель")}
              </p>
              <p className="text-sm font-medium">
                {t("sendUsdtToRub.sbp", "СБП (Система быстрых платежей)")}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/30 max-w-[800px] mx-auto">
        <button
          onClick={handleContinue}
          disabled={!isValid}
          className="w-full py-4 rounded-2xl bg-[#22C55E] text-white font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
        >
          {t("common.continue", "Продолжить")}
        </button>
      </div>
    </MobileLayout>
  );
};

export default SendUsdtToRub;
