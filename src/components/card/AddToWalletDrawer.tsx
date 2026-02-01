import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ChevronRight, Wallet, Smartphone, CreditCard, Plus, CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { openWallet, detectPlatform, getWalletDeepLink } from "@/lib/walletDeepLinks";
import { toast } from "sonner";

interface AddToWalletDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
}

const steps = [
  {
    icon: Smartphone,
    titleKey: "card.walletSteps.step1Title",
    descKey: "card.walletSteps.step1Desc",
    fallbackTitle: "Откройте приложение Wallet",
    fallbackDesc: "Найдите приложение Wallet на вашем устройстве",
  },
  {
    icon: Plus,
    titleKey: "card.walletSteps.step2Title",
    descKey: "card.walletSteps.step2Desc",
    fallbackTitle: "Нажмите + для добавления",
    fallbackDesc: "В правом верхнем углу нажмите кнопку добавления",
  },
  {
    icon: CreditCard,
    titleKey: "card.walletSteps.step3Title",
    descKey: "card.walletSteps.step3Desc",
    fallbackTitle: "Выберите «Дебетовая или кредитная карта»",
    fallbackDesc: "Выберите тип карты для добавления",
  },
  {
    icon: CheckCircle2,
    titleKey: "card.walletSteps.step4Title",
    descKey: "card.walletSteps.step4Desc",
    fallbackTitle: "Отсканируйте или введите данные",
    fallbackDesc: "Наведите камеру на карту или введите данные вручную",
  },
];

export const AddToWalletDrawer = ({ 
  open, 
  onOpenChange,
  cardNumber = "•••• •••• •••• ••••",
  expiryDate = "••/••",
  cvv = "•••"
}: AddToWalletDrawerProps) => {
  const { t } = useTranslation();
  const walletHref = getWalletDeepLink();
  const isAndroid = detectPlatform() === 'android';

  const handleCopyAndOpenWallet = async () => {
    // Format card data for clipboard
    const cardData = `${t("card.cardNumber", "Номер карты")}: ${cardNumber}\n${t("card.expiry", "Срок")}: ${expiryDate}\n${t("card.cvv", "CVV")}: ${cvv}`;
    
    try {
      await navigator.clipboard.writeText(cardData);
      toast.success(t("card.dataCopied", "Данные карты скопированы"));
    } catch {
      toast.error(t("card.copyFailed", "Не удалось скопировать"));
    }

    // Then open wallet
    const result = openWallet();
    if (!result.success) {
      toast.info(
        result.reason === 'embedded'
          ? t('card.walletPreviewHint')
          : t('card.walletDesktopHint'),
        { duration: 4500 }
      );
    }
  };

  // Apple icon SVG
  const AppleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );

  // NFC waves icon
  const NfcIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8.32a7.43 7.43 0 0 1 0 7.36"/>
      <path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58"/>
      <path d="M12.91 4.1a15.91 15.91 0 0 1 .01 15.8"/>
      <path d="M16.37 2a20.16 20.16 0 0 1 0 20"/>
    </svg>
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-center">
            {isAndroid 
              ? t("card.addToGooglePay", "Добавить в Google Pay") 
              : t("card.addToApplePay", "Добавить в Apple Pay")
            }
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-8 space-y-5 overflow-y-auto">
          {/* Open Wallet Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Button
              className="w-full h-14 rounded-xl text-white relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
              }}
              onClick={handleCopyAndOpenWallet}
            >
              {/* Glow effect */}
              <div 
                className="absolute inset-0 opacity-40 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at 30% 50%, rgba(59, 130, 246, 0.4) 0%, transparent 60%)',
                }}
              />
              <div className="flex items-center gap-3 relative z-10">
                {isAndroid ? (
                  <Wallet className="w-5 h-5" />
                ) : (
                  <div className="flex items-center gap-2">
                    <AppleIcon />
                    <NfcIcon />
                  </div>
                )}
                <span className="font-medium text-sm">
                  {t("card.copyAndAddToWallet", "Скопировать и добавить в Wallet")}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-white/60 relative z-10" />
            </Button>
          </motion.div>

          {/* Divider with text */}
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {t("card.walletSteps.howTo", "Как добавить")}
            </span>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: 0.3 + index * 0.1,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50"
                >
                  {/* Icon without number */}
                  <motion.div 
                    className="flex-shrink-0"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 400,
                      damping: 15,
                      delay: 0.4 + index * 0.1 
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                  </motion.div>

                  {/* Step content with number */}
                  <div className="flex-1 pt-1">
                    <motion.h4 
                      className="font-semibold text-foreground mb-0.5 flex items-center gap-2"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 + index * 0.1 }}
                    >
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </span>
                      {t(step.titleKey, step.fallbackTitle)}
                    </motion.h4>
                    <motion.p 
                      className="text-sm text-muted-foreground ml-7"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      {t(step.descKey, step.fallbackDesc)}
                    </motion.p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Note */}
          <motion.p 
            className="text-xs text-center text-muted-foreground px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {t("card.walletSteps.note", "Данные карты можно скопировать на странице карты нажав кнопку «Показать»")}
          </motion.p>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
