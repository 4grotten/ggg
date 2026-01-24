/**
 * CodeEntry — экран ввода кода подтверждения
 * WhatsApp OTP: POST /otp/verify/ + /otp/resend/
 * For new users: collects username/password before verification
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { MessageSquare, HelpCircle, Loader2, RefreshCw, MessageCircle, User, Lock, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { verifyCode as verifySmsCode, resendCode as resendSmsCode, getCurrentUser } from "@/services/api/authApi";
import { verifyOtp, resendOtp, parseAttemptsRemaining, sendOtp } from "@/services/api/otpApi";
import { setAuthToken } from "@/services/api/apiClient";
import { z } from "zod";

// Validation schemas
const codeSchema = z.string()
  .length(6, "Code must be 6 digits")
  .regex(/^\d+$/, "Only digits allowed");

const usernameSchema = z.string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed");

const passwordSchema = z.string()
  .min(6, "Password must be at least 6 characters");

const RESEND_COOLDOWN = 60; // seconds

interface LocationState {
  phoneNumber?: string;
  authType?: 'sms' | 'whatsapp';
  otpId?: string;
  expiresAt?: string;
  username?: string;   // For registration (from old flow)
  password?: string;   // For registration (from old flow)
  isNewUser?: boolean; // Flag for new user registration
}

const CodeEntry = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  // Get phone number and auth type from navigation state
  const locationState = location.state as LocationState | null;
  const phoneNumber = locationState?.phoneNumber || "";
  const authType = locationState?.authType || 'whatsapp';
  const registrationUsername = locationState?.username;
  const registrationPassword = locationState?.password;
  const isNewUserFromState = locationState?.isNewUser || false;
  
  // Check if it's WhatsApp auth
  const isWhatsAppAuth = authType === 'whatsapp';
  
  // Registration step for new users: 'code' | 'credentials'
  const [registrationStep, setRegistrationStep] = useState<'code' | 'credentials'>(
    isNewUserFromState && !registrationUsername ? 'code' : 'code'
  );
  
  // Code entry state
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [showSendNewCode, setShowSendNewCode] = useState(false);
  
  // Registration credentials state (for new users)
  const [username, setUsername] = useState(registrationUsername || "");
  const [password, setPassword] = useState(registrationPassword || "");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  
  // Verified code for submission after credentials entry
  const [verifiedCode, setVerifiedCode] = useState("");
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
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
  
  // Handle input change
  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError("");
    setAttemptsRemaining(null);
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all digits entered
    const fullCode = newCode.join("");
    if (fullCode.length === 6) {
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
    const fullCode = codeStr || code.join("");
    
    // Validate
    const validation = codeSchema.safeParse(fullCode);
    if (!validation.success) {
      setError(t("auth.code.invalidCode") || "Invalid code");
      return;
    }
    
    setIsLoading(true);
    setError("");
    setShowSendNewCode(false);
    
    try {
      if (isWhatsAppAuth) {
        // For new users without credentials, we need to collect them first
        const hasCredentials = (username && password) || (registrationUsername && registrationPassword);
        
        if (isNewUserFromState && !hasCredentials) {
          // New user without credentials — save code and show credentials form
          setVerifiedCode(fullCode);
          setRegistrationStep('credentials');
          setIsLoading(false);
          return;
        }
        
        // WhatsApp OTP verification — pass credentials if available
        const usernameToSend = username || registrationUsername;
        const passwordToSend = password || registrationPassword;
        const response = await verifyOtp(phoneNumber, fullCode, usernameToSend, passwordToSend);
        
        // Handle username taken error (status 400)
        if (response.error?.status === 400 && response.error.message.includes("Username")) {
          setUsernameError(response.error.message);
          setRegistrationStep('credentials');
          setVerifiedCode(fullCode);
          setIsLoading(false);
          return;
        }
        
        // Handle "username and password required" error
        if (response.error?.status === 400 && response.error.message.includes("required for registration")) {
          setVerifiedCode(fullCode);
          setRegistrationStep('credentials');
          setIsLoading(false);
          return;
        }
        
        if (response.error || !response.data?.is_valid) {
          const errorMsg = response.error?.message || response.data?.error || t("auth.code.wrongCode");
          
          // Parse attempts remaining
          const attempts = parseAttemptsRemaining(errorMsg);
          if (attempts !== null) {
            setAttemptsRemaining(attempts);
          }
          
          // Check for terminal errors
          if (errorMsg.includes("Max attempts exceeded") || errorMsg.includes("OTP expired") || errorMsg.includes("No active OTP")) {
            setShowSendNewCode(true);
            setError(t(`auth.code.${errorMsg.includes("expired") ? "otpExpired" : errorMsg.includes("Max") ? "maxAttempts" : "noActiveOtp"}`) || errorMsg);
          } else {
            setError(errorMsg);
          }
          
          setCode(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
          return;
        }
        
        // WhatsApp OTP verified successfully — token is in response
        if (response.data?.is_valid && response.data.token) {
          setAuthToken(response.data.token);
          toast.success(t("auth.code.success") || "Code verified!");
          
          if (response.data.is_new_user) {
            // New user — go to profile setup
            navigate("/auth/profile", { 
              replace: true,
              state: { phoneNumber, isNewUser: true }
            });
          } else {
            // Existing user — fetch profile and go to home
            await getCurrentUser();
            navigate("/", { replace: true });
          }
        } else {
          // Fallback: is_valid but no token (shouldn't happen)
          toast.error(t("auth.code.error") || "Verification failed");
        }
      } else {
        // SMS verification (Kyrgyzstan)
        const response = await verifySmsCode(phoneNumber, parseInt(fullCode, 10));
        
        if (response.error) {
          setError(response.error.message || t("auth.code.wrongCode"));
          setCode(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
          return;
        }
        
        if (response.data) {
          toast.success(t("auth.code.success") || "Code verified!");
          
          if (response.data.is_new_user) {
            navigate("/auth/profile", { 
              replace: true,
              state: { phoneNumber, isNewUser: true }
            });
          } else {
            navigate("/", { replace: true });
          }
        }
      }
    } catch {
      setError(t("auth.code.error") || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Resend code
  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    
    setIsResending(true);
    setError("");
    setShowSendNewCode(false);
    setAttemptsRemaining(null);
    
    try {
      if (isWhatsAppAuth) {
        // WhatsApp OTP resend
        const response = await resendOtp(phoneNumber);
        
        if (response.error) {
          if (response.error.secondsRemaining) {
            // Cooldown active
            setResendCooldown(response.error.secondsRemaining);
            toast.error(t("auth.code.cooldownActive") || `Please wait ${response.error.secondsRemaining} seconds`);
          } else {
            toast.error(response.error.message || t("auth.code.resendError"));
          }
        } else {
          toast.success(t("auth.code.resendSuccess") || "Code sent!");
          setResendCooldown(RESEND_COOLDOWN);
          setCode(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
        }
      } else {
        // SMS resend (Kyrgyzstan)
        const response = await resendSmsCode(phoneNumber, 'register_auth_type');
        
        if (response.error) {
          toast.error(response.error.message || t("auth.code.resendError"));
        } else {
          toast.success(t("auth.code.resendSuccess") || "Code sent!");
          setResendCooldown(RESEND_COOLDOWN);
          setCode(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
        }
      }
    } catch {
      toast.error(t("auth.code.resendError") || "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };
  
  // Send new code (after expiry or max attempts)
  const handleSendNewCode = async () => {
    setIsResending(true);
    setError("");
    setShowSendNewCode(false);
    setAttemptsRemaining(null);
    
    try {
      if (isWhatsAppAuth) {
        const response = await sendOtp(phoneNumber);
        
        if (response.error) {
          if (response.error.status === 429) {
            toast.error(t("auth.phone.rateLimitError") || "Too many requests. Please wait.");
          } else {
            toast.error(response.error.message || t("auth.code.resendError"));
          }
        } else if (response.data?.sent) {
          toast.success(t("auth.code.newCodeSent") || "New code sent!");
          setResendCooldown(RESEND_COOLDOWN);
          setCode(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
        }
      } else {
        // For SMS, just resend
        await handleResend();
      }
    } catch {
      toast.error(t("auth.code.resendError") || "Failed to send code");
    } finally {
      setIsResending(false);
    }
  };
  
  // Format phone for display
  const formatPhoneDisplay = (phone: string) => {
    return phone;
  };
  
  // Validate and submit credentials for registration
  const validateCredentials = (): boolean => {
    let isValid = true;
    
    const usernameResult = usernameSchema.safeParse(username);
    if (!usernameResult.success) {
      setUsernameError(t("auth.register.usernameInvalid") || usernameResult.error.errors[0].message);
      isValid = false;
    } else {
      setUsernameError("");
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      setPasswordError(t("auth.register.passwordTooShort") || passwordResult.error.errors[0].message);
      isValid = false;
    } else {
      setPasswordError("");
    }
    
    if (password !== confirmPassword) {
      setConfirmPasswordError(t("auth.register.passwordsMismatch") || "Passwords don't match");
      isValid = false;
    } else {
      setConfirmPasswordError("");
    }
    
    return isValid;
  };
  
  const handleSubmitCredentials = async () => {
    if (!validateCredentials()) return;
    
    setIsLoading(true);
    
    try {
      // Submit with the verified code and credentials
      const response = await verifyOtp(phoneNumber, verifiedCode, username, password);
      
      if (response.error?.status === 400 && response.error.message.includes("Username")) {
        setUsernameError(response.error.message);
        setIsLoading(false);
        return;
      }
      
      if (response.error || !response.data?.is_valid) {
        const errorMsg = response.error?.message || response.data?.error || t("auth.code.error");
        toast.error(errorMsg);
        // Code might have expired, go back to code entry
        if (errorMsg.includes("expired") || errorMsg.includes("No active OTP")) {
          setRegistrationStep('code');
          setShowSendNewCode(true);
        }
        setIsLoading(false);
        return;
      }
      
      if (response.data?.is_valid && response.data.token) {
        setAuthToken(response.data.token);
        toast.success(t("auth.code.success") || "Account created!");
        
        navigate("/auth/profile", { 
          replace: true,
          state: { phoneNumber, isNewUser: true }
        });
      }
    } catch {
      toast.error(t("auth.register.error") || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };
  
  const isCredentialsValid = username.length >= 3 && password.length >= 6 && confirmPassword.length >= 6;
  const hasCredentialsError = !!(usernameError || passwordError || confirmPasswordError);

  // Credentials form for new users
  if (registrationStep === 'credentials') {
    return (
      <MobileLayout
        showBackButton
        onBack={() => setRegistrationStep('code')}
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
                  hasCredentialsError 
                    ? 'bg-destructive/10 ring-2 ring-destructive' 
                    : 'bg-primary/10'
                }`}
                initial={{ scale: 0.8 }}
                animate={{ 
                  scale: 1,
                  rotate: hasCredentialsError ? [0, -5, 5, -5, 5, -3, 3, 0] : 0,
                  x: hasCredentialsError ? [0, -8, 8, -8, 8, -4, 4, 0] : 0
                }}
                transition={{ 
                  scale: { duration: 0.3, delay: 0.2 },
                  rotate: { duration: 0.5 },
                  x: { duration: 0.5 }
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={hasCredentialsError ? 'error' : 'normal'}
                    initial={{ y: 30, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -30, opacity: 0, scale: 0.8 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 20 
                    }}
                  >
                    <User className={`w-12 h-12 transition-colors duration-300 ${hasCredentialsError ? 'text-destructive' : 'text-primary'}`} />
                  </motion.div>
                </AnimatePresence>
              </motion.div>
              <h1 className="text-2xl font-bold">
                {t("auth.register.title") || "Create Account"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {phoneNumber}
              </p>
            </motion.div>

            {/* Credentials Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="space-y-6"
            >
              {/* Username */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t("auth.register.username") || "Username"}
                </label>
                <div className={`flex items-center gap-2 border-b pb-4 transition-colors duration-300 ${
                  usernameError ? 'border-destructive' : 'border-border'
                }`}>
                  <User className={`w-5 h-5 ${usernameError ? 'text-destructive' : 'text-muted-foreground'}`} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value.toLowerCase());
                      setUsernameError("");
                    }}
                    placeholder={t("auth.register.usernamePlaceholder") || "Enter username"}
                    className="flex-1 text-lg bg-transparent border-none outline-none placeholder:text-muted-foreground"
                    autoComplete="username"
                    autoFocus
                  />
                </div>
                {usernameError && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-destructive text-sm"
                  >
                    {usernameError}
                  </motion.p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t("auth.register.usernameHint") || "Letters, numbers, and underscores only"}
                </p>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t("auth.register.password") || "Password"}
                </label>
                <div className={`flex items-center gap-2 border-b pb-4 transition-colors duration-300 ${
                  passwordError ? 'border-destructive' : 'border-border'
                }`}>
                  <Lock className={`w-5 h-5 ${passwordError ? 'text-destructive' : 'text-muted-foreground'}`} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder={t("auth.register.passwordPlaceholder") || "Enter password"}
                    className="flex-1 text-lg bg-transparent border-none outline-none placeholder:text-muted-foreground"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordError && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-destructive text-sm"
                  >
                    {passwordError}
                  </motion.p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t("auth.register.confirmPassword") || "Confirm Password"}
                </label>
                <div className={`flex items-center gap-2 border-b pb-4 transition-colors duration-300 ${
                  confirmPasswordError ? 'border-destructive' : 'border-border'
                }`}>
                  <Lock className={`w-5 h-5 ${confirmPasswordError ? 'text-destructive' : 'text-muted-foreground'}`} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setConfirmPasswordError("");
                    }}
                    placeholder={t("auth.register.confirmPasswordPlaceholder") || "Confirm password"}
                    className="flex-1 text-lg bg-transparent border-none outline-none placeholder:text-muted-foreground"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPasswordError && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-destructive text-sm"
                  >
                    {confirmPasswordError}
                  </motion.p>
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

          {/* Submit Button */}
          <div className="karta-footer-actions">
            <button
              onClick={handleSubmitCredentials}
              disabled={!isCredentialsValid || isLoading}
              className="karta-btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("common.loading") || "Loading..."}
                </>
              ) : (
                t("auth.register.createAccount") || "Create Account"
              )}
            </button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  // Code entry view
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
                        ? 'border-primary'
                        : 'border-border focus:border-primary'
                  } disabled:opacity-50`}
                  autoFocus={index === 0}
                />
              ))}
            </div>
            
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <p className="text-destructive text-sm">{error}</p>
                {attemptsRemaining !== null && (
                  <p className="text-muted-foreground text-xs mt-1">
                    {t("auth.code.attemptsRemaining", { count: attemptsRemaining }) || `${attemptsRemaining} attempts remaining`}
                  </p>
                )}
              </motion.div>
            )}
            
            {/* Resend / Send New Code button */}
            <div className="text-center">
              {showSendNewCode ? (
                <button
                  onClick={handleSendNewCode}
                  disabled={isResending}
                  className="text-primary font-medium flex items-center gap-2 mx-auto"
                >
                  {isResending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {t("auth.code.sendNewCode") || "Send new code"}
                </button>
              ) : (
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
              t("auth.code.verify") || "Verify"
            )}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default CodeEntry;
