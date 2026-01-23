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
}

export const VerificationStepsList = ({ steps }: VerificationStepsListProps) => {
  const { t } = useTranslation();
  const [highlightedIndex, setHighlightedIndex] = useState(steps.length - 1);
  const [animationComplete, setAnimationComplete] = useState(false);

  // Elevator animation: start from last step, move up to first
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    // Animate from bottom to top
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
    
    return () => timers.forEach(clearTimeout);
  }, [steps.length]);

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isHighlighted = highlightedIndex === index;
        const isPassed = highlightedIndex < index;
        const isCurrent = animationComplete && index === 0;
        
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
                step.status === "completed"
                  ? "bg-primary text-primary-foreground"
                  : isCurrent
                  ? "bg-[#007AFF] text-white"
                  : "bg-secondary text-muted-foreground"
              }`}
              animate={{
                borderWidth: isHighlighted || isCurrent ? 2 : 0,
                borderColor: isHighlighted || isCurrent ? "#007AFF" : "transparent",
                scale: isHighlighted ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ borderStyle: "solid" }}
            >
              {step.status === "completed" ? (
                <Check className="w-5 h-5" />
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
                  color: isHighlighted || isCurrent ? "#007AFF" : "hsl(var(--muted-foreground))",
                  scale: isHighlighted ? [1, 1.05, 1] : 1,
                  fontWeight: isHighlighted ? 600 : 400
                }}
                transition={{ duration: 0.3 }}
              >
                {t('verify.steps.step')} {index + 1}
              </motion.p>
              <motion.p 
                className="font-medium"
                animate={{ 
                  color: isCurrent ? "#007AFF" : undefined 
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