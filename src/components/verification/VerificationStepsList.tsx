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
  
  // Animation states
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [completedAnimationIndices, setCompletedAnimationIndices] = useState<number[]>([]);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'step1' | 'step1-complete' | 'step2' | 'step3' | 'done'>('idle');

  // Elevator animation with delays between floors
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    if (isReturning) {
      // Phase 1: Highlight step 1 (questionnaire)
      timers.push(
        setTimeout(() => {
          setAnimationPhase('step1');
          setHighlightedIndex(0);
        }, 400)
      );
      
      // Phase 2: Step 1 becomes green with checkmark
      timers.push(
        setTimeout(() => {
          setAnimationPhase('step1-complete');
          setCompletedAnimationIndices([0]);
          setHighlightedIndex(null);
        }, 1000)
      );
      
      // Phase 3: Elevator moves to step 2
      timers.push(
        setTimeout(() => {
          setAnimationPhase('step2');
          setHighlightedIndex(1);
        }, 1600)
      );
      
      // Phase 4: Elevator moves to step 3
      timers.push(
        setTimeout(() => {
          setAnimationPhase('step3');
          setHighlightedIndex(2);
        }, 2200)
      );
      
      // Phase 5: Both step 2 and 3 highlighted together
      timers.push(
        setTimeout(() => {
          setAnimationPhase('done');
        }, 2800)
      );
    } else {
      // For new users: animate from bottom to top
      for (let i = steps.length - 1; i >= 0; i--) {
        const delay = (steps.length - 1 - i) * 400;
        timers.push(
          setTimeout(() => {
            setHighlightedIndex(i);
            if (i === 0) {
              setTimeout(() => setAnimationPhase('done'), 300);
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
        const isCompletedByAnimation = completedAnimationIndices.includes(index);
        const isCompleted = step.status === "completed" || isCompletedByAnimation;
        // After animation done, steps 2 and 3 should be highlighted as "current" (blue)
        const isCurrent = animationPhase === 'done' && index >= 1 && isReturning;
        
        return (
          <motion.div 
            key={step.id} 
            className="flex items-start gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1, duration: 0.4, ease: "easeOut" }}
          >
            <motion.div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              animate={{
                scale: isHighlighted ? [1, 1.15, 1] : 1,
                backgroundColor: isCompleted 
                  ? "rgb(34, 197, 94)" 
                  : isHighlighted || isCurrent
                  ? "#007AFF" 
                  : "hsl(var(--secondary))",
              }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <motion.div
                animate={{ 
                  scale: isHighlighted ? [1, 1.2, 1] : 1,
                  color: isCompleted || isHighlighted || isCurrent ? "#ffffff" : "hsl(var(--muted-foreground))"
                }}
                transition={{ duration: 0.3 }}
              >
                {isCompleted ? <Check className="w-5 h-5" strokeWidth={2.5} /> : step.icon}
              </motion.div>
            </motion.div>
            <div className="flex-1 pt-2">
              <motion.p 
                className="text-xs flex items-center gap-1"
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
                {t('verify.steps.step')} {index + 1}
                {isCompleted && (
                  <motion.span
                    className="flex items-center gap-1 ml-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  >
                    • {t('verify.steps.completed')} <Check className="w-3 h-3" strokeWidth={3} />
                  </motion.span>
                )}
              </motion.p>
              <motion.p 
                className="font-medium"
                animate={{ 
                  color: isCompleted 
                    ? "rgb(34, 197, 94)" 
                    : isHighlighted || isCurrent 
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
