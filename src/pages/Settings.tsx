import { useState, useRef } from "react";
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
import { User, Globe, Palette, Receipt, MessageCircle, Briefcase, ChevronRight, Check, X, Sun, Moon, Monitor, Camera, Download, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AnimatedDrawerItem, AnimatedDrawerContainer } from "@/components/ui/animated-drawer-item";

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

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { i18n, t } = useTranslation();
  const { avatarUrl, setAvatarUrl } = useAvatar();
  const { user, isAuthenticated, logout, updateAvatar } = useAuth();
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || "en");
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInstallClick = async () => {
    if (isInstalled) {
      toast.info(t("toast.appAlreadyInstalled"));
      return;
    }
    
    if (isInstallable) {
      const success = await promptInstall();
      if (success) {
        toast.success(t("toast.appInstalled"));
      }
    } else {
      // Show instructions for iOS or browsers that don't support install prompt
      toast.info(t("toast.installInstructions"));
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
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

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
              className="flex items-center justify-center w-9 h-9 rounded-full bg-destructive/10 hover:bg-destructive/20 transition-colors disabled:opacity-50"
              aria-label="Logout"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 text-destructive animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 text-destructive" />
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
      </div>

      <div className="space-y-3 px-4 pb-28">
        {/* Personal Details */}
        <div className="bg-card rounded-2xl overflow-hidden">
          <SettingsItem
            icon={<User className="w-5 h-5" />}
            label={t("settings.personalDetails")}
            value={t("settings.notVerified")}
            onClick={() => navigate("/profile-verification")}
          />
        </div>

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

        {/* Add to Home Screen */}
        {!isInstalled && (
          <div className="bg-card rounded-2xl overflow-hidden">
            <SettingsItem
              icon={<Download className="w-5 h-5" />}
              label={t("settings.addToHomeScreen")}
              onClick={handleInstallClick}
            />
          </div>
        )}

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

        {/* Logout Button */}
        {isAuthenticated && (
          <div className="bg-card rounded-2xl overflow-hidden">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-between py-4 px-4 hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                {isLoggingOut ? (
                  <Loader2 className="w-5 h-5 text-destructive animate-spin" />
                ) : (
                  <LogOut className="w-5 h-5 text-destructive" />
                )}
                <span className="text-destructive font-medium">
                  {t("settings.logout") || "Log Out"}
                </span>
              </div>
            </button>
          </div>
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
