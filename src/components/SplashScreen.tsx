import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const SplashScreen = () => {
  const [isReady, setIsReady] = useState(false);

  // Wait for page to be fully ready and painted before starting animation
  useEffect(() => {
    // Use requestAnimationFrame to ensure the DOM is painted
    let rafId: number;
    const startAnimation = () => {
      rafId = requestAnimationFrame(() => {
        // Double RAF ensures paint is complete
        rafId = requestAnimationFrame(() => {
          setIsReady(true);
        });
      });
    };
    
    // Wait for document to be fully interactive
    if (document.readyState === 'complete') {
      startAnimation();
    } else {
      window.addEventListener('load', startAnimation);
      return () => {
        window.removeEventListener('load', startAnimation);
        cancelAnimationFrame(rafId);
      };
    }
    
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="fixed inset-0 flex items-center justify-center z-50 overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 50%, hsl(270, 80%, 25%) 0%, hsl(260, 70%, 15%) 40%, hsl(250, 60%, 8%) 70%, hsl(240, 50%, 4%) 100%)"
      }}
    >
      {/* Ambient Purple Glow Layers */}
      <div className="absolute inset-0">
        {/* Core glow */}
        <motion.div
          animate={{ 
            opacity: [0.6, 0.9, 0.6],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(270, 100%, 60%) 0%, hsl(280, 80%, 40%) 30%, transparent 70%)",
            filter: "blur(80px)"
          }}
        />
        
        {/* Secondary glow ring */}
        <motion.div
          animate={{ 
            opacity: [0.4, 0.7, 0.4],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(ellipse, hsl(290, 100%, 50%) 0%, hsl(260, 70%, 30%) 40%, transparent 70%)",
            filter: "blur(100px)"
          }}
        />
        
        {/* Outer ambient */}
        <motion.div
          animate={{ 
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(ellipse, hsl(280, 60%, 35%) 0%, transparent 60%)",
            filter: "blur(120px)"
          }}
        />
      </div>

      {/* Floating Card */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0, y: 80 }}
        animate={isReady ? { 
          scale: 1, 
          opacity: 1,
          y: [0, -15, 0]
        } : { scale: 0.6, opacity: 0, y: 80 }}
        transition={{ 
          scale: { duration: 1, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 0.8 },
          y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }
        }}
        className="relative w-[60vw] max-w-[280px]"
        style={{ perspective: "1000px" }}
      >
        {/* Card glow underneath */}
        <motion.div
          animate={{ 
            opacity: [0.5, 0.8, 0.5],
            scale: [0.9, 1.05, 0.9]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute inset-0 rounded-2xl"
          style={{
            background: "linear-gradient(180deg, hsl(270, 100%, 60%) 0%, hsl(290, 80%, 50%) 100%)",
            filter: "blur(40px)",
            transform: "translateY(20px) scale(1.1)"
          }}
        />
        
        {/* Card Image */}
        <div className="relative overflow-hidden rounded-2xl" style={{ isolation: "isolate" }}>
          <motion.img
            src="./easy-card-banner.png"
            alt="Easy Card"
            className="relative w-full h-auto block"
            initial={{ rotateY: -15, rotateX: 8 }}
            animate={isReady ? { rotateY: 0, rotateX: 0 } : { rotateY: -15, rotateX: 8 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ 
              filter: "drop-shadow(0 20px 40px hsla(270, 100%, 50%, 0.5))"
            }}
          />
          
          {/* Fantasy glint overlay - pure CSS, starts after card loads */}
          {isReady && (
            <div
              className="absolute overflow-hidden pointer-events-none"
              style={{
                top: 4,
                left: 4,
                right: 4,
                bottom: 4,
                borderRadius: 12,
              }}
            >
              <div
                className="absolute inset-0 mix-blend-screen"
                style={{
                  background:
                    "linear-gradient(105deg, transparent 10%, rgba(255,255,255,0.1) 28%, rgba(255,255,255,0.3) 44%, rgba(255,215,160,0.4) 50%, rgba(255,255,255,0.3) 56%, rgba(255,255,255,0.1) 72%, transparent 90%)",
                  animation: "splash-glint 2.2s ease-in-out 1.2s infinite",
                  opacity: 0,
                }}
              />
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
