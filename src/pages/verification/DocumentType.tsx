import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { StepIndicator } from "@/components/verification/StepIndicator";
import { RadioGroup } from "@/components/verification/RadioGroup";
import { ChevronDown, AlertTriangle } from "lucide-react";
import { useVerificationProgress } from "@/hooks/useVerificationProgress";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DocumentType = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { saveFormData, getFormData } = useVerificationProgress();
  
  const [country] = useState("United Arab Emirates");
  const [documentType, setDocumentType] = useState<string | null>(null);
  const [showUnsupportedAlert, setShowUnsupportedAlert] = useState(false);

  const documentTypes = [
    { id: "drivers-license", label: t('verify.documentType.driversLicense') },
    { id: "id-card", label: t('verify.documentType.idCard') },
    { id: "residence-permit", label: t('verify.documentType.residencePermit') },
    { id: "passport", label: t('verify.documentType.passport') },
  ];

  // Load saved data on mount
  useEffect(() => {
    const saved = getFormData();
    if (saved.documentType) setDocumentType(saved.documentType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save data on change
  useEffect(() => {
    saveFormData({ documentType: documentType || undefined });
  }, [documentType, saveFormData]);

  const handleDocumentTypeChange = (type: string) => {
    setDocumentType(type);
    
    // Show alert for residence permit
    if (type === "residence-permit") {
      setTimeout(() => setShowUnsupportedAlert(true), 300);
    }
  };

  const handleContinue = () => {
    if (documentType === "residence-permit") {
      setShowUnsupportedAlert(true);
    } else {
      navigate("/verify/document-upload");
    }
  };

  const handleChangeDocumentType = () => {
    setShowUnsupportedAlert(false);
    setDocumentType(null);
  };

  return (
    <MobileLayout
      showBackButton
      onBack={() => navigate("/verify/address")}
      rightAction={<LanguageSwitcher />}
    >
      <div className="flex flex-col h-[calc(100vh-56px)]">
        {/* Progress */}
        <div className="px-6 py-4">
          <StepIndicator currentStep={4} totalSteps={6} />
        </div>

        <div className="flex-1 px-6 py-4 overflow-y-auto pb-28">
          <h1 className="text-2xl font-bold mb-2">
            {t('verify.documentType.title')}
          </h1>
          <p className="text-muted-foreground mb-6">{t('verify.documentType.subtitle')}</p>

          {/* Issuing Country */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">
              {t('verify.documentType.issuingCountry')} <span className="text-destructive">*</span>
            </label>
            <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:border-muted-foreground transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-xl">🇦🇪</span>
                <span>{country}</span>
              </div>
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Document Type */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">
              {t('verify.documentType.documentType')} <span className="text-destructive">*</span>
            </label>
            <RadioGroup
              options={documentTypes}
              value={documentType}
              onChange={handleDocumentTypeChange}
            />
          </div>

          <p className="text-xs text-muted-foreground">{t('verify.documentType.requiredFields')}</p>

          <PoweredByFooter />
        </div>

        {/* Button */}
        <div className="karta-footer-actions">
          <button
            onClick={handleContinue}
            disabled={!documentType}
            className={`karta-btn-primary ${
              !documentType ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {t('verify.documentType.continue')}
          </button>
        </div>
      </div>

      {/* Unsupported Document Alert */}
      <AlertDialog open={showUnsupportedAlert} onOpenChange={setShowUnsupportedAlert}>
        <AlertDialogContent className="max-w-[320px] rounded-2xl p-0 overflow-hidden border-0 gap-0">
          <div className="p-5 pb-4">
            {/* Warning Icon */}
            <motion.div 
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </motion.div>
            </motion.div>

            <AlertDialogTitle className="text-center text-[17px] font-semibold mb-2">
              {t('verify.documentType.unsupported.title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-[13px] text-muted-foreground mb-4">
              {t('verify.documentType.unsupported.description')}
            </AlertDialogDescription>

            {/* Unsupported countries list */}
            <div className="bg-secondary/50 rounded-xl p-3 mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {t('verify.documentType.unsupported.countriesTitle')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["🇦🇫 Afghanistan", "🇮🇷 Iran", "🇰🇵 North Korea", "🇸🇾 Syria", "🇨🇺 Cuba"].map((country, i) => (
                  <motion.span 
                    key={country}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-md"
                  >
                    {country}
                  </motion.span>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {t('verify.documentType.unsupported.suggestion')}
            </p>
          </div>
          
          {/* iOS-style buttons */}
          <div className="flex flex-col">
            <button
              onClick={handleChangeDocumentType}
              className="w-full py-3 text-[17px] font-semibold text-[#007AFF] border-t border-border hover:bg-secondary/50 transition-colors"
            >
              {t('verify.documentType.unsupported.changeType')}
            </button>
            <button
              onClick={() => setShowUnsupportedAlert(false)}
              className="w-full py-3 text-[17px] font-normal text-muted-foreground border-t border-border hover:bg-secondary/50 transition-colors"
            >
              {t('verify.documentType.unsupported.cancel')}
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
};

export default DocumentType;
