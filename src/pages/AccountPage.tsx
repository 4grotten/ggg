import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Copy, Landmark, Share2, QrCode, Clock, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useWalletSummary, useBankAccounts } from "@/hooks/useCards";
import { CardTransactionsList } from "@/components/card/CardTransactionsList";
import { useMergedTransactionGroups } from "@/hooks/useTransactions";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import aedCurrency from "@/assets/aed-currency.png";

const AccountPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: walletData, isLoading: walletLoading } = useWalletSummary();
  const { data: bankAccountsData, isLoading: bankLoading } = useBankAccounts();
  const isLoading = walletLoading || bankLoading;
  
  // Prefer bank-accounts API data, fallback to wallet summary
  const bankAccount = bankAccountsData?.data?.[0];
  const walletAccount = walletData?.data?.physical_account;
  
  const account = bankAccount || walletAccount ? {
    iban: bankAccount?.iban || walletAccount?.iban || "",
    balance: bankAccount?.balance || walletAccount?.balance || "0",
    currency: walletAccount?.currency || "AED",
    bank_name: bankAccount?.bank_name,
    beneficiary: bankAccount?.beneficiary,
    is_active: bankAccount?.is_active,
    id: bankAccount?.id,
  } : null;
  
  const [qrOpen, setQrOpen] = useState(false);
  const { data: transactionsData, isLoading: transactionsLoading } = useMergedTransactionGroups();

  const transactionGroups = useMemo(() => {
    const groups = transactionsData?.groups || [];
    const bankTypes = ["transfer_in", "transfer_out", "bank_deposit", "bank_withdrawal"];
    return groups
      .map(group => ({
        ...group,
        transactions: group.transactions.filter(tx =>
          bankTypes.includes(tx.type || "") ||
          tx.description?.toLowerCase().includes("bank") ||
          tx.description?.toLowerCase().includes("iban") ||
          tx.merchant?.toLowerCase().includes("bank")
        ),
      }))
      .filter(group => group.transactions.length > 0);
  }, [transactionsData]);

  const iban = account?.iban || "";
  const accountNumber = iban.slice(-13);
  const bankName = account?.bank_name || "EasyCard FZE";
  const currency = account?.currency || "AED";
  const userName = account?.beneficiary || user?.full_name || "Account Holder";
  const nameParts = userName.trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  // vCard format for QR — adds as contact to address book
  const vCardData = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${lastName};${firstName};;;`,
    `FN:${userName}`,
    `ORG:IBAN ${currency}`,
    `NOTE:IBAN: ${iban}\\nAccount: ${accountNumber}\\nBank: ${bankName}\\nCurrency: ${currency}`,
    `X-IBAN:${iban}`,
    `X-ACCOUNT:${accountNumber}`,
    "END:VCARD",
  ].join("\n");

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} ${t('accountPage.copied')}`);
  };
  
  const getAllDetailsText = () => {
    return [
      `${t('accountPage.beneficiary')}: ${userName}`,
      `${t('accountPage.bankName')}: ${bankName}`,
      `IBAN: ${iban}`,
      `${t('accountPage.accountNumber')}: ${accountNumber}`,
      `${t('accountPage.currency')}: ${currency}`,
    ].join('\n');
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(getAllDetailsText());
    toast.success(t('accountPage.copiedToClipboard'));
  };

  const handleShare = async () => {
    // Try sharing vCard file first, fallback to text
    try {
      const vCardBlob = new Blob([vCardData], { type: 'text/vcard' });
      const vCardFile = new File([vCardBlob], `${userName.replace(/\s+/g, '_')}.vcf`, { type: 'text/vcard' });
      
      if (navigator.share && navigator.canShare?.({ files: [vCardFile] })) {
        await navigator.share({
          title: userName,
          files: [vCardFile],
        });
        return;
      }
    } catch {
      // vCard file share not supported, fall through
    }

    // Fallback: share as text
    try {
      const shareData = {
        title: t('accountPage.title'),
        text: getAllDetailsText(),
      };
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        handleCopyAll();
      }
    } catch {
      // user cancelled
    }
  };

  const formatBalance = (val: string | number) =>
    new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(val));

  return (
    <MobileLayout
      header={
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">{t('accountPage.title')}</h1>
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
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : account ? (
          <>
            {/* Balance card */}
            <motion.div
              className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('accountPage.bankAccount')}</p>
                  <p className="text-sm font-medium">{account.currency || "AED"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <img src={aedCurrency} alt="AED" className="w-8 h-8 dark:invert dark:brightness-200" />
                <span className="text-3xl font-bold">{formatBalance(account.balance)}</span>
                <span className="text-lg text-muted-foreground">AED</span>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => navigate("/top-up/bank")}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#27AE60] text-white py-2.5 font-medium text-sm hover:bg-[#219653] transition-colors"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  {t('dashboard.topUp')}
                </button>
                <button
                  onClick={() => navigate("/send-to-card")}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-500 text-white py-2.5 font-medium text-sm hover:bg-blue-600 transition-colors"
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
                {t('accountPage.share')}
              </button>

              <Drawer open={qrOpen} onOpenChange={setQrOpen}>
                <DrawerTrigger asChild>
                  <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-secondary/70 hover:bg-secondary transition-colors py-3 font-medium text-sm">
                    <QrCode className="w-4 h-4" />
                    {t('accountPage.qrCode')}
                  </button>
                </DrawerTrigger>
                <DrawerContent className="pb-8">
                  <div className="flex flex-col items-center px-6 pt-4 pb-2 space-y-5">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-primary" />
                      <span className="font-semibold">{t('accountPage.title')}</span>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-lg">
                      <QRCodeSVG
                        value={vCardData}
                        size={220}
                        level="H"
                        includeMargin={false}
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    </div>

                    <div className="text-center space-y-2">
                      <p className="text-sm font-semibold">{userName}</p>
                      <p className="text-xs text-muted-foreground">{bankName}</p>
                      <div className="h-px bg-border/50 w-full" />
                      <div>
                        <p className="text-xs text-muted-foreground">IBAN</p>
                        <p className="text-sm font-mono font-medium break-all px-4">{iban}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('accountPage.accountNumber')}</p>
                        <p className="text-sm font-mono font-medium">{accountNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('accountPage.currency')}</p>
                        <p className="text-sm font-medium">{currency}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 w-full">
                      <button
                        onClick={handleCopyAll}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 font-medium text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        {t('accountPage.copy')}
                      </button>
                      <button
                        onClick={() => {
                          setQrOpen(false);
                          handleShare();
                        }}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-secondary text-foreground py-3 font-medium text-sm"
                      >
                        <Share2 className="w-4 h-4" />
                        {t('accountPage.share')}
                      </button>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
            </motion.div>

            {/* IBAN details */}
            <motion.div
              className="rounded-2xl bg-secondary/50 p-5 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('accountPage.details')}</h3>
              
              <div className="space-y-3">
                {account?.beneficiary && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('accountPage.beneficiary')}</p>
                      <p className="text-sm font-medium">{account.beneficiary}</p>
                    </div>
                    <div className="h-px bg-border/50" />
                  </>
                )}

                {account?.bank_name && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('accountPage.bankName')}</p>
                      <p className="text-sm font-medium">{account.bank_name}</p>
                    </div>
                    <div className="h-px bg-border/50" />
                  </>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">IBAN</p>
                    <p className="text-sm font-mono font-medium break-all">{iban}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(iban, "IBAN")}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="h-px bg-border/50" />

                <div>
                  <p className="text-xs text-muted-foreground">{t('accountPage.accountNumber')}</p>
                  <p className="text-sm font-mono font-medium">{iban.slice(-13)}</p>
                </div>

                <div className="h-px bg-border/50" />

                <div>
                  <p className="text-xs text-muted-foreground">{t('accountPage.currency')}</p>
                  <p className="text-sm font-medium">{account.currency || "AED"}</p>
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

              {transactionsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-32 w-full rounded-xl" />
                </div>
              ) : (
                <CardTransactionsList groups={transactionGroups} />
              )}
            </motion.div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Landmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{t('accountPage.notFound')}</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default AccountPage;
