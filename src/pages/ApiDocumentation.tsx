import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ArrowLeft, Menu, X } from "lucide-react";
import { ApiSidebar } from "@/components/api/ApiSidebar";
import { ApiEndpointDetail } from "@/components/api/ApiEndpointDetail";
import { ApiIntroduction } from "@/components/api/ApiIntroduction";
import { getEndpointById } from "@/data/apiDocumentation";
import { cn } from "@/lib/utils";

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
    </MobileLayout>
  );
};

export default ApiDocumentation;
