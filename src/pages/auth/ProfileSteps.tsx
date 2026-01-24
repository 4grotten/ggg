import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { 
  User, 
  Camera, 
  Lock,
  LockOpen,
  Eye, 
  EyeOff, 
  Check,
  Smartphone,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAvatar } from "@/contexts/AvatarContext";
import { AvatarCropDialog } from "@/components/settings/AvatarCropDialog";
import { StepIndicator } from "@/components/verification/StepIndicator";
import { initProfile, setPassword as apiSetPassword, uploadAvatar } from "@/services/api/authApi";
import { getAuthToken } from "@/services/api/apiClient";

type Step = "name" | "gender" | "photo" | "password" | "complete";

// Animated Gender Option Component
const GenderOption = ({ 
  type, 
  isSelected, 
  onSelect, 
  label 
}: { 
  type: "male" | "female"; 
  isSelected: boolean; 
  onSelect: () => void; 
  label: string;
}) => {
  const [showFinalIcon, setShowFinalIcon] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const isMale = type === "male";
  const color = isMale ? "#007AFF" : "#FF6B9D";
  
  // Reset and trigger animation on mount
  useEffect(() => {
    setShowFinalIcon(false);
    const timer = setTimeout(() => setShowFinalIcon(true), 600);
    return () => clearTimeout(timer);
  }, []);

  // Trigger animation when selected
  useEffect(() => {
    if (isSelected) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [isSelected]);

  // Male gender symbol (Mars) - ♂
  const MaleSymbol = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-14 h-14">
      <circle cx="10" cy="14" r="6" />
      <path d="M20 4L14.5 9.5" />
      <path d="M15 4h5v5" />
    </svg>
  );

  // Female gender symbol (Venus) - ♀
  const FemaleSymbol = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-14 h-14">
      <circle cx="12" cy="8" r="6" />
      <path d="M12 14v7" />
      <path d="M9 18h6" />
    </svg>
  );

  // Gift icon for female
  const GiftIcon = () => (
    <span className="text-5xl">💝</span>
  );

  // Shy animation keyframes for female
  const shyAnimation = {
    initial: { rotate: 0, scale: 1 },
    animate: {
      rotate: [0, -15, 15, -10, 10, -5, 5, 0],
      scale: [1, 0.9, 0.85, 0.8, 0.85, 0.9, 0.95, 1],
      transition: {
        duration: 1.2,
        times: [0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 1],
        ease: "easeInOut" as const
      }
    }
  };

  // Pump animation keyframes for male
  const pumpAnimation = {
    initial: { scale: 1, rotate: 0 },
    animate: {
      scale: [1, 1.15, 1.25, 1.3, 1.25, 1.15, 1.05, 1],
      rotate: [0, -5, 5, -3, 3, -2, 2, 0],
      transition: {
        duration: 1.0,
        times: [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1],
        ease: "easeOut" as const
      }
    }
  };

  // Glow animation for female circle border
  const femaleGlowAnimation = {
    initial: { 
      boxShadow: isSelected ? `0 0 20px ${color}40` : 'none',
      filter: 'none'
    },
    animate: {
      boxShadow: [
        `0 0 20px ${color}40`,
        `0 0 30px ${color}60, inset 0 0 10px ${color}30`,
        `0 0 40px ${color}80, inset 0 0 20px ${color}40`,
        `0 0 20px ${color}40`
      ],
      filter: [
        'none',
        'brightness(1.1)',
        'brightness(1.2) contrast(1.1)',
        'none'
      ],
      transition: {
        duration: 1.2,
        times: [0, 0.3, 0.5, 1],
        ease: "easeInOut" as const
      }
    }
  };

  // Flash animation for male circle border
  const maleFlashAnimation = {
    initial: { 
      boxShadow: isSelected ? `0 0 20px ${color}40` : 'none',
      filter: 'none'
    },
    animate: {
      boxShadow: [
        `0 0 20px ${color}40`,
        `0 0 50px ${color}90, inset 0 0 15px ${color}50`,
        `0 0 80px ${color}ff, inset 0 0 30px ${color}80`,
        `0 0 50px ${color}90`,
        `0 0 20px ${color}40`
      ],
      filter: [
        'none',
        'brightness(1.2)',
        'brightness(1.5) contrast(1.2)',
        'brightness(1.2)',
        'none'
      ],
      transition: {
        duration: 1.0,
        times: [0, 0.2, 0.4, 0.7, 1],
        ease: "easeOut" as const
      }
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className="flex flex-col items-center"
    >
      <motion.div 
        className="w-28 h-28 rounded-full flex items-center justify-center overflow-hidden relative"
        style={{
          backgroundColor: isSelected ? `${color}15` : 'transparent',
          border: isSelected ? `3px solid ${color}` : '2px solid hsl(var(--border))',
        }}
        initial="initial"
        animate={isAnimating ? "animate" : "initial"}
        variants={isMale ? maleFlashAnimation : femaleGlowAnimation}
        transition={{ type: "spring", stiffness: 120, damping: 14, delay: isMale ? 0.1 : 0.15 }}
      >
        <AnimatePresence mode="wait">
          {!showFinalIcon ? (
            <motion.div
              key="initial"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{ color }}
              className="flex items-center justify-center"
            >
              {isMale ? (
                <span className="text-5xl">📱</span>
              ) : (
                <GiftIcon />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="final"
              initial="initial"
              animate={isAnimating ? "animate" : "initial"}
              variants={isMale ? pumpAnimation : shyAnimation}
              style={{ color }}
              className="flex items-center justify-center"
            >
              {isMale ? <MaleSymbol /> : <FemaleSymbol />}
            </motion.div>
          )}
        </AnimatePresence>
        
        {isSelected && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-background"
            style={{ backgroundColor: color }}
          >
            <Check className="w-5 h-5 text-white" />
          </motion.div>
        )}
      </motion.div>
      <motion.span 
        className="mt-3 text-lg font-medium transition-colors"
        style={{ color: isSelected ? color : 'hsl(var(--foreground))' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: isMale ? 0.3 : 0.4 }}
      >
        {label}
      </motion.span>
    </motion.button>
  );
};

