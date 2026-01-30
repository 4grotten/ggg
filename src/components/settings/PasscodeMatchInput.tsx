import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
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

  useEffect(() => {
    if (!autoFocus) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [autoFocus]);

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
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        className="sr-only"
      />

      <motion.button
        type="button"
        onClick={() => inputRef.current?.focus()}
        animate={shake ? { x: [-8, 8, -8, 8, 0] } : undefined}
        transition={{ duration: 0.35 }}
        className="w-full flex items-center justify-center gap-3 py-3"
        aria-label="Passcode input"
      >
        {perIndexState.map((state, i) => (
          <span
            key={i}
            className={cn(
              "w-4 h-4 rounded-full transition-colors",
              state === "empty" && "bg-muted",
              state === "filled" && "bg-primary",
              state === "match" && "bg-primary",
              state === "mismatch" && "bg-destructive"
            )}
          />
        ))}
      </motion.button>
    </div>
  );
};
