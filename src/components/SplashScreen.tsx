import { motion } from "framer-motion";

const SplashScreen = () => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted flex items-center justify-center z-50"
    >
      <div className="flex flex-col items-center gap-5">
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
          className="relative w-[75vw] max-w-[280px]"
        >
          {/* Animated Shadow */}
          <motion.div
            animate={{ 
              opacity: [0.25, 0.45, 0.25],
              scale: [0.95, 1.02, 0.95]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute inset-0 bg-primary/50 blur-[40px] rounded-3xl transform translate-y-6"
          />
          
          {/* Card */}
          <motion.div
            initial={{ rotateY: -8 }}
            animate={{ rotateY: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative w-full aspect-[1.586/1] rounded-2xl bg-gradient-to-br from-[#4A9EF7] via-[#2B6FD4] to-[#1A4BA8] p-4 overflow-hidden"
            style={{ 
              boxShadow: "0 20px 40px -10px rgba(59, 130, 246, 0.4)"
            }}
          >
            {/* Decorative Circles */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-2 right-2 w-16 h-16 border border-white/15 rounded-full" />
              <div className="absolute top-5 right-5 w-10 h-10 border border-white/15 rounded-full" />
              <div className="absolute -bottom-8 -left-8 w-28 h-28 border border-white/10 rounded-full" />
              <div className="absolute bottom-8 left-12 w-20 h-20 border border-white/8 rounded-full" />
              <div className="absolute top-1/2 right-1/4 w-12 h-12 border border-white/5 rounded-full" />
            </div>
            
            {/* Shine Effect */}
            <motion.div
              animate={{ 
                x: ["-150%", "250%"],
                opacity: [0, 0.35, 0]
              }}
              transition={{ 
                duration: 2.5,
                delay: 0.8,
                repeat: Infinity,
                repeatDelay: 2.5,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 pointer-events-none"
            />

            {/* Card Content */}
            <div className="relative h-full flex flex-col justify-between z-10">
              {/* Top Row - VISA */}
              <div className="flex justify-end">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="text-white font-bold text-2xl italic tracking-tight"
                  style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
                >
                  <span className="text-white">VI</span>
                  <span className="text-[#F7A823]">S</span>
                  <span className="text-white">A</span>
                </motion.div>
              </div>
              
              {/* Middle - Chip + Card Number */}
              <div className="flex flex-col gap-2">
                {/* Chip */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="w-10 h-8 rounded-md bg-gradient-to-br from-[#D4AF37] via-[#C5A028] to-[#B8960F] relative overflow-hidden"
                >
                  {/* Chip pattern */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px p-1">
                    <div className="bg-[#A8850A]/40 rounded-sm" />
                    <div className="bg-[#A8850A]/30 rounded-sm" />
                    <div className="bg-[#A8850A]/40 rounded-sm" />
                    <div className="bg-[#A8850A]/30 rounded-sm" />
                    <div className="bg-[#A8850A]/50 rounded-sm" />
                    <div className="bg-[#A8850A]/30 rounded-sm" />
                    <div className="bg-[#A8850A]/40 rounded-sm" />
                    <div className="bg-[#A8850A]/30 rounded-sm" />
                    <div className="bg-[#A8850A]/40 rounded-sm" />
                  </div>
                </motion.div>
                
                {/* Card Number Dots */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="flex gap-3"
                >
                  {[0, 1, 2, 3].map((group) => (
                    <div key={group} className="flex gap-1">
                      {[0, 1, 2, 3].map((dot) => (
                        <div 
                          key={dot} 
                          className="w-2 h-2 rounded-full bg-white"
                        />
                      ))}
                    </div>
                  ))}
                </motion.div>
              </div>
              
              {/* Bottom Row - Easy Card */}
              <div className="flex justify-end">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  className="text-white font-medium text-base italic tracking-wide"
                >
                  Easy Card
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Text Below Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-primary">
            Easy Card
          </h1>
          <p className="text-muted-foreground text-base mt-1">
            Your digital wallet
          </p>
        </motion.div>

        {/* Loading Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex gap-2 mt-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{ 
                duration: 0.8, 
                repeat: Infinity,
                delay: i * 0.15
              }}
              className={`w-2.5 h-2.5 rounded-full ${
                i === 0 ? 'bg-primary' : i === 1 ? 'bg-primary/70' : 'bg-primary/40'
              }`}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
