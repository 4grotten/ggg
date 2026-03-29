import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Copy, Upload, MessageSquare, Check, Wallet } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { Skeleton } from "@/components/ui/skeleton";
import { getCryptoIcon } from "@/components/icons/CryptoIcons";
import { submitCryptoTopup } from "@/services/api/transactions";
import { useCardsList, useCryptoWallets } from "@/hooks/useCards";

type TokenType = "USDT" | "USDC";
type NetworkId = "trc20" | "erc20";

interface NetworkOption {
  id: NetworkId;
  name: string;
  shortName: string;
}

const NETWORKS: NetworkOption[] = [
  { id: "trc20", name: "Tron (TRC20)", shortName: "TRC20" },
  { id: "erc20", name: "Ethereum (ERC20)", shortName: "ERC20" },
];

const TOKENS: { id: TokenType; name: string; color: string; symbol: string }[] = [
  { id: "USDT", name: "Tether USDT", color: "#26A17B", symbol: "₮" },
  { id: "USDC", name: "USD Coin", color: "#2775CA", symbol: "$" },
];

const TopUpCrypto = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const settings = useSettings();
  const [searchParams] = useSearchParams();
  const TOP_UP_CRYPTO_FEE = settings.TOP_UP_CRYPTO_FEE;
  const TOP_UP_CRYPTO_MIN_AMOUNT = settings.TOP_UP_CRYPTO_MIN_AMOUNT;
  const { data: cardsData } = useCardsList();
  const { data: cryptoWalletsData, isLoading: cryptoWalletsLoading } = useCryptoWallets();

  const tokenParam = (searchParams.get("token") as TokenType) || "USDT";
  const networkParam = (searchParams.get("network") as NetworkId) || "trc20";

  const [selectedToken] = useState<TokenType>(tokenParam);
  const [selectedNetworkId] = useState<NetworkId>(networkParam);
  const [copied, setCopied] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedNetwork = NETWORKS.find((n) => n.id === selectedNetworkId) || NETWORKS[0];
  const selectedTokenInfo = TOKENS.find((tk) => tk.id === selectedToken) || TOKENS[0];
  const walletLabel = t("topUp.usdtWallet", `Кошелек ${selectedToken}`);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const wallets = cryptoWalletsData?.data;
    const existingWallet = Array.isArray(wallets)
      ? wallets.find(
          (wallet) =>
            wallet.token?.toUpperCase() === selectedToken &&
            wallet.network?.toLowerCase() === selectedNetworkId
        )
      : null;

    if (existingWallet?.address) {
      setWalletAddress(existingWallet.address);
      setError(null);
      setLoading(false);
      return;
    }

    if (cryptoWalletsLoading || !cryptoWalletsData) {
      return;
    }

    const cards = cardsData?.data;
    const firstCardId = Array.isArray(cards) && cards.length > 0 ? cards[0].id : null;

    if (!firstCardId) {
      setWalletAddress("");
      setError("Не удалось получить адрес пополнения");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchAddress = async () => {
      setLoading(true);
      setError(null);

      const networkApiValue = selectedNetworkId.toUpperCase() as "TRC20" | "ERC20";
      const result = await submitCryptoTopup({
        card_id: firstCardId,
        token: selectedToken,
        network: networkApiValue,
      });

      if (cancelled) return;

      const address = result.data?.metadata?.crypto_address || result.data?.deposit_address || "";

      if (result.success && address) {
        setWalletAddress(address);
        setError(null);
      } else {
        setWalletAddress("");
        setError(result.error || "Не удалось получить адрес пополнения");
        toast.error(result.error || "Не удалось получить адрес пополнения");
      }

      setLoading(false);
    };

    fetchAddress();

    return () => {
      cancelled = true;
    };
  }, [cardsData, cryptoWalletsData, cryptoWalletsLoading, selectedNetworkId, selectedToken]);

  const truncateAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-6)}`;

  const handleCopy = async () => {
    if (!walletAddress) return;

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
    if (!walletAddress) return;

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
    } catch (shareError) {
      if ((shareError as Error).name !== "AbortError") {
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
        <div className="pt-4 pb-6">
          <h1 className="text-2xl font-bold text-center text-foreground">
            {t("topUp.topUpToUsdt", `Пополнить ${selectedToken}`)}
          </h1>
        </div>

        <div className="flex justify-center px-6 mb-6">
          {loading ? (
            <Skeleton className="w-[252px] h-[280px] rounded-2xl" />
          ) : error ? (
            <div className="rounded-2xl bg-destructive/10 px-6 py-5 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl">
              <QRCodeSVG value={walletAddress} size={200} level="H" includeMargin={false} />
              <div className="flex items-center justify-center gap-2 mt-4">
                <p className="text-primary font-medium">{truncateAddress(walletAddress)}</p>
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

        <div className="px-6 space-y-3 flex-1">
          <div className="w-full bg-muted rounded-2xl p-4 flex items-center justify-between">
            <span className="text-muted-foreground">{t("topUp.topUpTo")}</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#26A17B]">
                <Wallet className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-foreground">{walletLabel}</span>
            </div>
          </div>

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

          <div className="bg-muted rounded-2xl p-4 flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">{t("topUp.usdtWarning")}</p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 flex gap-3 max-w-[800px] mx-auto">
        <button
          onClick={handleCopy}
          disabled={!walletAddress}
          className={`flex-1 flex items-center justify-center gap-2 font-semibold py-4 rounded-xl transition-all duration-300 active:scale-95 backdrop-blur-2xl border-2 border-white/50 shadow-lg ${
            copied ? "bg-green-500/90 text-white" : "bg-muted/80 text-foreground hover:bg-muted"
          } ${!walletAddress ? "opacity-50" : ""}`}
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
          <span className="transition-all duration-300">{copied ? t("topUp.copied") : t("topUp.copy")}</span>
        </button>
        <button
          onClick={handleShare}
          disabled={!walletAddress}
          className={`flex-1 flex items-center justify-center gap-2 bg-[#007AFF]/90 text-white font-semibold py-4 rounded-xl hover:bg-[#007AFF] transition-all duration-200 active:scale-95 backdrop-blur-2xl border-2 border-white/50 shadow-lg ${!walletAddress ? "opacity-50" : ""}`}
        >
          <Upload className="w-5 h-5" />
          <span>{t("topUp.share")}</span>
        </button>
      </div>
    </MobileLayout>
  );
};

export default TopUpCrypto;
