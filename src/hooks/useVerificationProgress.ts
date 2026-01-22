import { useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const STORAGE_KEY = "verification_progress";

// Order of verification steps
const VERIFICATION_STEPS = [
  "/verify",
  "/verify/terms",
  "/verify/steps",
  "/verify/personal-info",
  "/verify/monthly-volume",
  "/verify/address",
  "/verify/document-type",
  "/verify/document-upload",
  "/verify/document-capture-front",
  "/verify/document-capture-back",
  "/verify/liveness",
  "/verify/processing",
  "/verify/complete",
] as const;

type VerificationStep = (typeof VERIFICATION_STEPS)[number];

export const useVerificationProgress = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Save current step to localStorage
  const saveProgress = useCallback((step: VerificationStep) => {
    localStorage.setItem(STORAGE_KEY, step);
  }, []);

  // Get saved progress from localStorage
  const getSavedProgress = useCallback((): VerificationStep | null => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && VERIFICATION_STEPS.includes(saved as VerificationStep)) {
      return saved as VerificationStep;
    }
    return null;
  }, []);

  // Clear progress (when verification is complete)
  const clearProgress = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Check if user should be redirected to saved progress
  const redirectToSavedProgress = useCallback(() => {
    const savedStep = getSavedProgress();
    const currentPath = location.pathname;

    // Only redirect if we're at the start of verification flow
    // and there's saved progress that's further along
    if (savedStep && currentPath === "/verify") {
      const savedIndex = VERIFICATION_STEPS.indexOf(savedStep);
      const currentIndex = VERIFICATION_STEPS.indexOf(currentPath as VerificationStep);

      // If saved step is further along (and not complete/processing)
      if (savedIndex > currentIndex && savedIndex < VERIFICATION_STEPS.indexOf("/verify/processing")) {
        return savedStep;
      }
    }
    return null;
  }, [getSavedProgress, location.pathname]);

  // Auto-save progress when on a verification page
  useEffect(() => {
    const currentPath = location.pathname as VerificationStep;
    if (VERIFICATION_STEPS.includes(currentPath)) {
      // Don't save processing or complete steps
      if (currentPath !== "/verify/processing" && currentPath !== "/verify/complete") {
        saveProgress(currentPath);
      }
      // Clear progress when complete
      if (currentPath === "/verify/complete") {
        clearProgress();
      }
    }
  }, [location.pathname, saveProgress, clearProgress]);

  return {
    saveProgress,
    getSavedProgress,
    clearProgress,
    redirectToSavedProgress,
  };
};
