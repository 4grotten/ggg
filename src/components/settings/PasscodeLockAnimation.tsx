import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';

/**
 * PasscodeLockAnimation - циклическая анимация для экрана создания пароля
 * 4 звёздочки появляются по кругу, затем замок со вспышкой
 */
export const PasscodeLockAnimation = () => {
  const [phase, setPhase] = useState<'stars' | 'lock'>('stars');
  const [visibleStars, setVisibleStars] = useState(0);

  // Cycle through phases
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (phase === 'stars') {
      if (visibleStars < 4) {
        // Show stars one by one
        timeout = setTimeout(() => {
          setVisibleStars(prev => prev + 1);
        }, 300);
      } else {
        // All stars shown, switch to lock
        timeout = setTimeout(() => {
          setPhase('lock');
          setVisibleStars(0);
        }, 500);
      }
    } else {
      // Lock phase, then restart
      timeout = setTimeout(() => {
        setPhase('stars');
      }, 1500);
    }

    return () => clearTimeout(timeout);
  }, [phase, visibleStars]);

  // Positions for 4 stars in a circle (top, right, bottom, left)
  const starPositions = [
    { x: 0, y: -20 },   // top
    { x: 20, y: 0 },    // right
    { x: 0, y: 20 },    // bottom
    { x: -20, y: 0 },   // left
  ];

  return (
    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto relative overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 'stars' ? (
          <motion.div
            key="stars"
            className="relative w-full h-full flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {starPositions.map((pos, i) => (
              <motion.span
                key={i}
                className="absolute text-primary font-bold text-xl"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: i < visibleStars ? 1 : 0,
                  scale: i < visibleStars ? 1 : 0,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 15,
                }}
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                }}
              >
                ✱
              </motion.span>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="lock"
            className="relative flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {/* Flash effect */}
            <motion.div
              className="absolute inset-0 bg-primary/30 rounded-full"
              initial={{ scale: 1.5, opacity: 0.8 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
            {/* Glow ring */}
            <motion.div
              className="absolute inset-[-8px] rounded-full border-2 border-primary/50"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: [0, 0.8, 0] }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            {/* Lock icon */}
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <Lock className="w-9 h-9 text-primary" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
