import { memo } from "react";
import { motion } from "framer-motion";
import easyCardImage from "@/assets/easy-card.png";

// Memoized glow layer for fantastic effect
const GlowLayer = memo(({ 
  className,
  blur, 
  gradient, 
  duration, 
  delay = 0,
  style = {},
}: { 
  className: string;
  blur: number;
  gradient: string;
  duration: number;
  delay?: number;
  style?: React.CSSProperties;
}) => (
  <motion.div 
    className={className}
    style={{ 
      background: gradient,
      filter: `blur(${blur}px)`,
      willChange: "opacity, transform",
      ...style
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
      {/* Full screen ambient glow - softer at edges */}
      <GlowLayer
        className="absolute inset-0"
        blur={120}
        gradient="radial-gradient(ellipse 80% 60% at 50% 55%, rgba(139, 92, 246, 0.4) 0%, rgba(99, 102, 241, 0.25) 30%, rgba(59, 130, 246, 0.1) 60%, transparent 100%)"
        duration={4}
      />
      
      {/* Large outer glow - fills most of screen */}
      <GlowLayer
        className="absolute w-[150vw] h-[120vh] -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
        blur={80}
        gradient="radial-gradient(ellipse 50% 40% at 50% 50%, rgba(168, 85, 247, 0.5) 0%, rgba(139, 92, 246, 0.3) 35%, rgba(79, 70, 229, 0.15) 60%, transparent 85%)"
        duration={3.5}
        delay={0.2}
      />

      {/* Floating Card */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          y: [0, -10, 0]
        }}
        transition={{ 
          scale: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 0.8 },
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }}
        className="relative w-[70vw] max-w-xs z-10"
      >
        {/* Intense glow directly behind card */}
        <GlowLayer
          className="absolute -inset-20 rounded-[50%]"
          blur={60}
          gradient="radial-gradient(ellipse at center, rgba(168, 85, 247, 1) 0%, rgba(139, 92, 246, 0.8) 25%, rgba(99, 102, 241, 0.5) 50%, rgba(59, 130, 246, 0.2) 75%, transparent 100%)"
          duration={2.5}
        />
        
        {/* Bright core glow */}
        <GlowLayer
          className="absolute -inset-12 rounded-3xl"
          blur={35}
          gradient="radial-gradient(ellipse at center, rgba(192, 132, 252, 1) 0%, rgba(168, 85, 247, 0.9) 30%, rgba(139, 92, 246, 0.5) 60%, transparent 85%)"
          duration={2}
          delay={0.3}
        />
        
        {/* Inner intense glow */}
        <GlowLayer
          className="absolute -inset-6 rounded-2xl"
          blur={20}
          gradient="radial-gradient(ellipse at center, rgba(216, 180, 254, 0.9) 0%, rgba(192, 132, 252, 0.7) 40%, transparent 70%)"
          duration={1.8}
          delay={0.6}
        />
        
        {/* Card Image */}
        <motion.img
          src={easyCardImage}
          alt="Easy Card"
          className="relative z-10 w-full h-auto rounded-xl"
          initial={{ rotateY: -10, rotateX: 5 }}
          animate={{ rotateY: 0, rotateX: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        
        {/* Moving Light Reflection on Card */}
        <motion.div
          initial={{ x: "-150%", opacity: 0 }}
          animate={{ 
            x: ["-150%", "250%"],
            opacity: [0, 0.6, 0]
          }}
          transition={{ 
            duration: 2.5,
            delay: 0.8,
            repeat: Infinity,
            repeatDelay: 2.5,
            ease: "easeInOut"
          }}
          className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-12 rounded-xl pointer-events-none overflow-hidden"
        />
        
        {/* Secondary Light Wave on Card */}
        <motion.div
          animate={{ 
            x: ["-200%", "300%"],
            opacity: [0, 0.3, 0]
          }}
          transition={{ 
            duration: 3,
            delay: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut"
          }}
          className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-purple-200/25 to-transparent -skew-x-12 rounded-xl pointer-events-none overflow-hidden"
        />
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
