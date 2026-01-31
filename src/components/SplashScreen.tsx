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
    className={`absolute ${inset} rounded-3xl z-0`}
    style={{ 
      background: gradient,
      filter: `blur(${blur}px)`,
      willChange: "opacity, transform"
    }}
    animate={{
      opacity: [0.4, 1, 0.4],
      scale: [0.97, 1.08, 0.97]
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
      {/* Floating Card */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          y: [0, -12, 0]
        }}
        transition={{ 
          scale: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 0.8 },
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }}
        className="relative w-[85vw] max-w-sm"
      >
        {/* Fantastic Glow Layers - Purple/Blue Theme */}
        <GlowLayer
          inset="-inset-12"
          blur={50}
          gradient="radial-gradient(ellipse at center, rgba(147, 51, 234, 0.9) 0%, rgba(79, 70, 229, 0.6) 30%, rgba(59, 130, 246, 0.3) 60%, transparent 85%)"
          duration={3}
        />
        <GlowLayer
          inset="-inset-8"
          blur={35}
          gradient="radial-gradient(ellipse at center, rgba(168, 85, 247, 0.95) 0%, rgba(139, 92, 246, 0.7) 35%, rgba(99, 102, 241, 0.4) 55%, transparent 80%)"
          duration={2.5}
          delay={0.3}
        />
        <GlowLayer
          inset="-inset-4"
          blur={20}
          gradient="radial-gradient(ellipse at center, rgba(192, 132, 252, 1) 0%, rgba(167, 139, 250, 0.8) 30%, transparent 65%)"
          duration={2}
          delay={0.6}
        />
        
        {/* Outer Rotating Glow Ring */}
        <motion.div
          className="absolute -inset-16 rounded-full z-0"
          style={{
            background: "conic-gradient(from 0deg, transparent, rgba(147, 51, 234, 0.6), rgba(59, 130, 246, 0.6), transparent, rgba(168, 85, 247, 0.5), transparent)",
            filter: "blur(40px)"
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Pulsing Core Glow */}
        <motion.div
          className="absolute -inset-6 rounded-3xl z-0"
          style={{
            background: "radial-gradient(ellipse at center, rgba(168, 85, 247, 0.9) 0%, rgba(124, 58, 237, 0.5) 40%, transparent 70%)",
            filter: "blur(25px)"
          }}
          animate={{
            opacity: [0.6, 1, 0.6],
            scale: [0.95, 1.1, 0.95]
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Card Image */}
        <motion.img
          src={easyCardImage}
          alt="Easy Card"
          className="relative z-10 w-full h-auto rounded-2xl"
          initial={{ rotateY: -10, rotateX: 5 }}
          animate={{ rotateY: 0, rotateX: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ 
            filter: "drop-shadow(0 0 30px rgba(147, 51, 234, 0.6)) drop-shadow(0 30px 60px rgba(79, 70, 229, 0.5))"
          }}
        />
        
        {/* Moving Light Reflection */}
        <motion.div
          initial={{ x: "-150%", opacity: 0 }}
          animate={{ 
            x: ["-150%", "250%"],
            opacity: [0, 0.7, 0]
          }}
          transition={{ 
            duration: 2.5,
            delay: 0.8,
            repeat: Infinity,
            repeatDelay: 2.5,
            ease: "easeInOut"
          }}
          className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 rounded-2xl pointer-events-none"
        />
        
        {/* Secondary Light Wave */}
        <motion.div
          animate={{ 
            x: ["-200%", "300%"],
            opacity: [0, 0.35, 0]
          }}
          transition={{ 
            duration: 3,
            delay: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut"
          }}
          className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-purple-200/30 to-transparent -skew-x-12 rounded-2xl pointer-events-none"
        />
        
        {/* Sparkle Effects */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white z-20 pointer-events-none"
            style={{
              top: `${15 + Math.random() * 70}%`,
              left: `${10 + Math.random() * 80}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 1.5 + Math.random(),
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut"
            }}
          />
        ))}
        
        {/* Corner Highlight */}
        <motion.div
          animate={{ 
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 2.5, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute -top-6 -right-6 w-40 h-40 bg-purple-300/30 blur-3xl rounded-full pointer-events-none z-0"
        />
        
        {/* Bottom Accent Glow */}
        <motion.div
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 0.5
          }}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-24 bg-blue-500/40 blur-3xl rounded-full pointer-events-none z-0"
        />
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
