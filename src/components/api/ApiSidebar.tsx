import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ApiCategory, ApiEndpoint, apiCategories } from "@/data/apiDocumentation";
import { useTranslation } from "react-i18next";

interface ApiSidebarProps {
  selectedEndpoint: string | null;
  onSelectEndpoint: (endpointId: string) => void;
  onSelectIntro: () => void;
  isIntroSelected: boolean;
}

export const ApiSidebar = ({ 
  selectedEndpoint, 
  onSelectEndpoint, 
  onSelectIntro,
  isIntroSelected 
}: ApiSidebarProps) => {
  const { t } = useTranslation();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-green-500 bg-green-500/10';
      case 'POST': return 'text-blue-500 bg-blue-500/10';
      case 'PUT': return 'text-orange-500 bg-orange-500/10';
      case 'DELETE': return 'text-red-500 bg-red-500/10';
      case 'PATCH': return 'text-purple-500 bg-purple-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-background border-r border-border">
      <div className="p-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          {t("api.sidebar.title")}
        </h2>
        
        {/* Introduction */}
        <button
          onClick={onSelectIntro}
          className={cn(
            "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-2",
            isIntroSelected 
              ? "bg-primary/10 text-primary" 
              : "text-foreground hover:bg-muted"
          )}
        >
          {t("api.introduction.title")}
        </button>
        
        {/* Categories */}
        <div className="space-y-1">
          {apiCategories.map((category) => (
            <div key={category.id}>
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span>{t(category.titleKey)}</span>
                </div>
                {expandedCategories.includes(category.id) ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              
              {expandedCategories.includes(category.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="ml-4 space-y-0.5 mt-1"
                >
                {category.endpoints.map((endpoint) => (
                    <button
                      key={endpoint.id}
                      onClick={() => onSelectEndpoint(endpoint.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                        selectedEndpoint === endpoint.id
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                        getMethodColor(endpoint.method)
                      )}>
                        {endpoint.method}
                      </span>
                      <span className="truncate">{t(`api.endpoints.${endpoint.id}.title`, endpoint.title)}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApiSidebar;
