import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, QrCode, ExternalLink, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";

const EXCHANGE_SERVICE_URL = "https://t.me/easycard_exchange_bot";

const TopUpRub = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showScanner, setShowScanner] = useState(false);

  const handleScanQR = () => {
    setShowScanner(true);
    // Request camera for QR scanning
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(() => {
          toast.info(t("topUpRub.scannerOpened", "Наведите камеру на QR-код"));
        })
        .catch(() => {
          toast.error(t("topUpRub.cameraError", "Нет доступа к камере"));
          setShowScanner(false);
        });
    } else {
      toast.error(t("topUpRub.cameraNotSupported", "Камера не поддерживается"));
      setShowScanner(false);
    }
  };

  const handleOpenLink = () => {
    window.open(EXCHANGE_SERVICE_URL, "_blank");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(EXCHANGE_SERVICE_URL);
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
        {/* Info Card */}
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
                {t("topUpRub.exchangeDescription", "Обмен рублей на USDT через сервис")}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("topUpRub.howItWorks", "Отсканируйте QR-код или перейдите по ссылке на обменный сервис. После покупки USDT, средства поступят на ваш кошелёк.")}
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {/* Scan QR */}
          <button
            onClick={handleScanQR}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border/50 hover:bg-muted/80 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <QrCode className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-base font-medium text-foreground">
                {t("topUpRub.scanQR", "Сканировать QR-код")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("topUpRub.scanQRDesc", "Откройте камеру и наведите на QR")}
              </p>
            </div>
            <QrCode className="w-5 h-5 text-muted-foreground/60" />
          </button>

          {/* Open Link */}
          <button
            onClick={handleOpenLink}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border/50 hover:bg-muted/80 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-[#FF6B35] flex items-center justify-center">
              <ExternalLink className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-base font-medium text-foreground">
                {t("topUpRub.openLink", "Перейти по ссылке")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("topUpRub.openLinkDesc", "Открыть обменный сервис в браузере")}
              </p>
            </div>
            <ExternalLink className="w-5 h-5 text-muted-foreground/60" />
          </button>
        </motion.div>

        {/* Link copy section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-2xl bg-muted/50 border border-border/50"
        >
          <p className="text-xs text-muted-foreground mb-2">
            {t("topUpRub.serviceLink", "Ссылка на сервис")}
          </p>
          <div className="flex items-center gap-3">
            <p className="text-sm font-mono flex-1 break-all text-foreground">{EXCHANGE_SERVICE_URL}</p>
            <button
              onClick={handleCopyLink}
              className="p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20"
        >
          <p className="text-sm text-amber-600 dark:text-amber-400">
            ⚠️ {t("topUpRub.warning", "Используйте только проверенные обменные сервисы. EasyCard не несёт ответственности за сторонние платформы.")}
          </p>
        </motion.div>
      </div>
    </MobileLayout>
  );
};

export default TopUpRub;
