import { Home, Info, MessageCircle, LogIn } from "lucide-react";
import { NavLink as RouterNavLink, useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
  const isInitializedRef = useRef(false);
  const tabRefs = useRef<(HTMLElement | null)[]>([]);
  const [selectorStyle, setSelectorStyle] = useState<{ left: number; width: number } | null>(null);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const activeIndex = navItems.findIndex(item => isActive(item.path));

  const calcSelectorStyle = useCallback((index: number) => {
    const tab = tabRefs.current[index];
    if (!tab) return null;

    const container = tab.parentElement;
    if (!container) return null;

    const containerRect = container.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();

    const baseLeft = tabRect.left - containerRect.left;
    const baseWidth = tabRect.width;

    // Expand symmetrically; for edge tabs mirror the free space so label stays centered
    if (index === 0) {
      const leftExtension = baseLeft;
      return { left: 0, width: baseWidth + leftExtension * 2 };
    }
    if (index === navItems.length - 1) {
      const rightExtension = containerRect.width - (baseLeft + baseWidth);
      return { left: baseLeft - rightExtension, width: baseWidth + rightExtension * 2 };
    }

    const extraPadding = 8;
    return { left: baseLeft - extraPadding, width: baseWidth + extraPadding * 2 };
  }, []);

  const updateSelector = useCallback(
    (index: number) => {
      const next = calcSelectorStyle(index);
      if (next) setSelectorStyle(next);
    },
    [calcSelectorStyle],
  );

  const handleTabPress = useCallback(
    (index: number, path: string) => {
      // Move selector immediately on first touch/press, without waiting for route change.
      setPressedIndex(index);
      updateSelector(index);
      selection();
      // Navigate immediately on pointer down
      navigate(path);
    },
    [updateSelector, selection, navigate],
  );

  useEffect(() => {
    hasMountedRef.current = true;
  }, []);

  // Initialize selector position without animation on first render
  useEffect(() => {
    if (!isInitializedRef.current) {
      const style = calcSelectorStyle(activeIndex);
      if (style) {
        setSelectorStyle(style);
        isInitializedRef.current = true;
      }
    }
  }, [activeIndex, calcSelectorStyle]);

  // Keep selector in sync with the actually opened route.
  // This prevents a mismatch where the selector stays on an old tab while another page is open.
  useEffect(() => {
    if (isInitializedRef.current) {
      setPressedIndex(null);
      // Avoid fighting the optimistic press animation; once route changes, snap to the new active.
      updateSelector(activeIndex);
    }
  }, [activeIndex, updateSelector, i18n.language]);

  // Update on resize
  useEffect(() => {
    const onResize = () => updateSelector(pressedIndex ?? activeIndex);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [updateSelector, pressedIndex, activeIndex]);

  return (
    <nav className="fixed bottom-4 left-0 right-0 z-50 px-4 max-w-[800px] mx-auto">
      <div className="bg-white/50 dark:bg-card/70 backdrop-blur-2xl rounded-3xl shadow-lg border border-border/50 px-2 py-1.5 max-w-[400px] mx-auto">
        <div className="flex items-center justify-around relative">
          {/* iOS 26 liquid glass selector */}
          {selectorStyle && (
            <motion.div
              className="absolute overflow-hidden backdrop-blur-xl rounded-[22px] pointer-events-none z-0"
              initial={false}
              animate={{
                left: selectorStyle.left,
                width: selectorStyle.width,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{
                height: "100%",
                top: 0,
                background: "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.15) 100%)",
                boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3), 0 0 8px rgba(255,255,255,0.05)",
              }}
            >
              <div className="absolute inset-0 ring-1 ring-inset ring-white/30 dark:ring-white/15 rounded-[22px]" />
            </motion.div>
          )}
          
          {navItems.map((item, index) => {
            const active = isActive(item.path);
            
            if (item.path === "/settings") {
              // For unauthenticated users, show login button instead of avatar
              if (!isAuthenticated) {
                return (
                  <div
                    key={item.path}
                    ref={(el) => { tabRefs.current[index] = el; }}
                    onPointerDown={() => handleTabPress(index, "/auth/phone")}
                    className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-3xl transition-all relative z-10 touch-manipulation cursor-pointer"
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
                  </div>
                );
              }
              
              return (
                <div
                  key={item.path}
                  ref={(el) => { tabRefs.current[index] = el; }}
                  onPointerDown={() => handleTabPress(index, item.path)}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-3xl transition-all relative z-10 touch-manipulation cursor-pointer"
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
                </div>
              );
            }
            
            const Icon = item.icon!;
            return (
              <div
                key={item.path}
                ref={(el) => { tabRefs.current[index] = el; }}
                onPointerDown={() => handleTabPress(index, item.path)}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-3xl transition-all relative z-10 touch-manipulation cursor-pointer"
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
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
