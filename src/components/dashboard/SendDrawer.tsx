import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, QrCode, Landmark, CreditCard, X, Wallet, ArrowLeft } from "lucide-react";
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

interface SendDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SubMenu = null | "stablecoins" | "bank";

export const SendDrawer = ({ open, onOpenChange }: SendDrawerProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [authAlertOpen, setAuthAlertOpen] = useState(false);
  const [subMenu, setSubMenu] = useState<SubMenu>(null);

  const handleClose = (val: boolean) => {
    if (!val) setSubMenu(null);
    onOpenChange(val);
  };

  const mainOptions = [
    {
      id: "card",
      icon: CreditCard,
      title: "Easy Card",
      subtitle: t("drawer.sendToCard"),
      iconBg: "bg-primary",
    },
    {
      id: "stablecoins",
      icon: QrCode,
      title: t("drawer.stablecoins"),
      subtitle: "USDT, USDC",
      iconBg: "bg-green-500",
    },
    {
      id: "bank",
      icon: Landmark,
      title: t("drawer.bankTransfer"),
      subtitle: "AED Wire",
      iconBg: "bg-purple-500",
    },
  ];

  const stablecoinOptions = [
    {
      id: "crypto-card",
      icon: CreditCard,
      title: t("wallet.sendFromCard", "Перевод с карты"),
      subtitle: t("wallet.sendToCardDesc", "Мгновенный перевод средств на Easy Card"),
      iconBg: "bg-primary",
    },
    {
      id: "crypto-wallet",
      icon: Wallet,
      title: t("wallet.sendToWallet", "Перевод на Кошелёк USDT"),
      subtitle: t("wallet.sendToWalletDesc", "Перевод USDT на Кошелек EasyCard так и внешний"),
      iconBg: "bg-green-500",
    },
    {
      id: "crypto-bank",
      icon: Landmark,
      title: t("drawer.bankTransfer", "Банковский перевод"),
      subtitle: t("wallet.sendToBankDesc", "Перевод на банковский счет (IBAN)"),
      iconBg: "bg-purple-500",
    },
  ];

  const bankOptions = [
    {
      id: "bank-own-card",
      icon: CreditCard,
      title: t("account.toMyCard", "На свою карту"),
      subtitle: t("account.toMyCardDesc", "Со счёта на карту"),
      iconBg: "bg-primary",
    },
    {
      id: "bank-iban-easycard",
      icon: CreditCard,
      title: "IBAN → EasyCard",
      subtitle: t("account.ibanToCardDesc", "Со счёта IBAN на карту"),
      iconBg: "bg-primary",
    },
    {
      id: "bank-account",
      icon: Landmark,
      title: t("account.toAccount", "На счёт"),
      subtitle: t("account.toAccountDesc", "Банковский перевод"),
      iconBg: "bg-green-600",
    },
    {
      id: "bank-usdt",
      icon: Wallet,
      title: t("account.usdtWallet", "Кошелёк USDT TRC20"),
      subtitle: t("account.usdtWalletDesc", "Перевод криптовалюты"),
      iconBg: "bg-green-600",
    },
  ];

  const navigateAuth = (path: string) => {
    if (!isAuthenticated) {
      handleClose(false);
      setTimeout(() => setAuthAlertOpen(true), 300);
      return;
    }
    handleClose(false);
    navigate(path);
  };

  const handleMainClick = (optionId: string) => {
    if (optionId === "card") {
      navigateAuth("/send-to-card");
    } else if (optionId === "stablecoins") {
      setSubMenu("stablecoins");
    } else if (optionId === "bank") {
      setSubMenu("bank");
    }
  };

  const handleStablecoinClick = (optionId: string) => {
    if (optionId === "crypto-card") {
      navigateAuth("/send/crypto-to-card");
    } else if (optionId === "crypto-wallet") {
      navigateAuth("/send/crypto");
    } else if (optionId === "crypto-bank") {
      navigateAuth("/send/bank");
    }
  };

  const handleBankClick = (optionId: string) => {
    if (optionId === "bank-own-card") {
      navigateAuth("/send-IBAN-card");
    } else if (optionId === "bank-iban-easycard") {
      navigateAuth("/send-IBAN-external");
    } else if (optionId === "bank-account") {
      navigateAuth("/send/bank");
    } else if (optionId === "bank-usdt") {
      navigateAuth("/send/crypto");
    }
  };

  const currentOptions = subMenu === "stablecoins" ? stablecoinOptions 
    : subMenu === "bank" ? bankOptions 
    : mainOptions;

  const currentHandler = subMenu === "stablecoins" ? handleStablecoinClick
    : subMenu === "bank" ? handleBankClick
    : handleMainClick;

  const currentTitle = subMenu === "stablecoins" ? t("drawer.stablecoins", "Стейблкоины")
    : subMenu === "bank" ? t("drawer.bankTransfer", "Банковский перевод")
    : t("drawer.sendMoneyWith");

  return (
    <>
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="bg-background/95 backdrop-blur-xl">
          <DrawerHeader className="relative flex items-center justify-center py-4">
            {subMenu && (
              <button 
                onClick={() => setSubMenu(null)}
                className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-primary" />
              </button>
            )}
            <DrawerTitle className="text-center text-base font-semibold">
              {currentTitle}
            </DrawerTitle>
            <DrawerClose className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <X className="w-3.5 h-3.5 text-primary" />
            </DrawerClose>
          </DrawerHeader>
          
          <div className="px-4 pb-6">
            <AnimatedDrawerContainer key={subMenu || "main"} className="bg-muted/50 rounded-xl overflow-hidden">
              {currentOptions.map((option, index) => (
                <AnimatedDrawerItem key={option.id} index={index}>
                  <button
                    onClick={() => currentHandler(option.id)}
                    className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/80 transition-colors ${
                      index < currentOptions.length - 1 ? 'border-b border-border/50' : ''
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
