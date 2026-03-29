import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { apiRequest } from "@/services/api/apiClient";


interface TopUpRubState {
  usdtAmount: number;
  rubAmount: number;
}

interface RubTopupResponse {
  message: string;
  transaction_id: string;
  sbp_link: string;
  public_link: string;
  expected_crypto: number;
}

const TopUpRub = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const state = location.state as TopUpRubState | null;
  

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<RubTopupResponse | null>(null);

  const rubAmount = state?.rubAmount || 0;
  const usdtAmount = state?.usdtAmount || 0;

  useEffect(() => {
    if (!rubAmount || rubAmount <= 0) {
      setError("Сумма не указана");
      setLoading(false);
      return;
    }

    const submitTopup = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiRequest<RubTopupResponse>(
          `/transactions/topup/rub-to-crypto/`,
          {
            method: "POST",
            body: JSON.stringify({
              amount_rub: Math.round(rubAmount),
            }),
          },
          true
        );

        if (result.error) {
          setError(result.error.detail || result.error.message || "Ошибка API");
        } else if (result.data) {
          setPaymentData(result.data);
        } else {
          setError("Неизвестная ошибка");
        }
      } catch (err: any) {
        setError(err?.message || "Ошибка сети");
      }
      setLoading(false);
    };

    submitTopup();
  }, [rubAmount]);

  const paymentUrl = paymentData?.public_link || paymentData?.sbp_link || "";

  const handleOpenLink = () => {
    if (paymentUrl) window.open(paymentUrl, "_blank");
  };

  const handleShare = async () => {
    if (!paymentUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Оплата СБП", url: paymentUrl });
      } catch {}
    } else {
      navigator.clipboard.writeText(paymentUrl);
      toast.success(t("toast.copied", "Ссылка скопирована"));
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
            {t("topUpRub.title", "Пополнение USDT рублём")}
          </h1>
        </div>
      }
      rightAction={<LanguageSwitcher />}
    >
      <div className="px-4 py-6 space-y-4 pb-32">
        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-muted/50 border border-border/50"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-lg font-bold">₽</span>
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {t("topUpRub.rubToUsdt", "RUB → USDT")}
              </p>
              <p className="text-sm text-muted-foreground">
                {rubAmount > 0
                  ? `${Math.round(rubAmount).toLocaleString("ru-RU")} ₽ → ~${usdtAmount.toFixed(2)} USDT`
                  : t("topUpRub.exchangeDescription", "Пополнение USDT через рубли")}
              </p>
            </div>
          </div>
          {paymentData?.expected_crypto && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ожидаемое зачисление: <span className="font-medium text-foreground">{paymentData.expected_crypto} USDT</span>
            </p>
          )}
        </motion.div>

        {/* Loading */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-12 gap-3"
          >
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Создаём заявку на оплату...</p>
          </motion.div>
        )}

        {/* Error */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-center"
          >
            <p className="text-sm text-destructive font-medium">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-3 text-sm text-primary underline"
            >
              Вернуться назад
            </button>
          </motion.div>
        )}

        {/* Payment data loaded */}
        {paymentData && !loading && (
          <>
            {/* QR Code */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center p-4 rounded-2xl bg-transparent"
            >
              <div className="bg-white p-4 rounded-2xl inline-block">
                <QRCodeSVG value={paymentUrl} size={200} level="M" />
              </div>
              <p className="text-sm text-muted-foreground text-center mt-3">
                {t("topUpRub.scanToOpen", "Отсканируйте для перехода к пополнению")}
              </p>
            </motion.div>

            {/* Open Link Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <button
                onClick={handleOpenLink}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border/50 hover:bg-muted/80 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <ExternalLink className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base font-medium text-foreground">
                    {t("topUpRub.openLink", "Перейти по ссылке")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("topUpRub.openLinkDesc", "Открыть страницу пополнения")}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleShare(); }}
                  className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary-foreground">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </button>
              </button>
            </motion.div>
          </>
        )}
      </div>
    </MobileLayout>
  );
};

export default TopUpRub;
