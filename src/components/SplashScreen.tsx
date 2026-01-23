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
        className="relative w-[80vw] max-w-xs"
      >
        {/* Animated Shadow */}
        <motion.div
          animate={{ 
            opacity: [0.3, 0.5, 0.3],
            scale: [0.95, 1.02, 0.95]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute inset-0 bg-primary/40 blur-[50px] rounded-3xl transform translate-y-8"
        />
        
        {/* Card */}
        <motion.div
          initial={{ rotateY: -10, rotateX: 5 }}
          animate={{ rotateY: 0, rotateX: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative w-full aspect-[1.586/1] rounded-2xl bg-gradient-to-br from-[#3B82F6] via-[#2563EB] to-[#1D4ED8] p-5 overflow-hidden"
          style={{ 
            boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.5)"
          }}
        >
          {/* Decorative Circles */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-3 right-3 w-20 h-20 border-2 border-white rounded-full" />
            <div className="absolute top-6 right-6 w-14 h-14 border-2 border-white rounded-full" />
            <div className="absolute -bottom-6 -left-6 w-28 h-28 border border-white rounded-full" />
            <div className="absolute bottom-1/3 left-1/4 w-16 h-16 border border-white rounded-full opacity-50" />
          </div>
          
          {/* Moving Light Reflection */}
          <motion.div
            animate={{ 
              x: ["-150%", "250%"],
              opacity: [0, 0.4, 0]
            }}
            transition={{ 
              duration: 2.5,
              delay: 0.5,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none"
          />
          
          {/* Secondary Light Wave */}
          <motion.div
            animate={{ 
              x: ["-200%", "300%"],
              opacity: [0, 0.2, 0]
            }}
            transition={{ 
              duration: 3,
              delay: 1.5,
              repeat: Infinity,
              repeatDelay: 2.5,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 pointer-events-none"
          />
          
          {/* Corner Highlight */}
          <motion.div
            animate={{ 
              opacity: [0.1, 0.25, 0.1],
              scale: [1, 1.15, 1]
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity, 
              ease: "easeInOut"
            }}
            className="absolute -top-8 -right-8 w-24 h-24 bg-white/20 blur-2xl rounded-full pointer-events-none"
          />

          {/* Card Content */}
          <div className="relative h-full flex flex-col justify-between z-10">
            {/* Top Row */}
            <div className="flex items-start justify-between">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "2.5rem" }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="h-1 bg-white/50 rounded-full mt-1"
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="text-white font-bold text-xl italic tracking-tight"
                style={{ fontFamily: 'Arial, sans-serif' }}
              >
                VISA
              </motion.div>
            </div>
            
            {/* Card Number */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="text-white font-medium text-sm tracking-[0.2em]"
            >
              •••• •••• •••• ••••
            </motion.div>
            
            {/* Bottom Row */}
            <div className="flex items-end justify-end">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="text-white font-semibold text-base tracking-wide"
              >
                Easy Card
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
