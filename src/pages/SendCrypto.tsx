import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronDown, Check, CreditCard, ClipboardPaste, X, Wallet, Landmark, CheckCircle2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { useSettings } from "@/contexts/SettingsContext";
import { AnimatedDrawerItem, AnimatedDrawerContainer } from "@/components/ui/animated-drawer-item";
import { useCards, useIban, useCryptoWallets } from "@/hooks/useCards";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/services/api/apiClient";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface SourceOption {
  id: string;
  type: "virtual" | "metal" | "bank_account" | "crypto_wallet" | "referral";
  name: string;
  lastFour?: string;
  iban?: string;
  walletAddress?: string;
  token?: string;
  balance: number;
}

const coins = [
  { id: "usdt", name: "Tether", symbol: "USDT", color: "#26A17B" },
];

const networksByCoin: Record<string, { id: string; name: string }[]> = {
  usdt: [
    { id: "trc20", name: "Tron (TRC20)" },
  ],
};

const SendCrypto = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const settings = useSettings();
  
  // Check if this is a referral withdrawal
  const isReferralWithdrawal = location.state?.isReferralWithdrawal || false;
  const referralBalance = location.state?.referralBalance || 0;
  
  // Fetch real data
  const { data: cardsResponse, isLoading: cardsLoading } = useCards();
  const { data: ibanResponse, isLoading: ibanLoading } = useIban();
  const { data: cryptoWalletsResponse, isLoading: cryptoLoading } = useCryptoWallets();

  // Build source options from real data
  const [sourceOptions, setSourceOptions] = useState<SourceOption[]>([]);
  const [selectedSource, setSelectedSource] = useState<SourceOption | null>(null);

  useEffect(() => {
    const options: SourceOption[] = [];

    // Add crypto wallets FIRST (default source)
    if (cryptoWalletsResponse?.data) {
      cryptoWalletsResponse.data.forEach((wallet) => {
        options.push({
          id: wallet.id,
          type: "crypto_wallet",
          name: `${wallet.token} ${wallet.network}`,
          walletAddress: wallet.address,
          token: wallet.token,
          balance: parseFloat(wallet.balance) || 0,
        });
      });
    }

    // Add cards from API
    if (cardsResponse?.data) {
      cardsResponse.data.forEach((card) => {
        options.push({
          id: card.id,
          type: card.type,
          name: card.name,
          lastFour: card.lastFourDigits,
          balance: card.balance,
        });
      });
    }

    // Add bank account from IBAN API
    if (ibanResponse?.data) {
      options.push({
        id: "bank_account",
        type: "bank_account",
        name: t("send.bankAccount", "Банковский счёт AED"),
        iban: ibanResponse.data.iban,
        balance: ibanResponse.data.balance ?? 0,
      });
    }

    setSourceOptions(options);

    // Auto-select first option if none selected
    if (!selectedSource && options.length > 0) {
      setSelectedSource(options[0]);
    }
  }, [cardsResponse, ibanResponse, cryptoWalletsResponse]);

  const [selectedCoin, setSelectedCoin] = useState(coins[0]);
  const [selectedNetwork, setSelectedNetwork] = useState(networksByCoin[coins[0].id][0]);
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false);
  const [coinDrawerOpen, setCoinDrawerOpen] = useState(false);
  const [networkDrawerOpen, setNetworkDrawerOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [amountInput, setAmountInput] = useState("");

  // Recipient verification state
  const [recipientInfo, setRecipientInfo] = useState<{
    is_internal: boolean;
    recipient_name: string | null;
    avatar_url: string | null;
    message?: string;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Use referral balance or selected source balance
  const isCryptoSource = selectedSource?.type === "crypto_wallet";
  const availableBalance = isReferralWithdrawal ? referralBalance : (selectedSource?.balance ?? 0);
  const inputCurrency = isCryptoSource ? (selectedSource?.token || "USDT") : "AED";

  // Calculations depend on source type
  const amountNum = parseFloat(amountInput) || 0;
  let amountCrypto: string, networkFee: string, amountAfterFee: string;

  const SEND_COMMISSION_PERCENT = 1; // 1%
  const SEND_NETWORK_FEE = 5.90; // flat 5.90 USDT

  if (isCryptoSource) {
    // Input is already in USDT — no conversion needed
    amountCrypto = amountNum.toFixed(2);
    const commission = (amountNum * SEND_COMMISSION_PERCENT / 100);
    networkFee = SEND_NETWORK_FEE.toFixed(2);
    amountAfterFee = (amountNum - commission - SEND_NETWORK_FEE).toFixed(2);
  } else {
    // Input is in AED — convert to crypto
    amountCrypto = (amountNum * settings.AED_TO_USDT_RATE).toFixed(2);
    const cryptoAmount = parseFloat(amountCrypto);
    const commission = (cryptoAmount * SEND_COMMISSION_PERCENT / 100);
    networkFee = SEND_NETWORK_FEE.toFixed(2);
    amountAfterFee = (cryptoAmount - commission - SEND_NETWORK_FEE).toFixed(2);
  }

  const isValid = walletAddress.length >= 20 && amountNum > 0 && amountNum <= availableBalance;

  // Verify crypto address when user finishes typing
  const verifyAddress = useCallback(async (address: string) => {
    if (address.length < 20) {
      setRecipientInfo(null);
      setVerifyError(null);
      return;
    }
    setIsVerifying(true);
    setVerifyError(null);
    try {
      const res = await apiRequest<{
        is_internal: boolean;
        recipient_name: string | null;
        avatar_url: string | null;
        message?: string;
      }>(`/transactions/recipient-info/?crypto_address=${encodeURIComponent(address)}`, { method: 'GET' }, true);
      if (res.data) {
        setRecipientInfo(res.data);
      } else if (res.status === 400 || res.status === 404) {
        // Backend may not support crypto_address yet — treat as external
        setRecipientInfo({
          is_internal: false,
          recipient_name: null,
          avatar_url: null,
          message: "Внешний кошелёк"
        });
      } else {
        setVerifyError(res.error?.message || res.error?.detail || "Ошибка проверки");
      }
    } catch {
      setVerifyError("Ошибка сети");
    } finally {
      setIsVerifying(false);
    }
  }, []);

  // Debounced address verification
  useEffect(() => {
    if (walletAddress.length < 20) {
      setRecipientInfo(null);
      return;
    }
    const timer = setTimeout(() => verifyAddress(walletAddress), 600);
    return () => clearTimeout(timer);
  }, [walletAddress, verifyAddress]);

  const formatAmountInput = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return amountInput;
    if (parts[1] && parts[1].length > 2) {
      return `${parts[0]}.${parts[1].slice(0, 2)}`;
    }
    return cleaned;
  };

  const formatDisplayAmount = (value: string) => {
    if (!value) return "";
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    const parts = value.split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (parts.length > 1) {
      return `${integerPart}.${parts[1]}`;
    }
    return integerPart;
  };

  const parseDisplayAmount = (value: string) => {
    return value.replace(/,/g, "");
  };

  const handleCoinSelect = (coin: typeof coins[0]) => {
    setSelectedCoin(coin);
    setSelectedNetwork(networksByCoin[coin.id][0]);
    setCoinDrawerOpen(false);
  };

  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!isValid || isSending) return;
    setIsSending(true);

    try {
      let res;

      if (isCryptoSource) {
        // Wallet → Crypto Address
        res = await apiRequest<{
          message: string;
          transaction_id: string;
          status: string;
          is_internal?: boolean;
          recipient_name?: string;
        }>('/transactions/withdrawal/crypto-wallet/', {
          method: 'POST',
          body: JSON.stringify({
            from_wallet_id: selectedSource?.id,
            to_address: walletAddress,
            amount_usdt: amountNum.toFixed(6),
            token: selectedCoin.symbol,
            network: selectedNetwork.id.toUpperCase(),
          }),
        }, true);
      } else {
        // Card/Bank → External Crypto Wallet
        res = await apiRequest<{
          message: string;
          transaction_id: string;
          total_debit_crypto: string;
        }>('/transactions/withdrawal/crypto/', {
          method: 'POST',
          body: JSON.stringify({
            from_card_id: selectedSource?.id,
            token: selectedCoin.symbol,
            network: selectedNetwork.id.toUpperCase(),
            to_address: walletAddress,
            amount_crypto: amountCrypto,
          }),
        }, true);
      }

      if (res.data) {
        // Invalidate caches
        queryClient.invalidateQueries({ queryKey: ['cards'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['crypto-wallets'] });

        const statusMsg = res.data.status === 'completed'
          ? t("send.transferCompleted", "Перевод выполнен!")
          : t("send.transferPending", "Перевод в обработке");

        toast.success(statusMsg);
        navigate(isReferralWithdrawal ? "/partner" : "/");
      } else {
        const errMsg = res.error?.message || res.error?.detail || t("send.transferError", "Ошибка перевода");
        toast.error(errMsg);
      }
    } catch (err) {
      toast.error(t("send.networkError", "Ошибка сети"));
    } finally {
      setIsSending(false);
    }
  };

  const isDataLoading = cardsLoading || ibanLoading || cryptoLoading;

  const getSourceIcon = (source: SourceOption) => {
    if (source.type === "crypto_wallet") {
      return (
        <div className="w-10 h-10 rounded-full bg-[#26A17B] flex items-center justify-center">
          <Wallet className="w-5 h-5 text-white" />
        </div>
      );
    }
    if (source.type === "bank_account") {
      return (
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
          <Landmark className="w-5 h-5 text-white" />
        </div>
      );
    }
    return (
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        source.type === "metal" 
          ? "bg-gradient-to-br from-zinc-400 to-zinc-600" 
          : "bg-primary"
      }`}>
        <CreditCard className="w-5 h-5 text-primary-foreground" />
      </div>
    );
  };

  const getSourceSubtitle = (source: SourceOption) => {
    if (source.type === "crypto_wallet" && source.walletAddress) {
      return `${source.walletAddress.slice(0, 6)}...${source.walletAddress.slice(-4)}`;
    }
    if (source.type === "bank_account" && source.iban) {
      return `${source.iban.slice(0, 4)}****${source.iban.slice(-4)}`;
    }
    return source.lastFour ? `•••• ${source.lastFour}` : "";
  };

  return (
    <>
      <MobileLayout
        header={
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">{t("send.back")}</span>
          </button>
        }
        rightAction={<div className="flex items-center gap-2"><ThemeSwitcher /><LanguageSwitcher /></div>}
      >
        <div className="px-4 py-6 pb-32 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{t("send.sendToStablecoins")}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t("send.withdrawToWallet")}
            </p>
          </div>

          {/* Source Selection - Card, Bank Account, or Referral Balance */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {isReferralWithdrawal ? t("partner.referralBalance", "Реферальный счёт") : t("send.fromSource", "Откуда")}
            </label>
            {isReferralWithdrawal ? (
              <div className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">{t("partner.referralBalance", "Реферальный счёт")}</p>
                    <p className="text-sm text-muted-foreground">
                      {referralBalance.toFixed(2)} AED
                    </p>
                  </div>
                </div>
              </div>
            ) : isDataLoading ? (
              <Skeleton className="h-[72px] rounded-2xl" />
            ) : selectedSource ? (
              <button
                onClick={() => setSourceDrawerOpen(true)}
                className="w-full flex items-center justify-between p-4 bg-secondary rounded-2xl hover:bg-muted/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getSourceIcon(selectedSource)}
                  <div className="text-left">
                    <p className="font-semibold">{selectedSource.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {getSourceSubtitle(selectedSource)} · {selectedSource.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {selectedSource.type === "crypto_wallet" ? (selectedSource.token || "USDT") : "AED"}
                    </p>
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </button>
            ) : (
              <div className="w-full p-4 bg-secondary rounded-2xl text-muted-foreground text-sm">
                {t("send.noSourcesAvailable", "Нет доступных источников")}
              </div>
            )}
          </div>

          {/* Coin Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t("send.coin")}
            </label>
            <button
              onClick={() => setCoinDrawerOpen(true)}
              className="w-full flex items-center justify-between p-4 bg-secondary rounded-2xl hover:bg-muted/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: selectedCoin.color }}
                >
                  <span className="text-white font-bold text-sm">
                    {selectedCoin.symbol.charAt(0)}
                  </span>
                </div>
                <div className="text-left">
                  <p className="font-semibold">{selectedCoin.symbol}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCoin.name}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Network Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t("send.network")}
            </label>
            <button
              onClick={() => setNetworkDrawerOpen(true)}
              className="w-full flex items-center justify-between p-4 bg-secondary rounded-2xl hover:bg-muted/80 transition-colors"
            >
              <div className="text-left">
                <p className="font-semibold">{selectedNetwork.name}</p>
              </div>
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Wallet Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t("send.walletAddress")}
            </label>
            <div className="relative">
              <Input
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder={t("send.enterWalletAddress")}
                className="h-14 rounded-2xl bg-secondary border-0 text-base pr-12"
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    setWalletAddress(text.trim());
                  } catch (err) {
                    console.error("Failed to read clipboard");
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-background/50 transition-colors"
                aria-label="Paste from clipboard"
              >
                <ClipboardPaste className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Recipient verification result */}
            {isVerifying && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t("send.verifying", "Проверка адреса...")}</span>
              </div>
            )}
            {verifyError && (
              <p className="mt-2 text-sm text-destructive">{verifyError}</p>
            )}
            {recipientInfo && !isVerifying && (
              <div className="flex items-center gap-3 mt-3 p-3 rounded-xl bg-secondary">
                {recipientInfo.is_internal ? (
                  <>
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        {recipientInfo.avatar_url ? (
                          <AvatarImage src={recipientInfo.avatar_url} />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                          {recipientInfo.recipient_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <CheckCircle2 className="w-4 h-4 text-green-500 absolute -bottom-0.5 -right-0.5 bg-background rounded-full" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{recipientInfo.recipient_name}</p>
                      <p className="text-xs text-muted-foreground">{t("send.internalUser", "Пользователь системы")}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t("send.externalWallet", "Внешний кошелёк")}</p>
                      <p className="text-xs text-muted-foreground">{t("send.pendingTransfer", "Перевод будет в обработке")}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">
                {t("send.amount")}
              </label>
              <span className="text-sm text-muted-foreground">
                {t("send.available")}: <span className="font-medium text-foreground">{availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {isCryptoSource ? (selectedSource?.token || "USDT") : "AED"}</span>
              </span>
            </div>
            <div className="relative">
              <Input
                value={formatDisplayAmount(amountInput)}
                onChange={(e) => setAmountInput(formatAmountInput(parseDisplayAmount(e.target.value)))}
                placeholder="0.00"
                className="h-14 rounded-2xl bg-secondary border-0 text-base pr-28"
                inputMode="decimal"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  onClick={() => setAmountInput(availableBalance.toFixed(2))}
                  className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
                >
                  MAX
                </button>
                <span className="text-muted-foreground font-medium">
                  {inputCurrency}
                </span>
              </div>
            </div>
          </div>

          {/* Conversion Display */}
          <div className="bg-secondary rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pt-2 border-b border-border pb-3">
              <span className="text-muted-foreground">{t("send.youWillReceive")}</span>
              <span className="font-semibold text-lg">
                {amountCrypto} {selectedCoin.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("send.commission", "Комиссия")} (1%)</span>
              <span className="font-medium text-[#FFA000]">-{(parseFloat(amountCrypto) * 0.01).toFixed(2)} {selectedCoin.symbol}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("send.networkFee", "Сбор сети")}</span>
              <span className="font-medium text-[#FFA000]">-{networkFee} {selectedCoin.symbol}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-muted-foreground">{t("send.amount")}</span>
              <span className="font-medium">
                {(parseFloat(amountCrypto) + parseFloat(amountCrypto) * 0.01 + parseFloat(networkFee)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedCoin.symbol}
              </span>
            </div>
            {!isCryptoSource && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("send.exchangeRate")}</span>
                <span className="font-medium">1 USDT = {settings.USDT_TO_AED_SELL.toFixed(2)} AED</span>
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="bg-[#FFA000]/10 rounded-2xl p-4">
            <p className="text-sm text-[#FFA000]">
              ⚠️ {t("send.cryptoWarning")}
            </p>
          </div>

          <div className="pt-4">
            <PoweredByFooter />
          </div>
        </div>

        {/* Fixed Submit Button */}
        <div className="fixed bottom-0 left-0 right-0 p-6 max-w-[800px] mx-auto">
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSending}
            className="w-full h-14 rounded-2xl text-base font-semibold bg-primary/90 hover:bg-primary active:scale-95 backdrop-blur-2xl border-2 border-white/50 shadow-lg transition-all"
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {t("send.sending", "Отправка...")}
              </span>
            ) : (
              `${t("common.confirm", "Подтвердить")} ${(parseFloat(amountCrypto) + parseFloat(amountCrypto) * 0.01 + parseFloat(networkFee)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${selectedCoin.symbol}`
            )}
          </Button>
        </div>
      </MobileLayout>

      {/* Source Selection Drawer */}
      <Drawer open={sourceDrawerOpen} onOpenChange={setSourceDrawerOpen}>
        <DrawerContent className="bg-background/95 backdrop-blur-xl">
          <DrawerHeader className="relative flex items-center justify-center py-4">
            <DrawerTitle className="text-center text-base font-semibold">
              {t("send.selectSource", "Выберите источник")}
            </DrawerTitle>
            <DrawerClose className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <X className="w-3.5 h-3.5 text-primary" />
            </DrawerClose>
          </DrawerHeader>
          
          <div className="px-4 pb-6">
            <AnimatedDrawerContainer className="bg-muted/50 rounded-xl overflow-hidden">
              {sourceOptions.map((source, index) => (
                <AnimatedDrawerItem key={source.id} index={index}>
                  <button
                    onClick={() => {
                      setSelectedSource(source);
                      setSourceDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/80 transition-colors ${
                      index < sourceOptions.length - 1 ? 'border-b border-border/50' : ''
                    }`}
                  >
                    {getSourceIcon(source)}
                    <div className="flex-1 text-left">
                      <p className="text-base font-medium text-foreground">{source.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {getSourceSubtitle(source)} · {source.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {source.type === "crypto_wallet" ? (source.token || "USDT") : "AED"}
                      </p>
                    </div>
                    {selectedSource?.id === source.id && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                </AnimatedDrawerItem>
              ))}
            </AnimatedDrawerContainer>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Coin Selection Drawer */}
      <Drawer open={coinDrawerOpen} onOpenChange={setCoinDrawerOpen}>
        <DrawerContent className="bg-background/95 backdrop-blur-xl">
          <DrawerHeader className="relative flex items-center justify-center py-4">
            <DrawerTitle className="text-center text-base font-semibold">
              {t("send.selectCoin")}
            </DrawerTitle>
            <DrawerClose className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <X className="w-3.5 h-3.5 text-primary" />
            </DrawerClose>
          </DrawerHeader>
          
          <div className="px-4 pb-6">
            <AnimatedDrawerContainer className="bg-muted/50 rounded-xl overflow-hidden">
              {coins.map((coin, index) => (
                <AnimatedDrawerItem key={coin.id} index={index}>
                  <button
                    onClick={() => handleCoinSelect(coin)}
                    className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/80 transition-colors ${
                      index < coins.length - 1 ? 'border-b border-border/50' : ''
                    }`}
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: coin.color }}
                    >
                      <span className="text-white font-bold text-sm">
                        {coin.symbol.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-base font-medium text-foreground">{coin.symbol}</p>
                      <p className="text-sm text-muted-foreground">{coin.name}</p>
                    </div>
                    {selectedCoin.id === coin.id && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                </AnimatedDrawerItem>
              ))}
            </AnimatedDrawerContainer>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Network Selection Drawer */}
      <Drawer open={networkDrawerOpen} onOpenChange={setNetworkDrawerOpen}>
        <DrawerContent className="bg-background/95 backdrop-blur-xl">
          <DrawerHeader className="relative flex items-center justify-center py-4">
            <DrawerTitle className="text-center text-base font-semibold">
              {t("send.selectNetwork")}
            </DrawerTitle>
            <DrawerClose className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <X className="w-3.5 h-3.5 text-primary" />
            </DrawerClose>
          </DrawerHeader>
          
          <div className="px-4 pb-6">
            <AnimatedDrawerContainer className="bg-muted/50 rounded-xl overflow-hidden">
              {networksByCoin[selectedCoin.id].map((network, index) => (
                <AnimatedDrawerItem key={network.id} index={index}>
                  <button
                    onClick={() => {
                      setSelectedNetwork(network);
                      setNetworkDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-4 hover:bg-muted/80 transition-colors ${
                      index < networksByCoin[selectedCoin.id].length - 1 ? 'border-b border-border/50' : ''
                    }`}
                  >
                    <p className="text-base font-medium text-foreground">{network.name}</p>
                    {selectedNetwork.id === network.id && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                </AnimatedDrawerItem>
              ))}
            </AnimatedDrawerContainer>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default SendCrypto;
