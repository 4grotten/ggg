import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface VerificationStep {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  status: "pending" | "current" | "completed";
}

interface VerificationStepsListProps {
  steps: VerificationStep[];
  startFromStep?: number; // Start elevator animation from this step (for returning users)
}

export const VerificationStepsList = ({ steps, startFromStep }: VerificationStepsListProps) => {
  const { t } = useTranslation();
  const isReturning = startFromStep !== undefined;
  
  // For returning users: animate from startFromStep down to last, for new users: bottom to top
  const [highlightedIndex, setHighlightedIndex] = useState(
    isReturning ? startFromStep : steps.length - 1
  );
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showCompletedCheck, setShowCompletedCheck] = useState(isReturning);

  // Elevator animation
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    if (isReturning) {
      // For returning users: start from completed step, animate to next steps
      // First show the completed checkmark, then animate to steps 2 and 3
      timers.push(
        setTimeout(() => {
          setHighlightedIndex(1); // Move to step 2 (document)
          setTimeout(() => {
            setHighlightedIndex(2); // Move to step 3 (liveness)
            setTimeout(() => {
              setHighlightedIndex(1); // Return to step 2 (current step)
              setAnimationComplete(true);
            }, 400);
          }, 400);
        }, 600)
      );
    } else {
      // For new users: animate from bottom to top
      for (let i = steps.length - 1; i >= 0; i--) {
        const delay = (steps.length - 1 - i) * 400;
        timers.push(
          setTimeout(() => {
            setHighlightedIndex(i);
            if (i === 0) {
              setTimeout(() => setAnimationComplete(true), 300);
            }
          }, delay + 600)
        );
      }
    }
    
    return () => timers.forEach(clearTimeout);
  }, [steps.length, isReturning, startFromStep]);

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isHighlighted = highlightedIndex === index;
        const isCompleted = step.status === "completed";
        const isCurrent = animationComplete && step.status === "current";
        
        return (
          <motion.div 
            key={step.id} 
            className="flex items-start gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1, duration: 0.4, ease: "easeOut" }}
          >
            <motion.div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                isCompleted
                  ? "bg-green-500 text-white"
                  : isCurrent
                  ? "bg-[#007AFF] text-white"
                  : "bg-secondary text-muted-foreground"
              }`}
              animate={{
                borderWidth: isHighlighted || isCurrent ? 2 : 0,
                borderColor: isHighlighted ? "#007AFF" : isCurrent ? "#007AFF" : "transparent",
                scale: isHighlighted ? [1, 1.1, 1] : 1,
                backgroundColor: isCompleted 
                  ? "rgb(34, 197, 94)" 
                  : isCurrent 
                  ? "#007AFF" 
                  : undefined,
              }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ borderStyle: "solid" }}
            >
              {isCompleted && showCompletedCheck ? (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 15,
                    delay: 0.3 
                  }}
                >
                  <Check className="w-5 h-5" strokeWidth={3} />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ 
                    scale: isHighlighted ? [1, 1.2, 1] : 1,
                    color: isCurrent ? "#ffffff" : undefined
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {step.icon}
                </motion.div>
              )}
            </motion.div>
            <div className="flex-1 pt-2">
              <motion.p 
                className="text-xs"
                animate={{ 
                  color: isCompleted 
                    ? "rgb(34, 197, 94)" 
                    : isHighlighted || isCurrent 
                    ? "#007AFF" 
                    : "hsl(var(--muted-foreground))",
                  scale: isHighlighted ? [1, 1.05, 1] : 1,
                  fontWeight: isHighlighted ? 600 : 400
                }}
                transition={{ duration: 0.3 }}
              >
                {isCompleted ? (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    ✓ {t('verify.steps.completed')}
                  </motion.span>
                ) : (
                  <>{t('verify.steps.step')} {index + 1}</>
                )}
              </motion.p>
              <motion.p 
                className="font-medium"
                animate={{ 
                  color: isCompleted 
                    ? "rgb(34, 197, 94)" 
                    : isCurrent 
                    ? "#007AFF" 
                    : undefined 
                }}
                transition={{ duration: 0.3 }}
              >
                {step.title}
              </motion.p>
              {step.description && (
                <p className="text-sm text-muted-foreground">{step.description}</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
