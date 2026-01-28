/**
 * OTP Input with iOS/Android autofill support
 * Uses a single hidden input for native autofill + visual 6-cell display
 */

import * as React from "react";
import { cn } from "@/lib/utils";

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
        className={cn("relative flex justify-center gap-3", className)}
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
          disabled={disabled}
          autoFocus={autoFocus}
          aria-label="Verification code"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ caretColor: "transparent" }}
        />

        {/* Visual cells */}
        {digits.map((digit, index) => {
          const isFilled = digit !== "" && digit !== " ";
          const isFocused = document.activeElement === inputRef.current && index === value.length;
          
          return (
            <div
              key={index}
              className={cn(
                "w-12 h-14 flex items-center justify-center text-2xl font-bold rounded-xl border-2 bg-background transition-all duration-200 select-none",
                error
                  ? "border-destructive text-destructive"
                  : isFilled
                    ? "border-primary"
                    : "border-border",
                disabled && "opacity-50"
              )}
            >
              {isFilled ? digit : ""}
            </div>
          );
        })}
      </div>
    );
  }
);

OtpInput.displayName = "OtpInput";
