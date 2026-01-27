/**
 * ResetPasswordCode — экран ввода кода для сброса пароля
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
import { verifyResetCode, forgotPassword, getUserEmail, forgotPasswordEmail } from "@/services/api/authApi";
import { z } from "zod";

// Validation schema
const codeSchema = z.string()
  .length(6, "Code must be 6 digits")
  .regex(/^\d+$/, "Only digits allowed");

const RESEND_COOLDOWN = 60; // seconds

const ResetPasswordCode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  // Get phone number from navigation state
  const locationState = location.state as { phoneNumber?: string } | null;
  const phoneNumber = locationState?.phoneNumber || "";
  
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  
  // Email recovery state
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const verifyingRef = useRef(false);
  
  // Redirect if no phone number
  useEffect(() => {
    if (!phoneNumber) {
      navigate("/auth/phone", { replace: true });
    }
  }, [phoneNumber, navigate]);
  
  // Fetch user email on mount
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const response = await getUserEmail();
        if (response.data?.email) {
          setUserEmail(response.data.email);
        }
      } catch {
        // Email not available, ignore
      }
    };
    fetchEmail();
  }, []);
  
  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);
  
  // Handle input change
  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError("");
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all digits entered
    const fullCode = newCode.join("");
    if (fullCode.length === 6 && !isLoading) {
      handleVerify(fullCode);
    }
  };
  
  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    
    if (pastedData.length > 0) {
      const newCode = [...code];
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);
      
      // Focus last filled or next empty input
      const focusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[focusIndex]?.focus();
      
      // Auto-submit if complete
      if (pastedData.length === 6) {
        handleVerify(pastedData);
      }
    }
  };
  
  // Verify code
  const handleVerify = async (codeStr?: string) => {
    // Prevent double-submit
    if (isLoading || verifyingRef.current) return;
    verifyingRef.current = true;

    const fullCode = codeStr || code.join("");
    
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
      const response = await verifyResetCode(phoneNumber, fullCode);
      
      if (response.error) {
        setError(response.error.message || t("auth.resetPassword.wrongCode") || "Wrong code");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }
      
      if (response.data?.is_valid) {
        toast.success(t("auth.resetPassword.codeVerified") || "Code verified!");
        
        // Navigate to set new password
        navigate("/auth/reset-password", { 
          replace: true,
          state: { 
            phoneNumber, 
            resetCode: fullCode,
            resetToken: response.data.token
          }
        });
      } else {
        const errorMessage = response.data?.error || t("auth.resetPassword.wrongCode") || "Wrong code";
        setError(errorMessage);
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
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
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      toast.error(t("auth.resetPassword.resendError") || "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };
  
  // Send reset link to email
  const handleSendToEmail = async () => {
    if (isSendingEmail || emailSent) return;
    
    setIsSendingEmail(true);
    
    try {
      const response = await forgotPasswordEmail();
      
      if (response.error) {
        toast.error(response.error.message || t("editProfile.changePassword.emailError") || "Failed to send email");
      } else {
        setEmailSent(true);
        toast.success(t("editProfile.changePassword.emailSent") || "Reset link sent to email!");
      }
    } catch {
      toast.error(t("editProfile.changePassword.emailError") || "Failed to send email");
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
              <KeyRound className={`w-12 h-12 transition-colors duration-300 ${error ? 'text-destructive' : 'text-emerald-500'}`} />
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
            <div className="flex justify-center gap-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={isLoading}
                  className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-background transition-all duration-200 outline-none ${
                    error
                      ? 'border-destructive text-destructive'
                      : digit
                        ? 'border-emerald-500'
                        : 'border-border focus:border-emerald-500'
                  } disabled:opacity-50`}
                  autoFocus={index === 0}
                />
              ))}
            </div>
            
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
              {userEmail && (
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
                    ? t("editProfile.changePassword.emailSent") || "Email sent!"
                    : `${t("editProfile.changePassword.sendToEmail") || "Send to"} ${userEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')}`
                  }
                </motion.button>
              )}
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
            disabled={code.join("").length < 6 || isLoading}
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
