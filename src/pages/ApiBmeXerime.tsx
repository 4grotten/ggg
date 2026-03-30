import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ApiEndpointDetail } from "@/components/api/ApiEndpointDetail";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { bmeXerimeCategories, getBmeEndpointById, BME_API_BASE_URL } from "@/data/bmeXerimeApiDocs";
import { ChevronDown, ChevronRight, Globe, Key, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef } from "react";

// Animated burger menu icon
const AnimatedBurger = ({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-muted transition-colors md:hidden"
    aria-label="Toggle menu"
  >
    <div className="w-4 h-3 relative flex flex-col justify-between">
      <motion.span
        animate={{ rotate: isOpen ? 45 : 0, y: isOpen ? 5 : 0 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="block w-full h-0.5 bg-foreground rounded-full origin-center"
      />
      <motion.span
        animate={{ opacity: isOpen ? 0 : 1, scaleX: isOpen ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        className="block w-full h-0.5 bg-foreground rounded-full"
      />
      <motion.span
        animate={{ rotate: isOpen ? -45 : 0, y: isOpen ? -5 : 0 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="block w-full h-0.5 bg-foreground rounded-full origin-center"
      />
    </div>
  </button>
);

// Sidebar for BME API
const BmeSidebar = ({
  selectedEndpoint,
  onSelectEndpoint,
  onSelectIntro,
  isIntroSelected,
}: {
  selectedEndpoint: string | null;
  onSelectEndpoint: (id: string) => void;
  onSelectIntro: () => void;
  isIntroSelected: boolean;
}) => {
  const { t } = useTranslation();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const isExpanding = !prev.includes(categoryId);
      if (isExpanding) {
        setTimeout(() => {
          categoryRefs.current[categoryId]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 100);
        return [...prev, categoryId];
      }
      return prev.filter((id) => id !== categoryId);
    });
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return "text-green-500 bg-green-500/10";
      case "POST": return "text-blue-500 bg-blue-500/10";
      case "PUT": return "text-orange-500 bg-orange-500/10";
      case "DELETE": return "text-red-500 bg-red-500/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-background border-r border-border">
      <div className="p-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          BME & Xerime API
        </h2>
        <button
          onClick={onSelectIntro}
          className={cn(
            "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-2",
            isIntroSelected ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
          )}
        >
          Введение
        </button>
        <div className="space-y-1">
          {bmeXerimeCategories.map((category) => (
            <div key={category.id} ref={(el) => { categoryRefs.current[category.id] = el; }}>
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-start justify-between px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <span className="shrink-0 mt-0.5">{category.icon}</span>
                  <span className="break-words">{category.title}</span>
                </div>
                <span className="shrink-0 mt-0.5 ml-1">
                  {expandedCategories.includes(category.id) ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </span>
              </button>
              {expandedCategories.includes(category.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="ml-4 space-y-0.5 mt-1"
                >
                  {category.endpoints.map((endpoint) => (
                    <button
                      key={endpoint.id}
                      onClick={() => onSelectEndpoint(endpoint.id)}
                      className={cn(
                        "w-full flex items-start gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                        selectedEndpoint === endpoint.id
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5", getMethodColor(endpoint.method))}>
                        {endpoint.method}
                      </span>
                      <span className="break-words text-left">{endpoint.title}</span>
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

// Introduction section
const BmeIntroduction = () => (
  <div className="max-w-4xl mx-auto space-y-8">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="-mx-4 md:-mx-8 -mt-4 md:-mt-8 px-4 md:px-8 py-8 md:py-12 bg-primary"
    >
      <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
        API BME & Xerime
      </h1>
      <p className="text-lg text-primary-foreground/80">
        Документация по интеграции с платёжным процессингом BME и Xerime
      </p>
    </motion.div>

    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Base URL</p>
            <code className="text-lg font-mono text-primary">{BME_API_BASE_URL}</code>
          </div>
        </div>
      </div>
    </motion.div>

    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Аутентификация</h2>
      <div className="p-4 rounded-xl bg-muted/50 border border-border/50 space-y-3">
        <div className="flex items-start gap-3">
          <Key className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Все запросы (кроме Health) требуют JWT аутентификации:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Отправьте POST запрос на <code className="px-1 py-0.5 rounded bg-muted font-mono text-primary">/api/v2/login</code> с вашими credentials</li>
              <li>Включите токен в заголовок: <code className="px-1 py-0.5 rounded bg-muted font-mono text-primary">Authorization: Bearer &lt;token&gt;</code></li>
              <li>Токен действителен <strong>24 часа</strong> — обновите до истечения</li>
            </ol>
          </div>
        </div>
      </div>
    </motion.div>

    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Доступные разделы</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {bmeXerimeCategories.map((cat) => (
          <div key={cat.id} className="p-4 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <span>{cat.icon}</span>
              <span className="font-semibold text-foreground">{cat.title}</span>
            </div>
            <p className="text-xs text-muted-foreground">{cat.endpoints.length} endpoint{cat.endpoints.length !== 1 ? "s" : ""}</p>
          </div>
        ))}
      </div>
    </motion.div>

    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Коды ошибок</h2>
      <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
        <div className="space-y-2 text-sm">
          {[
            { code: "400", desc: "Bad Request — Неподдерживаемая комбинация актива/сети" },
            { code: "401", desc: "Unauthorized — Невалидный или истекший токен" },
            { code: "403", desc: "Forbidden — Нет доступа к endpoint" },
            { code: "404", desc: "Not Found — Транзакция не найдена" },
            { code: "409", desc: "Conflict — Дубликат транзакции или external_reference" },
            { code: "422", desc: "Unprocessable Entity — Недостаточный баланс" },
          ].map((err) => (
            <div key={err.code} className="flex items-start gap-3">
              <code className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-mono font-bold text-xs shrink-0">{err.code}</code>
              <span className="text-muted-foreground">{err.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  </div>
);

const ApiBmeXerime = () => {
  const navigate = useNavigate();
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

  const currentEndpoint = selectedEndpoint ? getBmeEndpointById(selectedEndpoint) : null;

  return (
    <MobileLayout
      showBackButton
      onBack={() => navigate("/settings")}
      title="API BME & Xerime"
      rightAction={
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <AnimatedBurger isOpen={isSidebarOpen} onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        </div>
      }
    >
      <div className="flex h-[calc(100vh-120px)] overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:block w-64 shrink-0 border-r border-border overflow-hidden">
          <BmeSidebar
            selectedEndpoint={selectedEndpoint}
            onSelectEndpoint={handleSelectEndpoint}
            onSelectIntro={handleSelectIntro}
            isIntroSelected={isIntroSelected}
          />
        </div>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              key="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.3 } }}
              exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.1 } }}
              className="fixed inset-0 z-50 md:hidden"
            >
              <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsSidebarOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <motion.div
                initial={{ x: "-100%", opacity: 0, scale: 0.9 }}
                animate={{ x: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 30, mass: 0.8 } }}
                exit={{ x: "-100%", opacity: 0, scale: 0.95, transition: { duration: 0.25 } }}
                className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-background/95 backdrop-blur-xl shadow-2xl border-r border-primary/20 overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="h-full pt-2">
                  <BmeSidebar
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
              <BmeIntroduction />
            ) : currentEndpoint ? (
              <ApiEndpointDetail endpoint={currentEndpoint} />
            ) : (
              <BmeIntroduction />
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default ApiBmeXerime;
