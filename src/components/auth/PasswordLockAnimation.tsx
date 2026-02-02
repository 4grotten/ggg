/**
 * PasswordLockAnimation - Cyclic animation:
 * Open lock → 6 asterisks appear → Closed lock
 * 3 second cycle
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LockOpen, Lock } from "lucide-react";

interface PasswordLockAnimationProps {
  className?: string;
}

export const PasswordLockAnimation = ({ className }: PasswordLockAnimationProps) => {
  const [phase, setPhase] = useState<'open' | 'typing' | 'closed'>('open');
  const [visibleDots, setVisibleDots] = useState(0);

  useEffect(() => {
    const runCycle = () => {
      // Phase 1: Open lock (0-1000ms) - 1 sec
      setPhase('open');
      setVisibleDots(0);

      // Phase 2: Typing dots (1000ms - 3000ms) - 2 sec
      setTimeout(() => {
        setPhase('typing');
      }, 1000);

      // Show dots one by one over 2 seconds (500ms per dot for 4 dots)
      for (let i = 1; i <= 4; i++) {
        setTimeout(() => {
          setVisibleDots(i);
        }, 1000 + i * 400);
      }

      // Phase 3: Closed lock (3000ms - 4000ms) - 1 sec
      setTimeout(() => {
        setPhase('closed');
      }, 3000);
    };

    // Initial run
    runCycle();

    // Set up interval for cycling (4 seconds total)
    const interval = setInterval(runCycle, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {phase === 'open' && (
          <motion.div
            key="open"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <LockOpen className="w-12 h-12 text-primary" />
          </motion.div>
        )}

        {phase === 'typing' && (
          <motion.div
            key="typing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1"
          >
            {[0, 1, 2, 3].map((index) => (
              <motion.span
                key={index}
                initial={{ scale: 0, opacity: 0 }}
                animate={index < visibleDots ? {
                  scale: [0, 1.3, 1],
                  opacity: 1
                } : {
                  scale: 0,
                  opacity: 0
                }}
                transition={{
                  duration: 0.2,
                  type: "spring",
                  stiffness: 400,
                  damping: 15
                }}
                className="text-3xl font-bold text-primary"
              >
                *
              </motion.span>
            ))}
          </motion.div>
        )}

        {phase === 'closed' && (
          <motion.div
            key="closed"
            initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              rotate: 0,
            }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ 
              duration: 0.3,
              type: "spring",
              stiffness: 300,
              damping: 20
            }}
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 0.4,
                delay: 0.2
              }}
            >
              <Lock className="w-12 h-12 text-green-500" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
