import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Upload, ChevronRight, MessageSquare, Check, CreditCard, X, Landmark, Eye, EyeOff } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { TOP_UP_CRYPTO_FEE, TOP_UP_CRYPTO_MIN_AMOUNT } from "@/lib/fees";

interface Destination {
  id: string;
  type: "card" | "bank";
  cardType?: "virtual" | "metal";
  name: string;
  subtitle: string;
  fullNumber: string;
}

const destinations: Destination[] = [
  { id: "1", type: "card", cardType: "virtual", name: "Visa Virtual", subtitle: "•••• 4532", fullNumber: "4532 8801 2345 4532" },
  { id: "2", type: "card", cardType: "metal", name: "Visa Metal", subtitle: "•••• 8901", fullNumber: "4532 7712 6789 8901" },
  { id: "bank", type: "bank", name: "Банковский счёт AED", subtitle: "•••• 3456", fullNumber: "AE070331234567893456" },
];

const networks = [
  { id: "trc20", name: "Tron (TRC20)", shortName: "TRC20" },
  { id: "erc20", name: "Ethereum (ERC20)", shortName: "ERC20" },
  { id: "bep20", name: "BNB Chain (BEP20)", shortName: "BEP20" },
  { id: "sol", name: "Solana (SOL)", shortName: "SOL" },
];

