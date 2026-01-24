import apofizLogo from "@/assets/apofiz-logo.svg";
import { getAuthToken } from "@/services/api/apiClient";

interface PoweredByFooterProps {
  className?: string;
}

/**
 * Opens Apofiz.com with automatic authentication via POST form
 */
export const openApofizWithAuth = () => {
  const token = getAuthToken();
  
  if (!token) {
    window.open('https://apofiz.com', '_blank', 'noopener,noreferrer');
    return;
  }

  // Create a hidden form for POST-based authentication
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://apofiz.com/auth/token/';
  form.target = '_blank';
  form.style.display = 'none';

  // Add token as hidden input
  const tokenInput = document.createElement('input');
  tokenInput.type = 'hidden';
  tokenInput.name = 'token';
  tokenInput.value = token;
  form.appendChild(tokenInput);

  // Submit form
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
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
