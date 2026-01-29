import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ArrowLeft, Menu, X, Globe, Check } from "lucide-react";
import { ApiSidebar } from "@/components/api/ApiSidebar";
import { ApiEndpointDetail } from "@/components/api/ApiEndpointDetail";
import { ApiIntroduction } from "@/components/api/ApiIntroduction";
import { getEndpointById } from "@/data/apiDocumentation";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { AnimatedDrawerItem, AnimatedDrawerContainer } from "@/components/ui/animated-drawer-item";
import { toast } from "sonner";

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

const ApiDocumentation = () => {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [isIntroSelected, setIsIntroSelected] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(
    localStorage.getItem("language") || "system"
  );

  const languages = getLanguages(t);

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
    setIsLanguageOpen(false);
  };

  const handleSelectEndpoint = (endpointId: string) => {
    setSelectedEndpoint(endpointId);
    setIsIntroSelected(false);
    setIsSidebarOpen(false);
  };

  const handleSelectIntro = () => {
    setSelectedEndpoint(null);
    setIsIntroSelected(true);
    setIsSidebarOpen(false);
  };

  const currentEndpoint = selectedEndpoint ? getEndpointById(selectedEndpoint) : null;

  return (
    <MobileLayout
      header={
        <div className="flex items-center justify-between w-full px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/settings")}
              className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">{t("settings.apiDocumentation")}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <button
              onClick={() => setIsLanguageOpen(true)}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <Globe className="w-5 h-5" />
            </button>
            
            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-muted rounded-full transition-colors md:hidden"
            >
              {isSidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="flex h-[calc(100vh-120px)] overflow-hidden">
        {/* Sidebar - Desktop */}
        <div className="hidden md:block w-64 shrink-0 border-r border-border overflow-hidden">
          <ApiSidebar
            selectedEndpoint={selectedEndpoint}
            onSelectEndpoint={handleSelectEndpoint}
            onSelectIntro={handleSelectIntro}
            isIntroSelected={isIntroSelected}
          />
        </div>

        {/* Sidebar - Mobile overlay */}
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed inset-0 z-50 md:hidden"
          >
            <div 
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-background shadow-xl">
              <ApiSidebar
                selectedEndpoint={selectedEndpoint}
                onSelectEndpoint={handleSelectEndpoint}
                onSelectIntro={handleSelectIntro}
                isIntroSelected={isIntroSelected}
              />
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8">
            {isIntroSelected ? (
              <ApiIntroduction />
            ) : currentEndpoint ? (
              <ApiEndpointDetail endpoint={currentEndpoint} />
            ) : (
              <ApiIntroduction />
            )}
          </div>
        </div>
      </div>

      {/* Language Switcher Drawer */}
      <Drawer open={isLanguageOpen} onOpenChange={setIsLanguageOpen}>
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
    </MobileLayout>
  );
};

export default ApiDocumentation;
