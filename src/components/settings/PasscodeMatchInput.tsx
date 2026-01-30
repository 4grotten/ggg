import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface PasscodeMatchInputProps {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  /** If provided, entered digits are compared position-by-position and highlighted. */
  compareTo?: string;
  autoFocus?: boolean;
}

export const PasscodeMatchInput = ({
  value,
  onChange,
  length = 4,
  compareTo,
  autoFocus,
}: PasscodeMatchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [shake, setShake] = useState(false);
  const focusAttempts = useRef(0);

  // More aggressive focus for iOS - needs user gesture context sometimes
  const focusInput = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    
    // Clear and refocus to ensure keyboard appears
    input.blur();
    requestAnimationFrame(() => {
      input.focus();
      input.click(); // Extra trigger for iOS
    });
  }, []);

  useEffect(() => {
    if (!autoFocus) return;
    
    // Multiple attempts for iOS reliability
    const attemptFocus = () => {
      if (focusAttempts.current >= 3) return;
      focusAttempts.current++;
      
      const input = inputRef.current;
      if (input) {
        input.focus();
        // Check if actually focused, retry if not
        setTimeout(() => {
          if (document.activeElement !== input) {
            attemptFocus();
          }
        }, 100);
      }
    };
    
    // Initial delay for drawer animation
    const timer = setTimeout(attemptFocus, 150);
    return () => clearTimeout(timer);
  }, [autoFocus]);

  // Reset focus attempts when value changes (new phase)
  useEffect(() => {
    focusAttempts.current = 0;
  }, [compareTo]);

  const perIndexState = useMemo(() => {
    return Array.from({ length }).map((_, i) => {
      const hasDigit = i < value.length;
      if (!hasDigit) return "empty" as const;
      if (!compareTo) return "filled" as const;
      return value[i] === compareTo[i] ? ("match" as const) : ("mismatch" as const);
    });
  }, [compareTo, length, value]);

  const hasMismatch = perIndexState.some((s) => s === "mismatch");

  useEffect(() => {
    if (!compareTo) return;
    if (hasMismatch) {
      setShake(true);
      const t = window.setTimeout(() => setShake(false), 350);
      return () => window.clearTimeout(t);
    }
  }, [compareTo, hasMismatch]);

  return (
    <div className="w-full">
      {/* Hidden input for native numeric keyboard */}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          const next = e.target.value.replace(/\D/g, "").slice(0, length);
          onChange(next);
        }}
        onPaste={(e) => {
          // Handle paste for iOS password managers
          const pasted = e.clipboardData.getData("text");
          const digits = pasted.replace(/\D/g, "").slice(0, length);
          if (digits) {
            e.preventDefault();
            onChange(digits);
          }
        }}
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        autoCapitalize="off"
        autoCorrect="off"
        enterKeyHint="done"
        className="sr-only"
      />

      <motion.button
        type="button"
        onClick={focusInput}
        animate={shake ? { x: [-8, 8, -8, 8, 0] } : undefined}
        transition={{ duration: 0.35 }}
        className="w-full flex items-center justify-center gap-4 py-4"
        aria-label="Passcode input"
      >
        <AnimatePresence mode="popLayout">
          {perIndexState.map((state, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                backgroundColor:
                  state === "empty"
                    ? "hsl(var(--muted))"
                    : state === "mismatch"
                    ? "hsl(var(--destructive))"
                    : "hsl(var(--primary))",
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={cn(
                "w-5 h-5 rounded-full"
              )}
            />
          ))}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};