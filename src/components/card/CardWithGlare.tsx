import { useEffect, useState, useRef, ReactNode, createContext, useContext } from 'react';
import { motion } from 'framer-motion';

interface TiltState {
  rotateX: number;
  rotateY: number;
  glareX: number;
  glareY: number;
}

// Context to share tilt data with children
const TiltContext = createContext<TiltState>({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });

export const useTilt = () => useContext(TiltContext);

interface CardWithGlareProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'default' | 'metal';
}

export const CardWithGlare = ({ children, className = "", style, variant = 'default' }: CardWithGlareProps) => {
  const [tilt, setTilt] = useState<TiltState>({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const [hasGyroscope, setHasGyroscope] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const beta = event.beta ?? 0;
      const gamma = event.gamma ?? 0;
      
      const rotateX = Math.max(-12, Math.min(12, beta * 0.25));
      const rotateY = Math.max(-12, Math.min(12, gamma * 0.25));
      
      const glareX = 50 + gamma * 1.2;
      const glareY = 50 + beta * 1.2;
      
      setTilt({ rotateX, rotateY, glareX, glareY });
    };

    const initGyroscope = async () => {
      if (typeof DeviceOrientationEvent !== 'undefined') {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
          try {
            const permission = await (DeviceOrientationEvent as any).requestPermission();
            if (permission === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation, true);
              setHasGyroscope(true);
            }
          } catch (error) {
            console.log('Gyroscope permission denied');
          }
        } else {
          window.addEventListener('deviceorientation', handleOrientation, true);
          setHasGyroscope(true);
        }
      }
    };

    initGyroscope();

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  // Mouse fallback for desktop
  useEffect(() => {
    const card = cardRef.current;
    if (!card || hasGyroscope) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * 6;
      const rotateX = -((e.clientY - centerY) / (rect.height / 2)) * 6;
      
      const glareX = ((e.clientX - rect.left) / rect.width) * 100;
      const glareY = ((e.clientY - rect.top) / rect.height) * 100;
      
      setTilt({ rotateX, rotateY, glareX, glareY });
    };

    const handleMouseLeave = () => {
      setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasGyroscope]);

  const bandPosition = 50 + tilt.rotateY * 2.5;
  const isMetal = variant === 'metal';
  
  return (
    <TiltContext.Provider value={tilt}>
      <motion.div 
        ref={cardRef}
        className={`relative overflow-hidden ${className}`}
        style={{
          ...style,
          transformStyle: 'preserve-3d',
          perspective: '1000px',
        }}
        animate={{
          rotateX: tilt.rotateX,
          rotateY: tilt.rotateY,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
        
        {/* Glare spot */}
        <div 
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: isMetal
              ? `radial-gradient(ellipse 100% 60% at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.1) 30%, transparent 60%)`
              : `radial-gradient(ellipse 60% 40% at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
          }}
        />
        
        {/* Primary reflection band */}
        <div 
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: isMetal
              ? `linear-gradient(${105 + tilt.rotateY * 3}deg, transparent ${bandPosition - 18}%, rgba(255,255,255,0.15) ${bandPosition - 6}%, rgba(255,255,255,0.4) ${bandPosition}%, rgba(255,255,255,0.15) ${bandPosition + 6}%, transparent ${bandPosition + 18}%)`
              : `linear-gradient(${105 + tilt.rotateY * 2}deg, transparent ${bandPosition - 12}%, rgba(255,255,255,0.06) ${bandPosition - 4}%, rgba(255,255,255,0.15) ${bandPosition}%, rgba(255,255,255,0.06) ${bandPosition + 4}%, transparent ${bandPosition + 12}%)`,
          }}
        />
        
        {/* Secondary shine for metal */}
        {isMetal && (
          <div 
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: `linear-gradient(${80 + tilt.rotateX * 2}deg, transparent ${30 + tilt.rotateX}%, rgba(255,255,255,0.08) ${45 + tilt.rotateX}%, rgba(255,255,255,0.15) ${50 + tilt.rotateX}%, rgba(255,255,255,0.08) ${55 + tilt.rotateX}%, transparent ${70 + tilt.rotateX}%)`,
            }}
          />
        )}
      </motion.div>
    </TiltContext.Provider>
  );
};

// Parallax wrapper component for card content
interface ParallaxElementProps {
  children: ReactNode;
  depth?: number; // 1 = subtle, 2 = medium, 3 = strong
  className?: string;
}

export const ParallaxElement = ({ children, depth = 1, className = "" }: ParallaxElementProps) => {
  const tilt = useTilt();
  const multiplier = depth * 0.5;
  
  return (
    <motion.div
      className={className}
      animate={{
        x: tilt.rotateY * -multiplier,
        y: tilt.rotateX * -multiplier,
      }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
    >
      {children}
    </motion.div>
  );
};
