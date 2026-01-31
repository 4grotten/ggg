import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { QRCodeSVG } from "qrcode.react";
import { 
  CreditCard, 
  Wallet, 
  Bitcoin, 
  ChevronRight, 
  Copy, 
  Share2, 
  Check, 
  User,
  Building2,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface ShareProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewType = "main" | "card" | "account" | "crypto" | "network";

interface CardData {
  id: string;
  name: string;
  number: string;
  type: "virtual" | "metal";
  holder: string;
  expiry: string;
  cvv: string;
}

interface AccountData {
  id: string;
  name: string;
  iban: string;
  swift: string;
  bankName: string;
  currency: string;
}

interface CryptoNetwork {
  id: string;
  name: string;
  address: string;
}

// Mock data - in real app would come from API/context
const mockCards: CardData[] = [
  {
    id: "1",
    name: "Virtual Card",
    number: "4532 •••• •••• 7823",
    type: "virtual",
    holder: "JOHN DOE",
    expiry: "12/28",
    cvv: "***"
  },
  {
    id: "2", 
    name: "Metal Card",
    number: "5412 •••• •••• 3456",
    type: "metal",
    holder: "JOHN DOE",
    expiry: "06/29",
    cvv: "***"
  }
];

const mockAccounts: AccountData[] = [
  {
    id: "1",
    name: "AED Account",
    iban: "AE07 0331 2345 6789 0123 456",
    swift: "ABORAEAD",
    bankName: "Abu Dhabi Commercial Bank",
    currency: "AED"
  }
];

const cryptoNetworks: CryptoNetwork[] = [
  { id: "trc20", name: "TRC20 (Tron)", address: "TJYxBLjN5gKPxTdMjrKPfpXUPe5BYUj9kD" },
  { id: "erc20", name: "ERC20 (Ethereum)", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f1B2d1" },
  { id: "bep20", name: "BEP20 (BSC)", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f1B2d1" }
];

export const ShareProfileDrawer = ({ isOpen, onClose }: ShareProfileDrawerProps) => {
  const { t } = useTranslation();
  const { tap } = useHapticFeedback();
  const [currentView, setCurrentView] = useState<ViewType>("main");
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<AccountData | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<CryptoNetwork | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleClose = () => {
    setCurrentView("main");
    setSelectedCard(null);
    setSelectedAccount(null);
    setSelectedNetwork(null);
    onClose();
  };

  const handleBack = () => {
    if (currentView === "network") {
      setCurrentView("crypto");
      setSelectedNetwork(null);
    } else {
      setCurrentView("main");
      setSelectedCard(null);
      setSelectedAccount(null);
    }
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    tap();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(t("toast.copied") || "Copied!");
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error(t("toast.copyFailed") || "Failed to copy");
    }
  };

  const handleShare = async (data: string, title: string) => {
    tap();
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: data
        });
      } else {
        await copyToClipboard(data, "share");
      }
    } catch (error) {
      console.log("Share cancelled:", error);
    }
  };

  const handleShareBusinessCard = () => {
    tap();
    const businessCardData = `
Easy Card - Digital Payment Card

Name: John Doe
Phone: +971 50 123 4567
Email: john.doe@example.com

Referral Code: EASY2024
App: https://easycarduae.lovable.app
    `.trim();
    handleShare(businessCardData, "My Easy Card Business Card");
  };

  const handleShareCard = (card: CardData) => {
    const cardData = `
${card.name}
Card Number: ${card.number}
Holder: ${card.holder}
Expiry: ${card.expiry}
    `.trim();
    handleShare(cardData, card.name);
  };

  const handleShareAccount = (account: AccountData) => {
    const accountData = `
${account.name}
IBAN: ${account.iban}
SWIFT: ${account.swift}
Bank: ${account.bankName}
    `.trim();
    handleShare(accountData, account.name);
  };

  const getTitle = () => {
    switch (currentView) {
      case "card":
        return selectedCard?.name || t("settings.shareCard") || "Card Details";
      case "account":
        return selectedAccount?.name || t("settings.shareAccount") || "Account Details";
      case "crypto":
        return t("settings.shareCrypto") || "Crypto Wallet";
      case "network":
        return selectedNetwork?.name || "Network";
      default:
        return t("settings.share") || "Share";
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="relative">
          {currentView !== "main" && (
            <button
              onClick={handleBack}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <DrawerTitle className="text-center">{getTitle()}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Main Menu */}
            {currentView === "main" && (
              <motion.div
                key="main"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                {/* Business Card Button */}
                <button
                  onClick={handleShareBusinessCard}
                  className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl hover:opacity-90 transition-opacity"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold">{t("settings.businessCard") || "Business Card"}</p>
                    <p className="text-sm opacity-80">{t("settings.shareContactInfo") || "Share your contact info"}</p>
                  </div>
                  <Share2 className="w-5 h-5 opacity-80" />
                </button>

                {/* Cards Section */}
                <div className="bg-muted/50 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/50">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("settings.cards") || "Cards"}
                    </p>
                  </div>
                  {mockCards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => {
                        tap();
                        setSelectedCard(card);
                        setCurrentView("card");
                      }}
                      className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: card.type === "virtual" 
                            ? "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)"
                            : "linear-gradient(135deg, #71717a 0%, #27272a 100%)"
                        }}
                      >
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{card.name}</p>
                        <p className="text-sm text-muted-foreground">{card.number}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  ))}
                </div>

                {/* Accounts Section */}
                <div className="bg-muted/50 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/50">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("settings.accounts") || "Accounts"}
                    </p>
                  </div>
                  {mockAccounts.map((account) => (
                    <button
                      key={account.id}
                      onClick={() => {
                        tap();
                        setSelectedAccount(account);
                        setCurrentView("account");
                      }}
                      className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                      >
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{account.name}</p>
                        <p className="text-sm text-muted-foreground">{account.currency}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  ))}
                </div>

                {/* Crypto Wallets Section */}
                <button
                  onClick={() => {
                    tap();
                    setCurrentView("crypto");
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-muted/50 rounded-2xl hover:bg-muted/70 transition-colors"
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}
                  >
                    <Bitcoin className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{t("settings.cryptoWallets") || "Crypto Wallets"}</p>
                    <p className="text-sm text-muted-foreground">{t("settings.selectNetwork") || "Select network to share"}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </motion.div>
            )}

            {/* Card Details View */}
            {currentView === "card" && selectedCard && (
              <motion.div
                key="card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-muted/50 rounded-2xl p-4 space-y-4">
                  <DetailRow 
                    label={t("card.number") || "Card Number"} 
                    value={selectedCard.number}
                    onCopy={() => copyToClipboard(selectedCard.number.replace(/\s/g, ""), "number")}
                    copied={copiedField === "number"}
                  />
                  <DetailRow 
                    label={t("card.holder") || "Card Holder"} 
                    value={selectedCard.holder}
                    onCopy={() => copyToClipboard(selectedCard.holder, "holder")}
                    copied={copiedField === "holder"}
                  />
                  <DetailRow 
                    label={t("card.expiry") || "Expiry"} 
                    value={selectedCard.expiry}
                    onCopy={() => copyToClipboard(selectedCard.expiry, "expiry")}
                    copied={copiedField === "expiry"}
                  />
                </div>

                <button
                  onClick={() => handleShareCard(selectedCard)}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-primary text-primary-foreground rounded-2xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span>{t("common.share") || "Share"}</span>
                </button>
              </motion.div>
            )}

            {/* Account Details View */}
            {currentView === "account" && selectedAccount && (
              <motion.div
                key="account"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-muted/50 rounded-2xl p-4 space-y-4">
                  <DetailRow 
                    label="IBAN" 
                    value={selectedAccount.iban}
                    onCopy={() => copyToClipboard(selectedAccount.iban.replace(/\s/g, ""), "iban")}
                    copied={copiedField === "iban"}
                  />
                  <DetailRow 
                    label="SWIFT/BIC" 
                    value={selectedAccount.swift}
                    onCopy={() => copyToClipboard(selectedAccount.swift, "swift")}
                    copied={copiedField === "swift"}
                  />
                  <DetailRow 
                    label={t("bank.name") || "Bank"} 
                    value={selectedAccount.bankName}
                    onCopy={() => copyToClipboard(selectedAccount.bankName, "bank")}
                    copied={copiedField === "bank"}
                  />
                </div>

                <button
                  onClick={() => handleShareAccount(selectedAccount)}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-primary text-primary-foreground rounded-2xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span>{t("common.share") || "Share"}</span>
                </button>
              </motion.div>
            )}

            {/* Crypto Network Selection */}
            {currentView === "crypto" && (
              <motion.div
                key="crypto"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <p className="text-sm text-muted-foreground px-1">
                  {t("settings.selectNetworkDesc") || "Select a network to view wallet address"}
                </p>
                {cryptoNetworks.map((network) => (
                  <button
                    key={network.id}
                    onClick={() => {
                      tap();
                      setSelectedNetwork(network);
                      setCurrentView("network");
                    }}
                    className="w-full flex items-center gap-4 p-4 bg-muted/50 rounded-2xl hover:bg-muted/70 transition-colors"
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" }}
                    >
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{network.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {network.address.slice(0, 8)}...{network.address.slice(-6)}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                ))}
              </motion.div>
            )}

            {/* Network Wallet View with QR */}
            {currentView === "network" && selectedNetwork && (
              <motion.div
                key="network"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-2xl">
                    <QRCodeSVG 
                      value={selectedNetwork.address} 
                      size={180}
                      level="H"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="bg-muted/50 rounded-2xl p-4">
                  <p className="text-sm text-muted-foreground mb-2">{t("crypto.walletAddress") || "Wallet Address"}</p>
                  <p className="font-mono text-sm break-all">{selectedNetwork.address}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => copyToClipboard(selectedNetwork.address, "address")}
                    className="flex-1 flex items-center justify-center gap-2 py-4 px-4 bg-muted rounded-2xl font-medium hover:bg-muted/80 transition-colors"
                  >
                    {copiedField === "address" ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-primary" />
                    )}
                    <span>{t("common.copy") || "Copy"}</span>
                  </button>
                  <button
                    onClick={() => handleShare(selectedNetwork.address, `${selectedNetwork.name} Wallet`)}
                    className="flex-1 flex items-center justify-center gap-2 py-4 px-4 bg-primary text-primary-foreground rounded-2xl font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>{t("common.share") || "Share"}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

// Helper component for detail rows
interface DetailRowProps {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}

const DetailRow = ({ label, value, onCopy, copied }: DetailRowProps) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
    <button
      onClick={onCopy}
      className="p-2 rounded-lg hover:bg-muted transition-colors"
    >
      {copied ? (
        <Check className="w-5 h-5 text-green-500" />
      ) : (
        <Copy className="w-5 h-5 text-primary" />
      )}
    </button>
  </div>
);

export default ShareProfileDrawer;
