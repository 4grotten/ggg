import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, X } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { AnimatedDrawerItem, AnimatedDrawerContainer } from "@/components/ui/animated-drawer-item";

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

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(
    localStorage.getItem("language") || "system"
  );

  const languages = getLanguages(t);
  const currentLang = languages.find((l) => l.code === selectedLanguage) || 
    languages.find((l) => l.code === i18n.language) || 
    languages[2]; // Default to English

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code);
    const selectedLang = languages.find((l) => l.code === code);
    
    if (code === "system") {
      const browserLang = navigator.language.split("-")[0];
      const supportedLangs = ["en", "ru", "de", "tr", "zh", "ar", "es"];
      const detectedLang = supportedLangs.includes(browserLang) ? browserLang : "en";
      i18n.changeLanguage(detectedLang);
      const detectedLangName = languages.find((l) => l.code === detectedLang)?.name || "English";
      toast.success(t("toast.languageSystem", { language: detectedLangName }));
    } else {
      i18n.changeLanguage(code);
      toast.success(t("toast.languageChanged", { language: selectedLang?.name }));
    }
    
    localStorage.setItem("language", code);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-secondary hover:bg-muted transition-colors"
      >
        <span className="text-base">{currentLang.flag}</span>
        <span className="text-sm font-medium text-foreground uppercase">
          {currentLang.code === "system" ? i18n.language : currentLang.code}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="bg-background/95 backdrop-blur-xl">
          <DrawerHeader className="relative flex items-center justify-center py-4">
            <DrawerTitle className="text-center text-base font-semibold">
              {t("settings.applicationLanguage")}
            </DrawerTitle>
            <button
              onClick={() => setOpen(false)}
              className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-primary" />
            </button>
          </DrawerHeader>
          
          <div className="flex-1 overflow-y-auto px-4">
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
    </>
  );
};