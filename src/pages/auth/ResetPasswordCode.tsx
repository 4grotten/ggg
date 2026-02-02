/**
 * ResetPasswordCode — экран ввода кода для сброса пароля
 * Использует единый input для iOS autofill + визуальные 6 ячеек
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { KeyRound, HelpCircle, Loader2, RefreshCw, MessageCircle, Mail, Check } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { verifyCode, forgotPassword, resendCode } from "@/services/api/authApi";
import { z } from "zod";
import { OtpInput } from "@/components/ui/otp-input";
import { PasswordLockAnimation } from "@/components/auth/PasswordLockAnimation";

// Validation schema
const codeSchema = z.string()
  .length(6, "Code must be 6 digits")
  .regex(/^\d+$/, "Only digits allowed");

const RESEND_COOLDOWN = 60; // seconds

const ResetPasswordCode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  // Get phone number and email status from navigation state
  const locationState = location.state as { phoneNumber?: string; hasEmail?: boolean } | null;
  const phoneNumber = locationState?.phoneNumber || "";
  const hasEmail = locationState?.hasEmail || false;
  
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  
  // Email recovery state
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const verifyingRef = useRef(false);
  
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
    if (value.length === 6 && !isLoading) {
      handleVerify(value);
    }
  };
  
  // Verify code
  const handleVerify = async (codeStr?: string) => {
    // Prevent double-submit
    if (isLoading || verifyingRef.current) return;
    verifyingRef.current = true;

    const fullCode = codeStr || code;
    
    // Validate
    const validation = codeSchema.safeParse(fullCode);
    if (!validation.success) {
      setError(t("auth.resetPassword.invalidCode") || "Invalid code");
      verifyingRef.current = false;
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      // Use verifyCode() - it saves the token automatically
      const response = await verifyCode(phoneNumber, parseInt(fullCode, 10));
      
      if (response.error) {
        setError(response.error.message || t("auth.resetPassword.wrongCode") || "Wrong code");
        setCode("");
        return;
      }
      
      if (response.data?.token) {
        toast.success(t("auth.resetPassword.codeVerified") || "Code verified!");
        
        // Navigate to set new password - token is already saved in apiClient
        navigate("/auth/reset-password", { 
          replace: true,
          state: { phoneNumber }
        });
      } else {
        setError(t("auth.resetPassword.wrongCode") || "Wrong code");
        setCode("");
      }
    } catch {
      setError(t("auth.resetPassword.error") || "Verification failed");
    } finally {
      setIsLoading(false);
      verifyingRef.current = false;
    }
  };
  
  // Resend code
  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    
    setIsResending(true);
    
    try {
      const response = await forgotPassword(phoneNumber);
      
      if (response.error) {
        toast.error(response.error.message || t("auth.resetPassword.resendError") || "Failed to resend");
      } else {
        toast.success(t("auth.resetPassword.resendSuccess") || "Code sent via WhatsApp!");
        setResendCooldown(RESEND_COOLDOWN);
        setCode("");
      }
    } catch {
      toast.error(t("auth.resetPassword.resendError") || "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };
  
  // Send reset code to email
  const handleSendToEmail = async () => {
    if (isSendingEmail || emailSent) return;
    
    setIsSendingEmail(true);
    
    try {
      const response = await resendCode(phoneNumber, 'email_auth_type');
      
      if (response.error) {
        toast.error(response.error.message || t("auth.resetPassword.emailError") || "Failed to send email");
      } else {
        setEmailSent(true);
        toast.success(t("auth.resetPassword.emailSent") || "Code sent to email!");
      }
    } catch {
      toast.error(t("auth.resetPassword.emailError") || "Failed to send email");
    } finally {
      setIsSendingEmail(false);
    }
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
                  : 'bg-emerald-500/10'
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
              <PasswordLockAnimation />
            </motion.div>
            <h1 className="text-2xl font-bold">
              {t("auth.resetPassword.codeTitle") || "Enter reset code"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t("auth.resetPassword.codeSentTo") || "Code sent via WhatsApp to"} {phoneNumber}
            </p>
            <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-3 font-medium flex items-center justify-center gap-1">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </p>
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
            <div className="text-center space-y-3">
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
                className="text-emerald-600 dark:text-emerald-400 font-medium disabled:text-muted-foreground disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
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
              
              {/* Send to email option */}
              {hasEmail && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleSendToEmail}
                  disabled={isSendingEmail || emailSent}
                  className="text-primary font-medium disabled:text-muted-foreground disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {isSendingEmail ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : emailSent ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  {emailSent 
                    ? t("auth.resetPassword.emailSent") || "Code sent!"
                    : t("auth.resetPassword.sendToEmail") || "Send code to email"
                  }
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Test: Change password without OTP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="mt-6"
          >
            <button 
              onClick={() => navigate("/auth/reset-password", { 
                replace: true,
                state: { phoneNumber, skipOtp: true }
              })}
              className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              {t("auth.resetPassword.changeWithoutOtp") || "Change password without OTP (test)"}
            </button>
          </motion.div>

          {/* Support Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-4"
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
              t("auth.resetPassword.verify") || "Verify"
            )}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default ResetPasswordCode;
