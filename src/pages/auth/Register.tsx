/**
 * Register — экран регистрации нового пользователя
 * Показывает форму для ввода username и пароля перед отправкой OTP
 */

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { User, Lock, Eye, EyeOff, Loader2, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { sendOtp } from "@/services/api/otpApi";
import { z } from "zod";

interface LocationState {
  phoneNumber?: string;
  usernameError?: string;
}

// Validation schemas
const usernameSchema = z.string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed");

const passwordSchema = z.string()
  .min(6, "Password must be at least 6 characters");

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  // Get data from navigation state
  const locationState = location.state as LocationState | null;
  const phoneNumber = locationState?.phoneNumber || "";
  const initialUsernameError = locationState?.usernameError || "";
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [usernameError, setUsernameError] = useState(initialUsernameError);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  
  // Redirect if no phone number
  useEffect(() => {
    if (!phoneNumber) {
      navigate("/auth/phone", { replace: true });
    }
  }, [phoneNumber, navigate]);
  
  // Clear username error from navigation state after showing
  useEffect(() => {
    if (initialUsernameError) {
      setUsernameError(initialUsernameError);
    }
  }, [initialUsernameError]);
  
  const validateForm = (): boolean => {
    let isValid = true;
    
    // Validate username
    const usernameResult = usernameSchema.safeParse(username);
    if (!usernameResult.success) {
      setUsernameError(t("auth.register.usernameInvalid") || usernameResult.error.errors[0].message);
      isValid = false;
    } else {
      setUsernameError("");
    }
    
    // Validate password
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      setPasswordError(t("auth.register.passwordTooShort") || passwordResult.error.errors[0].message);
      isValid = false;
    } else {
      setPasswordError("");
    }
    
    // Validate confirm password
    if (password !== confirmPassword) {
      setConfirmPasswordError(t("auth.register.passwordsMismatch") || "Passwords don't match");
      isValid = false;
    } else {
      setConfirmPasswordError("");
    }
    
    return isValid;
  };
  
  const handleContinue = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Send OTP first
      const otpResponse = await sendOtp(phoneNumber);
      
      if (otpResponse.error) {
        const errorMsg = otpResponse.error.status === 429
          ? (t("auth.phone.rateLimitError") || "Too many requests. Please wait.")
          : otpResponse.error.status === 503
            ? (t("auth.phone.serviceUnavailable") || "Service temporarily unavailable")
            : (t("auth.phone.otpSendError") || "Failed to send code. You can retry on the next screen.");
        
        toast.warning(errorMsg);
      } else if (otpResponse.data?.sent) {
        toast.success(t("auth.phone.whatsappCodeSent") || "Code sent via WhatsApp!");
      }
      
      // Navigate to code entry with registration data
      navigate("/auth/code", {
        state: {
          phoneNumber,
          authType: 'whatsapp',
          username,
          password,
          otpId: otpResponse.data?.otp_id,
          expiresAt: otpResponse.data?.expires_at
        }
      });
    } catch {
      toast.error(t("auth.register.error") || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };
  
  const isFormValid = username.length >= 3 && password.length >= 6 && confirmPassword.length >= 6;

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
              className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <User className="w-12 h-12 text-primary" />
            </motion.div>
            <h1 className="text-2xl font-bold">
              {t("auth.register.title") || "Create Account"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {phoneNumber}
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("auth.register.username") || "Username"}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase());
                    setUsernameError("");
                  }}
                  placeholder={t("auth.register.usernamePlaceholder") || "Enter username"}
                  className={`pl-10 h-12 ${usernameError ? 'border-destructive' : ''}`}
                  autoComplete="username"
                />
              </div>
              {usernameError && (
                <p className="text-sm text-destructive">{usernameError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("auth.register.usernameHint") || "Letters, numbers, and underscores only"}
              </p>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("auth.register.password") || "Password"}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                  placeholder={t("auth.register.passwordPlaceholder") || "Enter password"}
                  className={`pl-10 pr-10 h-12 ${passwordError ? 'border-destructive' : ''}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("auth.register.confirmPassword") || "Confirm Password"}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmPasswordError("");
                  }}
                  placeholder={t("auth.register.confirmPasswordPlaceholder") || "Confirm password"}
                  className={`pl-10 pr-10 h-12 ${confirmPasswordError ? 'border-destructive' : ''}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="text-sm text-destructive">{confirmPasswordError}</p>
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

        {/* Continue Button */}
        <div className="karta-footer-actions">
          <button
            onClick={handleContinue}
            disabled={!isFormValid || isLoading}
            className="karta-btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t("common.loading") || "Loading..."}
              </>
            ) : (
              t("common.continue") || "Continue"
            )}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Register;
