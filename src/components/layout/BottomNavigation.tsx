import { Home, Info, MessageCircle, LogIn } from "lucide-react";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAvatar } from "@/contexts/AvatarContext";
import { useAuth } from "@/contexts/AuthContext";
import { useVoiceCall } from "@/contexts/VoiceCallContext";
import { motion } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

const navItems = [
  { icon: Home, labelKey: "nav.home", path: "/" },
  { icon: Info, labelKey: "nav.info", path: "/info" },
  { icon: MessageCircle, labelKey: "nav.chat", path: "/chat" },
  { icon: null, labelKey: "nav.profile", path: "/settings" },
];

export const BottomNavigation = () => {
  const location = useLocation();
  const { avatarUrl } = useAvatar();
  const { user, isAuthenticated } = useAuth();
  const { isConnected, isSpeaking } = useVoiceCall();
  const { t, i18n } = useTranslation();
  const { selection } = useHapticFeedback();
  
  // Priority: API avatar (small) > local avatar > fallback
  const displayAvatar = user?.avatar?.small || user?.avatar?.file || avatarUrl;
  const displayName = user?.full_name || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
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
  
  // Check if active tab is first or last (Home or Profile)
  const isEdgeTab = activeIndex === 0 || activeIndex === navItems.length - 1;

  const updateSelector = useCallback(() => {
    const activeTab = tabRefs.current[activeIndex];
    if (activeTab) {
      const container = activeTab.parentElement;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const tabRect = activeTab.getBoundingClientRect();
        
        // For edge tabs (Home/Profile), expand the selector more
        const extraPadding = isEdgeTab ? 8 : 0;
        
        setSelectorStyle({
          left: tabRect.left - containerRect.left - extraPadding,
          width: tabRect.width + extraPadding * 2,
        });
      }
    }
  }, [activeIndex, isEdgeTab]);

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
          {/* iOS 26 liquid glass selector */}
          <motion.div
            className="absolute overflow-hidden backdrop-blur-xl rounded-2xl"
            initial={false}
            animate={{
              left: selectorStyle.left,
              width: selectorStyle.width,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{
              height: "calc(100% - 8px)",
              top: "4px",
              background: "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.15) 100%)",
              boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3), 0 0 8px rgba(255,255,255,0.05)",
            }}
          >
            <div className="absolute inset-0 ring-1 ring-inset ring-white/30 dark:ring-white/15 rounded-2xl" />
          </motion.div>
          
          {navItems.map((item, index) => {
            const active = isActive(item.path);
            
            if (item.path === "/settings") {
              // For unauthenticated users, show login button instead of avatar
              if (!isAuthenticated) {
                return (
                  <RouterNavLink
                    key={item.path}
                    to="/auth/phone"
                    ref={(el) => { tabRefs.current[index] = el; }}
                    onClick={() => selection()}
                    className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-3xl transition-all relative z-10"
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full bg-primary flex items-center justify-center transition-all",
                      active ? "ring-2 ring-primary/50" : ""
                    )}>
                      <LogIn className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium transition-colors",
                        active ? "text-primary" : "text-foreground"
                      )}
                    >
                      {t("nav.login") || t(item.labelKey)}
                    </span>
                  </RouterNavLink>
                );
              }
              
              return (
                <RouterNavLink
                  key={item.path}
                  to={item.path}
                  ref={(el) => { tabRefs.current[index] = el; }}
                  onClick={() => selection()}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-3xl transition-all relative z-10"
                >
                  <Avatar className={cn(
                    "w-6 h-6 transition-all",
                    active ? "ring-2 ring-primary" : ""
                  )}>
                    <AvatarImage src={displayAvatar} alt="Profile" />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
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
                onClick={() => selection()}
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
