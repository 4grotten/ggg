import { useCallback } from "react";

// Telegram WebApp HapticFeedback types
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

type HapticStyle = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid';
type NotificationType = 'success' | 'error' | 'warning';

const HAPTIC_STORAGE_KEY = 'haptic_feedback_enabled';

// Get haptic enabled state from localStorage
export function isHapticEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(HAPTIC_STORAGE_KEY);
  // Default to true if not set
  return stored === null ? true : stored === 'true';
}

// Set haptic enabled state
export function setHapticEnabled(enabled: boolean): void {
  localStorage.setItem(HAPTIC_STORAGE_KEY, String(enabled));
}

// Check if Telegram WebApp is available
function isTelegramWebApp(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp?.HapticFeedback;
}

// Check if Web Vibration API is available
function hasVibrationAPI(): boolean {
  return typeof window !== 'undefined' && 'vibrate' in navigator;
}

// Vibration patterns in ms
const VIBRATION_PATTERNS: Record<string, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  soft: 15,
  rigid: 30,
  success: [10, 30, 10],
  error: [50, 30, 50, 30, 50],
  warning: [30, 20, 30],
  selection: 5,
};

export function useHapticFeedback() {
  // Impact feedback - for button presses, UI interactions
  const impact = useCallback((style: HapticStyle = 'light') => {
    if (!isHapticEnabled()) return;

    if (isTelegramWebApp()) {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
    } else if (hasVibrationAPI()) {
      navigator.vibrate(VIBRATION_PATTERNS[style] as number);
    }
  }, []);

  // Notification feedback - for success/error/warning
  const notification = useCallback((type: NotificationType) => {
    if (!isHapticEnabled()) return;

    if (isTelegramWebApp()) {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type);
    } else if (hasVibrationAPI()) {
      navigator.vibrate(VIBRATION_PATTERNS[type] as number[]);
    }
  }, []);

  // Selection feedback - for tab switches, selections
  const selection = useCallback(() => {
    if (!isHapticEnabled()) return;

    if (isTelegramWebApp()) {
      window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
    } else if (hasVibrationAPI()) {
      navigator.vibrate(VIBRATION_PATTERNS.selection as number);
    }
  }, []);

  // Quick shortcuts
  const success = useCallback(() => notification('success'), [notification]);
  const error = useCallback(() => notification('error'), [notification]);
  const warning = useCallback(() => notification('warning'), [notification]);
  const tap = useCallback(() => impact('light'), [impact]);

  return {
    impact,
    notification,
    selection,
    success,
    error,
    warning,
    tap,
  };
}

// Standalone functions for use outside React components
export const hapticFeedback = {
  impact: (style: HapticStyle = 'light') => {
    if (!isHapticEnabled()) return;
    if (isTelegramWebApp()) {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
    } else if (hasVibrationAPI()) {
      navigator.vibrate(VIBRATION_PATTERNS[style] as number);
    }
  },
  notification: (type: NotificationType) => {
    if (!isHapticEnabled()) return;
    if (isTelegramWebApp()) {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type);
    } else if (hasVibrationAPI()) {
      navigator.vibrate(VIBRATION_PATTERNS[type] as number[]);
    }
  },
  selection: () => {
    if (!isHapticEnabled()) return;
    if (isTelegramWebApp()) {
      window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
    } else if (hasVibrationAPI()) {
      navigator.vibrate(VIBRATION_PATTERNS.selection as number);
    }
  },
  success: () => hapticFeedback.notification('success'),
  error: () => hapticFeedback.notification('error'),
  warning: () => hapticFeedback.notification('warning'),
  tap: () => hapticFeedback.impact('light'),
};
