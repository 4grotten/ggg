import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Share2, AlertTriangle } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { TOP_UP_BANK_FEE_PERCENT, TOP_UP_BANK_MIN_AMOUNT } from "@/lib/fees";
import { useAuth } from "@/contexts/AuthContext";

interface BankDetail {
  label: string;
  value: string;
}

const TopUpBankDetails = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  // Get user ID for the reference field
  const userId = user?.id ? String(user.id) : "—";
  const userFullName = user?.full_name || "—";

  // Generate user-specific account number and IBAN
  // Account number: fixed prefix, last digits replaced with UID (always 13 digits)
  const generateAccountNumber = (uid: string): string => {
    const prefix = "1234567890";
    const padded = uid.padStart(3, "0");
    return (prefix + padded).slice(0, 13);
  };

  // IBAN: AE + fixed prefix, last digits replaced with UID (always 23 chars)
  const generateIban = (uid: string): string => {
    const prefix = "AE07033123456789012";
    const padded = uid.padStart(4, "0");
    return (prefix + padded).slice(0, 23);
  };

  const accountNumber = userId !== "—" ? generateAccountNumber(userId) : "—";
  const iban = userId !== "—" ? generateIban(userId) : "—";

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const bankDetails: BankDetail[] = [
    { label: t("topUp.beneficiary"), value: userFullName },
    { label: t("topUp.accountNumber"), value: accountNumber },
    { label: t("topUp.iban"), value: iban },
    { label: t("topUp.bankName"), value: "Emirates NBD" },
    { label: t("topUp.bankAddress"), value: "Dubai, United Arab Emirates" },
  ];

  const feeDetails = [
    { label: t("topUp.topUpFee"), value: `${TOP_UP_BANK_FEE_PERCENT}%` },
    { label: t("topUp.networkFee"), value: "0 AED" },
    { label: t("topUp.minimumAmount"), value: `${TOP_UP_BANK_MIN_AMOUNT} AED` },
    { label: t("topUp.expectedArrival"), value: t("topUp.workingDays") },
  ];

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(t("toast.copied", { label }));
  };

  const handleShare = async () => {
    const detailsText = bankDetails
      .map((d) => `${d.label}: ${d.value}`)
      .join("\n");

    const shareData = {
      title: "AED Bank Account Details",
      text: `AED Wire Transfer Details:\n\n${detailsText}\n\n${t("topUp.yourIdRequired")}: ${userId}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(shareData.text);
        toast.success(t("toast.accountDetailsCopied"));
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        navigator.clipboard.writeText(shareData.text);
        toast.success(t("toast.accountDetailsCopied"));
      }
    }
  };

  return (
    <MobileLayout showBackButton onBack={() => navigate(-1)} rightAction={<div className="flex items-center gap-2"><ThemeSwitcher /><LanguageSwitcher /></div>}>
      <div className="flex flex-col min-h-[calc(100vh-56px)] pb-28">
        {/* Title */}
        <div className="pt-4 pb-4 px-6">
          <h1 className="text-2xl font-bold text-center text-foreground">
            {t("topUp.viaBankTransfer")}
          </h1>
        </div>

        {/* Subtitle */}
        <div className="text-center pb-4">
          <span className="text-sm text-muted-foreground tracking-wide">
            {t("topUp.uaeDomesticOnly")}
          </span>
        </div>

        {/* Bank Details Card */}
        <div className="px-6 flex-1">
          <div className="bg-muted rounded-2xl p-5 space-y-4">
            {bankDetails.map((detail, index) => (
              <div
                key={index}
                className="flex items-start justify-between gap-3"
              >
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{detail.label}</p>
                  <p className="font-semibold text-foreground break-all">
                    {detail.value}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(detail.value, detail.label)}
                  className="p-2 hover:bg-background/50 rounded-lg transition-colors flex-shrink-0"
                >
                  <Copy className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>

          {/* Fee Details Card */}
          <div className="bg-muted rounded-2xl p-5 mt-4 space-y-3">
            {feeDetails.map((detail, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {detail.label}
                </span>
                <span className="font-semibold text-foreground">
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-6 flex gap-3 max-w-[800px] mx-auto">
        <button
          onClick={() => {
            const allText = bankDetails.map(d => `${d.label}: ${d.value}`).join("\n");
            navigator.clipboard.writeText(allText);
            toast.success(t("toast.accountDetailsCopied"));
          }}
          className="flex-1 bg-muted/80 text-foreground font-semibold py-4 rounded-xl hover:bg-muted transition-all flex items-center justify-center gap-2 active:scale-95 backdrop-blur-2xl border-2 border-white/50 shadow-lg"
        >
          <Copy className="w-5 h-5" />
          {t("topUp.copy", "Скопировать")}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 bg-primary/90 text-white font-semibold py-4 rounded-xl hover:bg-primary transition-all flex items-center justify-center gap-2 active:scale-95 backdrop-blur-2xl border-2 border-white/50 shadow-lg"
        >
          <Share2 className="w-5 h-5" />
          {t("topUp.share", "Поделиться")}
        </button>
      </div>
    </MobileLayout>
  );
};

export default TopUpBankDetails;
