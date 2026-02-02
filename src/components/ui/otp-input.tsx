/**
 * OTP Input with iOS/Android autofill support
 * Uses a single hidden input for native autofill + visual 6-cell display
 * Modern futuristic design with glow effects
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export const OtpInput = React.forwardRef<HTMLInputElement, OtpInputProps>(
  ({ value, onChange, disabled, error, autoFocus, className }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = React.useState(false);
    
    const combinedRef = (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value.replace(/\D/g, "").slice(0, 6);
      onChange(next);
    };

    const handleContainerClick = () => {
      inputRef.current?.focus();
    };

    // Split value into 6 digits for display
    const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");

    return (
      <div
        className={cn("relative flex justify-center gap-2 sm:gap-3", className)}
        onClick={handleContainerClick}
      >
        {/* Hidden input for iOS/Android autofill */}
        <input
          ref={combinedRef}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          enterKeyHint="done"
          maxLength={6}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-label="Verification code"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ caretColor: "transparent" }}
        />

        {/* Visual cells with futuristic design */}
        {digits.map((digit, index) => {
          const isFilled = digit !== "" && digit !== " ";
          const isCurrentIndex = index === value.length;
          const isActive = isFocused && isCurrentIndex;
          
          return (
            <motion.div
              key={index}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
              }}
              transition={{ 
                delay: index * 0.05,
                type: "spring",
                stiffness: 400,
                damping: 25
              }}
              className="relative"
            >
              {/* Glow effect behind */}
              <div
                className={cn(
                  "absolute -inset-1 rounded-2xl blur-md transition-all duration-300",
                  error
                    ? "bg-destructive/40"
                    : isFilled
                      ? "bg-primary/30"
                      : isActive
                        ? "bg-primary/20"
                        : "bg-transparent"
                )}
              />
              
              {/* Main cell */}
              <motion.div
                animate={isFilled ? { 
                  scale: [1, 1.05, 1],
                } : {}}
                transition={{ duration: 0.2 }}
                className={cn(
                  "relative w-11 h-14 sm:w-12 sm:h-16 flex items-center justify-center rounded-xl border-2 backdrop-blur-sm transition-all duration-300 select-none overflow-hidden",
                  // Background
                  "bg-gradient-to-b from-background/80 to-background/40",
                  // Border styles
                  error
                    ? "border-destructive shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                    : isFilled
                      ? "border-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                      : isActive
                        ? "border-primary/60 shadow-[0_0_15px_hsl(var(--primary)/0.2)]"
                        : "border-border/50",
                  disabled && "opacity-50"
                )}
              >
                {/* Inner highlight */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                
                {/* Digit display */}
                {isFilled ? (
                  <motion.span
                    initial={{ scale: 0, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className={cn(
                      "text-2xl sm:text-3xl font-bold",
                      error ? "text-destructive" : "text-foreground"
                    )}
                  >
                    {digit}
                  </motion.span>
                ) : isActive ? (
                  // Blinking cursor
                  <motion.div
                    animate={{ opacity: [1, 0] }}
                    transition={{ 
                      duration: 0.8, 
                      repeat: Infinity, 
                      repeatType: "reverse" 
                    }}
                    className="w-0.5 h-6 sm:h-7 bg-primary rounded-full"
                  />
                ) : null}
                
                {/* Bottom accent line */}
                <div 
                  className={cn(
                    "absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-300",
                    isFilled 
                      ? "w-3/4 bg-primary" 
                      : isActive 
                        ? "w-1/2 bg-primary/60"
                        : "w-0 bg-border"
                  )}
                />
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    );
  }
);

OtpInput.displayName = "OtpInput";
