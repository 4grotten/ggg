import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/dashboard/ThemeSwitcher";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { AvatarCropDialog } from "@/components/settings/AvatarCropDialog";
import { useAvatar } from "@/contexts/AvatarContext";
import { useAuth } from "@/contexts/AuthContext";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useVerificationProgress } from "@/hooks/useVerificationProgress";
import { User, Globe, Palette, Receipt, MessageCircle, Briefcase, ChevronRight, ChevronDown, Check, X, Sun, Moon, Monitor, Camera, Smartphone, Share2, LogOut, Loader2, Plus, Home, Upload, LogIn, UserPlus, Users, SlidersHorizontal, Laptop, Code, Download, ArrowLeftRight, ScanFace, ShieldCheck, Vibrate } from "lucide-react";
import { ApofizLogo } from "@/components/icons/ApofizLogo";
import { openApofizWithAuth } from "@/components/layout/PoweredByFooter";
import { toast } from "sonner";
import { AnimatedDrawerItem, AnimatedDrawerContainer } from "@/components/ui/animated-drawer-item";
import { saveCurrentAccount, useMultiAccount, type SavedAccount } from "@/hooks/useMultiAccount";
import { LEVELS } from "@/components/partner/LevelCarousel";
import { MOCK_TRANSACTIONS } from "@/components/partner/ReferralTransactions";
import { ScreenLockDrawer } from "@/components/settings/ScreenLockDrawer";
import { PasswordVerifyDialog } from "@/components/settings/PasswordVerifyDialog";
import { useScreenLockContext } from "@/contexts/ScreenLockContext";
import { useUserRole } from "@/hooks/useUserRole";
import { isHapticEnabled, setHapticEnabled, useHapticFeedback } from "@/hooks/useHapticFeedback";

// Telegram-style colored icon backgrounds with gradients
const iconGradients: Record<string, string> = {
  user: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
  briefcase: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
  users: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
  sliders: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
  globe: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)',
  palette: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
  receipt: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',
  code: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)',
  privacy: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
  message: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
  download: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
  laptop: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
  apofiz: 'linear-gradient(135deg, #18181b 0%, #3f3f46 100%)',
  userplus: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
  lock: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)',
  admin: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
  vibrate: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
};

interface ColoredIconProps {
  children: React.ReactNode;
  colorKey: keyof typeof iconGradients;
}

const ColoredIcon = ({ children, colorKey }: ColoredIconProps) => {
  const gradient = iconGradients[colorKey] || iconGradients.user;
  return (
    <div 
      className="w-8 h-8 rounded-lg text-white flex items-center justify-center"
      style={{ background: gradient }}
    >
      {children}
    </div>
  );
};

// Animated menu section with cascade effect
interface AnimatedMenuSectionProps {
  children: React.ReactNode;
  index: number;
}

const AnimatedMenuSection = ({ children, index }: AnimatedMenuSectionProps) => (
  <motion.div
    initial={{ opacity: 0, y: -30, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{
      duration: 0.5,
      delay: index * 0.08,
      ease: [0.23, 1, 0.32, 1], // cubic-bezier for smooth spring-like feel
    }}
  >
    <motion.div
      initial={{ filter: "blur(10px)" }}
      animate={{ filter: "blur(0px)" }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="bg-muted/70 dark:bg-card/70 backdrop-blur-xl rounded-2xl overflow-hidden border border-border/50"
    >
      {children}
    </motion.div>
  </motion.div>
);

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  valueIcon?: React.ReactNode;
  valueClassName?: string;
  onClick?: () => void;
}

const SettingsItem = ({ icon, label, value, valueIcon, valueClassName, onClick }: SettingsItemProps) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between py-4 px-4 hover:bg-muted/50 transition-colors"
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-foreground font-medium">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {valueIcon && <span className="flex items-center">{valueIcon}</span>}
      {value && <span className={valueClassName || "text-muted-foreground text-sm"}>{value}</span>}
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </div>
  </button>
);

const getLanguages = (t: (key: string) => string) => [
  { code: "system", name: t("settings.languages.system"), flag: "🌐" },
  { code: "ru", name: t("settings.languages.russian"), flag: "🇷🇺" },
  { code: "en", name: t("settings.languages.english"), flag: "🇺🇸" },
  { code: "de", name: t("settings.languages.german"), flag: "🇩🇪" },
  { code: "tr", name: t("settings.languages.turkish"), flag: "🇹🇷" },
  { code: "zh", name: t("settings.languages.chinese"), flag: "🇨🇳" },
  { code: "ar", name: t("settings.languages.arabic"), flag: "🇦🇪" },
  { code: "es", name: t("settings.languages.spanish"), flag: "🇪🇸" },
];

