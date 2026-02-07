import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordMatchInputProps {
  password: string;
  confirmPassword: string;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  passwordLabel: string;
  confirmLabel: string;
  passwordPlaceholder: string;
  confirmPlaceholder: string;
  minCharsHint?: string;
}

export const PasswordMatchInput = ({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  passwordLabel,
  confirmLabel,
  passwordPlaceholder,
  confirmPlaceholder,
  minCharsHint,
}: PasswordMatchInputProps) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);

  // Character-by-character comparison
  const charComparison = useMemo(() => {
    if (!confirmPassword) return [];
    
    return confirmPassword.split("").map((char, index) => {
      if (index >= password.length) {
        return { char, match: false, exists: false };
      }
      return { 
        char, 
        match: char === password[index], 
        exists: true 
      };
    });
  }, [password, confirmPassword]);

  const allMatch = confirmPassword.length > 0 && 
    confirmPassword.length === password.length && 
    charComparison.every(c => c.match);

  return (
    <div className="space-y-4">
      {/* New Password */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {passwordLabel}
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder={passwordPlaceholder}
            className="flex h-14 w-full rounded-2xl border border-border bg-card px-4 pr-12 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {minCharsHint && (
          <p className="text-xs text-muted-foreground">{minCharsHint}</p>
        )}
      </div>

      {/* Confirm Password with character matching */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {confirmLabel}
        </label>
        <div className="relative">
          {/* Hidden actual input */}
          <input
            type="text"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            onFocus={() => setIsConfirmFocused(true)}
            onBlur={() => setIsConfirmFocused(false)}
            className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-text"
            autoComplete="off"
          />
          
          {/* Visual representation */}
          <div 
            className={cn(
              "flex h-14 w-full rounded-2xl border bg-card px-4 pr-12 items-center transition-colors duration-300",
              confirmPassword.length === 0 
                ? "border-border" 
                : allMatch 
                  ? "border-green-500" 
                  : "border-red-500"
            )}
          >
            {confirmPassword.length === 0 ? (
              <div className="flex items-center">
                {isConfirmFocused && (
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-0.5 h-5 bg-primary mr-1"
                  />
                )}
                <span className="text-muted-foreground text-base">{confirmPlaceholder}</span>
              </div>
            ) : (
              <div className="flex items-center gap-0.5 overflow-hidden h-6">
                <AnimatePresence mode="popLayout">
                  {charComparison.map((item, index) => (
                    <motion.span
                      key={`${index}-${item.char}-${allMatch ? 'text' : 'dot'}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: 1, 
                        opacity: 1,
                      }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 500,
                        damping: 25,
                        delay: index * 0.02
                      }}
                      className="relative flex items-center justify-center w-4 h-6"
                    >
                      {(showConfirmPassword || allMatch) ? (
                        // Show actual characters with color
                        <motion.span
                          animate={item.match ? {
                            color: "#22c55e",
                          } : {
                            color: "#ef4444",
                            x: [0, -2, 2, -2, 2, 0],
                          }}
                          transition={item.match ? {
                            duration: 0.3
                          } : {
                            duration: 0.4,
                            x: { duration: 0.3 }
                          }}
                          className="text-base font-medium"
                        >
                          {item.char}
                        </motion.span>
                      ) : (
                        // Show dots with color - centered in fixed container
                        <motion.div
                          animate={item.match ? {
                            scale: [1, 1.3, 1],
                          } : {
                            x: [0, -2, 2, -2, 2, 0],
                          }}
                          transition={item.match ? {
                            scale: { duration: 0.3 },
                          } : {
                            x: { duration: 0.3 },
                          }}
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.match ? "#22c55e" : "#ef4444" }}
                        />
                      )}
                      
                      {/* Success sparkle effect */}
                      {item.match && (
                        <motion.span
                          initial={{ scale: 0, opacity: 1 }}
                          animate={{ scale: 2, opacity: 0 }}
                          transition={{ duration: 0.4 }}
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                          <span className="w-1 h-1 rounded-full bg-green-400" />
                        </motion.span>
                      )}
                    </motion.span>
                  ))}
                </AnimatePresence>
                
                {/* Blinking cursor */}
                {isConfirmFocused && (
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-0.5 h-5 bg-foreground ml-0.5"
                  />
                )}
              </div>
            )}
          </div>
          
          {/* Toggle visibility button */}
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-20"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        
        {/* Match indicator */}
        <AnimatePresence>
          {confirmPassword.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2"
            >
              {allMatch ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1.5 text-green-500"
                >
                  <motion.svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.path
                      d="M5 13l4 4L19 7"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.svg>
                  <span className="text-xs font-medium">{t("editProfile.changePassword.passwordsMatch")}</span>
                </motion.div>
              ) : (
                <motion.span
                  initial={{ x: -5 }}
                  animate={{ x: 0 }}
                  className="text-xs text-red-500"
                >
                  {t("editProfile.changePassword.passwordsNotMatch")}
                </motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
