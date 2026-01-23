import { Home, Info, MessageCircle } from "lucide-react";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAvatar } from "@/contexts/AvatarContext";
import { useVoiceCall } from "@/contexts/VoiceCallContext";
import { motion } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";

const navItems = [
  { icon: Home, labelKey: "nav.home", path: "/" },
  { icon: Info, labelKey: "nav.info", path: "/info" },
  { icon: MessageCircle, labelKey: "nav.chat", path: "/chat" },
  { icon: null, labelKey: "nav.profile", path: "/settings" },
];

export const BottomNavigation = () => {
  const location = useLocation();
  const { avatarUrl } = useAvatar();
  const { isConnected, isSpeaking } = useVoiceCall();
  const { t, i18n } = useTranslation();
  const hasMountedRef = useRef(false);
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [selectorStyle, setSelectorStyle] = useState({ left: 0, width: 0 });

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const activeIndex = navItems.findIndex(item => isActive(item.path));

  const updateSelector = useCallback(() => {
    const activeTab = tabRefs.current[activeIndex];
    if (activeTab) {
      const container = activeTab.parentElement;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const tabRect = activeTab.getBoundingClientRect();
        setSelectorStyle({
          left: tabRect.left - containerRect.left,
          width: tabRect.width,
        });
      }
    }
  }, [activeIndex]);

  useEffect(() => {
    hasMountedRef.current = true;
  }, []);

  useEffect(() => {
    updateSelector();
  }, [activeIndex, updateSelector, i18n.language]);

  // Update on resize
  useEffect(() => {
    window.addEventListener('resize', updateSelector);
    return () => window.removeEventListener('resize', updateSelector);
  }, [updateSelector]);

  return (
    <nav className="fixed bottom-4 left-0 right-0 z-50 px-4 max-w-[800px] mx-auto">
      <div className="bg-white/50 dark:bg-card/70 backdrop-blur-2xl rounded-3xl shadow-lg border border-border/50 px-2 py-1.5 max-w-[400px] mx-auto">
        <div className="flex items-center justify-around relative">
          {/* Sliding selector */}
          <motion.div
            className="absolute bg-gray-200/50 dark:bg-white/10 rounded-3xl"
            initial={false}
            animate={{
              left: selectorStyle.left,
              width: selectorStyle.width,
            }}
            transition={
              hasMountedRef.current
                ? { type: "spring", stiffness: 400, damping: 30 }
                : { duration: 0 }
            }
            style={{
              height: "calc(100% - 4px)",
              top: "2px",
            }}
          />
          
          {navItems.map((item, index) => {
            const active = isActive(item.path);
            
            if (item.path === "/settings") {
              return (
                <RouterNavLink
                  key={item.path}
                  to={item.path}
                  ref={(el) => { tabRefs.current[index] = el; }}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-3xl transition-all relative z-10"
                >
                  <Avatar className={cn(
                    "w-6 h-6 transition-all",
                    active ? "ring-2 ring-primary" : ""
                  )}>
                    <AvatarImage src={avatarUrl} alt="Profile" />
                    <AvatarFallback className="text-xs">AW</AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      "text-xs font-medium transition-colors",
                      active ? "text-primary" : "text-foreground"
                    )}
                  >
                    {t(item.labelKey)}
                  </span>
                </RouterNavLink>
              );
            }
            
            const Icon = item.icon!;
            return (
              <RouterNavLink
                key={item.path}
                to={item.path}
                ref={(el) => { tabRefs.current[index] = el; }}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-3xl transition-all relative z-10"
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      "w-6 h-6 transition-colors",
                      active ? "text-primary" : "text-foreground"
                    )}
                    strokeWidth={active ? 2.5 : 1.5}
                  />
                  {/* Active call indicator on chat icon */}
                  {item.path === "/chat" && isConnected && (
                    <motion.div
                      animate={isSpeaking ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                      className={cn(
                        "absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-card",
                        isSpeaking ? "bg-green-500" : "bg-yellow-500"
                      )}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    active ? "text-primary" : "text-foreground"
                  )}
                >
                  {t(item.labelKey)}
                </span>
              </RouterNavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
