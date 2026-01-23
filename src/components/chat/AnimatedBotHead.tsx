import { motion } from "framer-motion";

interface AnimatedBotHeadProps {
  size?: "sm" | "lg";
}

export const AnimatedBotHead = ({ size = "sm" }: AnimatedBotHeadProps) => {
  const isLarge = size === "lg";
  const containerSize = isLarge ? "w-10 h-10" : "w-4 h-4";
  const eyeSize = isLarge ? "w-[8px] h-[8px]" : "w-[4px] h-[4px]";
  const pupilSize = isLarge ? "w-[4px] h-[4px]" : "w-[2px] h-[2px]";
  const eyeGap = isLarge ? "gap-[10px]" : "gap-[5px]";
  const pupilMove = isLarge ? 3 : 1.5;

  return (
    <div className={`relative ${containerSize}`}>
      {/* Bot head */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full text-current"
      >
        {/* Head outline */}
        <rect x="3" y="11" width="18" height="10" rx="2" />
        {/* Antenna */}
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4" />
        {/* Ears */}
        <path d="M3 15h-1" />
        <path d="M22 15h-1" />
      </svg>
      
      {/* Animated eyes container */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ top: '52%' }}>
        <div className={`flex ${eyeGap}`}>
          {/* Left eye */}
          <motion.div
            className={`relative ${eyeSize} bg-current rounded-full overflow-hidden`}
            animate={{
              scaleY: [1, 1, 1, 1, 1, 1, 0.1, 1, 0.1, 1, 0.1, 1, 1, 1, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.3, 0.33, 0.36, 0.5, 0.7, 0.73, 0.76, 0.79, 0.82, 0.85, 0.88, 0.9, 0.95, 1],
            }}
          >
            {/* Pupil */}
            <motion.div
              className={`absolute ${pupilSize} bg-background rounded-full`}
              style={{ top: '25%', left: '25%' }}
              animate={{
                x: [0, pupilMove, pupilMove, -pupilMove, -pupilMove, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.1, 0.33, 0.35, 0.5, 0.52, 0.7, 0.73, 0.76, 0.79, 0.82, 0.85, 0.88, 0.95, 1],
              }}
            />
          </motion.div>
          
          {/* Right eye */}
          <motion.div
            className={`relative ${eyeSize} bg-current rounded-full overflow-hidden`}
            animate={{
              scaleY: [1, 1, 1, 1, 1, 1, 0.1, 1, 0.1, 1, 0.1, 1, 1, 1, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.3, 0.33, 0.36, 0.5, 0.7, 0.73, 0.76, 0.79, 0.82, 0.85, 0.88, 0.9, 0.95, 1],
            }}
          >
            {/* Pupil */}
            <motion.div
              className={`absolute ${pupilSize} bg-background rounded-full`}
              style={{ top: '25%', left: '25%' }}
              animate={{
                x: [0, pupilMove, pupilMove, -pupilMove, -pupilMove, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.1, 0.33, 0.35, 0.5, 0.52, 0.7, 0.73, 0.76, 0.79, 0.82, 0.85, 0.88, 0.95, 1],
              }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};
