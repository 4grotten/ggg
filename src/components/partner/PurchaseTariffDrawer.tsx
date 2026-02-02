import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, QrCode, CreditCard, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AnimatedDrawerItem, AnimatedDrawerContainer } from "@/components/ui/animated-drawer-item";
import { useAuth } from "@/contexts/AuthContext";

interface PurchaseTariffDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tariffId: string;
  tariffName: string;
  tariffPrice: number;
  tariffDescription?: string;
}

export const PurchaseTariffDrawer = ({ 
  open, 
  onOpenChange, 
  tariffId,
  tariffName, 
  tariffPrice,
  tariffDescription
}: PurchaseTariffDrawerProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [authAlertOpen, setAuthAlertOpen] = useState(false);
  
  const options = [
    {
      id: "card",
      icon: CreditCard,
      title: t("partner.bonuses.payWithCard", "Оплата картой"),
      subtitle: t("partner.bonuses.fromBalance", "С баланса карты"),
      iconBg: "bg-primary",
    },
    {
      id: "crypto",
      icon: QrCode,
      title: t("partner.bonuses.payWithCrypto", "Оплата криптой"),
      subtitle: "USDT, USDC",
      iconBg: "bg-emerald-500",
    },
  ];

  const handleOptionClick = (optionId: string) => {
    if (!isAuthenticated) {
      onOpenChange(false);
      setTimeout(() => setAuthAlertOpen(true), 300);
      return;
    }
    
    onOpenChange(false);
    
    // Navigate with pre-filled amount
    if (optionId === "card") {
      navigate("/partner/pay-balance", { 
        state: { 
          tariffId,
          tariffName,
          tariffPrice,
          tariffDescription
        } 
      });
    } else if (optionId === "crypto") {
      navigate("/partner/pay-crypto", { 
        state: { 
          tariffId,
          tariffName,
          tariffPrice,
          tariffDescription
        } 
      });
    }
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-background/95 backdrop-blur-xl">
          <DrawerHeader className="relative flex items-center justify-center py-4">
            <div className="text-center">
              <DrawerTitle className="text-base font-semibold">
                {t("partner.bonuses.purchaseTariff", "Приобрести тариф")}
              </DrawerTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {tariffName} — <span className="text-primary font-semibold">${tariffPrice}</span>
              </p>
            </div>
            <DrawerClose className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <X className="w-3.5 h-3.5 text-primary" />
            </DrawerClose>
          </DrawerHeader>
          
          <div className="px-4 pb-6">
            <AnimatedDrawerContainer className="bg-muted/50 rounded-xl overflow-hidden">
              {options.map((option, index) => (
                <AnimatedDrawerItem key={option.id} index={index}>
                  <button
                    onClick={() => handleOptionClick(option.id)}
                    className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/80 transition-colors ${
                      index < options.length - 1 ? 'border-b border-border/50' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full ${option.iconBg} flex items-center justify-center`}>
                      <option.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-base font-medium text-foreground">{option.title}</p>
                      <p className="text-sm text-muted-foreground">{option.subtitle}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                  </button>
                </AnimatedDrawerItem>
              ))}
            </AnimatedDrawerContainer>
          </div>
        </DrawerContent>
      </Drawer>

      {/* iOS-style Auth Alert */}
      <AlertDialog open={authAlertOpen} onOpenChange={setAuthAlertOpen}>
        <AlertDialogContent className="w-[270px] rounded-2xl p-0 gap-0 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border-0 shadow-2xl">
          <div className="pt-5 pb-4 px-4 text-center">
            <AlertDialogTitle className="text-[17px] font-semibold text-foreground mb-1">
              {t('feesAndLimits.authRequired')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-muted-foreground leading-tight">
              {t('feesAndLimits.authRequiredMessage')}
            </AlertDialogDescription>
          </div>
          <div className="border-t border-[#C6C6C8] dark:border-[#38383A]">
            <button
              onClick={() => setAuthAlertOpen(false)}
              className="w-full py-[11px] text-[17px] text-[#007AFF] font-normal border-b border-[#C6C6C8] dark:border-[#38383A] active:bg-black/5 dark:active:bg-white/5 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={() => {
                setAuthAlertOpen(false);
                navigate("/auth/phone");
              }}
              className="w-full py-[11px] text-[17px] text-[#007AFF] font-semibold active:bg-black/5 dark:active:bg-white/5 transition-colors"
            >
              {t('common.authorize')}
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
