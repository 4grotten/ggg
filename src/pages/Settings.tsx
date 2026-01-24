import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { AvatarCropDialog } from "@/components/settings/AvatarCropDialog";
import { useAvatar } from "@/contexts/AvatarContext";
import { useAuth } from "@/contexts/AuthContext";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { User, Globe, Palette, Receipt, MessageCircle, Briefcase, ChevronRight, Check, X, Sun, Moon, Monitor, Camera, Smartphone, Share2, LogOut, Loader2, ExternalLink, Plus, Home, Upload, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AnimatedDrawerItem, AnimatedDrawerContainer } from "@/components/ui/animated-drawer-item";
import { saveCurrentAccount, useMultiAccount, type SavedAccount } from "@/hooks/useMultiAccount";

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
}

const SettingsItem = ({ icon, label, value, onClick }: SettingsItemProps) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between py-4 px-4 hover:bg-muted/50 transition-colors"
  >
    <div className="flex items-center gap-3">
      <span className="text-foreground">{icon}</span>
      <span className="text-foreground font-medium">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {value && <span className="text-muted-foreground text-sm">{value}</span>}
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
  const { user, isAuthenticated, logout, updateAvatar } = useAuth();
  const { accounts } = useMultiAccount();
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || "en");
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
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
    // Update local preview immediately
    setAvatarUrl(croppedImage);
    setCropImageSrc(null);
    setIsCropDialogOpen(false);
    
    // If authenticated and have file, upload to API
    if (isAuthenticated && pendingFile) {
      setIsUploadingAvatar(true);
      try {
        await updateAvatar(pendingFile);
        toast.success(t("toast.avatarUpdated"));
      } catch (error) {
        console.error('Failed to upload avatar:', error);
        toast.error(t("toast.avatarUploadFailed") || "Failed to upload avatar");
      } finally {
        setIsUploadingAvatar(false);
        setPendingFile(null);
      }
    } else {
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
      showBackButton
      onBack={() => navigate(-1)}
      rightAction={
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {isAuthenticated && (
            <button
              onClick={handleLogout}
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
              <Avatar className="w-24 h-24">
                <AvatarImage 
                  src={displayAvatar} 
                  alt={displayName} 
                />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploadingAvatar ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </div>
            </button>
            <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
            {displayPhone && (
              <p className="text-sm text-muted-foreground mt-1">{displayPhone}</p>
            )}
            {displayEmail && (
              <p className="text-sm text-muted-foreground">{displayEmail}</p>
            )}
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
        {isAuthenticated && (
          <div className="bg-card rounded-2xl overflow-hidden">
            <SettingsItem
              icon={<User className="w-5 h-5" />}
              label={t("settings.editProfile") || "Edit Profile"}
              onClick={() => navigate("/settings/edit-profile")}
            />
          </div>
        )}

        {/* Personal Details / Verification */}
        <div className="bg-card rounded-2xl overflow-hidden">
          <SettingsItem
            icon={<Briefcase className="w-5 h-5" />}
            label={t("settings.personalDetails")}
            value={t("settings.notVerified")}
            onClick={() => navigate("/profile-verification")}
          />
        </div>

        {/* Install App */}
        {!isInstalled && (
          <div className="bg-card rounded-2xl overflow-hidden">
            <SettingsItem
              icon={<Smartphone className="w-5 h-5" />}
              label={t("settings.installApp")}
              onClick={handleInstallClick}
            />
          </div>
        )}

        {/* Language & Appearance */}
        <div className="bg-card rounded-2xl overflow-hidden divide-y divide-border">
          <SettingsItem
            icon={<Globe className="w-5 h-5" />}
            label={t("settings.language")}
            value={currentLanguage?.name}
            onClick={() => setIsLanguageOpen(true)}
          />
          <SettingsItem
            icon={<Palette className="w-5 h-5" />}
            label={t("settings.appearance")}
            value={currentTheme.name}
            onClick={() => setIsAppearanceOpen(true)}
          />
        </div>

        {/* Limits and Fees */}
        <div className="bg-card rounded-2xl overflow-hidden">
          <SettingsItem
            icon={<Receipt className="w-5 h-5" />}
            label={t("settings.limitsAndFees")}
            onClick={() => navigate("/fees-and-limits")}
          />
        </div>

        {/* Support & Legal */}
        <div className="bg-card rounded-2xl overflow-hidden divide-y divide-border">
          <SettingsItem
            icon={<MessageCircle className="w-5 h-5" />}
            label={t("settings.askQuestion")}
            onClick={() => navigate("/chat")}
          />
          <SettingsItem
            icon={<Briefcase className="w-5 h-5" />}
            label={t("settings.privacyPolicy")}
          />
        </div>

        {/* Add Account Button */}
        <div className="bg-card rounded-2xl overflow-hidden">
          <SettingsItem
            icon={<UserPlus className="w-5 h-5" />}
            label={t("settings.addAccount") || "Add Account"}
            onClick={() => {
              // Save current account before adding new one
              if (user) {
                saveCurrentAccount(user);
              }
              navigate("/auth/phone");
            }}
          />
        </div>

        {/* Other Accounts section hidden for now */}

        {/* Logout Button */}
        {isAuthenticated && (
          <button
            onClick={handleLogout}
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
    </MobileLayout>
  );
};

export default Settings;
