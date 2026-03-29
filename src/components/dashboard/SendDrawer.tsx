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

type SubMenu = null | "card" | "stablecoins" | "bank";

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

  const cardOptions = [
    {
      id: "card-send",
      icon: CreditCard,
      title: t("wallet.sendFromCard", "Перевод с карты"),
      subtitle: t("wallet.sendFromCardDesc", "Мгновенный перевод средств с Easy Card"),
      iconBg: "bg-primary",
    },
    {
      id: "card-wallet",
      icon: Wallet,
      title: t("wallet.sendToWallet", "Перевод на Кошелёк USDT"),
      subtitle: t("wallet.sendToWalletDesc", "Перевод USDT на Кошелек EasyCard так и внешний"),
      iconBg: "bg-green-500",
    },
    {
      id: "card-bank",
      icon: Landmark,
      title: t("drawer.bankTransfer", "Банковский перевод"),
      subtitle: t("wallet.sendToBankDesc", "Перевод на банковский счет (IBAN)"),
      iconBg: "bg-purple-500",
    },
  ];

  const stablecoinOptions = [
    {
      id: "crypto-card",
      icon: CreditCard,
      title: t("wallet.sendFromCard", "Перевод с карты"),
      subtitle: t("wallet.sendFromCardDesc", "Мгновенный перевод средств с Easy Card"),
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
    {
      id: "crypto-rub",
      icon: null as any,
      customIcon: <span className="text-white text-lg font-bold">₽</span>,
      title: t("drawer.sendUsdtToRub", "Отправить USDT в Рубли"),
      customSubtitle: (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>🇷🇺</span>
          <span>RUB</span>
          <span>→</span>
          <svg className="w-4 h-4" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="#26A17B"/>
            <path d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117" fill="white"/>
          </svg>
          <span>USDT</span>
        </span>
      ),
      iconBg: "bg-primary",
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

  const handleCardClick = (optionId: string) => {
    if (optionId === "card-send") {
      navigateAuth("/send-to-card");
    } else if (optionId === "card-wallet") {
      navigateAuth("/send/crypto");
    } else if (optionId === "card-bank") {
      navigateAuth("/send/bank");
    }
  };

  const handleMainClick = (optionId: string) => {
    if (optionId === "card") {
      setSubMenu("card");
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
    } else if (optionId === "crypto-rub") {
      navigateAuth("/top-up/rub");
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

  const currentOptions = subMenu === "card" ? cardOptions
    : subMenu === "stablecoins" ? stablecoinOptions 
    : subMenu === "bank" ? bankOptions 
    : mainOptions;

  const currentHandler = subMenu === "card" ? handleCardClick
    : subMenu === "stablecoins" ? handleStablecoinClick
    : subMenu === "bank" ? handleBankClick
    : handleMainClick;

  const currentTitle = subMenu === "card" ? "Easy Card"
    : subMenu === "stablecoins" ? t("drawer.stablecoins", "Стейблкоины")
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
                      {'customIcon' in option && option.customIcon ? option.customIcon : <option.icon className="w-5 h-5 text-white" />}
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
