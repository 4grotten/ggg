import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ChevronDown, Phone, HelpCircle, MessageSquare, KeyRound, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { login as apiLogin, forgotPassword, registerAuth, getCurrentUser } from "@/services/api/authApi";
import { setAuthToken, AUTH_USER_KEY } from "@/services/api/apiClient";
import { sendOtp } from "@/services/api/otpApi";
import { z } from "zod";

interface Country {
  code: string;
  dialCode: string;
  flag: string;
  name: string;
}

const countries: Country[] = [
  { code: "AE", dialCode: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "AF", dialCode: "+93", flag: "🇦🇫", name: "Afghanistan" },
  { code: "AL", dialCode: "+355", flag: "🇦🇱", name: "Albania" },
  { code: "DZ", dialCode: "+213", flag: "🇩🇿", name: "Algeria" },
  { code: "AD", dialCode: "+376", flag: "🇦🇩", name: "Andorra" },
  { code: "AO", dialCode: "+244", flag: "🇦🇴", name: "Angola" },
  { code: "AR", dialCode: "+54", flag: "🇦🇷", name: "Argentina" },
  { code: "AM", dialCode: "+374", flag: "🇦🇲", name: "Armenia" },
  { code: "AU", dialCode: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "AT", dialCode: "+43", flag: "🇦🇹", name: "Austria" },
  { code: "AZ", dialCode: "+994", flag: "🇦🇿", name: "Azerbaijan" },
  { code: "BH", dialCode: "+973", flag: "🇧🇭", name: "Bahrain" },
  { code: "BD", dialCode: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "BY", dialCode: "+375", flag: "🇧🇾", name: "Belarus" },
  { code: "BE", dialCode: "+32", flag: "🇧🇪", name: "Belgium" },
  { code: "BZ", dialCode: "+501", flag: "🇧🇿", name: "Belize" },
  { code: "BJ", dialCode: "+229", flag: "🇧🇯", name: "Benin" },
  { code: "BT", dialCode: "+975", flag: "🇧🇹", name: "Bhutan" },
  { code: "BO", dialCode: "+591", flag: "🇧🇴", name: "Bolivia" },
  { code: "BA", dialCode: "+387", flag: "🇧🇦", name: "Bosnia" },
  { code: "BW", dialCode: "+267", flag: "🇧🇼", name: "Botswana" },
  { code: "BR", dialCode: "+55", flag: "🇧🇷", name: "Brazil" },
  { code: "BN", dialCode: "+673", flag: "🇧🇳", name: "Brunei" },
  { code: "BG", dialCode: "+359", flag: "🇧🇬", name: "Bulgaria" },
  { code: "KH", dialCode: "+855", flag: "🇰🇭", name: "Cambodia" },
  { code: "CM", dialCode: "+237", flag: "🇨🇲", name: "Cameroon" },
  { code: "CA", dialCode: "+1", flag: "🇨🇦", name: "Canada" },
  { code: "CL", dialCode: "+56", flag: "🇨🇱", name: "Chile" },
  { code: "CN", dialCode: "+86", flag: "🇨🇳", name: "China" },
  { code: "CO", dialCode: "+57", flag: "🇨🇴", name: "Colombia" },
  { code: "CR", dialCode: "+506", flag: "🇨🇷", name: "Costa Rica" },
  { code: "HR", dialCode: "+385", flag: "🇭🇷", name: "Croatia" },
  { code: "CU", dialCode: "+53", flag: "🇨🇺", name: "Cuba" },
  { code: "CY", dialCode: "+357", flag: "🇨🇾", name: "Cyprus" },
  { code: "CZ", dialCode: "+420", flag: "🇨🇿", name: "Czech Republic" },
  { code: "DK", dialCode: "+45", flag: "🇩🇰", name: "Denmark" },
  { code: "DO", dialCode: "+1", flag: "🇩🇴", name: "Dominican Republic" },
  { code: "EC", dialCode: "+593", flag: "🇪🇨", name: "Ecuador" },
  { code: "EG", dialCode: "+20", flag: "🇪🇬", name: "Egypt" },
  { code: "SV", dialCode: "+503", flag: "🇸🇻", name: "El Salvador" },
  { code: "EE", dialCode: "+372", flag: "🇪🇪", name: "Estonia" },
  { code: "ET", dialCode: "+251", flag: "🇪🇹", name: "Ethiopia" },
  { code: "FI", dialCode: "+358", flag: "🇫🇮", name: "Finland" },
  { code: "FR", dialCode: "+33", flag: "🇫🇷", name: "France" },
  { code: "GE", dialCode: "+995", flag: "🇬🇪", name: "Georgia" },
  { code: "DE", dialCode: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "GH", dialCode: "+233", flag: "🇬🇭", name: "Ghana" },
  { code: "GR", dialCode: "+30", flag: "🇬🇷", name: "Greece" },
  { code: "GT", dialCode: "+502", flag: "🇬🇹", name: "Guatemala" },
  { code: "HN", dialCode: "+504", flag: "🇭🇳", name: "Honduras" },
  { code: "HK", dialCode: "+852", flag: "🇭🇰", name: "Hong Kong" },
  { code: "HU", dialCode: "+36", flag: "🇭🇺", name: "Hungary" },
  { code: "IS", dialCode: "+354", flag: "🇮🇸", name: "Iceland" },
  { code: "IN", dialCode: "+91", flag: "🇮🇳", name: "India" },
  { code: "ID", dialCode: "+62", flag: "🇮🇩", name: "Indonesia" },
  { code: "IR", dialCode: "+98", flag: "🇮🇷", name: "Iran" },
  { code: "IQ", dialCode: "+964", flag: "🇮🇶", name: "Iraq" },
  { code: "IE", dialCode: "+353", flag: "🇮🇪", name: "Ireland" },
  { code: "IL", dialCode: "+972", flag: "🇮🇱", name: "Israel" },
  { code: "IT", dialCode: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "JM", dialCode: "+1", flag: "🇯🇲", name: "Jamaica" },
  { code: "JP", dialCode: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "JO", dialCode: "+962", flag: "🇯🇴", name: "Jordan" },
  { code: "KZ", dialCode: "+7", flag: "🇰🇿", name: "Kazakhstan" },
  { code: "KE", dialCode: "+254", flag: "🇰🇪", name: "Kenya" },
  { code: "KW", dialCode: "+965", flag: "🇰🇼", name: "Kuwait" },
  { code: "KG", dialCode: "+996", flag: "🇰🇬", name: "Kyrgyzstan" },
  { code: "LA", dialCode: "+856", flag: "🇱🇦", name: "Laos" },
  { code: "LV", dialCode: "+371", flag: "🇱🇻", name: "Latvia" },
  { code: "LB", dialCode: "+961", flag: "🇱🇧", name: "Lebanon" },
  { code: "LY", dialCode: "+218", flag: "🇱🇾", name: "Libya" },
  { code: "LT", dialCode: "+370", flag: "🇱🇹", name: "Lithuania" },
  { code: "LU", dialCode: "+352", flag: "🇱🇺", name: "Luxembourg" },
  { code: "MO", dialCode: "+853", flag: "🇲🇴", name: "Macau" },
  { code: "MY", dialCode: "+60", flag: "🇲🇾", name: "Malaysia" },
  { code: "MV", dialCode: "+960", flag: "🇲🇻", name: "Maldives" },
  { code: "MT", dialCode: "+356", flag: "🇲🇹", name: "Malta" },
  { code: "MX", dialCode: "+52", flag: "🇲🇽", name: "Mexico" },
  { code: "MD", dialCode: "+373", flag: "🇲🇩", name: "Moldova" },
  { code: "MC", dialCode: "+377", flag: "🇲🇨", name: "Monaco" },
  { code: "MN", dialCode: "+976", flag: "🇲🇳", name: "Mongolia" },
  { code: "ME", dialCode: "+382", flag: "🇲🇪", name: "Montenegro" },
  { code: "MA", dialCode: "+212", flag: "🇲🇦", name: "Morocco" },
  { code: "MM", dialCode: "+95", flag: "🇲🇲", name: "Myanmar" },
  { code: "NP", dialCode: "+977", flag: "🇳🇵", name: "Nepal" },
  { code: "NL", dialCode: "+31", flag: "🇳🇱", name: "Netherlands" },
  { code: "NZ", dialCode: "+64", flag: "🇳🇿", name: "New Zealand" },
  { code: "NG", dialCode: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "NO", dialCode: "+47", flag: "🇳🇴", name: "Norway" },
  { code: "OM", dialCode: "+968", flag: "🇴🇲", name: "Oman" },
  { code: "PK", dialCode: "+92", flag: "🇵🇰", name: "Pakistan" },
  { code: "PS", dialCode: "+970", flag: "🇵🇸", name: "Palestine" },
  { code: "PA", dialCode: "+507", flag: "🇵🇦", name: "Panama" },
  { code: "PY", dialCode: "+595", flag: "🇵🇾", name: "Paraguay" },
  { code: "PE", dialCode: "+51", flag: "🇵🇪", name: "Peru" },
  { code: "PH", dialCode: "+63", flag: "🇵🇭", name: "Philippines" },
  { code: "PL", dialCode: "+48", flag: "🇵🇱", name: "Poland" },
  { code: "PT", dialCode: "+351", flag: "🇵🇹", name: "Portugal" },
  { code: "QA", dialCode: "+974", flag: "🇶🇦", name: "Qatar" },
  { code: "RO", dialCode: "+40", flag: "🇷🇴", name: "Romania" },
  { code: "RU", dialCode: "+7", flag: "🇷🇺", name: "Russia" },
  { code: "SA", dialCode: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "SN", dialCode: "+221", flag: "🇸🇳", name: "Senegal" },
  { code: "RS", dialCode: "+381", flag: "🇷🇸", name: "Serbia" },
  { code: "SG", dialCode: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "SK", dialCode: "+421", flag: "🇸🇰", name: "Slovakia" },
  { code: "SI", dialCode: "+386", flag: "🇸🇮", name: "Slovenia" },
  { code: "ZA", dialCode: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "KR", dialCode: "+82", flag: "🇰🇷", name: "South Korea" },
  { code: "ES", dialCode: "+34", flag: "🇪🇸", name: "Spain" },
  { code: "LK", dialCode: "+94", flag: "🇱🇰", name: "Sri Lanka" },
  { code: "SD", dialCode: "+249", flag: "🇸🇩", name: "Sudan" },
  { code: "SE", dialCode: "+46", flag: "🇸🇪", name: "Sweden" },
  { code: "CH", dialCode: "+41", flag: "🇨🇭", name: "Switzerland" },
  { code: "SY", dialCode: "+963", flag: "🇸🇾", name: "Syria" },
  { code: "TW", dialCode: "+886", flag: "🇹🇼", name: "Taiwan" },
  { code: "TJ", dialCode: "+992", flag: "🇹🇯", name: "Tajikistan" },
  { code: "TZ", dialCode: "+255", flag: "🇹🇿", name: "Tanzania" },
  { code: "TH", dialCode: "+66", flag: "🇹🇭", name: "Thailand" },
  { code: "TN", dialCode: "+216", flag: "🇹🇳", name: "Tunisia" },
  { code: "TR", dialCode: "+90", flag: "🇹🇷", name: "Turkey" },
  { code: "TM", dialCode: "+993", flag: "🇹🇲", name: "Turkmenistan" },
  { code: "UA", dialCode: "+380", flag: "🇺🇦", name: "Ukraine" },
  { code: "GB", dialCode: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "US", dialCode: "+1", flag: "🇺🇸", name: "United States" },
  { code: "UY", dialCode: "+598", flag: "🇺🇾", name: "Uruguay" },
  { code: "UZ", dialCode: "+998", flag: "🇺🇿", name: "Uzbekistan" },
  { code: "VE", dialCode: "+58", flag: "🇻🇪", name: "Venezuela" },
  { code: "VN", dialCode: "+84", flag: "🇻🇳", name: "Vietnam" },
  { code: "YE", dialCode: "+967", flag: "🇾🇪", name: "Yemen" },
  { code: "ZM", dialCode: "+260", flag: "🇿🇲", name: "Zambia" },
  { code: "ZW", dialCode: "+263", flag: "🇿🇼", name: "Zimbabwe" },
];

