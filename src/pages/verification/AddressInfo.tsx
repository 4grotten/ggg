import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { StepIndicator } from "@/components/verification/StepIndicator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountrySearchableList } from "@/components/verification/CountrySearchableList";
import { getCountryByCode } from "@/data/countries";

const AddressInfo = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [countryCode, setCountryCode] = useState("AE");
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const selectedCountry = getCountryByCode(countryCode);
  const isValid = addressLine1.trim() && city.trim();

  if (showCountryPicker) {
    return (
      <CountrySearchableList
        value={countryCode}
        onChange={setCountryCode}
        onClose={() => setShowCountryPicker(false)}
      />
    );
  }

  return (
    <MobileLayout
      showBackButton
      onBack={() => navigate("/verify/monthly-volume")}
      rightAction={<LanguageSwitcher />}
    >
      <div className="flex flex-col h-[calc(100vh-56px)]">
        {/* Progress */}
        <div className="px-6 py-4">
          <StepIndicator currentStep={3} totalSteps={6} />
        </div>

        <div className="flex-1 px-6 py-4 overflow-y-auto pb-28">
          <h1 className="text-2xl font-bold mb-2">
            {t('verify.address.title')}
          </h1>
          <p className="text-muted-foreground mb-6">
            {t('verify.address.description')}
          </p>

          {/* Address Line 1 */}
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">
              {t('verify.address.addressLine1')} <span className="text-destructive">*</span>
            </Label>
            <Input
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder={t('verify.address.addressLine1Placeholder')}
              className="h-12"
            />
          </div>

          {/* Address Line 2 */}
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">
              {t('verify.address.addressLine2')}
            </Label>
            <Input
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder={t('verify.address.addressLine2Placeholder')}
              className="h-12"
            />
          </div>

          {/* City */}
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">
              {t('verify.address.city')} <span className="text-destructive">*</span>
            </Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t('verify.address.cityPlaceholder')}
              className="h-12"
            />
          </div>

          {/* Postal Code */}
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">
              {t('verify.address.postalCode')}
            </Label>
            <Input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder={t('verify.address.postalCodePlaceholder')}
              className="h-12"
              inputMode="text"
            />
          </div>

          {/* Country */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-2 block">
              {t('verify.address.country')}
            </Label>
            <button
              onClick={() => setShowCountryPicker(true)}
              className="w-full flex items-center justify-between p-3 h-12 rounded-xl border border-border bg-background hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedCountry?.flag}</span>
                <span>{selectedCountry?.name}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            {t('verify.address.requiredFields')}
          </p>

          <PoweredByFooter />
        </div>

        {/* Button */}
        <div className="karta-footer-actions">
          <button
            onClick={() => navigate("/verify/document-type")}
            disabled={!isValid}
            className={`karta-btn-primary ${
              !isValid ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {t('common.continue')}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default AddressInfo;
