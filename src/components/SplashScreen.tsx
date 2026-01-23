import { motion } from "framer-motion";

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
        {/* Animated Shadow */}
        <motion.div
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: [0.95, 1.05, 0.95],
            y: [0, 8, 0]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute inset-0 bg-primary/50 blur-[60px] rounded-3xl transform translate-y-12"
        />
        
        {/* Secondary Glow */}
        <motion.div
          animate={{ 
            opacity: [0.2, 0.4, 0.2],
            rotate: [0, 5, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 0.5
          }}
          className="absolute inset-0 bg-blue-400/30 blur-[80px] rounded-3xl transform translate-y-8 -translate-x-4"
        />
        
        {/* Card Image */}
        <motion.img
          src="/og-image.png"
          alt="Easy Card"
          className="relative w-full h-auto rounded-2xl"
          initial={{ rotateY: -10, rotateX: 5 }}
          animate={{ rotateY: 0, rotateX: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ 
            filter: "drop-shadow(0 30px 60px rgba(59, 130, 246, 0.4))"
          }}
        />
        
        {/* Moving Light Reflection */}
        <motion.div
          initial={{ x: "-150%", opacity: 0 }}
          animate={{ 
            x: ["−150%", "250%"],
            opacity: [0, 0.6, 0]
          }}
          transition={{ 
            duration: 2.5,
            delay: 0.8,
            repeat: Infinity,
            repeatDelay: 2.5,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 rounded-2xl pointer-events-none"
        />
        
        {/* Secondary Light Wave */}
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
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 rounded-2xl pointer-events-none"
        />
        
        {/* Corner Highlight */}
        <motion.div
          animate={{ 
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2.5, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 blur-2xl rounded-full pointer-events-none"
        />
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
