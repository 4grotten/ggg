import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";

type TokenType = "USDT" | "USDC";
type NetworkId = "trc20" | "erc20" | "bep20";

interface TokenInfo {
  id: TokenType;
  name: string;
  color: string;
  symbol: string;
}

interface NetworkInfo {
  id: NetworkId;
  name: string;
  shortName: string;
}

const TOKENS: TokenInfo[] = [
  { id: "USDT", name: "Tether USDT", color: "#26A17B", symbol: "₮" },
  { id: "USDC", name: "USD Coin", color: "#2775CA", symbol: "$" },
];

const NETWORKS: NetworkInfo[] = [
  { id: "trc20", name: "Tron (TRC20)", shortName: "TRC20" },
  { id: "erc20", name: "Ethereum (ERC20)", shortName: "ERC20" },
  { id: "bep20", name: "BSC (BEP20)", shortName: "BEP20" },
];

const CryptoTopUpSelect = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedToken, setSelectedToken] = useState<TokenType | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId | null>(null);

  const handleContinue = () => {
    if (selectedToken && selectedNetwork) {
      navigate(`/top-up/crypto?token=${selectedToken}&network=${selectedNetwork}`);
    }
  };

  const canContinue = selectedToken && selectedNetwork;

  return (
    <MobileLayout
      showBackButton
      onBack={() => navigate(-1)}
      rightAction={
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      }
    >
      <div className="flex flex-col min-h-[calc(100vh-56px)] pb-28">
        <div className="pt-4 pb-6">
          <h1 className="text-2xl font-bold text-center text-foreground">
            {t("topUp.selectCryptoTitle", "Пополнение крипто")}
          </h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            {t("topUp.selectCryptoSubtitle", "Выберите монету и сеть")}
          </p>
        </div>

        <div className="px-6 space-y-6 flex-1">
          {/* Token Selection */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">
              {t("topUp.selectToken", "Выберите монету")}
            </p>
            <div className="space-y-2">
              {TOKENS.map((token, index) => (
                <motion.button
                  key={token.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedToken(token.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                    selectedToken === token.id
                      ? "border-primary bg-primary/5"
                      : "border-border/50 bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: token.color }}
                  >
                    <span className="text-white text-lg font-bold">{token.symbol}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-foreground">{token.id}</p>
                    <p className="text-sm text-muted-foreground">{token.name}</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedToken === token.id
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {selectedToken === token.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2.5 h-2.5 rounded-full bg-white"
                      />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Network Selection */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">
              {t("topUp.selectNetworkLabel", "Выберите сеть")}
            </p>
            <div className="space-y-2">
              {NETWORKS.map((network, index) => (
                <motion.button
                  key={network.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  onClick={() => setSelectedNetwork(network.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                    selectedNetwork === network.id
                      ? "border-primary bg-primary/5"
                      : "border-border/50 bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-sm font-bold text-foreground">{network.shortName}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-foreground">{network.name}</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedNetwork === network.id
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {selectedNetwork === network.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2.5 h-2.5 rounded-full bg-white"
                      />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 max-w-[800px] mx-auto">
        <motion.button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`w-full py-4 rounded-2xl font-semibold text-base transition-all ${
            canContinue
              ? "bg-primary text-primary-foreground active:scale-[0.98]"
              : "bg-muted text-muted-foreground"
          }`}
          whileTap={canContinue ? { scale: 0.98 } : {}}
        >
          {t("common.continue", "Далее")}
        </motion.button>
      </div>
    </MobileLayout>
  );
};

export default CryptoTopUpSelect;
