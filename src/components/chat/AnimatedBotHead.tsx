import { motion } from "framer-motion";

interface AnimatedBotHeadProps {
  size?: "sm" | "lg";
}

export const AnimatedBotHead = ({ size = "sm" }: AnimatedBotHeadProps) => {
  const isLarge = size === "lg";
  const containerSize = isLarge ? "w-14 h-14" : "w-6 h-6";
  const eyeWidth = isLarge ? 3 : 1.5;
  const eyeHeight = isLarge ? 6 : 3;
  const eyeGap = isLarge ? 8 : 4;

  return (
    <div className={`relative ${containerSize}`}>
      {/* Bot head SVG */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full text-current"
      >
        {/* Square head outline */}
        <rect x="3" y="11" width="18" height="10" />
        
        {/* Animated Antenna group */}
        <motion.g
          style={{ transformOrigin: "12px 11px" }}
          animate={{
            rotate: [0, 8, 0, -8, 0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v4" />
        </motion.g>
        
        {/* Ears */}
        <path d="M3 15h-1" />
        <path d="M22 15h-1" />
      </svg>
      
      {/* Animated eyes container - positioned over the head */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ top: isLarge ? '54%' : '52%' }}
      >
        <div className="flex items-center" style={{ gap: `${eyeGap}px` }}>
          {/* Left eye - vertical line */}
          <motion.div
            className="bg-current rounded-full"
            style={{ 
              width: `${eyeWidth}px`, 
              height: `${eyeHeight}px`,
              originY: 0.5
            }}
            animate={{
              scaleY: [1, 1, 1, 1, 1, 1, 0.2, 1, 0.2, 1, 0.2, 1, 1, 1, 1],
              x: [0, 2, 2, -2, -2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.1, 0.33, 0.35, 0.5, 0.52, 0.7, 0.73, 0.76, 0.79, 0.82, 0.85, 0.88, 0.95, 1],
            }}
          />
          
          {/* Right eye - vertical line */}
          <motion.div
            className="bg-current rounded-full"
            style={{ 
              width: `${eyeWidth}px`, 
              height: `${eyeHeight}px`,
              originY: 0.5
            }}
            animate={{
              scaleY: [1, 1, 1, 1, 1, 1, 0.2, 1, 0.2, 1, 0.2, 1, 1, 1, 1],
              x: [0, 2, 2, -2, -2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.1, 0.33, 0.35, 0.5, 0.52, 0.7, 0.73, 0.76, 0.79, 0.82, 0.85, 0.88, 0.95, 1],
            }}
          />
        </div>
      </div>
    </div>
  );
};