// Animated "Not Specified" Option Component
const NotSpecifiedOption = ({ 
  isSelected, 
  onSelect, 
  label 
}: { 
  isSelected: boolean; 
  onSelect: () => void; 
  label: string;
}) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    if (isSelected && !animationComplete) {
      setShowEmoji(true);
    }
    if (!isSelected) {
      setShowEmoji(false);
      setAnimationComplete(false);
    }
  }, [isSelected, animationComplete]);

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={`w-full flex items-center justify-center p-4 rounded-2xl border-2 transition-all min-h-[60px] ${
        isSelected
          ? "border-muted-foreground bg-muted/20"
          : "border-border hover:border-muted-foreground/50"
      }`}
    >
      <div className="relative flex items-center gap-2">
        <span className={`text-lg ${isSelected ? "text-muted-foreground" : ""}`}>{label}</span>
        
        <div className="relative w-6 h-6">
          {/* Rolling emoji */}
          {showEmoji && (
            <motion.span
              initial={{ x: -200, rotate: -1080, opacity: 1 }}
              animate={{ x: 0, rotate: 0, opacity: 1 }}
              onAnimationComplete={() => {
                setShowEmoji(false);
                setAnimationComplete(true);
              }}
              transition={{ 
                type: "spring", 
                stiffness: 80, 
                damping: 12,
              }}
              className="absolute inset-0 flex items-center justify-center text-xl"
            >
              😂
            </motion.span>
          )}
          
          {/* Checkmark appears after emoji */}
          {isSelected && animationComplete && !showEmoji && (
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="absolute inset-0 w-6 h-6 rounded-full bg-muted-foreground flex items-center justify-center"
            >
              <Check className="w-4 h-4 text-white" />
            </motion.div>
          )}
        </div>
      </div>
    </motion.button>
  );
};

