import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface AnimatedBotHeadProps {
  size?: "sm" | "lg";
  isUserTyping?: boolean;
}

export const AnimatedBotHead = ({ size = "sm", isUserTyping = false }: AnimatedBotHeadProps) => {
  const isLarge = size === "lg";
  const containerSize = isLarge ? "w-12 h-14" : "w-5 h-6";
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

      // After clapping (~1.8s more), back to idle
      const idleTimer = setTimeout(() => {
        setAnimationPhase("idle");
        setShowHands(false);
      }, 3000);

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
          ? { y: [0, -6, 0, -6, 0, -6, 0] }
          : { y: 0 }
      }
      transition={
        animationPhase === "jumping"
          ? { duration: 1.2, ease: "easeOut" }
          : { duration: 0.3 }
      }
    >
      {/* Bot SVG with extended viewBox for hands */}
      <svg
        viewBox="-6 0 36 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full text-current overflow-visible"
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
              ? [1, 0.1, 1]
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
              {/* Left arm and hand */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.line
                  x1="4"
                  y1="18"
                  x2="-2"
                  y2="22"
                  strokeWidth="2"
                  animate={{
                    x2: animationPhase === "clapping" ? [-2, 6, -2, 6, -2, 6, -2] : -2,
                    y2: animationPhase === "clapping" ? [22, 16, 22, 16, 22, 16, 22] : 22,
                  }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
                <motion.circle
                  cx="-3"
                  cy="23"
                  r="2"
                  fill="currentColor"
                  animate={{
                    cx: animationPhase === "clapping" ? [-3, 7, -3, 7, -3, 7, -3] : -3,
                    cy: animationPhase === "clapping" ? [23, 15, 23, 15, 23, 15, 23] : 23,
                  }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </motion.g>
              
              {/* Right arm and hand */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.line
                  x1="20"
                  y1="18"
                  x2="26"
                  y2="22"
                  strokeWidth="2"
                  animate={{
                    x2: animationPhase === "clapping" ? [26, 18, 26, 18, 26, 18, 26] : 26,
                    y2: animationPhase === "clapping" ? [22, 16, 22, 16, 22, 16, 22] : 22,
                  }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
                <motion.circle
                  cx="27"
                  cy="23"
                  r="2"
                  fill="currentColor"
                  animate={{
                    cx: animationPhase === "clapping" ? [27, 17, 27, 17, 27, 17, 27] : 27,
                    cy: animationPhase === "clapping" ? [23, 15, 23, 15, 23, 15, 23] : 23,
                  }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </motion.g>
            </>
          )}
        </AnimatePresence>
      </svg>
    </motion.div>
  );
};
