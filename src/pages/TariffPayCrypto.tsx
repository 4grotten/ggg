import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Copy, Check, Crown, Zap, Sparkles, Rocket, Gem, MessageSquare, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { toast } from "sonner";
import useEmblaCarousel from "embla-carousel-react";
import confetti from "canvas-confetti";
import { QRCodeSVG } from "qrcode.react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { X } from "lucide-react";

// Tariff icons mapping
const TARIFF_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  smart: Zap,
  agent: Sparkles,
  pro: Crown,
  vip: Rocket,
  partner: Gem,
};

// Tariff colors mapping
const TARIFF_COLORS: Record<string, string> = {
  smart: "text-emerald-500",
  agent: "text-amber-500",
  pro: "text-primary",
  vip: "text-violet-500",
  partner: "text-amber-400",
};

// Tariff gradient backgrounds
const TARIFF_BG_COLORS: Record<string, string> = {
  smart: "bg-emerald-500/10",
  agent: "bg-amber-500/10",
  pro: "bg-primary/10",
  vip: "bg-violet-500/10",
  partner: "bg-amber-400/10",
};

// All available tariffs
const ALL_TARIFFS = [
  { id: "smart", name: "Smart", price: 50 },
  { id: "agent", name: "Agent", price: 250 },
  { id: "pro", name: "PRO", price: 1270 },
  { id: "vip", name: "VIP", price: 2540 },
];

interface Network {
  id: string;
  name: string;
  shortName: string;
  address: string;
  color: string;
}

