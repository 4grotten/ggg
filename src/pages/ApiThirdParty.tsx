import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { Construction } from "lucide-react";

const ApiThirdParty = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <MobileLayout
      showBackButton
      onBack={() => navigate("/settings")}
      title={t("settings.apiThirdParty")}
      rightAction={<LanguageSwitcher />}
    >
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Construction className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          {t("apiThirdParty.comingSoon", "Coming Soon")}
        </h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          {t("apiThirdParty.description", "Third-party API integrations will be available here soon.")}
        </p>
      </div>
    </MobileLayout>
  );
};

export default ApiThirdParty;
