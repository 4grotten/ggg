import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PoweredByFooter } from "@/components/layout/PoweredByFooter";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { 
  User, 
  Camera, 
  Lock, 
  Eye, 
  EyeOff, 
  Check,
  Smartphone
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAvatar } from "@/contexts/AvatarContext";
import { AvatarCropDialog } from "@/components/settings/AvatarCropDialog";
import { StepIndicator } from "@/components/verification/StepIndicator";

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
  
  const isMale = type === "male";
  const color = isMale ? "#007AFF" : "#FF6B9D";
  
  // Reset and trigger animation on mount
  useEffect(() => {
    setShowFinalIcon(false);
    const timer = setTimeout(() => setShowFinalIcon(true), 600);
    return () => clearTimeout(timer);
  }, []);

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
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ 
          scale: 1,
          opacity: 1,
          boxShadow: isSelected ? `0 0 20px ${color}40` : 'none'
        }}
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
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ 
                opacity: 1,
                scale: 1, 
                y: 0
              }}
              transition={{ 
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
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

const ProfileSteps = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setAvatarUrl } = useAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState<Step>("name");
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [showError, setShowError] = useState(false);
  
  // Form data
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "not_specified" | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
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

  const phone = sessionStorage.getItem("registerPhone") || "+971 50 123 4567";

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

  const handleComplete = () => {
    sessionStorage.setItem("userName", fullName);
    sessionStorage.setItem("userGender", gender || "");
    toast.success(t('auth.profile.success'));
    navigate("/");
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
            <motion.div 
              className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
                showError 
                  ? 'bg-destructive/10 ring-2 ring-destructive' 
                  : 'bg-primary/10'
              }`}
              initial={iconAnimation.initial}
              animate={iconAnimation.animate}
              transition={iconTransition}
            >
              <motion.div
                animate={{
                  x: showError ? [0, -8, 8, -8, 8, -4, 4, 0] : 0,
                  rotate: showError ? [0, -10, 10, -10, 10, -5, 5, 0] : 0
                }}
                transition={{ duration: 0.5 }}
              >
                <User className={`w-12 h-12 ${showError ? 'text-destructive' : 'text-primary'}`} />
              </motion.div>
            </motion.div>
            
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
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setGender("not_specified")}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                gender === "not_specified"
                  ? "border-muted-foreground bg-muted/20"
                  : "border-border hover:border-muted-foreground/50"
              }`}
            >
              <span className="text-lg">{t('auth.steps.gender.preferNotToSay')}</span>
              {gender === "not_specified" && (
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full bg-muted-foreground flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </motion.button>
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
                >
                  <Camera className="w-16 h-16 text-white" />
                </motion.div>
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
            <motion.div 
              className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
                showError 
                  ? 'bg-destructive/10 ring-2 ring-destructive' 
                  : 'bg-primary/10'
              }`}
              initial={iconAnimation.initial}
              animate={iconAnimation.animate}
              transition={iconTransition}
            >
              <motion.div
                animate={{
                  x: showError ? [0, -8, 8, -8, 8, -4, 4, 0] : 0,
                  rotate: showError ? [0, -10, 10, -10, 10, -5, 5, 0] : 0
                }}
                transition={{ duration: 0.5 }}
              >
                <Lock className={`w-12 h-12 ${showError ? 'text-destructive' : 'text-primary'}`} />
              </motion.div>
            </motion.div>
            
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
        // Get gender label (localized in all languages via auth.profile.*)
        const genderLabel =
          gender === 'male'
            ? t('auth.profile.male')
            : gender === 'female'
              ? t('auth.profile.female')
              : t('auth.profile.notSelected');

        const genderIcon = gender === 'male' ? '♂' : gender === 'female' ? '♀' : '•';
        const genderIconClass =
          gender === 'male'
            ? 'text-blue-500'
            : gender === 'female'
              ? 'text-pink-500'
              : 'text-muted-foreground';
        
        return (
          <motion.div
            key="complete"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col items-center pt-2"
          >
            <h1 className="text-xl font-bold mb-1 text-center">{t('auth.steps.complete.title')}</h1>
            <p className="text-muted-foreground text-sm text-center">{t('auth.steps.complete.description')}</p>
            <p className="text-muted-foreground/70 text-xs text-center mb-4">
              {t('auth.steps.complete.canEditInSettings')}
            </p>
            
            {/* Telegram-style contact card - compact */}
            <motion.div 
              className="w-full max-w-[280px] bg-card rounded-2xl overflow-hidden shadow-lg border border-border"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
            >
              {/* Photo - smaller */}
              <motion.div 
                className="w-full p-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
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
                transition={{ delay: 0.4 }}
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
            
            {/* Success indicator */}
            <motion.div 
              className="mt-4 flex items-center gap-2 text-green-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">{t('auth.steps.complete.ready')}</span>
            </motion.div>
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
        return { disabled: false, text: t('auth.steps.complete.button') !== 'auth.steps.complete.button' ? t('auth.steps.complete.button') : 'Начать' };
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

        <div className="flex-1 overflow-hidden px-6 py-4 pb-28">
          <AnimatePresence mode="wait" custom={direction}>
            {renderStepContent()}
          </AnimatePresence>
          
          <PoweredByFooter />
        </div>

        {/* Continue Button */}
        <div className="karta-footer-actions">
          <motion.button
            onClick={handleButtonClick}
            whileTap={{ scale: 0.98 }}
            className="karta-btn-primary"
          >
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
