import { motion } from "framer-motion";
import easyCardImage from "@/assets/easy-card.png";

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
        {/* Card Image */}
        <motion.img
          src={easyCardImage}
          alt="Easy Card"
          className="relative z-10 w-full h-auto rounded-2xl"
          initial={{ rotateY: -10, rotateX: 5 }}
          animate={{ rotateY: 0, rotateX: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ 
            filter: "drop-shadow(0 30px 60px rgba(79, 70, 229, 0.4))"
          }}
        />
        
        {/* Moving Light Reflection on Card */}
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
          className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 rounded-2xl pointer-events-none overflow-hidden"
        />
        
        {/* Secondary Light Wave on Card */}
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
          className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-purple-200/30 to-transparent -skew-x-12 rounded-2xl pointer-events-none overflow-hidden"
        />
        
        {/* Sparkle Effects on Card */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-white z-20 pointer-events-none"
            style={{
              top: `${20 + Math.random() * 60}%`,
              left: `${15 + Math.random() * 70}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.2, 0],
            }}
            transition={{
              duration: 1.5 + Math.random(),
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
