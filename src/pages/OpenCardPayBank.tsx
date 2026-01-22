import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Copy, Share2, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { CardMiniature } from "@/components/dashboard/CardMiniature";
import { VIRTUAL_CARD_ANNUAL_FEE, METAL_CARD_ANNUAL_FEE, TOP_UP_BANK_FEE_PERCENT } from "@/lib/fees";

const OpenCardPayBank = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const cardType = searchParams.get("type") as "virtual" | "metal" || "virtual";

  const cardIssuanceFee = cardType === "virtual" ? VIRTUAL_CARD_ANNUAL_FEE : METAL_CARD_ANNUAL_FEE;
  const bankFee = cardIssuanceFee * (TOP_UP_BANK_FEE_PERCENT / 100);
  const totalAmount = cardIssuanceFee + bankFee;

  // Bank details
  const bankDetails = {
    bankName: "Emirates NBD",
    accountName: "Easy Card LLC",
    iban: "AE070260001015323498601",
    swift: "EABORAE1XXX",
    reference: `CARD-${Date.now().toString(36).toUpperCase()}`
  };

  const formatBalance = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('toast.copied'));
  };

  const handleShare = async () => {
    const shareText = `${t('topUp.bankDetails')}
${t('topUp.bankName')}: ${bankDetails.bankName}
${t('topUp.accountName')}: ${bankDetails.accountName}
IBAN: ${bankDetails.iban}
SWIFT: ${bankDetails.swift}
${t('topUp.reference')}: ${bankDetails.reference}
${t('openCard.totalToPay')}: ${formatBalance(totalAmount)} AED`;

    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch (err) {
        navigator.clipboard.writeText(shareText);
        toast.success(t('toast.copied'));
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success(t('toast.copied'));
    }
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
          <h1 className="text-lg font-semibold">{t('openCard.payWithBank')}</h1>
        </div>
      }
    >
      <div className="px-4 py-6 space-y-4 pb-32">
        {/* Payment Details */}
        <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-16 shrink-0">
              <CardMiniature type={cardType} />
            </div>
            <div className="flex-1">
              <p className="font-semibold">
                {cardType === "virtual" ? t('openCard.virtualCard') : t('openCard.metalCard')}
              </p>
              <p className="text-xs text-muted-foreground">{t('openCard.annualServiceDescription')}</p>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="space-y-2 pt-3 border-t border-border/50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('openCard.annualFee')}</span>
              <span className="font-medium">{formatBalance(cardIssuanceFee)} AED</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('openCard.servicePeriod')}</span>
              <span className="font-medium">12 {t('openCard.months')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('openCard.bankFee')} ({TOP_UP_BANK_FEE_PERCENT}%)</span>
              <span className="font-medium">{formatBalance(bankFee)} AED</span>
            </div>
            <div className="flex justify-between text-base pt-2 border-t border-border/50">
              <span className="font-semibold">{t('openCard.totalToPay')}</span>
              <span className="font-bold text-primary">{formatBalance(totalAmount)} AED</span>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-border/50">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{bankDetails.bankName}</p>
              <p className="text-xs text-muted-foreground">{t('topUp.bankTransfer')}</p>
            </div>
          </div>

          {/* Account Name */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t('topUp.accountName')}</p>
              <p className="font-medium">{bankDetails.accountName}</p>
            </div>
            <button
              onClick={() => handleCopy(bankDetails.accountName, t('topUp.accountName'))}
              className="p-2 rounded-lg bg-primary/10 text-primary"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          {/* IBAN */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">IBAN</p>
              <p className="font-medium font-mono text-sm">{bankDetails.iban}</p>
            </div>
            <button
              onClick={() => handleCopy(bankDetails.iban, 'IBAN')}
              className="p-2 rounded-lg bg-primary/10 text-primary"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          {/* SWIFT */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">SWIFT</p>
              <p className="font-medium font-mono">{bankDetails.swift}</p>
            </div>
            <button
              onClick={() => handleCopy(bankDetails.swift, 'SWIFT')}
              className="p-2 rounded-lg bg-primary/10 text-primary"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          {/* Reference */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div>
              <p className="text-xs text-muted-foreground">{t('topUp.reference')}</p>
              <p className="font-medium font-mono text-primary">{bankDetails.reference}</p>
            </div>
            <button
              onClick={() => handleCopy(bankDetails.reference, t('topUp.reference'))}
              className="p-2 rounded-lg bg-primary/10 text-primary"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Important Note */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700">
          <p className="font-medium mb-1">{t('topUp.importantNote')}</p>
          <p className="text-xs">{t('topUp.includeReference')}</p>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 max-w-[800px] mx-auto">
        <button
          onClick={handleShare}
          className="w-full py-4 rounded-2xl bg-primary/90 backdrop-blur-2xl border-2 border-white/50 text-primary-foreground font-semibold flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          {t('topUp.shareDetails')}
        </button>
      </div>
    </MobileLayout>
  );
};

export default OpenCardPayBank;
