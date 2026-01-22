import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Clock, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { CardMiniature } from "@/components/dashboard/CardMiniature";
import { VIRTUAL_CARD_ANNUAL_FEE, METAL_CARD_ANNUAL_FEE, USDT_TO_AED_TOP_UP, TOP_UP_CRYPTO_FEE } from "@/lib/fees";

const OpenCardPayCrypto = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const cardType = searchParams.get("type") as "virtual" | "metal" || "virtual";
  
  // Timer for crypto payment (30 minutes = 1800 seconds)
  const [timeLeft, setTimeLeft] = useState(1800);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Crypto wallet address (mock)
  const cryptoWalletAddress = "TN7X8dH3qwP9mKvL2YnZ6bR4cF5jW1sA8e";

  const cardIssuanceFee = cardType === "virtual" ? VIRTUAL_CARD_ANNUAL_FEE : METAL_CARD_ANNUAL_FEE;
  const cryptoAmountUsdt = (cardIssuanceFee / USDT_TO_AED_TOP_UP) + TOP_UP_CRYPTO_FEE;

  // Start timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBalance = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatCrypto = (amount: number) => amount.toFixed(2);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(cryptoWalletAddress);
    toast.success(t('toast.copied'));
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
          <h1 className="text-lg font-semibold">{t('openCard.payWithCrypto')}</h1>
        </div>
      }
    >
      <div className="px-4 py-6 space-y-4 pb-32">
        {/* Payment Details */}
        <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-16 shrink-0">
              <CardMiniature type={cardType} />
            </div>
            <div className="flex-1">
              <p className="font-semibold">
                {cardType === "virtual" ? t('openCard.virtualCard') : t('openCard.metalCard')}
              </p>
              <p className="text-xs text-muted-foreground">{t('openCard.annualServiceDescription')}</p>
            </div>
          </div>

          {/* Fee Breakdown with rates */}
          <div className="space-y-2 pt-3 border-t border-border/50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('openCard.annualFee')}</span>
              <span className="font-medium">{formatBalance(cardIssuanceFee)} AED</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('openCard.servicePeriod')}</span>
              <span className="font-medium">12 {t('openCard.months')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('openCard.exchangeRate')}</span>
              <span className="font-medium">1 USDT = {USDT_TO_AED_TOP_UP} AED</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('openCard.networkFee')}</span>
              <span className="font-medium">{TOP_UP_CRYPTO_FEE} USDT</span>
            </div>
            <div className="flex justify-between text-base pt-2 border-t border-border/50">
              <span className="font-semibold">{t('openCard.totalToPay')}</span>
              <span className="font-bold text-primary">{formatCrypto(cryptoAmountUsdt)} USDT</span>
            </div>
          </div>
        </div>

        {/* QR Code and Address */}
        <div className="flex flex-col items-center p-4 rounded-2xl bg-white">
          <QRCodeSVG
            value={cryptoWalletAddress}
            size={180}
            level="M"
            className="mb-3"
          />
          <p className="text-xs text-muted-foreground mb-2">{t('openCard.sendExactAmount')}</p>
          <p className="text-xl font-bold text-foreground">{formatCrypto(cryptoAmountUsdt)} USDT</p>
          <p className="text-xs text-muted-foreground mt-2">{t('openCard.network')}: TRC20</p>
        </div>

        {/* Wallet Address */}
        <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
          <p className="text-xs text-muted-foreground mb-2">{t('openCard.walletAddress')}</p>
          <div className="flex items-center gap-3">
            <p className="text-sm font-mono flex-1 break-all">{cryptoWalletAddress}</p>
            <button
              onClick={handleCopyAddress}
              className="p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>

        {timeLeft === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-sm text-destructive text-center"
          >
            {t('openCard.paymentExpired')}
          </motion.div>
        )}
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 max-w-[800px] mx-auto">
        <button
          disabled
          className="w-full py-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-600 font-semibold flex items-center justify-center gap-3 backdrop-blur-2xl"
        >
          <Clock className="w-5 h-5" />
          <span>{t('openCard.waitingPayment')}</span>
          <span className="font-mono bg-amber-500/20 px-3 py-1 rounded-lg text-sm">
            {formatTime(timeLeft)}
          </span>
        </button>
      </div>
    </MobileLayout>
  );
};

export default OpenCardPayCrypto;
