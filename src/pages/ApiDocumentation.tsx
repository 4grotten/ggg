import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ApiSidebar } from "@/components/api/ApiSidebar";
import { ApiEndpointDetail } from "@/components/api/ApiEndpointDetail";
import { ApiIntroduction } from "@/components/api/ApiIntroduction";
import { getEndpointById } from "@/data/apiDocumentation";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";

// Animated burger menu icon - styled to match LanguageSwitcher
const AnimatedBurger = ({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-muted transition-colors md:hidden"
    aria-label="Toggle menu"
  >
    <div className="w-4 h-3 relative flex flex-col justify-between">
      <motion.span
        animate={{
          rotate: isOpen ? 45 : 0,
          y: isOpen ? 5 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="block w-full h-0.5 bg-foreground rounded-full origin-center"
      />
      <motion.span
        animate={{
          opacity: isOpen ? 0 : 1,
          scaleX: isOpen ? 0 : 1,
        }}
        transition={{ duration: 0.2 }}
        className="block w-full h-0.5 bg-foreground rounded-full"
      />
      <motion.span
        animate={{
          rotate: isOpen ? -45 : 0,
          y: isOpen ? -5 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="block w-full h-0.5 bg-foreground rounded-full origin-center"
      />
    </div>
  </button>
);

const ApiDocumentation = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [isIntroSelected, setIsIntroSelected] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  // Sidebar animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3, delay: 0.1 }
    }
  };

  const sidebarVariants = {
    hidden: { 
      x: "-100%",
      opacity: 0,
      scale: 0.9,
    },
    visible: { 
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { 
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      }
    },
    exit: { 
      x: "-100%",
      opacity: 0,
      scale: 0.95,
      transition: { 
        duration: 0.25,
        ease: [0.32, 0, 0.67, 0] as const
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.1 + i * 0.05,
        duration: 0.3,
        ease: [0.23, 1, 0.32, 1]
      }
    })
  };

  return (
    <MobileLayout
      showBackButton
      onBack={() => navigate("/settings")}
      title={t("settings.apiDocumentation")}
      rightAction={
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <AnimatedBurger 
            isOpen={isSidebarOpen} 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          />
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

        {/* Sidebar - Mobile overlay with fantastic animation */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              key="sidebar-overlay"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-50 md:hidden"
            >
              {/* Backdrop with blur */}
              <motion.div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsSidebarOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              
              {/* Sidebar panel */}
              <motion.div 
                variants={sidebarVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-background/95 backdrop-blur-xl shadow-2xl border-r border-primary/20 overflow-hidden"
              >
                {/* Decorative gradient glow */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
                
                {/* Close button */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors z-10"
                >
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
                
                {/* Sidebar content */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="h-full pt-2"
                >
                  <ApiSidebar
                    selectedEndpoint={selectedEndpoint}
                    onSelectEndpoint={handleSelectEndpoint}
                    onSelectIntro={handleSelectIntro}
                    isIntroSelected={isIntroSelected}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
    </MobileLayout>
  );
};

export default ApiDocumentation;
