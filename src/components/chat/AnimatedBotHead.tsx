import { motion } from "framer-motion";

export const AnimatedBotHead = () => {
  return (
    <div className="relative w-4 h-4">
      {/* Bot head */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full text-secondary-foreground"
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
        <div className="flex gap-[5px]">
          {/* Left eye */}
          <motion.div
            className="relative w-[4px] h-[4px] bg-secondary-foreground rounded-full overflow-hidden"
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
              className="absolute w-[2px] h-[2px] bg-background rounded-full"
              style={{ top: '25%', left: '25%' }}
              animate={{
                x: [0, 1.5, 1.5, -1.5, -1.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
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
            className="relative w-[4px] h-[4px] bg-secondary-foreground rounded-full overflow-hidden"
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
              className="absolute w-[2px] h-[2px] bg-background rounded-full"
              style={{ top: '25%', left: '25%' }}
              animate={{
                x: [0, 1.5, 1.5, -1.5, -1.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
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
