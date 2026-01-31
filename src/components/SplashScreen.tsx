import { memo } from "react";
import { motion } from "framer-motion";
import easyCardImage from "@/assets/easy-card.png";

// Memoized glow layer for effect behind card
const GlowLayer = memo(({ 
  className,
  blur, 
  gradient, 
  duration, 
  delay = 0,
}: { 
  className: string;
  blur: number;
  gradient: string;
  duration: number;
  delay?: number;
}) => (
  <motion.div 
    className={className}
    style={{ 
      background: gradient,
      filter: `blur(${blur}px)`,
      willChange: "opacity, transform"
    }}
    animate={{
      opacity: [0.6, 1, 0.6],
      scale: [0.98, 1.03, 0.98]
    }}
    transition={{
      duration,
      repeat: Infinity,
      ease: "easeInOut",
      delay
    }}
  />
));

GlowLayer.displayName = "GlowLayer";

const SplashScreen = () => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 bg-background flex items-center justify-center z-50 overflow-hidden"
    >
      {/* Floating Card */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 50 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          y: [0, -10, 0]
        }}
        transition={{ 
          scale: { duration: 1, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 0.8 },
          y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }
        }}
        className="relative w-[70vw] max-w-xs z-10"
      >
        {/* Glow behind card */}
        <GlowLayer
          className="absolute -inset-16 rounded-[50%]"
          blur={50}
          gradient="radial-gradient(ellipse at center, rgba(168, 85, 247, 0.9) 0%, rgba(139, 92, 246, 0.6) 30%, rgba(99, 102, 241, 0.3) 55%, transparent 80%)"
          duration={2.5}
        />
        
        <GlowLayer
          className="absolute -inset-8 rounded-3xl"
          blur={30}
          gradient="radial-gradient(ellipse at center, rgba(192, 132, 252, 0.8) 0%, rgba(168, 85, 247, 0.5) 40%, transparent 70%)"
          duration={2}
          delay={0.3}
        />
        
        {/* Card Image */}
        <motion.img
          src={easyCardImage}
          alt="Easy Card"
          className="relative z-10 w-full h-auto rounded-xl"
          initial={{ rotateY: -15, rotateX: 8 }}
          animate={{ rotateY: 0, rotateX: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        
        {/* Primary Moving Light Reflection on card */}
        <motion.div
          initial={{ x: "-150%", opacity: 0 }}
          animate={{ 
            x: ["-150%", "250%"],
            opacity: [0, 0.8, 0]
          }}
          transition={{ 
            duration: 1.8,
            delay: 0.6,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut"
          }}
          className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 rounded-xl pointer-events-none overflow-hidden"
        />
        
        {/* Secondary shimmer wave on card */}
        <motion.div
          animate={{ 
            x: ["-200%", "300%"],
            opacity: [0, 0.4, 0]
          }}
          transition={{ 
            duration: 2.2,
            delay: 1.5,
            repeat: Infinity,
            repeatDelay: 2.5,
            ease: "easeInOut"
          }}
          className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-purple-100/40 to-transparent -skew-x-12 rounded-xl pointer-events-none overflow-hidden"
        />
        
        {/* Edge highlight - top */}
        <motion.div
          animate={{
            opacity: [0.3, 0.7, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 left-4 right-4 h-[2px] z-20 bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full pointer-events-none"
        />
        
        {/* Corner glint */}
        <motion.div
          animate={{
            opacity: [0, 1, 0],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 2.5,
            delay: 0.8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-3 right-4 w-4 h-4 z-20 bg-white/70 blur-sm rounded-full pointer-events-none"
        />
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
