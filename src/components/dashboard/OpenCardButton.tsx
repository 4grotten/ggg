import { CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";

interface OpenCardButtonProps {
  onClick?: () => void;
}

export const OpenCardButton = ({ onClick }: OpenCardButtonProps) => {
  const { t } = useTranslation();
  
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-4 rounded-2xl hover:bg-primary/90 transition-all shadow-lg active:scale-[0.98]"
    >
      <CreditCard className="w-5 h-5" />
      <span className="text-base">{t('dashboard.openCard')}</span>
    </button>
  );
};
