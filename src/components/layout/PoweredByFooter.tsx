import { ApofizLogo } from "@/components/icons/ApofizLogo";
import { getAuthToken } from "@/services/api/apiClient";
import { getApofizUrl } from "@/config/apofiz";

interface PoweredByFooterProps {
  className?: string;
}

/**
 * Opens apofiz.com with automatic authentication via token
 */
export const openApofizWithAuth = () => {
  const token = getAuthToken();
  const url = getApofizUrl(token);
  window.open(url, '_blank', 'noopener,noreferrer');
};

export const PoweredByFooter = ({ className = "" }: PoweredByFooterProps) => {
  return (
    <button 
      onClick={openApofizWithAuth}
      className={`text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1 hover:opacity-80 transition-opacity ${className}`}
    >
      Powered by{" "}
      <ApofizLogo className="w-4 h-4" />{" "}
      <span className="font-semibold text-foreground">Apofiz</span>
    </button>
  );
};
