import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  isAuthenticated: boolean;
  displayName: string;
  displayAvatar?: string;
  isVerified: boolean;
  onAccountSwitcherOpen: () => void;
}

export const DashboardHeader = ({
  isAuthenticated,
  displayName,
  displayAvatar,
  isVerified,
  onAccountSwitcherOpen,
}: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handlePointerDown = () => {
    longPressTimer.current = setTimeout(() => {
      onAccountSwitcherOpen();
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  if (!isAuthenticated) {
    return (
      <motion.button
        onClick={() => navigate("/auth/phone")}
        className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/25"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.2,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <LogIn className="w-5 h-5 text-primary-foreground" />
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={() => navigate("/settings")}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="relative"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.2,
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        initial={{ boxShadow: "0 0 0 0 rgba(var(--primary), 0)" }}
        animate={{
          boxShadow: [
            "0 0 0 0 hsl(var(--primary) / 0.4)",
            "0 0 0 8px hsl(var(--primary) / 0)",
            "0 0 0 0 hsl(var(--primary) / 0)",
          ],
        }}
        transition={{ duration: 1.5, delay: 0.5 }}
        className="rounded-full"
      >
        <Avatar className="w-10 h-10 ring-2 ring-transparent transition-all duration-300 hover:ring-primary/50">
          <AvatarImage src={displayAvatar} alt={displayName} className="object-cover" />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </motion.div>
      <motion.div
        className={cn(
          "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 border-background",
          isVerified ? "bg-green-500" : "bg-red-500"
        )}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.6 }}
      >
        {isVerified ? (
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-white"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        ) : (
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-white"
            animate={{
              opacity: [1, 0.3, 1],
              scale: [1, 0.8, 1],
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </motion.div>
    </motion.button>
  );
};