const networks: Network[] = [
  { id: "trc20", name: "Tron (TRC20)", shortName: "TRC20", address: "TSvgRpJKx8NaH5WyuX3RcTqHGmyuX3Rc", color: "#FF0013" },
  { id: "erc20", name: "Ethereum (ERC20)", shortName: "ERC20", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD51", color: "#627EEA" },
  { id: "bep20", name: "BNB Chain (BEP20)", shortName: "BEP20", address: "0xBb23F4AC5B47BBc3FF9c5E5ba7d8E4D92F6c8e4a", color: "#F3BA2F" },
  { id: "sol", name: "Solana (SOL)", shortName: "SOL", address: "7nYp5xJRxPHhFGCLchVVkjQCma5LzKTgd8FKNsPxV2kL", color: "#9945FF" },
];

const TariffPayCrypto = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  // Get tariff data from router state (initial selection)
  const initialTariff = location.state || {};
  
  // Find initial tariff index
  const getInitialIndex = () => {
    const idx = ALL_TARIFFS.findIndex(t => t.id === initialTariff.tariffId);
    return idx >= 0 ? idx : 0;
  };
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    startIndex: getInitialIndex(),
    align: 'center'
  });
  const [selectedTariffIndex, setSelectedTariffIndex] = useState(getInitialIndex());
  const [copied, setCopied] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(networks[0]);
  const [networkDrawerOpen, setNetworkDrawerOpen] = useState(false);

  // Current selected tariff
  const currentTariff = ALL_TARIFFS[selectedTariffIndex];
  const tariffId = currentTariff?.id || "smart";
  const tariffPrice = currentTariff?.price || 50;

  // Fee rates
  const NETWORK_FEE_RATE = 0.005; // 0.5%
  const CONVERSION_FEE_RATE = 0.015; // 1.5%

  // Calculate fees and total
  const calculateTotal = (priceUsd: number) => {
    const networkFee = priceUsd * NETWORK_FEE_RATE;
    const conversionFee = priceUsd * CONVERSION_FEE_RATE;
    return {
      base: priceUsd,
      networkFee,
      conversionFee,
      total: priceUsd + networkFee + conversionFee
    };
  };

  // Handle carousel selection
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedTariffIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Get wallet address based on selected network
  const walletAddress = selectedNetwork.address;

  const formatBalance = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success(t("toast.addressCopied", "Адрес скопирован"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("toast.copyFailed", "Ошибка копирования"));
    }
  };

  const scrollToTariff = (index: number) => {
    emblaApi?.scrollTo(index);
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
          <h1 className="text-lg font-semibold">{t('partner.bonuses.payForTariff', 'Оплата тарифа')}</h1>
        </div>
      }
      rightAction={
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      }
    >
      <div className="py-6 space-y-4 pb-32">
        {/* Tariff Card Carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {ALL_TARIFFS.map((tariff, index) => {
              const Icon = TARIFF_ICONS[tariff.id] || Crown;
              const color = TARIFF_COLORS[tariff.id] || "text-primary";
              const bgColor = TARIFF_BG_COLORS[tariff.id] || "bg-primary/10";
              const breakdown = calculateTotal(tariff.price);
              
              return (
                <div 
                  key={tariff.id}
                  className="flex-none w-full min-w-0 px-4"
                >
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-muted/50 border border-border/50 space-y-4"
                  >
                    {/* Tariff Header */}
                    <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                      <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center ${color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg">{tariff.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('partner.bonuses.tariffPurchase', 'Приобретение тарифа')}
                        </p>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('partner.bonuses.tariffCost', 'Стоимость тарифа')}</span>
                        <span className="font-medium">${tariff.price}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('fees.networkFee', 'Комиссия сети')} (0.5%)</span>
                        <span className="font-medium">${formatBalance(breakdown.networkFee)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('fees.conversionFee', 'Комиссия конвертации')} (1.5%)</span>
                        <span className="font-medium">${formatBalance(breakdown.conversionFee)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('partner.bonuses.paymentType', 'Тип оплаты')}</span>
                        <span className="font-medium">{t('partner.bonuses.oneTimePayment', 'Единоразовый платёж')}</span>
                      </div>
                      <div className="flex justify-between text-base pt-3 border-t border-border/50">
                        <span className="font-semibold">{t('openCard.totalToPay', 'Итого к оплате')}</span>
                        <span className="font-bold text-primary">${formatBalance(breakdown.total)} USDT</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carousel Dots */}
        <div className="flex justify-center gap-1.5">
          {ALL_TARIFFS.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToTariff(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === selectedTariffIndex 
                  ? 'w-6 bg-primary' 
                  : 'w-1.5 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        {/* Tariff Description */}
        <div className="px-4">
          <motion.div
            key={tariffId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-2xl bg-primary/5 border border-primary/20"
          >
            <p className="text-sm text-primary">
              {tariffId === 'smart' && t('partner.bonuses.smartDesc', 'Для начинающих партнёров')}
              {tariffId === 'agent' && t('partner.bonuses.agentDesc', 'Для активных партнёров с растущей сетью')}
              {tariffId === 'pro' && t('partner.bonuses.proDesc', 'Для активных и опытных партнёров с большой аудиторией')}
              {tariffId === 'vip' && t('partner.bonuses.vipDesc', 'Для лидеров с максимальными привилегиями')}
            </p>
          </motion.div>
        </div>

        {/* Network Selector */}
        <div className="px-4">
          <button 
            onClick={() => setNetworkDrawerOpen(true)}
            className="w-full bg-muted/50 border border-border/50 rounded-2xl p-4 flex items-center justify-between"
          >
            <span className="text-muted-foreground">{t("topUp.network", "Сеть")}</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#26A17B] flex items-center justify-center">
                <span className="text-white text-xs font-bold">₮</span>
              </div>
              <span className="font-semibold text-foreground">{selectedNetwork.shortName}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </button>
        </div>

        {/* QR Code and Address - matching OpenCardPayCrypto design */}
        <div className="px-4 space-y-4">
          {/* QR Code Section */}
          <motion.div 
            key={`qr-container-${selectedNetwork.id}`}
            initial={{ opacity: 0, rotateY: 90, scale: 0.9 }}
            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center p-4 rounded-2xl bg-white"
          >
            <QRCodeSVG
              value={walletAddress}
              size={180}
              level="M"
              className="mb-3"
            />
            <p className="text-xs text-muted-foreground mb-2">{t('openCard.sendExactAmount', 'Отправьте точную сумму')}</p>
            <motion.p 
              key={`amount-${tariffId}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-bold text-foreground"
            >
              {formatBalance(calculateTotal(tariffPrice).total)} USDT
            </motion.p>
            <motion.p 
              key={`network-label-${selectedNetwork.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-xs text-muted-foreground mt-2"
            >
              {t('openCard.network', 'Сеть')}: {selectedNetwork.name}
            </motion.p>
          </motion.div>

          {/* Wallet Address */}
          <motion.div 
            key={`address-container-${selectedNetwork.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="p-4 rounded-2xl bg-muted/50 border border-border/50"
          >
            <p className="text-xs text-muted-foreground mb-2">{t('openCard.walletAddress', 'Адрес кошелька')}</p>
            <div className="flex items-center gap-3">
              <p className="text-sm font-mono flex-1 break-all">{walletAddress}</p>
              <button
                onClick={handleCopy}
                className="p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
              >
                {copied ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <Check className="w-5 h-5 text-green-500" />
                  </motion.div>
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Warning */}
        <div className="px-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {t("topUp.usdtWarning", "Отправляйте только USDT в выбранной сети. Отправка других токенов приведёт к потере средств.")}
            </p>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 max-w-[800px] mx-auto bg-gradient-to-t from-background via-background to-transparent pt-8">
        <motion.button
          onClick={handleCopy}
          className={`w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${
            copied 
              ? "bg-green-500 text-white" 
              : "bg-primary text-primary-foreground"
          }`}
        >
          {copied ? (
            <>
              <Check className="w-5 h-5" />
              {t("topUp.copied", "Скопировано")}
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              {t("topUp.copyAddress", "Скопировать адрес")}
            </>
          )}
        </motion.button>
      </div>

      {/* Network Selection Drawer */}
      <Drawer open={networkDrawerOpen} onOpenChange={setNetworkDrawerOpen}>
        <DrawerContent className="bg-background/95 backdrop-blur-xl">
          <DrawerHeader className="relative flex items-center justify-center py-4">
            <DrawerTitle className="text-center text-base font-semibold">
              {t("topUp.selectNetwork", "Выберите сеть")}
            </DrawerTitle>
            <DrawerClose className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <X className="w-3.5 h-3.5 text-primary" />
            </DrawerClose>
          </DrawerHeader>
          
          <div className="px-4 pb-6">
            <div className="bg-muted/50 rounded-xl overflow-hidden">
              {networks.map((network, index) => (
                <button
                  key={network.id}
                  onClick={() => {
                    setSelectedNetwork(network);
                    setNetworkDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/80 transition-colors ${
                    index < networks.length - 1 ? 'border-b border-border/50' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <svg className="w-5 h-5 text-foreground" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-base font-medium text-foreground">{network.name}</p>
                  </div>
                  {selectedNetwork.id === network.id && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </MobileLayout>
  );
};

export default TariffPayCrypto;