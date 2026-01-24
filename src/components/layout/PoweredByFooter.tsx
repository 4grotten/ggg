import apofizLogo from "@/assets/apofiz-logo.svg";
import { getAuthToken } from "@/services/api/apiClient";

interface PoweredByFooterProps {
  className?: string;
}

const handleApofizClick = () => {
  const token = getAuthToken();
  const url = token 
    ? `https://apofiz.com?token=${encodeURIComponent(token)}`
    : 'https://apofiz.com';
  window.open(url, '_blank', 'noopener,noreferrer');
};

export const PoweredByFooter = ({ className = "" }: PoweredByFooterProps) => {
  return (
    <button 
      onClick={handleApofizClick}
      className={`text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1 hover:opacity-80 transition-opacity ${className}`}
    >
      Powered by{" "}
      <img src={apofizLogo} alt="Apofiz" className="w-4 h-4 inline-block" />{" "}
      <span className="font-semibold text-foreground">Apofiz</span>
    </button>
  );
};
