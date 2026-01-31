import { memo } from "react";
import { motion } from "framer-motion";
import easyCardImage from "@/assets/easy-card.png";

// Memoized glow layer
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
      opacity: [0.5, 1, 0.5],
      scale: [0.97, 1.04, 0.97]
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
      {/* Full screen ambient glow - outer layer */}
      <GlowLayer
        className="absolute inset-0"
        blur={100}
        gradient="radial-gradient(ellipse 100% 80% at 50% 50%, rgba(139, 92, 246, 0.5) 0%, rgba(99, 102, 241, 0.3) 30%, rgba(79, 70, 229, 0.15) 50%, rgba(59, 130, 246, 0.05) 70%, transparent 100%)"
        duration={4}
      />
      
      {/* Mid layer glow */}
      <GlowLayer
        className="absolute inset-0"
        blur={70}
        gradient="radial-gradient(ellipse 70% 55% at 50% 50%, rgba(168, 85, 247, 0.6) 0%, rgba(139, 92, 246, 0.4) 35%, rgba(99, 102, 241, 0.2) 55%, transparent 80%)"
        duration={3}
        delay={0.5}
      />
      
      {/* Inner bright glow */}
      <GlowLayer
        className="absolute inset-0"
        blur={50}
        gradient="radial-gradient(ellipse 50% 40% at 50% 50%, rgba(192, 132, 252, 0.7) 0%, rgba(168, 85, 247, 0.5) 30%, rgba(139, 92, 246, 0.25) 50%, transparent 70%)"
        duration={2.5}
        delay={1}
      />

      {/* Floating Card with 3D effect */}
      <motion.div
        initial={{ scale: 1, opacity: 1 }}
        animate={{ 
          y: [0, -10, 0],
          rotateX: [0, 2, 0],
          rotateY: [0, -2, 0]
        }}
        transition={{ 
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          rotateX: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          rotateY: { duration: 5, repeat: Infinity, ease: "easeInOut" }
        }}
        className="relative w-[70vw] max-w-xs z-10"
        style={{ 
          perspective: "1000px",
          transformStyle: "preserve-3d"
        }}
      >
        {/* Intense glow directly behind card */}
        <GlowLayer
          className="absolute -inset-12 rounded-[40%]"
          blur={40}
          gradient="radial-gradient(ellipse at center, rgba(192, 132, 252, 1) 0%, rgba(168, 85, 247, 0.8) 30%, rgba(139, 92, 246, 0.4) 60%, transparent 85%)"
          duration={2}
        />
        
        {/* Card Image with 3D shadow effect */}
        <motion.img
          src={easyCardImage}
          alt="Easy Card"
          className="relative z-10 w-full h-auto rounded-xl"
          style={{ 
            boxShadow: `
              0 25px 50px -12px rgba(139, 92, 246, 0.5),
              0 12px 25px -5px rgba(168, 85, 247, 0.4),
              0 0 0 1px rgba(255, 255, 255, 0.1) inset,
              0 -2px 10px rgba(255, 255, 255, 0.1) inset
            `,
            transform: "translateZ(20px)"
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
