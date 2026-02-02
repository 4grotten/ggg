/**
 * CodeEntry — экран ввода SMS-кода
 * POST /verify_code/ для подтверждения
 * POST /resend_code/ для повторной отправки
 * 
 * Автозаполнение OTP:
 * - Используется единый input с autoComplete="one-time-code" для iOS/Android
 * - Визуально отображается как 6 отдельных ячеек
 */

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { MessageSquare, HelpCircle, Loader2, RefreshCw, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { verifyOtp, sendOtp } from "@/services/api/authApi";
import { z } from "zod";
import { OtpInput } from "@/components/ui/otp-input";

// Validation schema
const codeSchema = z.string()
  .length(6, "Code must be 6 digits")
  .regex(/^\d+$/, "Only digits allowed");

const RESEND_COOLDOWN = 60; // seconds

const CodeEntry = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  // Get phone number and auth type from navigation state
  const locationState = location.state as { phoneNumber?: string; authType?: 'sms' | 'whatsapp' } | null;
  const phoneNumber = locationState?.phoneNumber || "";
  const authType = locationState?.authType || 'sms';
  
  // Check if it's WhatsApp auth (non-+996 countries)
  const isWhatsAppAuth = authType === 'whatsapp';
  
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Redirect if no phone number
  useEffect(() => {
    if (!phoneNumber) {
      navigate("/auth/phone", { replace: true });
    }
  }, [phoneNumber, navigate]);
  
  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);
  
  // Handle code change
  const handleCodeChange = (value: string) => {
    setCode(value);
    setError("");
    
    // Auto-submit when all 6 digits entered
    if (value.length === 6 && !isLoading && !isVerifying) {
      handleVerify(value);
    }
  };
  
  // Verify code
  const handleVerify = async (codeStr?: string) => {
    // Prevent double-submit
    if (isLoading || isVerifying) return;
    setIsVerifying(true);

    const fullCode = codeStr || code;
    
    // Validate
    const validation = codeSchema.safeParse(fullCode);
    if (!validation.success) {
      setError(t("auth.code.invalidCode") || "Invalid code");
      setIsVerifying(false);
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      // IMPORTANT: send as string to preserve leading zeros (server expects 6 chars)
      const response = await verifyOtp(phoneNumber, fullCode);
      
      // Check for API-level error
      if (response.error) {
        setError(response.error.message || t("auth.code.wrongCode"));
        setCode("");
        return;
      }
      
      // Check response data - API returns error in data.error field
      if (response.data?.is_valid) {
        toast.success(t("auth.code.success") || "Code verified!");
        
        // OTP verified - go to profile setup page
        navigate("/auth/profile", { 
          replace: true,
          state: { phoneNumber, otpVerified: true }
        });
      } else {
        // API returns error message in data.error field
        const errorMessage = (response.data as { error?: string })?.error || t("auth.code.wrongCode");
        setError(errorMessage);
        setCode("");
      }
    } catch {
      setError(t("auth.code.error") || "Verification failed");
    } finally {
      setIsLoading(false);
      setIsVerifying(false);
    }
  };
  
  // Resend code - use sendOtp with appropriate type
  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    
    setIsResending(true);
    
    try {
      // Use WhatsApp for non-+996 countries, SMS for +996
      const otpType: 'sms' | 'whatsapp' = isWhatsAppAuth ? 'whatsapp' : 'sms';
      const response = await sendOtp(phoneNumber, otpType);
      
      if (response.error) {
        toast.error(response.error.message || t("auth.code.resendError"));
      } else {
        const successMessage = isWhatsAppAuth 
          ? (t("auth.code.resendSuccessWhatsApp") || "Code sent via WhatsApp!")
          : (t("auth.code.resendSuccess") || "Code sent!");
        toast.success(successMessage);
        setResendCooldown(RESEND_COOLDOWN);
        setCode("");
      }
    } catch {
      toast.error(t("auth.code.resendError") || "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };
  
  // Format phone for display
  const formatPhoneDisplay = (phone: string) => {
    return phone;
  };

  return (
    <MobileLayout
      showBackButton
      onBack={() => navigate("/auth/phone")}
      rightAction={<LanguageSwitcher />}
    >
      <div className="flex flex-col h-[calc(100vh-56px)]">
        <div className="flex-1 overflow-y-auto px-6 py-8 pb-28">
          {/* Header */}
          <motion.div 
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div 
              className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 overflow-hidden transition-colors duration-300 ${
                error 
                  ? 'bg-destructive/10 ring-2 ring-destructive' 
                  : isWhatsAppAuth 
                    ? 'bg-emerald-500/10' 
                    : 'bg-primary/10'
              }`}
              initial={{ scale: 0.8 }}
              animate={{ 
                scale: 1,
                rotate: error ? [0, -5, 5, -5, 5, -3, 3, 0] : 0,
                x: error ? [0, -8, 8, -8, 8, -4, 4, 0] : 0
              }}
              transition={{ 
                scale: { duration: 0.3, delay: 0.2 },
                rotate: { duration: 0.5 },
                x: { duration: 0.5 }
              }}
            >
              {isWhatsAppAuth ? (
                <MessageCircle className={`w-12 h-12 transition-colors duration-300 ${error ? 'text-destructive' : 'text-emerald-500'}`} />
              ) : (
                <MessageSquare className={`w-12 h-12 transition-colors duration-300 ${error ? 'text-destructive' : 'text-primary'}`} />
              )}
            </motion.div>
            <h1 className="text-2xl font-bold">
              {isWhatsAppAuth 
                ? (t("auth.code.titleWhatsApp") || "Enter WhatsApp code")
                : (t("auth.code.title") || "Enter verification code")
              }
            </h1>
            <p className="text-muted-foreground mt-2">
              {isWhatsAppAuth 
                ? (t("auth.code.sentToWhatsApp") || "Code sent via WhatsApp to")
                : (t("auth.code.sentTo") || "Code sent to")
              } {formatPhoneDisplay(phoneNumber)}
            </p>
            {isWhatsAppAuth && (
              <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-3 font-medium">
                {t("auth.code.whatsappRegionNotice") || "In your region, authorization works only through WhatsApp"}
              </p>
            )}
          </motion.div>

          {/* Code Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-6"
          >
            <OtpInput
              value={code}
              onChange={handleCodeChange}
              disabled={isLoading}
              error={!!error}
              autoFocus
            />
            
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-sm text-center"
              >
                {error}
              </motion.p>
            )}
            
            {/* Resend button */}
            <div className="text-center">
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
                className="text-primary font-medium disabled:text-muted-foreground disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {isResending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {resendCooldown > 0 
                  ? `${t("auth.code.resendIn") || "Resend in"} ${resendCooldown}s`
                  : t("auth.code.resend") || "Resend code"
                }
              </button>
            </div>
          </motion.div>

          {/* Support Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-8"
          >
            <button 
              onClick={() => navigate("/chat")}
              className="text-primary font-medium flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              {t("auth.phone.support")}
            </button>
          </motion.div>

          <PoweredByFooter />
        </div>

        {/* Verify Button */}
        <div className="karta-footer-actions">
          <button
            onClick={() => handleVerify()}
            disabled={code.length < 6 || isLoading}
            className="karta-btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t("common.loading") || "Loading..."}
              </>
            ) : (
              t("auth.code.verify") || "Verify"
            )}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default CodeEntry;
