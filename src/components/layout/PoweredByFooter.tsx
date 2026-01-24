import apofizLogo from "@/assets/apofiz-logo.svg";

interface PoweredByFooterProps {
  className?: string;
}

/**
 * Opens test.apofiz.com
 */
export const openApofizWithAuth = () => {
  window.open('https://test.apofiz.com', '_blank', 'noopener,noreferrer');
};

export const PoweredByFooter = ({ className = "" }: PoweredByFooterProps) => {
  return (
    <button 
      onClick={openApofizWithAuth}
      className={`text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1 hover:opacity-80 transition-opacity ${className}`}
    >
      Powered by{" "}
      <img src={apofizLogo} alt="Apofiz" className="w-4 h-4 inline-block" />{" "}
      <span className="font-semibold text-foreground">Apofiz</span>
    </button>
  );
};
