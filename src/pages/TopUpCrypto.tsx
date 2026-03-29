import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Copy, Upload, MessageSquare, Check, Wallet, ChevronDown } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { useCryptoWallets } from "@/hooks/useCards";
import { Skeleton } from "@/components/ui/skeleton";
import { getCryptoIcon } from "@/components/icons/CryptoIcons";

type TokenType = "USDT" | "USDC";
type NetworkId = "trc20" | "erc20" | "bep20";

interface NetworkOption {
  id: NetworkId;
  name: string;
  shortName: string;
  icon: string;
}

const NETWORKS: NetworkOption[] = [
  { id: "trc20", name: "Tron (TRC20)", shortName: "TRC20", icon: "◈" },
  { id: "erc20", name: "Ethereum (ERC20)", shortName: "ERC20", icon: "◆" },
  { id: "bep20", name: "BSC (BEP20)", shortName: "BEP20", icon: "◇" },
];

const TOKENS: { id: TokenType; name: string; color: string; symbol: string }[] = [
  { id: "USDT", name: "Tether USDT", color: "#26A17B", symbol: "₮" },
  { id: "USDC", name: "USD Coin", color: "#2775CA", symbol: "$" },
];

const fallbackAddresses: Record<NetworkId, string> = {
  trc20: "TSvgRpJKx8NaH5WyuX3RcTqHGmyuX3Rc",
  erc20: "0x742d35Cc6634C0532925a3b844Bc9e7595f8aE21",
  bep20: "0x742d35Cc6634C0532925a3b844Bc9e7595f8aE21",
};

const TopUpCrypto = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const settings = useSettings();
  const [searchParams] = useSearchParams();
  const TOP_UP_CRYPTO_FEE = settings.TOP_UP_CRYPTO_FEE;
  const TOP_UP_CRYPTO_MIN_AMOUNT = settings.TOP_UP_CRYPTO_MIN_AMOUNT;
  const { data: cryptoWalletsData, isLoading: walletsLoading } = useCryptoWallets();

  const tokenParam = (searchParams.get("token") as TokenType) || "USDT";
  const networkParam = (searchParams.get("network") as NetworkId) || "trc20";

  const [selectedToken, setSelectedToken] = useState<TokenType>(tokenParam);
  const [selectedNetworkId, setSelectedNetworkId] = useState<NetworkId>(networkParam);
  const [copied, setCopied] = useState(false);

  const selectedNetwork = NETWORKS.find(n => n.id === selectedNetworkId) || NETWORKS[0];
  const selectedTokenInfo = TOKENS.find(tk => tk.id === selectedToken) || TOKENS[0];

  const walletAddress = useMemo(() => {
    if (cryptoWalletsData?.data) {
      const wallet = cryptoWalletsData.data.find(w => w.network.toLowerCase() === selectedNetworkId);
      if (wallet) return wallet.address;
    }
    return fallbackAddresses[selectedNetworkId];
  }, [cryptoWalletsData, selectedNetworkId]);

  const walletLabel = t("topUp.usdtWallet", `Кошелек ${selectedToken}`);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
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
      title: `${selectedToken} Wallet Address`,
      text: `${selectedToken} (${selectedNetwork.shortName}) Address: ${walletAddress}`,
      url: window.location.href,
    };

    try {
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else if (navigator.share) {
        await navigator.share({
          title: `${selectedToken} Wallet Address`,
          text: `${selectedToken} (${selectedNetwork.shortName}) Address: ${walletAddress}`,
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
      rightAction={<div className="flex items-center gap-2"><ThemeSwitcher /><LanguageSwitcher /></div>}
    >
      <div className="flex flex-col min-h-[calc(100vh-56px)] pb-28">
        {/* Title */}
        <div className="pt-4 pb-6">
          <h1 className="text-2xl font-bold text-center text-foreground">
            {t("topUp.topUpToUsdt", `Пополнить ${selectedToken}`)}
          </h1>
        </div>

        {/* QR Code */}
        <div className="flex justify-center px-6 mb-6">
          {walletsLoading ? (
            <Skeleton className="w-[252px] h-[280px] rounded-2xl" />
          ) : (
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
          )}
        </div>

        {/* Info Cards */}
        <div className="px-6 space-y-3 flex-1">
          {/* Destination: USDT wallet (fixed) */}
          <div className="w-full bg-muted rounded-2xl p-4 flex items-center justify-between">
            <span className="text-muted-foreground">{t("topUp.topUpTo")}</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#26A17B]">
                <Wallet className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-foreground">{walletLabel}</span>
            </div>
          </div>

          {/* Token & Network info (read-only) */}
          <div className="w-full bg-muted rounded-2xl p-4 flex items-center justify-between">
            <span className="text-muted-foreground">{t("topUp.receiveToken")}</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: selectedTokenInfo.color }}>
                <span className="text-white text-xs font-bold">{selectedTokenInfo.symbol}</span>
              </div>
              <span className="font-semibold text-foreground">{selectedToken}</span>
            </div>
          </div>

          <div className="w-full bg-muted rounded-2xl p-4 flex items-center justify-between">
            <span className="text-muted-foreground">{t("topUp.network")}</span>
            <div className="flex items-center gap-2">
              {getCryptoIcon(selectedNetworkId, 22)}
              <span className="font-semibold text-foreground">{selectedNetwork.name}</span>
            </div>
          </div>

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

    </MobileLayout>
  );
};

export default TopUpCrypto;
