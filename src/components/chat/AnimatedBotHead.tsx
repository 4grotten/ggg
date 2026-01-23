import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface AnimatedBotHeadProps {
  size?: "sm" | "lg";
  isUserTyping?: boolean;
}

export const AnimatedBotHead = ({ size = "sm", isUserTyping = false }: AnimatedBotHeadProps) => {
  const isLarge = size === "lg";
  const containerSize = isLarge ? "w-10 h-10" : "w-4 h-4";
  const [animationPhase, setAnimationPhase] = useState<"idle" | "jumping" | "clapping">("idle");
  const [showHands, setShowHands] = useState(false);

  useEffect(() => {
    if (isUserTyping && animationPhase === "idle") {
      // Start jumping
      setAnimationPhase("jumping");
      
      // After 3 jumps (~1.2s), start clapping
      const clappingTimer = setTimeout(() => {
        setShowHands(true);
        setAnimationPhase("clapping");
      }, 1200);

      // After clapping (~1.5s more), back to idle
      const idleTimer = setTimeout(() => {
        setAnimationPhase("idle");
        setShowHands(false);
      }, 2700);

      return () => {
        clearTimeout(clappingTimer);
        clearTimeout(idleTimer);
      };
    }
  }, [isUserTyping, animationPhase]);

  // Reset to idle when user stops typing
  useEffect(() => {
    if (!isUserTyping && animationPhase !== "idle") {
      const resetTimer = setTimeout(() => {
        setAnimationPhase("idle");
        setShowHands(false);
      }, 500);
      return () => clearTimeout(resetTimer);
    }
  }, [isUserTyping, animationPhase]);

  return (
    <motion.div 
      className={`relative ${containerSize}`}
      animate={
        animationPhase === "jumping" 
          ? { y: [0, -8, 0, -8, 0, -8, 0] }
          : { y: 0 }
      }
      transition={
        animationPhase === "jumping"
          ? { duration: 1.2, ease: "easeOut" }
          : { duration: 0.3 }
      }
    >
      {/* Bot head SVG - tall rectangular head like human */}
      <svg
        viewBox="0 0 24 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full text-current"
      >
        {/* Tall rectangular head */}
        <rect x="4" y="9" width="16" height="16" rx="2" />
        
        {/* Animated Antenna group */}
        <motion.g
          style={{ transformOrigin: "12px 9px" }}
          animate={{
            rotate: animationPhase === "jumping" 
              ? [0, -15, 15, -15, 15, -15, 15, 0]
              : [0, 8, 0, -8, 0, 5, -5, 0],
          }}
          transition={{
            duration: animationPhase === "jumping" ? 1.2 : 2,
            repeat: animationPhase === "jumping" ? 0 : Infinity,
            ease: "easeInOut",
          }}
        >
          <circle cx="12" cy="4" r="2" />
          <path d="M12 6v3" />
        </motion.g>
        
        {/* Ears */}
        <path d="M4 17h-2" />
        <path d="M22 17h-2" />
        
        {/* Animated eyes */}
        <motion.g
          animate={{
            scaleY: animationPhase === "clapping"
              ? [1, 0.1, 1] // Quick blinks during clapping
              : [1, 1, 1, 1, 1, 1, 0.1, 1, 0.1, 1, 0.1, 1, 1, 1, 1],
          }}
          transition={{
            duration: animationPhase === "clapping" ? 0.3 : 3,
            repeat: Infinity,
            ease: "easeInOut",
            times: animationPhase === "clapping" 
              ? undefined 
              : [0, 0.3, 0.33, 0.36, 0.5, 0.7, 0.73, 0.76, 0.79, 0.82, 0.85, 0.88, 0.9, 0.95, 1],
          }}
          style={{ transformOrigin: "12px 15px" }}
        >
          <motion.circle 
            cx="9" 
            cy="15" 
            r="1"
            animate={{
              cx: animationPhase === "idle" 
                ? [9, 10, 10, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9]
                : 9,
            }}
            transition={{
              duration: 3,
              repeat: animationPhase === "idle" ? Infinity : 0,
              ease: "easeInOut",
              times: [0, 0.1, 0.33, 0.35, 0.5, 0.52, 0.7, 0.73, 0.76, 0.79, 0.82, 0.85, 0.88, 0.95, 1],
            }}
          />
          <motion.circle 
            cx="15" 
            cy="15" 
            r="1"
            animate={{
              cx: animationPhase === "idle"
                ? [15, 16, 16, 14, 14, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15]
                : 15,
            }}
            transition={{
              duration: 3,
              repeat: animationPhase === "idle" ? Infinity : 0,
              ease: "easeInOut",
              times: [0, 0.1, 0.33, 0.35, 0.5, 0.52, 0.7, 0.73, 0.76, 0.79, 0.82, 0.85, 0.88, 0.95, 1],
            }}
          />
        </motion.g>

        {/* Animated Hands */}
        <AnimatePresence>
          {showHands && (
            <>
              {/* Left hand */}
              <motion.path
                d="M2 20 L4 17"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: 1,
                  rotate: animationPhase === "clapping" ? [0, 25, 0, 25, 0, 25, 0] : 0
                }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={{ 
                  duration: animationPhase === "clapping" ? 1.5 : 0.3,
                  ease: "easeInOut"
                }}
                style={{ transformOrigin: "4px 17px" }}
              />
              {/* Left hand circle */}
              <motion.circle
                cx="1"
                cy="21"
                r="1.5"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  x: animationPhase === "clapping" ? [0, 4, 0, 4, 0, 4, 0] : 0,
                  y: animationPhase === "clapping" ? [0, -4, 0, -4, 0, -4, 0] : 0
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: animationPhase === "clapping" ? 1.5 : 0.3 }}
              />
              
              {/* Right hand */}
              <motion.path
                d="M22 20 L20 17"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: 1,
                  rotate: animationPhase === "clapping" ? [0, -25, 0, -25, 0, -25, 0] : 0
                }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={{ 
                  duration: animationPhase === "clapping" ? 1.5 : 0.3,
                  ease: "easeInOut"
                }}
                style={{ transformOrigin: "20px 17px" }}
              />
              {/* Right hand circle */}
              <motion.circle
                cx="23"
                cy="21"
                r="1.5"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  x: animationPhase === "clapping" ? [0, -4, 0, -4, 0, -4, 0] : 0,
                  y: animationPhase === "clapping" ? [0, -4, 0, -4, 0, -4, 0] : 0
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: animationPhase === "clapping" ? 1.5 : 0.3 }}
              />
            </>
          )}
        </AnimatePresence>
      </svg>
    </motion.div>
  );
};