const TopUpCrypto = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedToken] = useState("USDT");
  const [copied, setCopied] = useState(false);
  const [selectedDest, setSelectedDest] = useState<Destination>(destinations[0]);
  const [selectedNetwork, setSelectedNetwork] = useState(networks[0]);
  const [destDrawerOpen, setDestDrawerOpen] = useState(false);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [networkDrawerOpen, setNetworkDrawerOpen] = useState(false);
  
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Mock wallet address
  const walletAddress = "TSvgRpJKx8NaH5WyuX3RcTqHGmyuX3Rc";
  
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success(t("toast.addressCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("toast.copyFailed"));
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: "USDT Wallet Address",
      text: `USDT (TRC20) Address: ${walletAddress}`,
      url: window.location.href,
    };

    try {
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else if (navigator.share) {
        // Try without URL if canShare fails
        await navigator.share({
          title: "USDT Wallet Address",
          text: `USDT (TRC20) Address: ${walletAddress}`,
        });
      } else {
        handleCopy();
        toast.info(t("toast.shareNotSupported"));
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        handleCopy();
      }
    }
  };

  return (
    <MobileLayout
      showBackButton
      onBack={() => navigate(-1)}
    >
      <div className="flex flex-col min-h-[calc(100vh-56px)] pb-28">
        {/* Title */}
        <div className="pt-4 pb-6">
          <h1 className="text-2xl font-bold text-center text-foreground">
            {t("topUp.yourAddress")}
          </h1>
        </div>

        {/* QR Code */}
        <div className="flex justify-center px-6 mb-6">
          <div className="bg-white p-6 rounded-2xl">
            <QRCodeSVG 
              value={walletAddress} 
              size={200}
              level="H"
              includeMargin={false}
            />
            <div className="flex items-center justify-center gap-2 mt-4">
              <p className="text-primary font-medium">
                {truncateAddress(walletAddress)}
              </p>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                aria-label={t("topUp.copy")}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-[#007AFF]" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="px-6 space-y-3 flex-1">
          {/* Select Destination */}
          <button 
            onClick={() => setDestDrawerOpen(true)}
            className="w-full bg-muted rounded-2xl p-4 flex items-center justify-between"
          >
            <span className="text-muted-foreground">{t("topUp.topUpTo")}</span>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                selectedDest.type === "bank"
                  ? "bg-purple-500"
                  : selectedDest.cardType === "metal" 
                    ? "bg-gradient-to-br from-zinc-400 to-zinc-600" 
                    : "bg-primary"
              }`}>
                {selectedDest.type === "bank" 
                  ? <Landmark className="w-3.5 h-3.5 text-primary-foreground" />
                  : <CreditCard className="w-3.5 h-3.5 text-primary-foreground" />
                }
              </div>
              <span className="font-semibold text-foreground">{selectedDest.name}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </button>

          {/* Receive Token */}
          <div className="bg-muted rounded-2xl p-4 flex items-center justify-between">
            <span className="text-muted-foreground">{t("topUp.receiveToken")}</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#26A17B] flex items-center justify-center">
                <span className="text-white text-xs font-bold">₮</span>
              </div>
              <span className="font-semibold text-foreground">{selectedToken}</span>
            </div>
          </div>

          {/* Network */}
          <button 
            onClick={() => setNetworkDrawerOpen(true)}
            className="w-full bg-muted rounded-2xl p-4 flex items-center justify-between"
          >
            <span className="text-muted-foreground">{t("topUp.network")}</span>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-foreground" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-semibold text-foreground">{selectedNetwork.name}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </button>

          {/* Fees */}
          <div className="bg-muted rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("topUp.topUpFee")}</span>
              <span className="font-semibold text-foreground">{TOP_UP_CRYPTO_FEE.toFixed(2)} USDT</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("topUp.minimumAmount")}</span>
              <span className="font-semibold text-foreground">{TOP_UP_CRYPTO_MIN_AMOUNT.toFixed(2)} USDT</span>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-muted rounded-2xl p-4 flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              {t("topUp.usdtWarning")}
            </p>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-6 flex gap-3 max-w-[800px] mx-auto">
        <button
          onClick={handleCopy}
          className={`flex-1 flex items-center justify-center gap-2 font-semibold py-4 rounded-xl transition-all duration-300 active:scale-95 backdrop-blur-2xl border-2 border-white/50 shadow-lg ${
            copied 
              ? "bg-green-500/90 text-white" 
              : "bg-muted/80 text-foreground hover:bg-muted"
          }`}
        >
          <div className="relative w-5 h-5">
            <Copy 
              className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${
                copied ? "opacity-0 scale-50 rotate-90" : "opacity-100 scale-100 rotate-0"
              }`} 
            />
            <Check 
              className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${
                copied ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90"
              }`} 
            />
          </div>
          <span className="transition-all duration-300">
            {copied ? t("topUp.copied") : t("topUp.copy")}
          </span>
        </button>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 bg-[#007AFF]/90 text-white font-semibold py-4 rounded-xl hover:bg-[#007AFF] transition-all duration-200 active:scale-95 backdrop-blur-2xl border-2 border-white/50 shadow-lg"
        >
          <Upload className="w-5 h-5" />
          <span>{t("topUp.share")}</span>
        </button>
      </div>

      {/* Destination Selection Drawer */}
      <Drawer open={destDrawerOpen} onOpenChange={setDestDrawerOpen}>
        <DrawerContent className="bg-background/95 backdrop-blur-xl">
          <DrawerHeader className="relative flex items-center justify-center py-4">
            <DrawerTitle className="text-center text-base font-semibold">
              {t("topUp.topUpTo")}
            </DrawerTitle>
            <DrawerClose className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <X className="w-3.5 h-3.5 text-primary" />
            </DrawerClose>
          </DrawerHeader>
          
          <div className="px-4 pb-6">
            <div className="bg-muted/50 rounded-xl overflow-hidden">
              {destinations.map((dest, index) => (
                <button
                  key={dest.id}
                  onClick={() => {
                    setSelectedDest(dest);
                    setDestDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/80 transition-colors ${
                    index < destinations.length - 1 ? 'border-b border-border/50' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    dest.type === "bank"
                      ? "bg-purple-500"
                      : dest.cardType === "metal" 
                        ? "bg-gradient-to-br from-zinc-400 to-zinc-600" 
                        : "bg-primary"
                  }`}>
                    {dest.type === "bank" 
                      ? <Landmark className="w-5 h-5 text-primary-foreground" />
                      : <CreditCard className="w-5 h-5 text-primary-foreground" />
                    }
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-base font-medium text-foreground">{dest.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {revealedId === dest.id ? dest.fullNumber : dest.subtitle}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRevealedId(revealedId === dest.id ? null : dest.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    {revealedId === dest.id
                      ? <EyeOff className="w-4 h-4 text-muted-foreground" />
                      : <Eye className="w-4 h-4 text-muted-foreground" />
                    }
                  </button>
                  {selectedDest.id === dest.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Network Selection Drawer */}
      <Drawer open={networkDrawerOpen} onOpenChange={setNetworkDrawerOpen}>
        <DrawerContent className="bg-background/95 backdrop-blur-xl">
          <DrawerHeader className="relative flex items-center justify-center py-4">
            <DrawerTitle className="text-center text-base font-semibold">
              {t("topUp.selectNetwork")}
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
                    <Check className="w-5 h-5 text-primary" />
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

export default TopUpCrypto;
