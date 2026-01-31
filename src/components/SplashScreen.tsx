import { memo } from "react";
import { motion } from "framer-motion";
import easyCardImage from "@/assets/easy-card.png";

// Memoized glow layer for fantastic effect
const GlowLayer = memo(({ 
  inset, 
  blur, 
  gradient, 
  duration, 
  delay = 0,
}: { 
  inset: string;
  blur: number;
  gradient: string;
  duration: number;
  delay?: number;
}) => (
  <motion.div 
    className={`absolute ${inset} rounded-3xl`}
    style={{ 
      background: gradient,
      filter: `blur(${blur}px)`,
      willChange: "opacity, transform"
    }}
    animate={{
      opacity: [0.5, 1, 0.5],
      scale: [0.98, 1.05, 0.98]
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
      className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted flex items-center justify-center z-50"
    >
      {/* Floating Card - smaller size */}
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
        className="relative w-[70vw] max-w-xs"
      >
        {/* Fantastic Glow Behind Card - Purple/Blue radiating effect */}
        <GlowLayer
          inset="-inset-8"
          blur={40}
          gradient="radial-gradient(ellipse at center, rgba(139, 92, 246, 0.8) 0%, rgba(99, 102, 241, 0.5) 40%, rgba(59, 130, 246, 0.2) 70%, transparent 90%)"
          duration={3}
        />
        <GlowLayer
          inset="-inset-6"
          blur={25}
          gradient="radial-gradient(ellipse at center, rgba(168, 85, 247, 0.9) 0%, rgba(139, 92, 246, 0.6) 35%, transparent 70%)"
          duration={2.5}
          delay={0.4}
        />
        <GlowLayer
          inset="-inset-4"
          blur={15}
          gradient="radial-gradient(ellipse at center, rgba(192, 132, 252, 0.7) 0%, rgba(167, 139, 250, 0.4) 40%, transparent 65%)"
          duration={2}
          delay={0.8}
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
