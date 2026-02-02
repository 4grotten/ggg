/**
 * ResetPassword — экран установки нового пароля
 * Использует setPassword() с токеном, полученным после verifyCode()
 * Использует PasswordMatchInput для визуальной обратной связи при вводе
 */

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { HelpCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { setPassword, getCurrentUser } from "@/services/api/authApi";
import { z } from "zod";
import { PasswordMatchInput } from "@/components/settings/PasswordMatchInput";
import { PasswordLockAnimation } from "@/components/auth/PasswordLockAnimation";

// Validation schema
const passwordSchema = z.string()
  .min(6, "Password must be at least 6 characters");

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  // Get phone number from navigation state (token is already saved in apiClient)
  const locationState = location.state as { phoneNumber?: string } | null;
  const phoneNumber = locationState?.phoneNumber || "";
  
  const [password, setPasswordValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Redirect if no phone number (means user didn't go through the flow)
  useEffect(() => {
    if (!phoneNumber) {
      navigate("/auth/phone", { replace: true });
    }
  }, [phoneNumber, navigate]);
  
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const isPasswordValid = password.length >= 6;
  
  const handleSubmit = async () => {
    // Validate password
    const validation = passwordSchema.safeParse(password);
    if (!validation.success) {
      setError(t("auth.resetPassword.passwordTooShort") || "Password must be at least 6 characters");
      return;
    }
    
    if (!passwordsMatch) {
      setError(t("auth.resetPassword.passwordMismatch") || "Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      // Use setPassword() - token is already saved from verifyCode()
      const response = await setPassword(password);
      
      if (response.error) {
        setError(response.error.message || t("auth.resetPassword.setError") || "Failed to set password");
        return;
      }
      
      toast.success(t("auth.resetPassword.success") || "Password changed successfully!");
      
      // Fetch user profile since we're now authorized
      await getCurrentUser();
      
      // Navigate to dashboard - user is already authorized
      navigate("/", { replace: true });
    } catch {
      setError(t("auth.resetPassword.setError") || "Failed to set password");
    } finally {
      setIsLoading(false);
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
              className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <PasswordLockAnimation />
            </motion.div>
            <h1 className="text-2xl font-bold">
              {t("auth.resetPassword.newPasswordTitle") || "Set new password"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t("auth.resetPassword.newPasswordDescription") || "Create a new password for your account"}
            </p>
          </motion.div>

          {/* Password Inputs with character matching */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <PasswordMatchInput
              password={password}
              confirmPassword={confirmPassword}
              onPasswordChange={(value) => {
                setPasswordValue(value);
                setError("");
              }}
              onConfirmPasswordChange={(value) => {
                setConfirmPassword(value);
                setError("");
              }}
              passwordLabel={t("auth.resetPassword.newPassword") || "New password"}
              confirmLabel={t("auth.resetPassword.confirmPassword") || "Confirm password"}
              passwordPlaceholder={t("auth.resetPassword.newPasswordPlaceholder") || "Enter new password"}
              confirmPlaceholder={t("auth.resetPassword.confirmPasswordPlaceholder") || "Repeat password"}
              minCharsHint={t("auth.resetPassword.passwordTooShort") || "Minimum 6 characters"}
            />
            
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-sm mt-4"
              >
                {error}
              </motion.p>
            )}
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

        {/* Submit Button */}
        <div className="karta-footer-actions">
          <button
            onClick={handleSubmit}
            disabled={!isPasswordValid || !passwordsMatch || isLoading}
            className="karta-btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t("common.loading") || "Loading..."}
              </>
            ) : (
              t("auth.resetPassword.setPassword") || "Set new password"
            )}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default ResetPassword;
