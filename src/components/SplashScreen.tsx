import { motion } from "framer-motion";

const SplashScreen = () => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted flex items-center justify-center z-50"
    >
      <div className="flex flex-col items-center gap-4">
        {/* OG Card Image */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.8, 
            ease: [0.16, 1, 0.3, 1]
          }}
          className="relative w-[90vw] max-w-md"
        >
          {/* Card Shadow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.5, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="absolute inset-0 bg-primary/40 blur-3xl rounded-3xl transform translate-y-10"
          />
          
          {/* OG Image */}
          <motion.img
            src="/og-image.png"
            alt="Easy Card"
            className="relative w-full h-auto rounded-2xl shadow-[0_25px_60px_-15px_rgba(59,130,246,0.5)]"
            initial={{ rotateY: -15 }}
            animate={{ rotateY: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          
          {/* Shine Effect */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ 
              duration: 1.5, 
              delay: 0.5,
              repeat: Infinity,
              repeatDelay: 3
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 rounded-2xl overflow-hidden pointer-events-none"
          />
        </motion.div>
        
        {/* Loading Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex gap-2 mt-4"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.4, 1],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{ 
                duration: 0.8, 
                repeat: Infinity,
                delay: i * 0.15
              }}
              className="w-2.5 h-2.5 rounded-full bg-primary"
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
