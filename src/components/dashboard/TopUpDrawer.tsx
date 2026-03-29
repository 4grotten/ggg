import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, QrCode, Landmark, Wallet, X, CreditCard, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
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
import { TronIcon, EthereumIcon } from "@/components/icons/CryptoIcons";
import { useAuth } from "@/contexts/AuthContext";

type TokenType = "USDT" | "USDC";
type NetworkId = "trc20" | "erc20";

const TOKENS: { id: TokenType; name: string; color: string; symbol: string }[] = [
  { id: "USDT", name: "Tether USDT", color: "#26A17B", symbol: "₮" },
  { id: "USDC", name: "USD Coin", color: "#2775CA", symbol: "$" },
];

const NETWORKS: { id: NetworkId; name: string; icon: JSX.Element }[] = [
  { id: "trc20", name: "Tron (TRC20)", icon: <TronIcon size={24} /> },
  { id: "erc20", name: "Ethereum (ERC20)", icon: <EthereumIcon size={24} /> },
];

type DrawerView = "main" | "select-token" | "select-network";

interface TopUpDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TopUpDrawer = ({ open, onOpenChange }: TopUpDrawerProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [authAlertOpen, setAuthAlertOpen] = useState(false);
  const [view, setView] = useState<DrawerView>("main");
  const [selectedToken, setSelectedToken] = useState<TokenType | null>(null);

  const resetState = () => {
    setView("main");
    setSelectedToken(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) resetState();
    onOpenChange(newOpen);
  };

  const options = [
    {
      id: "usdt-balance",
      icon: Wallet,
      title: t("drawer.usdtBalance", "Пополнить с USDT"),
      subtitle: t("drawer.usdtBalanceDesc", "Перевод USDT на карты и IBAN"),
      iconBg: "bg-[#26A17B]",
    },
    {
      id: "stablecoins",
      icon: QrCode,
      title: t("drawer.stablecoins"),
      subtitle: "USDT, USDC",
      iconBg: "bg-primary",
    },
    {
      id: "bank",
      icon: Landmark,
      title: t("drawer.bankTransfer"),
      subtitle: "AED Wire",
      iconBg: "bg-purple-500",
    },
    {
      id: "rub",
      icon: null as any,
      customIcon: <span className="text-white text-lg font-bold">₽</span>,
      title: t("drawer.rubTopUp", "Пополнить рублями"),
      subtitle: t("drawer.rubTopUpDesc", "RUB → USDT"),
      iconBg: "bg-primary",
    },
    {
      id: "share-card",
      icon: CreditCard,
      title: t("drawer.shareCardDetails", "Поделиться данными карты"),
      subtitle: t("drawer.shareCardDetailsDesc", "Отправить реквизиты"),
      iconBg: "bg-green-500",
    },
  ];

  const handleOptionClick = (optionId: string) => {
    if (!isAuthenticated) {
      handleOpenChange(false);
      setTimeout(() => setAuthAlertOpen(true), 300);
      return;
    }

    if (optionId === "stablecoins") {
      setView("select-token");
      return;
    }

    handleOpenChange(false);
    if (optionId === "usdt-balance") {
      navigate("/top-up/usdt-balance");
    } else if (optionId === "bank") {
      navigate("/top-up/bank");
    } else if (optionId === "share-card") {
      navigate("/card/virtual");
    } else if (optionId === "rub") {
      navigate("/top-up/rub");
    }
  };

  const handleTokenSelect = (token: TokenType) => {
    setSelectedToken(token);
    setView("select-network");
  };

  const handleNetworkSelect = (network: NetworkId) => {
    handleOpenChange(false);
    navigate(`/top-up/crypto?token=${selectedToken}&network=${network}`);
  };

  const slideVariants = {
    enter: { x: 80, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -80, opacity: 0 },
  };

  const renderContent = () => {
    if (view === "select-network") {
      const tokenInfo = TOKENS.find(tk => tk.id === selectedToken);
      return (
        <motion.div
          key="select-network"
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          <AnimatedDrawerContainer className="bg-muted/50 rounded-xl overflow-hidden">
            {NETWORKS.map((net, index) => (
              <AnimatedDrawerItem key={net.id} index={index}>
                <button
                  onClick={() => handleNetworkSelect(net.id)}
                  className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/80 transition-colors ${
                    index < NETWORKS.length - 1 ? "border-b border-border/50" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {net.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-base font-medium text-foreground">{net.name}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                </button>
              </AnimatedDrawerItem>
            ))}
          </AnimatedDrawerContainer>
        </motion.div>
      );
    }

    if (view === "select-token") {
      return (
        <motion.div
          key="select-token"
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          <AnimatedDrawerContainer className="bg-muted/50 rounded-xl overflow-hidden">
            {TOKENS.map((token, index) => (
              <AnimatedDrawerItem key={token.id} index={index}>
                <button
                  onClick={() => handleTokenSelect(token.id)}
                  className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/80 transition-colors ${
                    index < TOKENS.length - 1 ? "border-b border-border/50" : ""
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: token.color }}
                  >
                    <span className="text-white text-lg font-bold">{token.symbol}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-base font-medium text-foreground">{token.id}</p>
                    <p className="text-sm text-muted-foreground">{token.name}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                </button>
              </AnimatedDrawerItem>
            ))}
          </AnimatedDrawerContainer>
        </motion.div>
      );
    }

    return (
      <motion.div
        key="main"
        variants={slideVariants}
        initial="center"
        animate="center"
        exit="exit"
        transition={{ duration: 0.2 }}
      >
        <AnimatedDrawerContainer className="bg-muted/50 rounded-xl overflow-hidden">
          {options.map((option, index) => (
            <AnimatedDrawerItem key={option.id} index={index}>
              <button
                onClick={() => handleOptionClick(option.id)}
                className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/80 transition-colors ${
                  index < options.length - 1 ? "border-b border-border/50" : ""
                }`}
              >
                <div className={`w-10 h-10 rounded-full ${option.iconBg} flex items-center justify-center`}>
                  {option.customIcon ? option.customIcon : <option.icon className="w-5 h-5 text-white" />}
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
      </motion.div>
    );
  };

  const getTitle = () => {
    if (view === "select-token") return t("topUp.selectToken", "Выберите монету");
    if (view === "select-network") return t("topUp.selectNetworkLabel", "Выберите сеть");
    return t("drawer.topUp", "Пополнить");
  };

  const handleBack = () => {
    if (view === "select-network") setView("select-token");
    else if (view === "select-token") setView("main");
  };

  return (
    <>
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="bg-background/95 backdrop-blur-xl">
          <DrawerHeader className="relative flex items-center justify-center py-4">
            {view !== "main" && (
              <button
                onClick={handleBack}
                className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-primary" />
              </button>
            )}
            <DrawerTitle className="text-center text-base font-semibold">
              {getTitle()}
            </DrawerTitle>
            <DrawerClose className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <X className="w-3.5 h-3.5 text-primary" />
            </DrawerClose>
          </DrawerHeader>

          <div className="px-4 pb-6">
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </div>
        </DrawerContent>
      </Drawer>

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