const ProfileSteps = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { setAvatarUrl } = useAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if this is a new user from registration flow
  const isNewUser = (location.state as { isNewUser?: boolean })?.isNewUser ?? true;
  const phoneFromState = (location.state as { phoneNumber?: string })?.phoneNumber;
  
  const [currentStep, setCurrentStep] = useState<Step>("name");
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [showError, setShowError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form data
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "not_specified" | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null); // Store file for API upload
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Auto-capitalize name input
  const handleNameChange = (value: string) => {
    const capitalized = value
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    setFullName(capitalized);
  };
  
  // Crop dialog
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string>("");

  const phone = phoneFromState || sessionStorage.getItem("registerPhone") || "+971 50 123 4567";

  // Check if this is a valid profile setup flow (either has token or otpVerified)
  const otpVerified = (location.state as { otpVerified?: boolean })?.otpVerified;
  
  useEffect(() => {
    // Allow access if OTP was just verified (new user) or if user has token
    if (!otpVerified && !getAuthToken()) {
      // No valid entry point, redirect back to auth
      navigate("/auth/phone", { replace: true });
    }
  }, [otpVerified, navigate]);

  const steps: Step[] = ["name", "gender", "photo", "password", "complete"];
  const currentStepIndex = steps.indexOf(currentStep);

  const goNext = () => {
    setDirection(1);
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const goBack = () => {
    setDirection(-1);
    if (currentStepIndex === 0) {
      navigate("/auth/phone");
    } else {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t('auth.profile.invalidImage'));
      return;
    }

    // Store the file for later API upload
    setPhotoFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setTempImageUrl(result);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedUrl: string) => {
    setPhotoPreview(croppedUrl);
    setAvatarUrl(croppedUrl);
    setCropDialogOpen(false);
  };

  const handleComplete = async () => {
    setIsLoading(true);
    
    try {
      let avatarId: number | undefined;
      
      // Upload avatar first if we have a photo file
      if (photoFile) {
        try {
          const avatarData = await uploadAvatar(photoFile);
          avatarId = avatarData.id;
        } catch (error) {
          console.warn("Avatar upload failed:", error);
          // Continue without avatar - not critical
        }
      }
      
      // Call init_profile API with avatar_id if available
      const profileResponse = await initProfile({
        full_name: fullName,
        gender: gender === "not_specified" ? undefined : gender || undefined,
        avatar_id: avatarId,
      });
      
      if (profileResponse.error) {
        toast.error(profileResponse.error.message || t("auth.profile.error"));
        setIsLoading(false);
        return;
      }
      
      // Set password if provided
      if (password.length >= 6) {
        const passwordResponse = await apiSetPassword(password);
        
        if (passwordResponse.error) {
          // Profile saved, but password failed - still continue
          console.warn("Password set failed:", passwordResponse.error);
        }
      }
      
      // Save to session for local use
      sessionStorage.setItem("userName", fullName);
      sessionStorage.setItem("userGender", gender || "");
      
      toast.success(t('auth.profile.success'));
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Profile init error:", error);
      toast.error(t("auth.profile.error") || "Failed to save profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  const iconAnimation = {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
    },
  };

  const iconTransition = { 
    type: "spring" as const, 
    stiffness: 200, 
    damping: 15,
    delay: 0.2 
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "name":
        return (
          <motion.div
            key="name"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col items-center"
          >
            {/* Animated icon: Question -> User */}
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 bg-primary/10 relative overflow-hidden">
              {/* Question mark first */}
              <motion.div
                className="absolute flex items-center justify-center"
                initial={{ opacity: 1, scale: 1 }}
                animate={{ 
                  opacity: [1, 1, 0],
                  scale: [1, 1.1, 0.8],
                  rotate: [0, 10, -10]
                }}
                transition={{ 
                  duration: 1.2,
                  times: [0, 0.6, 1],
                  delay: 0.2
                }}
              >
                <span className="text-5xl">❓</span>
              </motion.div>

              {/* User icon appears after */}
              <motion.div
                className="absolute"
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ 
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  x: showError ? [0, -8, 8, -8, 8, -4, 4, 0] : 0,
                  rotate: showError ? [0, -10, 10, -10, 10, -5, 5, 0] : 0
                }}
                transition={{ 
                  opacity: { delay: 1.2, duration: 0.3 },
                  scale: { delay: 1.2, type: "spring", stiffness: 200, damping: 15 },
                  y: { delay: 1.2, type: "spring", stiffness: 200, damping: 15 },
                  x: showError ? { duration: 0.5 } : undefined,
                  rotate: showError ? { duration: 0.5 } : undefined
                }}
              >
                <User className={`w-12 h-12 ${showError ? 'text-destructive' : 'text-primary'}`} />
              </motion.div>
            </div>
            
            <h1 className="text-2xl font-bold mb-2 text-center">{t('auth.steps.name.title')}</h1>
            <p className="text-muted-foreground text-center mb-8">{t('auth.steps.name.description')}</p>
            
            <div className="w-full">
              <input
                type="text"
                value={fullName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder={t('auth.steps.name.placeholder')}
                autoFocus
                autoCapitalize="words"
                className={`w-full text-left text-2xl font-medium bg-transparent border-b-2 py-4 text-foreground placeholder:text-muted-foreground outline-none transition-colors ${
                  showError 
                    ? 'border-destructive focus:border-destructive' 
                    : 'border-primary/30 focus:border-primary'
                }`}
              />
              <p className="text-muted-foreground text-sm text-center mt-4">
                {t('auth.steps.name.hint')}
              </p>
            </div>
          </motion.div>
        );

      case "gender":
        return (
          <motion.div
            key="gender"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col items-center"
          >
            <h1 className="text-2xl font-bold mb-2 text-center">{t('auth.steps.gender.title')}</h1>
            <p className="text-muted-foreground text-center mb-8">{t('auth.steps.gender.description')}</p>
            
            <div className="w-full flex gap-6 justify-center mb-6">
              {/* Male option */}
              <GenderOption
                type="male"
                isSelected={gender === "male"}
                onSelect={() => setGender("male")}
                label={t('auth.profile.male')}
              />

              {/* Female option */}
              <GenderOption
                type="female"
                isSelected={gender === "female"}
                onSelect={() => setGender("female")}
                label={t('auth.profile.female')}
              />
            </div>

            {/* Prefer not to say option */}
            <NotSpecifiedOption
              isSelected={gender === "not_specified"}
              onSelect={() => setGender("not_specified")}
              label={t('auth.steps.gender.preferNotToSay')}
            />
          </motion.div>
        );

      case "photo":
        return (
          <motion.div
            key="photo"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col items-center"
          >
            <h1 className="text-2xl font-bold mb-2 text-center">{t('auth.steps.photo.title')}</h1>
            <p className="text-muted-foreground text-center mb-8">{t('auth.steps.photo.description')}</p>
            
            <motion.button
              onClick={handlePhotoClick}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative w-40 h-40 rounded-full flex items-center justify-center overflow-hidden mb-6 transition-all duration-300 ${
                showError 
                  ? 'bg-destructive ring-4 ring-destructive/30' 
                  : 'bg-primary'
              }`}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <>
                  {/* Flash effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-white"
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: [0, 0, 0.9, 0.7, 0],
                    }}
                    transition={{ 
                      duration: 0.8,
                      times: [0, 0.3, 0.4, 0.5, 0.8],
                      delay: 0.4,
                      ease: "easeOut" as const
                    }}
                  />
                  
                  <motion.div
                    initial={{ y: -80, opacity: 0, scale: 0.5 }}
                    animate={{ 
                      y: 0, 
                      opacity: 1, 
                      scale: 1,
                      x: showError ? [0, -8, 8, -8, 8, -4, 4, 0] : 0,
                      rotate: showError ? [0, -10, 10, -10, 10, -5, 5, 0] : 0
                    }}
                    transition={showError ? { duration: 0.5 } : { 
                      type: "spring", 
                      stiffness: 200, 
                      damping: 15, 
                      delay: 0.2 
                    }}
                    className="relative z-10"
                  >
                    <Camera className="w-16 h-16 text-white" />
                  </motion.div>
                </>
              )}
              
              {/* Pulsing ring */}
              {!photoPreview && !showError && (
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-primary"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <button onClick={handlePhotoClick} className="text-primary font-medium text-lg">
              {photoPreview ? t('auth.steps.photo.change') : t('auth.steps.photo.add')}
            </button>
            
            {/* Photo is now required - no skip option */}
          </motion.div>
        );

      case "password":
        return (
          <motion.div
            key="password"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col items-center"
          >
            {/* Animated Lock Sequence */}
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 bg-primary/10 relative overflow-hidden">
              {/* Step 1: Password asterisks typing */}
              <motion.div
                className="absolute flex items-center justify-center gap-0.5"
                initial={{ opacity: 1 }}
                animate={{ opacity: [1, 1, 0] }}
                transition={{ 
                  duration: 1.5,
                  times: [0, 0.8, 1],
                  delay: 0.2
                }}
              >
                {[0, 1, 2, 3].map((i) => (
                  <motion.span
                    key={i}
                    className="text-3xl text-primary font-bold"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      delay: 0.3 + i * 0.2,
                      type: "spring",
                      stiffness: 300,
                      damping: 15
                    }}
                  >
                    *
                  </motion.span>
                ))}
              </motion.div>

              {/* Step 2: Open lock appears (after asterisks disappear) */}
              <motion.div
                className="absolute"
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ 
                  opacity: [0, 0, 1, 1, 0],
                  scale: [0.5, 0.5, 1.1, 1, 0.9],
                  y: [20, 20, 0, 0, 0]
                }}
                transition={{ 
                  duration: 1.8,
                  times: [0, 0.1, 0.3, 0.7, 0.9],
                  delay: 1.7,
                  ease: "easeOut" as const
                }}
              >
                <LockOpen className="w-12 h-12 text-primary" />
              </motion.div>

              {/* Step 3: Closed lock with flash */}
              <motion.div
                className="absolute"
                initial={{ opacity: 0, scale: 1.5, rotate: -10 }}
                animate={{ 
                  opacity: [0, 0, 1],
                  scale: [1.5, 1.5, 1],
                  rotate: [-10, -10, 0]
                }}
                transition={{ 
                  duration: 0.5,
                  times: [0, 0.3, 1],
                  delay: 3.2,
                  ease: "easeOut" as const
                }}
              >
                <Lock className={`w-12 h-12 ${showError ? 'text-destructive' : 'text-primary'}`} />
              </motion.div>

              {/* Flash effect when lock closes */}
              <motion.div
                className="absolute inset-0 rounded-full bg-primary"
                initial={{ opacity: 0, scale: 1 }}
                animate={{ 
                  opacity: [0, 0.7, 0],
                  scale: [1, 1.3, 1.4]
                }}
                transition={{ 
                  duration: 0.4,
                  delay: 3.2,
                  ease: "easeOut" as const
                }}
              />
            </div>
            
            <h1 className="text-2xl font-bold mb-2 text-center">{t('auth.steps.password.title')}</h1>
            <p className="text-muted-foreground text-center mb-8">{t('auth.steps.password.description')}</p>
            
            <div className="w-full relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
                className={`w-full text-left text-2xl font-medium bg-transparent border-b-2 py-4 text-foreground placeholder:text-muted-foreground outline-none transition-colors pr-12 ${
                  showError 
                    ? 'border-destructive focus:border-destructive' 
                    : 'border-primary/30 focus:border-primary'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground p-2"
              >
                {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
              </button>
            </div>
            
            {/* Password strength indicator */}
            <div className="w-full mt-6">
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      password.length >= level * 2
                        ? password.length >= 8
                          ? "bg-green-500"
                          : password.length >= 6
                          ? "bg-yellow-500"
                          : "bg-red-500"
                        : "bg-border"
                    }`}
                  />
                ))}
              </div>
              <p className="text-muted-foreground text-sm text-center">
                {t('auth.steps.password.hint')}
              </p>
            </div>
          </motion.div>
        );

      case "complete":
        // Get gender label for display (with "Пол:" prefix) - localized
        const genderLabel =
          gender === 'male'
            ? t('auth.profile.maleDisplay')
            : gender === 'female'
              ? t('auth.profile.femaleDisplay')
              : t('auth.profile.notSelectedDisplay');

        const genderIcon = gender === 'male' ? '♂' : gender === 'female' ? '♀' : '•';
        const genderIconClass =
          gender === 'male'
            ? 'text-blue-500'
            : gender === 'female'
              ? 'text-pink-500'
              : 'text-muted-foreground';
        
        // Confetti colors and particles for explosion effect
        const confettiColors = ['#34C759', '#FFD700', '#007AFF', '#FF3B30', '#AF52DE', '#FF9500'];
        const confettiParticles = Array.from({ length: 24 }, (_, i) => ({
          id: i,
          delay: 0.3 + Math.random() * 0.3,
          angle: (i * 15) + Math.random() * 10,
          color: confettiColors[i % confettiColors.length],
          distance: 80 + Math.random() * 120
        }));

        // Explosion confetti ribbon component
        const ExplosionRibbon = ({ delay, angle, color, distance }: { delay: number; angle: number; color: string; distance: number }) => {
          const radian = (angle * Math.PI) / 180;
          const endX = Math.cos(radian) * distance;
          const endY = Math.sin(radian) * distance;
          
          return (
            <motion.div
              className="absolute left-1/2 top-20"
              style={{ marginLeft: -10 }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0, rotate: angle }}
              animate={{ 
                x: endX,
                y: endY,
                opacity: [0, 1, 1, 0],
                scale: [0, 1.2, 1, 0.5],
                rotate: [angle, angle + 180, angle + 360]
              }}
              transition={{ 
                duration: 2,
                delay: delay,
                ease: "easeOut" as const,
              }}
            >
              <svg width="16" height="32" viewBox="0 0 20 40">
                <motion.path
                  d="M10 0 Q15 10 10 20 Q5 30 10 40"
                  fill="none"
                  stroke={color}
                  strokeWidth="4"
                  strokeLinecap="round"
                  animate={{
                    d: [
                      "M10 0 Q15 10 10 20 Q5 30 10 40",
                      "M10 0 Q5 10 10 20 Q15 30 10 40",
                      "M10 0 Q15 10 10 20 Q5 30 10 40"
                    ]
                  }}
                  transition={{
                    duration: 0.4,
                    repeat: 3,
                    ease: "easeInOut" as const
                  }}
                />
              </svg>
            </motion.div>
          );
        };

        return (
          <motion.div
            key="complete"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col items-center pt-2 relative"
          >
            {/* Explosion Confetti Effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {confettiParticles.map((particle) => (
                <ExplosionRibbon
                  key={particle.id}
                  delay={particle.delay}
                  angle={particle.angle}
                  color={particle.color}
                  distance={particle.distance}
                />
              ))}
            </div>

            {/* Title with animation */}
            <motion.h1 
              className="text-2xl font-bold mb-1 text-center"
              style={{ color: '#333333' }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            >
              🎉 {t('auth.steps.complete.congratulations') || 'Поздравляем!'}
            </motion.h1>
            <motion.p 
              className="text-base text-center mb-6"
              style={{ color: '#333333' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {t('auth.steps.complete.profileCreated') || 'Профиль успешно создан'}
            </motion.p>
            
            {/* Telegram-style contact card - compact with slide animation */}
            <motion.div 
              className="w-full max-w-[280px] bg-card rounded-2xl overflow-hidden shadow-lg border border-border"
              initial={{ opacity: 0, x: -100, rotate: -5 }}
              animate={{ 
                opacity: 1, 
                x: 0, 
                rotate: [0, -3, 3, -2, 2, -1, 1, 0]
              }}
              transition={{ 
                opacity: { delay: 0.2, duration: 0.3 },
                x: { delay: 0.2, type: "spring", stiffness: 150, damping: 15 },
                rotate: { delay: 0.5, duration: 0.8, ease: "easeOut" as const }
              }}
            >
              {/* Photo - smaller */}
              <motion.div 
                className="w-full p-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {photoPreview ? (
                  <img 
                    src={photoPreview} 
                    alt="" 
                    className="w-full aspect-square object-cover rounded-xl" 
                  />
                ) : (
                  <div className="w-full aspect-square bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center rounded-xl">
                    <User className="w-16 h-16 text-primary/50" />
                  </div>
                )}
              </motion.div>
              
              {/* Info section - compact */}
              <motion.div 
                className="px-4 pb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {/* Name */}
                <h3 className="text-lg font-bold text-foreground">{fullName}</h3>
                
                {/* Gender */}
                <p className="text-muted-foreground text-base flex items-center gap-2 mt-1">
                  <span
                    className={`text-2xl flex items-center justify-center ${genderIconClass}`}
                    style={{ lineHeight: 1, marginTop: '-2px' }}
                    aria-hidden="true"
                  >
                    {genderIcon}
                  </span>
                  <span className="leading-none">{genderLabel}</span>
                </p>
                
                {/* Phone */}
                <p className="text-primary text-base font-medium mt-1">{phone}</p>
              </motion.div>
            </motion.div>
            
            {/* Edit hint - below card */}
            <motion.p 
              className="text-center mt-4 max-w-[280px]"
              style={{ color: '#333333', opacity: 0.7, fontSize: '14px' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.7 }}
            >
              {t('auth.steps.complete.canEditInSettings')}
            </motion.p>
          </motion.div>
        );
    }
  };

  const getButtonState = () => {
    const continueText = t('common.continue') !== 'common.continue' ? t('common.continue') : 'Далее';
    const skipText = t('common.skip') !== 'common.skip' ? t('common.skip') : 'Пропустить';
    
    switch (currentStep) {
      case "name":
        return { disabled: fullName.trim().length < 2, text: continueText };
      case "gender":
        return { disabled: false, text: gender ? continueText : skipText };
      case "photo":
        return { disabled: !photoPreview, text: continueText };
      case "password":
        return { disabled: password.length < 6, text: continueText };
      case "complete":
        return { disabled: isLoading, text: isLoading ? t('common.loading') || 'Loading...' : (t('auth.steps.complete.button') !== 'auth.steps.complete.button' ? t('auth.steps.complete.button') : 'Начать') };
      default:
        return { disabled: true, text: continueText };
    }
  };

  const handleButtonClick = () => {
    if (currentStep === "complete") {
      handleComplete();
    } else if (!buttonState.disabled) {
      goNext();
    } else {
      // Trigger shake animation
      setShowError(true);
      setTimeout(() => setShowError(false), 600);
    }
  };

  const buttonState = getButtonState();

  return (
    <MobileLayout
      showBackButton={true}
      onBack={goBack}
      rightAction={<LanguageSwitcher />}
    >
      <div className="flex flex-col h-[calc(100vh-56px)]">
        {/* Progress */}
        {currentStep !== "complete" && (
          <div className="px-6 py-4">
            <StepIndicator currentStep={currentStepIndex} totalSteps={4} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4 pb-28">
          <AnimatePresence mode="wait" custom={direction}>
            {renderStepContent()}
          </AnimatePresence>
          
          <PoweredByFooter />
        </div>

        {/* Continue Button */}
        <div className="karta-footer-actions">
          <motion.button
            onClick={handleButtonClick}
            disabled={isLoading}
            whileTap={{ scale: 0.98 }}
            className="karta-btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && currentStep === "complete" && (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
            {buttonState.text}
          </motion.button>
        </div>
      </div>

      {/* Crop Dialog */}
      <AvatarCropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageSrc={tempImageUrl}
        onCropComplete={handleCropComplete}
      />
    </MobileLayout>
  );
};

export default ProfileSteps;
