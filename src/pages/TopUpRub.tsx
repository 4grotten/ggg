import { useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";

const PAYMENT_URL = "https://www.tinkoff.ru/";

const TopUpRub = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleOpenLink = () => {
    window.open(PAYMENT_URL, "_blank");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(PAYMENT_URL);
    toast.success(t("toast.copied", "Скопировано"));
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
            <div className="w-10 h-10 rounded-full bg-[#FF6B35] flex items-center justify-center">
              <span className="text-white text-lg font-bold">₽</span>
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {t("topUpRub.rubToUsdt", "RUB → USDT")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("topUpRub.exchangeDescription", "Обмен рублей на USDT")}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("topUpRub.howItWorks", "Отсканируйте QR-код или перейдите по ссылке для оплаты. После пополнения USDT поступят на ваш кошелёк.")}
          </p>
        </motion.div>

        {/* QR Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center p-4 rounded-2xl bg-transparent"
        >
          <div className="bg-white p-4 rounded-2xl inline-block">
            <QRCodeSVG value={PAYMENT_URL} size={200} level="M" />
          </div>
          <p className="text-sm text-muted-foreground text-center mt-3">
            {t("topUpRub.scanToOpen", "Отсканируйте для перехода к оплате")}
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
                {t("topUpRub.openLinkDesc", "Открыть страницу оплаты")}
              </p>
            </div>
            <ExternalLink className="w-5 h-5 text-muted-foreground/60" />
          </button>
        </motion.div>
      </div>
    </MobileLayout>
  );
};

export default TopUpRub;
