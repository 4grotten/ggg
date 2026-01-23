import { motion } from "framer-motion";

interface AnimatedBotHeadProps {
  size?: "sm" | "lg";
}

export const AnimatedBotHead = ({ size = "sm" }: AnimatedBotHeadProps) => {
  const isLarge = size === "lg";
  const containerSize = isLarge ? "w-10 h-10" : "w-4 h-4";

  return (
    <div className={`relative ${containerSize}`}>
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
            rotate: [0, 8, 0, -8, 0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
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
            scaleY: [1, 1, 1, 1, 1, 1, 0.1, 1, 0.1, 1, 0.1, 1, 1, 1, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.3, 0.33, 0.36, 0.5, 0.7, 0.73, 0.76, 0.79, 0.82, 0.85, 0.88, 0.9, 0.95, 1],
          }}
          style={{ transformOrigin: "12px 15px" }}
        >
          <motion.circle 
            cx="9" 
            cy="15" 
            r="1"
            animate={{
              cx: [9, 10, 10, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.1, 0.33, 0.35, 0.5, 0.52, 0.7, 0.73, 0.76, 0.79, 0.82, 0.85, 0.88, 0.95, 1],
            }}
          />
          <motion.circle 
            cx="15" 
            cy="15" 
            r="1"
            animate={{
              cx: [15, 16, 16, 14, 14, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.1, 0.33, 0.35, 0.5, 0.52, 0.7, 0.73, 0.76, 0.79, 0.82, 0.85, 0.88, 0.95, 1],
            }}
          />
        </motion.g>
      </svg>
    </div>
  );
};
