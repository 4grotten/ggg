import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Landmark } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useWalletSummary } from "@/hooks/useCards";
import { Skeleton } from "@/components/ui/skeleton";
import aedCurrency from "@/assets/aed-currency.png";

const AccountPage = () => {
  const navigate = useNavigate();
  const { data: walletData, isLoading } = useWalletSummary();
  const account = walletData?.data?.physical_account;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} скопирован`);
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
          <h1 className="text-lg font-semibold">AED Account</h1>
        </div>
      }
    >
      <div className="px-4 py-6 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full rounded-2xl" />
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
                  <p className="text-xs text-muted-foreground">Банковский счёт</p>
                  <p className="text-sm font-medium">{account.currency || "AED"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <img src={aedCurrency} alt="AED" className="w-8 h-8 dark:invert dark:brightness-200" />
                <span className="text-3xl font-bold">{formatBalance(account.balance)}</span>
                <span className="text-lg text-muted-foreground">AED</span>
              </div>
            </motion.div>

            {/* IBAN details */}
            <motion.div
              className="rounded-2xl bg-secondary/50 p-5 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Реквизиты</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">IBAN</p>
                    <p className="text-sm font-mono font-medium break-all">{account.iban}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(account.iban, "IBAN")}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="h-px bg-border/50" />

                <div>
                  <p className="text-xs text-muted-foreground">Account Number</p>
                  <p className="text-sm font-mono font-medium">{account.iban.slice(-13)}</p>
                </div>

                <div className="h-px bg-border/50" />

                <div>
                  <p className="text-xs text-muted-foreground">Валюта</p>
                  <p className="text-sm font-medium">{account.currency || "AED"}</p>
                </div>
              </div>
            </motion.div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Landmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Счёт не найден</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default AccountPage;
