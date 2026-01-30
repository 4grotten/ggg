import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';

/**
 * PasscodeLockAnimation - циклическая анимация для экрана создания пароля
 * 4 звёздочки появляются в ряд, затем замок со вспышкой
 */
export const PasscodeLockAnimation = () => {
  const [phase, setPhase] = useState<'stars' | 'lock'>('stars');
  const [visibleStars, setVisibleStars] = useState(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (phase === 'stars') {
      if (visibleStars < 4) {
        timeout = setTimeout(() => {
          setVisibleStars(prev => prev + 1);
        }, 250);
      } else {
        timeout = setTimeout(() => {
          setPhase('lock');
          setVisibleStars(0);
        }, 400);
      }
    } else {
      timeout = setTimeout(() => {
        setPhase('stars');
      }, 1200);
    }

    return () => clearTimeout(timeout);
  }, [phase, visibleStars]);

  return (
    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto relative overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 'stars' ? (
          <motion.div
            key="stars"
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            {[0, 1, 2, 3].map((i) => (
              <motion.span
                key={i}
                className="text-primary font-bold text-lg"
                initial={{ opacity: 0, scale: 0, y: 10 }}
                animate={{
                  opacity: i < visibleStars ? 1 : 0,
                  scale: i < visibleStars ? 1 : 0,
                  y: i < visibleStars ? 0 : 10,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 20,
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
            <motion.div
              className="absolute inset-0 bg-primary/30 rounded-full"
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute inset-[-6px] rounded-full border-2 border-primary/40"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.3, opacity: [0, 0.6, 0] }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
            <Lock className="w-9 h-9 text-primary" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