// Detect country by geolocation API
const detectCountryByGeo = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://ipapi.co/json/', { 
      signal: AbortSignal.timeout(3000) 
    });
    const data = await response.json();
    return data.country_code || null;
  } catch {
    return null;
  }
};

// Icon animation sequence: SMS -> OTP -> Phone
const iconSequence = [
  { Icon: MessageSquare, label: "sms" },
  { Icon: KeyRound, label: "otp" },
  { Icon: Phone, label: "phone" },
];

// Validation schema
const phoneSchema = z.string()
  .min(9, "Phone number too short")
  .max(15, "Phone number too long")
  .regex(/^\d+$/, "Only digits allowed");

const passwordSchema = z.string()
  .min(1, "Password is required");

const PhoneEntry = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [dialCode, setDialCode] = useState("+971");
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  // Check if adding new account - reset all state for fresh registration
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const isAddingAccount = searchParams.get('add_account') === 'true';
    
    if (isAddingAccount) {
      // Reset all form state for new registration
      setPhoneNumber("");
      setIsNotRobot(false);
      setIsLoginMode(false);
      setPassword("");
      setShowPassword(false);
      setPasswordError(false);
      setErrorMessage("");
    }
  }, []);

  // Auto-detect country on mount
  useEffect(() => {
    const detectCountry = async () => {
      const countryCode = await detectCountryByGeo();
      if (countryCode) {
        const found = countries.find(c => c.code === countryCode);
        if (found) {
          setSelectedCountry(found);
          setDialCode(found.dialCode);
        }
      } else {
        // Default to UAE
        setSelectedCountry(countries[0]);
        setDialCode(countries[0].dialCode);
      }
    };
    detectCountry();
  }, []);

  // Icon animation cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIconIndex((prev) => {
        if (prev < iconSequence.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 600);

    return () => clearInterval(interval);
  }, []);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [isNotRobot, setIsNotRobot] = useState(false);
  const [countryDrawerOpen, setCountryDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showError, setShowError] = useState(false);
  const [captchaError, setCaptchaError] = useState(false);
  
  // Login flow states
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  // Handle dial code input change
  const handleDialCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Ensure it starts with +
    if (!value.startsWith("+")) {
      value = "+" + value.replace(/[^0-9]/g, "");
    } else {
      value = "+" + value.slice(1).replace(/[^0-9]/g, "");
    }
    
    setDialCode(value);
    
    // Try to find matching country
    const matchedCountry = countries.find(c => c.dialCode === value);
    setSelectedCountry(matchedCountry || null);
  };

  // Select country from drawer
  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    setDialCode(country.dialCode);
    setCountryDrawerOpen(false);
    setSearchQuery("");
  };

  // Get full phone number in international format
  const getFullPhoneNumber = (): string => {
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    return `${dialCode}${cleanPhone}`;
  };

  const isPhoneValid = phoneNumber.replace(/\D/g, "").length >= 9 && dialCode.length >= 2;
  const isValid = isPhoneValid && isNotRobot;

  const handleContinue = async () => {
    if (isValid) {
      // Validate phone with zod
      const cleanPhone = phoneNumber.replace(/\D/g, "");
      const validation = phoneSchema.safeParse(cleanPhone);
      
      if (!validation.success) {
        setShowError(true);
        setTimeout(() => setShowError(false), 600);
        return;
      }
      
      setIsLoading(true);
      setErrorMessage("");
      
      try {
        const fullPhone = getFullPhoneNumber();
        
        // Check if this is a +996 country (SMS via old API) or other (WhatsApp via new OTP API)
        const isKyrgyzstan = dialCode === '+996';
        
        if (isKyrgyzstan) {
          // Kyrgyzstan: use old SMS flow via register_auth
          const response = await registerAuth(fullPhone);
          
          if (response.error) {
            setShowError(true);
            setErrorMessage(response.error.message || t("auth.phone.error"));
            setTimeout(() => setShowError(false), 600);
            return;
          }
          
          if (response.data) {
            const { is_new_user, token, temporary_code_enabled } = response.data;
            
            if (token) {
              setAuthToken(token);
              if (is_new_user) {
                navigate("/auth/profile", { state: { phoneNumber: fullPhone } });
              } else {
                await getCurrentUser();
                toast.success(t("auth.login.success"));
                navigate("/", { replace: true });
              }
            } else if (is_new_user && temporary_code_enabled) {
              toast.success(t("auth.phone.codeSent") || "Verification code sent!");
              navigate("/auth/code", { 
                state: { phoneNumber: fullPhone, authType: 'sms' }
              });
            } else if (!is_new_user) {
              setIsLoginMode(true);
            }
          }
        } else {
          // All other countries: first check if user exists via registerAuth
          const registerResponse = await registerAuth(fullPhone);
          
          if (registerResponse.error) {
            setShowError(true);
            setErrorMessage(registerResponse.error.message || t("auth.phone.error"));
            setTimeout(() => setShowError(false), 600);
            return;
          }
          
          if (registerResponse.data) {
            const { is_new_user, token } = registerResponse.data;
            
            // If user already has a token (auto-login case)
            if (token) {
              setAuthToken(token);
              if (is_new_user) {
                navigate("/auth/profile", { state: { phoneNumber: fullPhone } });
              } else {
                await getCurrentUser();
                toast.success(t("auth.login.success"));
                navigate("/", { replace: true });
              }
              return;
            }
            
            // Existing user without token - show password form
            if (!is_new_user) {
              setIsLoginMode(true);
              return;
            }
            
            // New user - send WhatsApp OTP
            const otpResponse = await sendOtp(fullPhone);
            
            // Navigate to code page regardless of OTP send result
            // User can request resend from there
            if (otpResponse.error) {
              // Show warning but still navigate
              const errorMsg = otpResponse.error.status === 429
                ? (t("auth.phone.rateLimitError") || "Too many requests. Please wait.")
                : otpResponse.error.status === 503
                  ? (t("auth.phone.serviceUnavailable") || "Service temporarily unavailable")
                  : (t("auth.phone.otpSendError") || "Failed to send code. You can retry on the next screen.");
              
              toast.warning(errorMsg);
            } else if (otpResponse.data?.sent) {
              toast.success(t("auth.phone.whatsappCodeSent") || "Code sent via WhatsApp!");
            }
            
            // Always navigate to code entry page
            navigate("/auth/code", { 
              state: { 
                phoneNumber: fullPhone, 
                authType: 'whatsapp',
                otpId: otpResponse.data?.otp_id,
                expiresAt: otpResponse.data?.expires_at
              }
            });
          }
        }
      } catch {
        setShowError(true);
        setErrorMessage(t("auth.phone.error") || "Something went wrong");
        setTimeout(() => setShowError(false), 600);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Trigger phone error only if phone is invalid
      if (!isPhoneValid) {
        setShowError(true);
        setTimeout(() => setShowError(false), 600);
      }
      
      // Trigger captcha error only if captcha not checked
      if (!isNotRobot) {
        setCaptchaError(true);
        setTimeout(() => setCaptchaError(false), 600);
      }
    }
  };
  
  const handleLogin = async () => {
    // Validate password
    const validation = passwordSchema.safeParse(password);
    if (!validation.success) {
      setPasswordError(true);
      setErrorMessage(t('auth.login.wrongPassword'));
      setTimeout(() => setPasswordError(false), 600);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    
    try {
      const fullPhone = getFullPhoneNumber();
      const response = await apiLogin(fullPhone, password);
      
      if (response.error) {
        setPasswordError(true);
        // Handle different error types
        if (response.status === 403) {
          setErrorMessage(t('auth.login.userBlocked') || 'User is not active');
        } else if (response.status === 429) {
          setErrorMessage(t('auth.login.tooManyAttempts') || 'Too many attempts. Please try again later.');
        } else {
          setErrorMessage(response.error.message || t('auth.login.wrongPassword'));
        }
        setTimeout(() => setPasswordError(false), 600);
        return;
      }
      
      if (response.data) {
        toast.success(t('auth.login.success'));
        navigate("/", { replace: true });
      }
    } catch {
      setPasswordError(true);
      setErrorMessage(t('auth.login.error') || 'Login failed');
      setTimeout(() => setPasswordError(false), 600);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleForgotPassword = async () => {
    const fullPhone = getFullPhoneNumber();
    setIsLoading(true);
    
    try {
      const response = await forgotPassword(fullPhone);
      
      if (response.error) {
        toast.error(response.error.message || t('auth.login.forgotPasswordError'));
      } else {
        toast.success(t('auth.login.forgotPasswordSent') || 'Password reset code sent');
      }
    } catch {
      toast.error(t('auth.login.forgotPasswordError') || 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBackToPhone = () => {
    setIsLoginMode(false);
    setPassword("");
    setPasswordError(false);
    setErrorMessage("");
  };

  const filteredCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dialCode.includes(searchQuery) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const CurrentIcon = iconSequence[currentIconIndex].Icon;

  // Login mode - password entry screen
  if (isLoginMode) {
    return (
      <MobileLayout
        showBackButton
        onBack={handleBackToPhone}
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
                  passwordError 
                    ? 'bg-destructive/10 ring-2 ring-destructive' 
                    : 'bg-primary/10'
                }`}
                initial={{ scale: 0.8 }}
                animate={{ 
                  scale: 1,
                  rotate: passwordError ? [0, -5, 5, -5, 5, -3, 3, 0] : 0,
                  x: passwordError ? [0, -8, 8, -8, 8, -4, 4, 0] : 0
                }}
                transition={{ 
                  scale: { duration: 0.3, delay: 0.2 },
                  rotate: { duration: 0.5 },
                  x: { duration: 0.5 }
                }}
              >
                <Lock className={`w-12 h-12 transition-colors duration-300 ${passwordError ? 'text-destructive' : 'text-primary'}`} />
              </motion.div>
              <h1 className="text-2xl font-bold">{t('auth.login.title')}</h1>
              <p className="text-muted-foreground mt-2">
                {dialCode} {phoneNumber}
              </p>
            </motion.div>

            {/* Password Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="space-y-6"
            >
              <div className={`flex items-center gap-2 border-b pb-4 transition-colors duration-300 ${
                passwordError ? 'border-destructive' : 'border-border'
              }`}>
                <Lock className={`w-5 h-5 ${passwordError ? 'text-destructive' : 'text-muted-foreground'}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  className="flex-1 text-lg bg-transparent border-none outline-none placeholder:text-muted-foreground"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {(passwordError || errorMessage) && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-destructive text-sm"
                >
                  {errorMessage || t('auth.login.wrongPassword')}
                </motion.p>
              )}
              
              {/* Forgot Password Link */}
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isLoading}
                className="text-primary text-sm font-medium hover:underline disabled:opacity-50"
              >
                {t('auth.login.forgotPassword') || 'Forgot password?'}
              </button>
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
                {t('auth.phone.support')}
              </button>
            </motion.div>

            <PoweredByFooter />
          </div>

          {/* Login Button */}
          <div className="karta-footer-actions">
            <button
              onClick={handleLogin}
              disabled={password.length < 1 || isLoading}
              className="karta-btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('common.loading') || 'Loading...'}
                </>
              ) : (
                t('auth.login.button')
              )}
            </button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      showBackButton
      onBack={() => navigate("/")}
      rightAction={<LanguageSwitcher />}
    >
      <div className="flex flex-col h-[calc(100vh-56px)]">
        <div className="flex-1 overflow-y-auto px-6 py-8 pb-28">
          {/* Header Animation */}
          <motion.div 
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div 
              className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 overflow-hidden transition-colors duration-300 ${
                showError 
                  ? 'bg-destructive/10 ring-2 ring-destructive' 
                  : 'bg-primary/10'
              }`}
              initial={{ scale: 0.8 }}
              animate={{ 
                scale: 1,
                rotate: showError ? [0, -5, 5, -5, 5, -3, 3, 0] : 0,
                x: showError ? [0, -8, 8, -8, 8, -4, 4, 0] : 0
              }}
              transition={{ 
                scale: { duration: 0.3, delay: 0.2 },
                rotate: { duration: 0.5 },
                x: { duration: 0.5 }
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={showError ? 'error' : currentIconIndex}
                  initial={{ y: 30, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -30, opacity: 0, scale: 0.8 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 20 
                  }}
                >
                  <CurrentIcon className={`w-12 h-12 transition-colors duration-300 ${showError ? 'text-destructive' : 'text-primary'}`} />
                </motion.div>
              </AnimatePresence>
            </motion.div>
            <h1 className="text-2xl font-bold">{t('auth.phone.title')}</h1>
          </motion.div>

          {/* Phone Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-6"
          >
            <div className={`flex items-center gap-3 border-b pb-4 transition-colors duration-300 ${
              showError ? 'border-destructive' : 'border-border'
            }`}>
              {/* Country flag selector (Telegram style) */}
              <Drawer open={countryDrawerOpen} onOpenChange={setCountryDrawerOpen}>
                <DrawerTrigger asChild>
                  <button className="flex items-center gap-1 text-lg font-medium flex-shrink-0 hover:opacity-80 transition-opacity">
                    <AnimatePresence mode="popLayout">
                      <motion.span 
                        key={selectedCountry?.code || 'globe'}
                        className="text-2xl inline-block"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        transition={{ duration: 0.12 }}
                      >
                        {selectedCountry?.flag || "🌍"}
                      </motion.span>
                    </AnimatePresence>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>{t('auth.phone.selectCountry')}</DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4 pb-2">
                    <Input
                      placeholder={t('auth.phone.searchCountry')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="mb-4"
                    />
                  </div>
                  <div className="px-4 pb-8 max-h-[50vh] overflow-y-auto">
                    {filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        onClick={() => handleSelectCountry(country)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                          selectedCountry?.code === country.code
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-secondary"
                        }`}
                      >
                        <span className="text-2xl">{country.flag}</span>
                        <span className="flex-1 text-left font-medium">{country.name}</span>
                        <span className="text-muted-foreground">{country.dialCode}</span>
                      </button>
                    ))}
                  </div>
                </DrawerContent>
              </Drawer>
              
              {/* Combined phone input (Telegram style: +971 50 123 4567) */}
              <input
                type="tel"
                inputMode="tel"
                value={`${dialCode}${phoneNumber ? ' ' + phoneNumber : ''}`}
                onChange={(e) => {
                  let value = e.target.value;
                  
                  // Ensure starts with +
                  if (!value.startsWith("+")) {
                    value = "+" + value.replace(/[^0-9]/g, "");
                  }
                  
                  // Remove all non-digit except + at start
                  const cleanValue = "+" + value.slice(1).replace(/[^0-9 ]/g, "");
                  
                  // Split into potential dial code and phone parts
                  // Try to find a matching country code from longest to shortest
                  const digitsOnly = cleanValue.replace(/[^0-9]/g, "");
                  
                  let foundDialCode = "+";
                  let remainingDigits = digitsOnly;
                  
                  // Try matching dial codes (max 4 digits after +)
                  for (let len = Math.min(4, digitsOnly.length); len >= 1; len--) {
                    const testCode = "+" + digitsOnly.slice(0, len);
                    const matchedCountry = countries.find(c => c.dialCode === testCode);
                    if (matchedCountry) {
                      foundDialCode = testCode;
                      remainingDigits = digitsOnly.slice(len);
                      setSelectedCountry(matchedCountry);
                      break;
                    }
                  }
                  
                  // If no match found, just use what was typed as dial code
                  if (foundDialCode === "+" && digitsOnly.length > 0) {
                    // Use first 1-4 digits as dial code
                    const codeLen = Math.min(4, digitsOnly.length);
                    foundDialCode = "+" + digitsOnly.slice(0, codeLen);
                    remainingDigits = digitsOnly.slice(codeLen);
                    setSelectedCountry(null);
                  }
                  
                  setDialCode(foundDialCode);
                  setPhoneNumber(formatPhoneNumber(remainingDigits));
                }}
                placeholder={`${dialCode} 50 123 4567`}
                className="flex-1 text-lg bg-transparent border-none outline-none placeholder:text-muted-foreground"
              />
            </div>

            {/* reCAPTCHA Mock */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                x: captchaError ? [0, -8, 8, -8, 8, -4, 4, 0] : 0
              }}
              transition={{ 
                opacity: { duration: 0.4, delay: 0.2 },
                y: { duration: 0.4, delay: 0.2 },
                x: { duration: 0.5 }
              }}
              onClick={() => {
                setIsNotRobot(!isNotRobot);
                setCaptchaError(false);
              }}
              className={`rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all duration-300 ${
                captchaError 
                  ? 'border-2 border-destructive bg-destructive/5' 
                  : 'border border-border hover:bg-secondary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded border-2 flex items-center justify-center transition-all ${
                    isNotRobot
                      ? "bg-primary border-primary"
                      : captchaError
                        ? "border-destructive"
                        : "border-muted-foreground"
                  }`}
                >
                  {isNotRobot && (
                    <motion.svg
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </motion.svg>
                  )}
                </div>
                <span className={`font-medium transition-colors duration-300 ${captchaError ? 'text-destructive' : 'text-foreground'}`}>
                  {t('auth.phone.notRobot')}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="font-medium">reCAPTCHA</span>
                </div>
              </div>
            </motion.div>
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
              {t('auth.phone.support')}
            </button>
          </motion.div>

          <PoweredByFooter />
        </div>

        {/* Continue Button */}
        <div className="karta-footer-actions">
          <button
            onClick={handleContinue}
            className="karta-btn-primary"
          >
            {t('common.continue')}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default PhoneEntry;