const getThemes = (t: (key: string) => string) => [
  { code: "light", name: t("settings.themes.light"), icon: Sun },
  { code: "dark", name: t("settings.themes.dark"), icon: Moon },
  { code: "system", name: t("settings.themes.system"), icon: Monitor },
];

// Install Steps Component with elevator animation
interface InstallStepsContentProps {
  isOpen: boolean;
  onShare: () => void;
  t: (key: string) => string;
}

const InstallStepsContent = ({ isOpen, onShare, t }: InstallStepsContentProps) => {
  const [step1Visible, setStep1Visible] = useState(false);
  const [icon1Visible, setIcon1Visible] = useState(false);
  const [step2Visible, setStep2Visible] = useState(false);
  const [icon2Visible, setIcon2Visible] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);
  const [buttonIconVisible, setButtonIconVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset states
      setStep1Visible(false);
      setIcon1Visible(false);
      setStep2Visible(false);
      setIcon2Visible(false);
      setButtonVisible(false);
      setButtonIconVisible(false);
      
      // Phase 1: Steps and button appear first (elevator animation)
      const timer1 = setTimeout(() => setStep1Visible(true), 200);
      const timer2 = setTimeout(() => setStep2Visible(true), 500);
      const timer3 = setTimeout(() => setButtonVisible(true), 800);
      
      // Phase 2: Icons appear one by one with 500ms delay after all steps visible
      const timer1Icon = setTimeout(() => setIcon1Visible(true), 1300);   // 800 + 500
      const timer2Icon = setTimeout(() => setIcon2Visible(true), 1800);   // 1300 + 500
      const timer3Icon = setTimeout(() => setButtonIconVisible(true), 2300); // 1800 + 500
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer1Icon);
        clearTimeout(timer2Icon);
        clearTimeout(timer3Icon);
      };
    }
  }, [isOpen]);

  return (
    <div className="px-6 pb-8 space-y-6">
      {/* Instructions */}
      <div className="space-y-4">
        <div 
          className={`flex items-start gap-4 p-4 bg-muted/50 rounded-xl transition-all duration-300 ease-out ${
            step1Visible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 -translate-y-4'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary">1</span>
          </div>
          <div>
            <p className="font-medium text-foreground flex items-center gap-2">
              {t("settings.installStep1") || "Tap the Share button"}
              <Upload 
                className={`w-4 h-4 text-primary transition-all duration-300 ease-out ${
                  icon1Visible 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-50'
                }`} 
              />
            </p>
            <p className="text-sm text-muted-foreground mt-1">{t("settings.installStep1Desc") || "Look for the share icon in your browser"}</p>
          </div>
        </div>
        
        <div 
          className={`flex items-start gap-4 p-4 bg-muted/50 rounded-xl transition-all duration-300 ease-out ${
            step2Visible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 -translate-y-4'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary">2</span>
          </div>
          <div>
            <p className="font-medium text-foreground flex items-center gap-2">
              {t("settings.installStep2") || "Select 'Add to Home Screen'"}
              <Plus 
                className={`w-4 h-4 text-primary transition-all duration-300 ease-out ${
                  icon2Visible 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-50'
                }`} 
              />
              <Home 
                className={`w-4 h-4 text-primary transition-all duration-300 ease-out delay-100 ${
                  icon2Visible 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-50'
                }`} 
              />
            </p>
            <p className="text-sm text-muted-foreground mt-1">{t("settings.installStep2Desc") || "Scroll down in the share menu to find this option"}</p>
          </div>
        </div>
      </div>

      {/* Share Button */}
      <button
        onClick={onShare}
        className={`w-full flex items-center justify-center gap-3 py-4 px-6 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all duration-300 ease-out ${
          buttonVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 -translate-y-4'
        }`}
      >
        <Share2 
          className={`w-5 h-5 transition-all duration-300 ease-out ${
            buttonIconVisible 
              ? 'opacity-100 scale-100' 
              : 'opacity-0 scale-50'
          }`} 
        />
        <span>{t("settings.openShare") || "Open Share"}</span>
      </button>
    </div>
  );
};

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { i18n, t } = useTranslation();
  const { avatarUrl, setAvatarUrl } = useAvatar();
  const { user, isAuthenticated, logout, updateAvatar, refreshUser, switchUser } = useAuth();
  const { accounts, refreshAccounts } = useMultiAccount();
  
  // Refresh accounts list when component mounts
  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const { getCompletedSteps } = useVerificationProgress();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || "en");
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [isAccountsExpanded, setIsAccountsExpanded] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = useState(false);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false);
  const [isScreenLockOpen, setIsScreenLockOpen] = useState(false);
  const [isAdminPasswordDialogOpen, setIsAdminPasswordDialogOpen] = useState(false);
  const { isEnabled: isScreenLockEnabled, isPaused: isScreenLockPaused } = useScreenLockContext();
  const { isAdmin } = useUserRole();
  const [hapticEnabled, setHapticEnabledState] = useState(isHapticEnabled());
  const { tap } = useHapticFeedback();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInstallClick = () => {
    if (isInstalled) {
      toast.info(t("toast.appAlreadyInstalled"));
      return;
    }
    setIsInstallOpen(true);
  };

  const handleShareForInstall = async () => {
    try {
      // Always copy link to clipboard first
      await navigator.clipboard.writeText(window.location.origin);
      toast.success(t("toast.linkCopied") || "Link copied to clipboard");
      
      // Then try to open native share dialog
      if (navigator.share) {
        await navigator.share({
          title: 'Easy Card',
          url: window.location.origin
        });
      }
    } catch (error) {
      console.log('Share cancelled:', error);
    }
  };

  const languages = getLanguages(t);
  const themes = getThemes(t);

  const currentLanguage = languages.find(l => l.code === selectedLanguage);
  const currentTheme = themes.find(th => th.code === theme) || themes[2];

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error(t("toast.selectImageFile"));
        return;
      }
      // Store the file for later upload
      setPendingFile(file);
      const url = URL.createObjectURL(file);
      setCropImageSrc(url);
      setIsCropDialogOpen(true);
    }
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  const handleCropComplete = async (croppedImage: string) => {
    setAvatarUrl(croppedImage);
    setCropImageSrc(null);
    setIsCropDialogOpen(false);
    
    if (isAuthenticated) {
      setIsUploadingAvatar(true);
      try {
        // Convert base64 cropped image to File
        const response = await fetch(croppedImage);
        const blob = await response.blob();
        const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        
        await updateAvatar(croppedFile);
        await refreshUser(); // Refresh to get updated avatar URL
        
        // Trigger flash effect
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 400);
        
        toast.success(t("toast.avatarUpdated"));
      } catch (error) {
        console.error('Failed to upload avatar:', error);
        toast.error(t("toast.avatarUploadFailed") || "Failed to upload avatar");
      } finally {
        setIsUploadingAvatar(false);
        setPendingFile(null);
      }
    } else {
      // Trigger flash for local preview
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 400);
      
      toast.success(t("toast.avatarUpdated"));
      setPendingFile(null);
    }
  };

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code);
    const selectedLang = languages.find(l => l.code === code);
    if (code === "system") {
      const browserLang = navigator.language.split('-')[0];
      const supportedLangs = ["en", "ru", "de", "tr", "zh", "ar", "es"];
      const detectedLang = supportedLangs.includes(browserLang) ? browserLang : "en";
      i18n.changeLanguage(detectedLang);
      const detectedLangName = languages.find(l => l.code === detectedLang)?.name || "English";
      toast.success(t("toast.languageSystem", { language: detectedLangName }));
    } else {
      i18n.changeLanguage(code);
      toast.success(t("toast.languageChanged", { language: selectedLang?.name }));
    }
    localStorage.setItem('language', code);
    setIsLanguageOpen(false);
  };

  const handleThemeSelect = (code: string) => {
    setTheme(code);
    setIsAppearanceOpen(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success(t('settings.logoutSuccess') || 'Successfully logged out');
    } catch {
      toast.error(t('settings.logoutError') || 'Failed to logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Get user display data from API or fallback
  const displayName = user?.full_name || 'Guest';
  const displayEmail = user?.email;
  const displayPhone = user?.phone_number;
  // Priority: API avatar (medium size) > local avatar > fallback
  const displayAvatar = user?.avatar?.medium || user?.avatar?.file || avatarUrl;
  const initials = displayName ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return parts.map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  const otherAccounts = accounts.filter((a) => a.user.id !== user?.id);

  const mockAccounts: Array<Pick<SavedAccount, "id" | "user"> & { isMock: true }> = [
    {
      id: -1,
      user: {
        id: -1,
        full_name: "Alex Johnson",
        phone_number: "+971 50 123 4567",
        email: null,
        avatar: null,
        username: null,
        date_of_birth: null,
        gender: null,
        has_empty_fields: false,
      },
      isMock: true,
    },
    {
      id: -2,
      user: {
        id: -2,
        full_name: "Maria Petrova",
        phone_number: "+996 555 111 222",
        email: null,
        avatar: null,
        username: null,
        date_of_birth: null,
        gender: null,
        has_empty_fields: false,
      },
      isMock: true,
    },
  ];

  const accountsToRender: Array<SavedAccount | (Pick<SavedAccount, "id" | "user"> & { isMock: true })> =
    otherAccounts.length > 0 ? otherAccounts : mockAccounts;

  return (
    <MobileLayout
      title={t("settings.profile")}
      titleAlign="left"
      rightAction={
        <div className="flex items-center gap-2">
          <ThemeSwitcher className="mr-1" />
          <LanguageSwitcher />
          {isAuthenticated && (
            <button
              onClick={() => setIsLogoutDialogOpen(true)}
              disabled={isLoggingOut}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-red-500/10 hover:bg-red-500/20 dark:bg-red-500/20 dark:hover:bg-red-500/30 transition-colors disabled:opacity-50"
              aria-label="Logout"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 text-red-500" />
              )}
            </button>
          )}
        </div>
      }
    >
      <div className="flex flex-col items-center pt-8 pb-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        
        {isAuthenticated ? (
          <>
            <button
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className="relative group mb-4"
            >
              {/* Avatar container */}
              <div className="relative">
                <Avatar className="w-28 h-28 ring-4 ring-background shadow-xl overflow-hidden">
                  <AvatarImage 
                    src={displayAvatar} 
                    alt={displayName}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl bg-muted">{initials}</AvatarFallback>
                </Avatar>
                
                {/* Flash effect - bright flash that expands */}
                <AnimatePresence>
                  {showFlash && (
                    <>
                      {/* White flash burst */}
                      <motion.div
                        initial={{ opacity: 1, scale: 1 }}
                        animate={{ opacity: 0, scale: 1.5 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="absolute inset-0 bg-white rounded-full z-30 pointer-events-none"
                      />
                      {/* Glow ring effect */}
                      <motion.div
                        initial={{ opacity: 0.8, scale: 1 }}
                        animate={{ opacity: 0, scale: 2 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full border-4 border-primary z-30 pointer-events-none"
                      />
                      {/* Success checkmark */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ delay: 0.2, duration: 0.3, type: "spring" }}
                        className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
                      >
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <Check className="w-7 h-7 text-white" strokeWidth={3} />
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Loading overlay - simple dots */}
              <AnimatePresence>
                {isUploadingAvatar && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full z-10"
                  >
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2.5 h-2.5 bg-white rounded-full"
                          animate={{ y: [0, -8, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut"
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Hover overlay (only when not uploading) */}
              {!isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              )}
              
              {/* Edit badge */}
              <motion.div 
                className="absolute bottom-0 right-0 w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-background"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Camera className="w-4 h-4 text-primary-foreground" />
              </motion.div>
            </button>
            <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
            {displayPhone && (
              <p className="text-sm text-muted-foreground mt-1">{displayPhone}</p>
            )}
            {displayEmail && (
              <p className="text-sm text-muted-foreground">{displayEmail}</p>
            )}
            
            {/* Status indicators */}
            <div className="flex items-center gap-3 mt-3">
              {/* Personal data status */}
              <button
                onClick={() => navigate("/settings/edit-profile")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  user?.has_empty_fields
                    ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                    : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{t("settings.personalData") || "Личные данные"}</span>
              </button>
              
              {/* Verification status - verified when completed 3 steps */}
              <button
                onClick={() => {
                  if (getCompletedSteps() >= 3) {
                    setIsVerificationDialogOpen(true);
                  } else {
                    navigate("/profile-verification");
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  getCompletedSteps() < 3
                    ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                    : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t("settings.verification")}</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate("/auth/phone")}
              className="w-24 h-24 rounded-full bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors"
            >
              <LogIn className="w-10 h-10 text-primary-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground">{t("settings.guest") || "Guest"}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("settings.loginToAccess") || "Sign in to access all features"}</p>
          </>
        )}
      </div>

      <div className="space-y-3 px-4 pb-28">
        {/* Edit Profile - only for authenticated users */}
        {isAuthenticated && (() => {
          // Count unfilled important fields (including username)
          const unfilledFieldsCount = [
            !user?.full_name,
            !user?.username,
            !user?.email,
            !user?.date_of_birth,
            !user?.gender
          ].filter(Boolean).length;

          return (
            <AnimatedMenuSection index={0}>
              <button
                onClick={() => navigate("/settings/edit-profile")}
                className="w-full flex items-center justify-between py-4 px-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ColoredIcon colorKey="user"><User className="w-4 h-4" /></ColoredIcon>
                  <span className="text-foreground font-medium">{t("settings.editProfile") || "Edit Profile"}</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Unfilled fields indicators - red dots when incomplete, green dot when complete */}
                  {unfilledFieldsCount > 0 ? (
                    <div className="flex items-center gap-1 mr-1">
                      {Array.from({ length: unfilledFieldsCount }).map((_, index) => (
                        <motion.span
                          key={index}
                          className="w-2 h-2 rounded-full bg-destructive"
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ 
                            duration: 1.2, 
                            repeat: Infinity, 
                            ease: "easeInOut",
                            delay: index * 0.15
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2.5 h-2.5 rounded-full mr-1"
                    >
                      <motion.div
                        animate={{ 
                          opacity: [1, 0.4, 1],
                          scale: [1, 1.05, 1]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="w-full h-full rounded-full bg-green-500"
                      />
                    </motion.div>
                  )}
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </button>
            </AnimatedMenuSection>
          );
        })()}

        {/* Personal Details / Verification */}
        {(() => {
          const completedSteps = getCompletedSteps();
          const isVerified = completedSteps >= 3;
          return (
            <AnimatedMenuSection index={1}>
              <button
                onClick={() => {
                  // If verified, ask for confirmation
                  if (isVerified) {
                    setIsVerificationDialogOpen(true);
                  } else {
                    navigate("/profile-verification");
                  }
                }}
                className="w-full flex items-center justify-between py-4 px-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ColoredIcon colorKey="briefcase"><Briefcase className="w-4 h-4" /></ColoredIcon>
                  <span className="text-foreground font-medium">{t("settings.personalDetails")}</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Verification status indicator */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2.5 h-2.5 rounded-full"
                  >
                    <motion.div
                      animate={{ 
                        opacity: [1, 0.4, 1],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className={`w-full h-full rounded-full ${isVerified ? 'bg-green-500' : 'bg-red-500'}`}
                    />
                  </motion.div>
                  <span className={isVerified ? "text-sm font-medium text-green-500" : "text-sm font-medium text-red-500"}>
                    {isVerified ? t("settings.verified") : t("settings.notVerified")}
                  </span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </button>
            </AnimatedMenuSection>
          );
        })()}

        {/* Referral Partner */}
        {(() => {
          // Calculate partner level from referrals
          const uniqueUsers = new Set(MOCK_TRANSACTIONS.map(tx => tx.userName)).size;
          const getCurrentLevel = () => {
            for (let i = LEVELS.length - 1; i >= 0; i--) {
              if (uniqueUsers >= LEVELS[i].minFriends) {
                return LEVELS[i];
              }
            }
            return LEVELS[0];
          };
          const currentLevel = getCurrentLevel();
          
          return (
            <AnimatedMenuSection index={2}>
              <button
                onClick={() => navigate("/partner")}
                className="w-full flex items-center justify-between py-4 px-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ColoredIcon colorKey="users"><Users className="w-4 h-4" /></ColoredIcon>
                  <span className="text-foreground font-medium">{t("settings.referralPartner") || "Referral Partner"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{currentLevel.icon}</span>
                  <span className="text-sm font-medium text-primary">{currentLevel.id}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </button>
            </AnimatedMenuSection>
          );
        })()}

        {/* Limits Settings */}
        <AnimatedMenuSection index={3}>
          <SettingsItem
            icon={<ColoredIcon colorKey="sliders"><SlidersHorizontal className="w-4 h-4" /></ColoredIcon>}
            label={t("settings.limitsSettings") || "Limits Settings"}
            onClick={() => navigate("/limits-settings")}
          />
        </AnimatedMenuSection>

        {/* Language & Appearance */}
        <AnimatedMenuSection index={4}>
          <SettingsItem
            icon={<ColoredIcon colorKey="globe"><Globe className="w-4 h-4" /></ColoredIcon>}
            label={t("settings.language")}
            valueIcon={<span className="text-lg">{currentLanguage?.flag}</span>}
            value={currentLanguage?.name}
            onClick={() => setIsLanguageOpen(true)}
          />
          <SettingsItem
            icon={<ColoredIcon colorKey="palette"><Palette className="w-4 h-4" /></ColoredIcon>}
            label={t("settings.appearance")}
            valueIcon={currentTheme.icon && (
              <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-secondary flex items-center justify-center">
                <currentTheme.icon className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            value={currentTheme.name}
            onClick={() => setIsAppearanceOpen(true)}
          />
          {/* Screen Lock */}
          <SettingsItem
            icon={<ColoredIcon colorKey="lock"><ScanFace className="w-4 h-4" /></ColoredIcon>}
            label={t("screenLock.title")}
            value={isScreenLockEnabled ? t("settings.enabled") || "On" : t("settings.disabled") || "Off"}
            valueIcon={isScreenLockPaused ? (
              <motion.span
                className="w-2 h-2 rounded-full bg-orange-500"
                animate={{ opacity: [1, 0.4, 1], scale: [1, 0.9, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            ) : undefined}
            valueClassName={isScreenLockEnabled ? "text-sm font-medium text-green-500" : "text-muted-foreground text-sm"}
            onClick={() => setIsScreenLockOpen(true)}
          />
          {/* Haptic Feedback */}
          <div className="w-full flex items-center justify-between py-4 px-4">
            <div className="flex items-center gap-3">
              <ColoredIcon colorKey="vibrate"><Vibrate className="w-4 h-4" /></ColoredIcon>
              <span className="text-foreground font-medium">{t("settings.hapticFeedback") || "Вибрация"}</span>
            </div>
            <Switch
              checked={hapticEnabled}
              onCheckedChange={(checked) => {
                setHapticEnabled(checked);
                setHapticEnabledState(checked);
                if (checked) {
                  tap();
                }
                toast.success(checked ? (t("settings.hapticEnabled") || "Вибрация включена") : (t("settings.hapticDisabled") || "Вибрация выключена"));
              }}
            />
          </div>
        </AnimatedMenuSection>

        {/* Limits and Fees */}
        <AnimatedMenuSection index={5}>
          <SettingsItem
            icon={<ColoredIcon colorKey="receipt"><Receipt className="w-4 h-4" /></ColoredIcon>}
            label={t("settings.limitsAndFees")}
            onClick={() => navigate("/fees-and-limits")}
          />
          <SettingsItem
            icon={<ColoredIcon colorKey="code"><Code className="w-4 h-4" /></ColoredIcon>}
            label={t("settings.apiDocumentation")}
            onClick={() => navigate("/settings/api")}
          />
          {isAdmin && (
            <SettingsItem
              icon={<ColoredIcon colorKey="admin"><ShieldCheck className="w-4 h-4" /></ColoredIcon>}
              label={t("settings.adminPanel") || "Административная панель"}
              onClick={() => setIsAdminPasswordDialogOpen(true)}
            />
          )}
        </AnimatedMenuSection>

        {/* Support & Legal */}
        <AnimatedMenuSection index={6}>
          <SettingsItem
            icon={<ColoredIcon colorKey="privacy"><Briefcase className="w-4 h-4" /></ColoredIcon>}
            label={t("settings.privacyPolicy")}
          />
          <SettingsItem
            icon={<ColoredIcon colorKey="message"><MessageCircle className="w-4 h-4" /></ColoredIcon>}
            label={t("settings.askQuestion")}
            onClick={() => navigate("/chat")}
          />
          {!isInstalled && (
            <SettingsItem
              icon={<ColoredIcon colorKey="download"><Download className="w-4 h-4" /></ColoredIcon>}
              label={t("settings.installApp")}
              onClick={handleInstallClick}
            />
          )}
        </AnimatedMenuSection>

        {/* Active Devices - only for authenticated users */}
        {isAuthenticated && (
          <AnimatedMenuSection index={7}>
            <SettingsItem
              icon={<ColoredIcon colorKey="laptop"><Laptop className="w-4 h-4" /></ColoredIcon>}
              label={t("settings.devices.title")}
              onClick={() => navigate("/settings/devices")}
            />
          </AnimatedMenuSection>
        )}

        {/* Apofiz Social Network */}
        <AnimatedMenuSection index={8}>
          <SettingsItem
            icon={<ColoredIcon colorKey="apofiz"><ApofizLogo className="w-4 h-4" forceLight /></ColoredIcon>}
            label={t("settings.apofizNetwork")}
            onClick={openApofizWithAuth}
          />
        </AnimatedMenuSection>

        {/* Add Account Button */}
        <AnimatedMenuSection index={9}>
          <SettingsItem
            icon={<ColoredIcon colorKey="userplus"><UserPlus className="w-4 h-4" /></ColoredIcon>}
            label={t("settings.addAccount") || "Add Account"}
            onClick={() => {
              // Save current account before adding new one
              // Use explicit token to ensure we capture it before any navigation/state changes
              if (user) {
                const currentToken = localStorage.getItem('auth_token');
                if (currentToken) {
                  saveCurrentAccount(user, currentToken);
                }
              }
              navigate("/auth/phone");
            }}
          />
        </AnimatedMenuSection>

        {/* Saved Accounts List - Collapsible */}
        {accounts.length > 0 && (
          <AnimatedMenuSection index={10}>
            <button
              onClick={() => setIsAccountsExpanded(!isAccountsExpanded)}
              className="w-full flex items-center justify-between py-4 px-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                  <ArrowLeftRight className="w-4 h-4 text-white" />
                </div>
                <span className="text-foreground font-medium">
                  {t("settings.switchAccount") || "Switch Account"}
                </span>
                <span className="h-5 px-1.5 rounded-full bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1">
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-green-400"
                    animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {accounts.length}
                </span>
              </div>
              <motion.div
                animate={{ rotate: isAccountsExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {isAccountsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  {accounts.map((account, index) => {
                    const isCurrentUser = account.user.id === user?.id;
                    return (
                      <button
                        key={account.id}
                        onClick={() => {
                          if (!isCurrentUser) {
                            switchUser(account.user, account.token);
                            toast.success(t("settings.switchedTo", { name: account.user.full_name }));
                            navigate('/');
                          }
                        }}
                        disabled={isCurrentUser}
                        className={`w-full flex items-center gap-3 px-4 py-3 transition-colors border-t border-border/30 ${
                          isCurrentUser ? 'bg-primary/5 cursor-default' : 'hover:bg-muted/50 active:bg-muted/70'
                        }`}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage 
                            src={account.user.avatar?.medium || account.user.avatar?.file} 
                            alt={account.user.full_name} 
                          />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {account.user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium text-foreground truncate">
                            {account.user.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {account.user.phone_number}
                          </p>
                        </div>
                        {isCurrentUser && (
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </AnimatedMenuSection>
        )}

        {/* Logout Button */}
        {isAuthenticated && (
          <button
            onClick={() => setIsLogoutDialogOpen(true)}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-red-500/10 hover:bg-red-500/20 dark:bg-red-500/20 dark:hover:bg-red-500/30 rounded-2xl transition-colors disabled:opacity-50"
          >
            {isLoggingOut ? (
              <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
            ) : (
              <LogOut className="w-5 h-5 text-red-500" />
            )}
            <span className="text-red-500 font-medium">{t("settings.logout")}</span>
          </button>
        )}
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent className="max-w-[320px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.logoutConfirmTitle") || "Выйти из аккаунта?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.logoutConfirmDescription") || "Вы уверены, что хотите выйти из аккаунта?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3">
            <AlertDialogCancel className="flex-1 mt-0">
              {t("common.cancel") || "Отмена"}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogout}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              {t("settings.logout") || "Выйти"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Language Selection Drawer */}
      <Drawer open={isLanguageOpen} onOpenChange={setIsLanguageOpen} shouldScaleBackground={false}>
        <DrawerContent className="bg-background/95 backdrop-blur-xl">
          <DrawerHeader className="relative flex items-center justify-center py-4">
            <DrawerTitle className="text-center text-base font-semibold">
              {t("settings.applicationLanguage")}
            </DrawerTitle>
            <button 
              onClick={() => setIsLanguageOpen(false)}
              className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-primary" />
            </button>
          </DrawerHeader>
          
          <div className="px-4 pb-6">
            <AnimatedDrawerContainer className="bg-muted/50 rounded-xl overflow-hidden">
              {languages.map((language, index) => (
                <AnimatedDrawerItem key={language.code} index={index}>
                  <button
                    onClick={() => handleLanguageSelect(language.code)}
                    className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/80 transition-colors ${
                      index < languages.length - 1 ? 'border-b border-border/50' : ''
                    }`}
                  >
                    <span className="text-2xl">{language.flag}</span>
                    <div className="flex-1 text-left">
                      <p className="text-base font-medium text-foreground">{language.name}</p>
                    </div>
                    {selectedLanguage === language.code && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                </AnimatedDrawerItem>
              ))}
            </AnimatedDrawerContainer>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Appearance Selection Drawer */}
      <Drawer open={isAppearanceOpen} onOpenChange={setIsAppearanceOpen} shouldScaleBackground={false}>
        <DrawerContent className="bg-background/95 backdrop-blur-xl">
          <DrawerHeader className="relative flex items-center justify-center py-4">
            <DrawerTitle className="text-center text-base font-semibold">
              {t("settings.appearance")}
            </DrawerTitle>
            <button 
              onClick={() => setIsAppearanceOpen(false)}
              className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-primary" />
            </button>
          </DrawerHeader>
          
          <div className="px-4 pb-6">
            <AnimatedDrawerContainer className="bg-muted/50 rounded-xl overflow-hidden">
              {themes.map((themeOption, index) => {
                const IconComponent = themeOption.icon;
                return (
                  <AnimatedDrawerItem key={themeOption.code} index={index}>
                    <button
                      onClick={() => handleThemeSelect(themeOption.code)}
                      className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/80 transition-colors ${
                        index < themes.length - 1 ? 'border-b border-border/50' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-foreground" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-base font-medium text-foreground">{themeOption.name}</p>
                      </div>
                      {theme === themeOption.code && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  </AnimatedDrawerItem>
                );
              })}
            </AnimatedDrawerContainer>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Install App Drawer */}
      <Drawer open={isInstallOpen} onOpenChange={setIsInstallOpen} shouldScaleBackground={false}>
        <DrawerContent className="bg-background/95 backdrop-blur-xl">
          <DrawerHeader className="relative flex items-center justify-center py-4">
            <DrawerTitle className="text-center text-base font-semibold">
              {t("settings.installApp")}
            </DrawerTitle>
            <button 
              onClick={() => setIsInstallOpen(false)}
              className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-primary" />
            </button>
          </DrawerHeader>
          
          <InstallStepsContent 
            isOpen={isInstallOpen} 
            onShare={handleShareForInstall} 
            t={t} 
          />
        </DrawerContent>
      </Drawer>
      {/* Avatar Crop Dialog */}
      {cropImageSrc && (
        <AvatarCropDialog
          open={isCropDialogOpen}
          onOpenChange={(open) => {
            setIsCropDialogOpen(open);
            if (!open) setCropImageSrc(null);
          }}
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Edit Profile Confirmation Dialog */}
      <AlertDialog open={isEditProfileDialogOpen} onOpenChange={setIsEditProfileDialogOpen}>
        <AlertDialogContent className="max-w-[320px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('settings.updateDataConfirmTitle') || 'Обновить данные?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.updateDataConfirmDescription') || 'Вы уверены, что хотите обновить личные данные?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3">
            <AlertDialogCancel className="flex-1 mt-0">
              {t('common.cancel') || 'Отмена'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsEditProfileDialogOpen(false);
                navigate("/settings/edit-profile");
              }}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              {t('common.continue') || 'Продолжить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Verification Confirmation Dialog */}
      <AlertDialog open={isVerificationDialogOpen} onOpenChange={setIsVerificationDialogOpen}>
        <AlertDialogContent className="max-w-[320px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('settings.updateDataConfirmTitle') || 'Обновить данные?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.updateVerificationConfirmDescription') || 'Вы уверены, что хотите обновить данные верификации? Это может сбросить статус верификации.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3">
            <AlertDialogCancel className="flex-1 mt-0">
              {t('common.cancel') || 'Отмена'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsVerificationDialogOpen(false);
                navigate("/profile-verification");
              }}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              {t('common.continue') || 'Продолжить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Screen Lock Drawer */}
      <ScreenLockDrawer
        isOpen={isScreenLockOpen}
        onOpenChange={setIsScreenLockOpen}
      />

      {/* Admin Panel Password Verification */}
      <PasswordVerifyDialog
        isOpen={isAdminPasswordDialogOpen}
        onOpenChange={setIsAdminPasswordDialogOpen}
        onSuccess={() => navigate("/settings/admin")}
        title={t("settings.adminPanel") || "Административная панель"}
        description={t("auth.enterPasswordToAccess", "Введите пароль аккаунта для доступа")}
      />
    </MobileLayout>
  );
};

export default Settings;
