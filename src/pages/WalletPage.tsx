import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Share2, QrCode, X, Clock, ArrowDownLeft, ArrowUpRight, CreditCard, ChevronRight, Wallet, Landmark } from "lucide-react";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { UsdtIcon, TronIcon } from "@/components/icons/CryptoIcons";
import { CardTransactionsList } from "@/components/card/CardTransactionsList";
import { useMergedTransactionGroups, useCryptoTransactionGroups } from "@/hooks/useTransactions";
import { useCryptoWallets } from "@/hooks/useCards";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";

const WalletPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [qrOpen, setQrOpen] = useState(false);
  const [sendDrawerOpen, setSendDrawerOpen] = useState(false);
  const { data: transactionsData, isLoading: transactionsLoading } = useMergedTransactionGroups();
  const { data: cryptoApiGroups, isLoading: cryptoApiLoading } = useCryptoTransactionGroups();
  const { data: cryptoWalletsData } = useCryptoWallets();
  
  const wallet = cryptoWalletsData?.data?.[0];
  const usdtBalance = wallet ? parseFloat(String(wallet.balance)) : 0;
  const walletAddress = wallet?.address || "—";

  const transactionGroups = useMemo(() => {
    // Filter mock groups for crypto types
    const groups = transactionsData?.groups || [];
    const cryptoTypes = ["topup", "crypto_withdrawal", "crypto_deposit", "top_up", "withdrawal"];
    const mockCryptoGroups = groups
      .map(group => ({
        ...group,
        transactions: group.transactions.filter(tx => 
          cryptoTypes.includes(tx.type || "") || 
          tx.description?.toLowerCase().includes("crypto") ||
          tx.description?.toLowerCase().includes("usdt") ||
          tx.merchant?.toLowerCase().includes("usdt") ||
          tx.merchant?.toLowerCase().includes("trc20")
        ),
      }))
      .filter(group => group.transactions.length > 0);

    // Merge: API crypto groups first, then mock crypto groups
    const merged = [...(cryptoApiGroups || []), ...mockCryptoGroups];
    return merged;
  }, [transactionsData, cryptoApiGroups]);



  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('walletPage.addressCopied'));
  };

  const handleShare = async () => {
    const shareData = {
      title: t('walletPage.title'),
      text: t('walletPage.shareMessage', { address: walletAddress }),
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(walletAddress);
        toast.success(t('walletPage.copiedToClipboard'));
      }
    } catch {
      // user cancelled share
    }
  };

  const formatBalance = (val: number) =>
    new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  return (
    <MobileLayout
      header={
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">{t('walletPage.title')}</h1>
        </div>
      }
      rightAction={
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      }
    >
      <div className="px-4 py-6 space-y-4">
        {/* Balance card */}
        <motion.div
          className="rounded-2xl bg-gradient-to-br from-[#26A17B]/20 to-[#26A17B]/5 border border-[#26A17B]/20 p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#26A17B]/20 flex items-center justify-center">
              <UsdtIcon size={22} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('walletPage.cryptoWallet')}</p>
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium">USDT</p>
                <TronIcon size={12} className="opacity-60" />
                <span className="text-xs text-muted-foreground">TRC20</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-[#26A17B]">$</span>
            <span className="text-3xl font-bold">{formatBalance(usdtBalance)}</span>
            <span className="text-lg text-muted-foreground">USDT</span>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => navigate("/top-up/crypto")}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#27AE60] text-white py-2.5 font-medium text-sm hover:bg-[#219653] transition-colors"
            >
              <ArrowDownLeft className="w-4 h-4" />
              {t('dashboard.topUp')}
            </button>
            <button
              onClick={() => setSendDrawerOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#007AFF] text-white py-2.5 font-medium text-sm hover:bg-[#0066DD] transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
              {t('dashboard.send')}
            </button>
          </div>
        </motion.div>

        {/* Action buttons: Share + QR */}
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-secondary/70 hover:bg-secondary transition-colors py-3 font-medium text-sm"
          >
            <Share2 className="w-4 h-4" />
            {t('walletPage.share')}
          </button>

          <Drawer open={qrOpen} onOpenChange={setQrOpen}>
            <DrawerTrigger asChild>
              <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-secondary/70 hover:bg-secondary transition-colors py-3 font-medium text-sm">
                <QrCode className="w-4 h-4" />
                {t('walletPage.qrCode')}
              </button>
            </DrawerTrigger>
            <DrawerContent className="pb-8">
              <div className="flex flex-col items-center px-6 pt-4 pb-2 space-y-5">
                <div className="flex items-center gap-2">
                  <UsdtIcon size={20} />
                  <span className="font-semibold">USDT TRC20</span>
                  <TronIcon size={14} className="opacity-60" />
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-lg">
                  <QRCodeSVG
                    value={walletAddress}
                    size={220}
                    level="H"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>

                <div className="text-center space-y-1">
                  <p className="text-xs text-muted-foreground">{t('walletPage.walletAddress')}</p>
                  <p className="text-sm font-mono font-medium break-all px-4">{walletAddress}</p>
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => copyToClipboard(walletAddress)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 font-medium text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    {t('walletPage.copy')}
                  </button>
                  <button
                    onClick={() => {
                      setQrOpen(false);
                      handleShare();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-secondary text-foreground py-3 font-medium text-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    {t('walletPage.share')}
                  </button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </motion.div>

        {/* Wallet details */}
        <motion.div
          className="rounded-2xl bg-secondary/50 p-5 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('walletPage.walletDetails')}</h3>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">{t('walletPage.network')}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <TronIcon size={16} />
                <p className="text-sm font-medium">Tron (TRC20)</p>
              </div>
            </div>

            <div className="h-px bg-border/50" />

            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{t('walletPage.walletAddress')}</p>
                <p className="text-sm font-mono font-medium break-all mt-0.5">{walletAddress}</p>
              </div>
              <button
                onClick={() => copyToClipboard(walletAddress)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors flex-shrink-0"
              >
                <Copy className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="h-px bg-border/50" />

            <div>
              <p className="text-xs text-muted-foreground">{t('walletPage.currency')}</p>
              <p className="text-sm font-medium">Tether (USDT)</p>
            </div>
          </div>
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">{t('dashboard.transactions')}</h2>
            <button
              onClick={() => navigate("/card/virtual/history")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <Clock className="w-4 h-4" />
              {t('card.transactionHistory')}
            </button>
          </div>

          {(transactionsLoading || cryptoApiLoading) ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : (
            <CardTransactionsList groups={transactionGroups} walletView />
          )}
        </motion.div>
      </div>

      {/* Send Drawer */}
      <Drawer open={sendDrawerOpen} onOpenChange={setSendDrawerOpen}>
        <DrawerContent className="pb-8">
          <div className="px-6 pt-4 pb-2 space-y-2">
            <h3 className="text-lg font-bold mb-3">{t('dashboard.send')}</h3>

            {/* Send to Card */}
            <button
              onClick={() => { setSendDrawerOpen(false); navigate("/send/crypto-to-card"); }}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/70 hover:bg-secondary transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#007AFF] flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{t('dashboard.sendToCard')}</p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.sendToCardDescription')}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Send to USDT Wallet */}
            <button
              onClick={() => { setSendDrawerOpen(false); navigate("/send/crypto"); }}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/70 hover:bg-secondary transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#26A17B] flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{t('send.usdtBalance', 'Кошелёк USDT')}</p>
                  <p className="text-xs text-muted-foreground">{t('send.usdtBalanceDesc', 'На внешний USDT адрес')}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Send to Bank Account */}
            <button
              onClick={() => { setSendDrawerOpen(false); navigate("/send/bank"); }}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/70 hover:bg-secondary transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#5B6EF5] flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{t('send.bankTransfer', 'Перевод на счёт')}</p>
                  <p className="text-xs text-muted-foreground">{t('send.sendLocalBankTransfer', 'Банковский перевод')}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </MobileLayout>
  );
};

export default WalletPage;
