import { useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const STORAGE_KEY = "verification_progress";
const FORM_DATA_KEY = "verification_form_data";
const PASSPORT_STATUS_KEY = "verification_passport_status";

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

export interface VerificationFormData {
  // PersonalInfo
  occupation?: string;
  salary?: string;
  purpose?: string;
  otherPurpose?: string;
  // MonthlyVolume
  volume?: string;
  crypto?: string;
  // AddressInfo
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  countryCode?: string;
  // DocumentType
  documentType?: string;
  issuingCountry?: string;
}

export interface PassportStatus {
  needsUpdate: boolean;
  completedSteps: number;
}

export const useVerificationProgress = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get passport status (for passport holders who need to update data)
  const getPassportStatus = useCallback((): PassportStatus | null => {
    const saved = localStorage.getItem(PASSPORT_STATUS_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }, []);

  // Set passport status
  const setPassportStatus = useCallback((status: PassportStatus | null) => {
    if (status) {
      localStorage.setItem(PASSPORT_STATUS_KEY, JSON.stringify(status));
    } else {
      localStorage.removeItem(PASSPORT_STATUS_KEY);
    }
  }, []);

  // Calculate completed steps (0, 1, 2, or 3) based on saved progress
  const getCompletedSteps = useCallback((): number => {
    // Check passport status first
    const passportStatus = getPassportStatus();
    if (passportStatus?.needsUpdate) {
      return passportStatus.completedSteps;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return 0;
    
    const stepIndex = VERIFICATION_STEPS.indexOf(saved as VerificationStep);
    const addressIndex = VERIFICATION_STEPS.indexOf("/verify/address");
    const livenessIndex = VERIFICATION_STEPS.indexOf("/verify/liveness");
    
    // Step 1 (Questionnaire) complete when we're at or past /verify/address
    if (stepIndex >= addressIndex) {
      // Step 2 (Document) complete when at or past liveness
      if (stepIndex >= livenessIndex) {
        return 2;
      }
      return 1;
    }
    return 0;
  }, [getPassportStatus]);

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
    localStorage.removeItem(FORM_DATA_KEY);
  }, []);

  // Get form data (not using useCallback to avoid stale closures)
  const getFormData = (): VerificationFormData => {
    try {
      const saved = localStorage.getItem(FORM_DATA_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  // Save form data
  const saveFormData = useCallback((data: Partial<VerificationFormData>) => {
    try {
      const saved = localStorage.getItem(FORM_DATA_KEY);
      const existing = saved ? JSON.parse(saved) : {};
      const updated = { ...existing, ...data };
      localStorage.setItem(FORM_DATA_KEY, JSON.stringify(updated));
    } catch {
      // Ignore errors
    }
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
        // Only save if current step is further than saved step
        const savedStep = getSavedProgress();
        const savedIndex = savedStep ? VERIFICATION_STEPS.indexOf(savedStep) : -1;
        const currentIndex = VERIFICATION_STEPS.indexOf(currentPath);
        
        // Only update progress if we're moving forward or there's no saved progress
        if (currentIndex > savedIndex) {
          saveProgress(currentPath);
        }
      }
      // Clear progress when complete
      if (currentPath === "/verify/complete") {
        clearProgress();
      }
    }
  }, [location.pathname, saveProgress, clearProgress, getSavedProgress]);

  return {
    saveProgress,
    getSavedProgress,
    clearProgress,
    redirectToSavedProgress,
    saveFormData,
    getFormData,
    getCompletedSteps,
    getPassportStatus,
    setPassportStatus,
  };
};
