import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface CardMiniatureProps {
  type: "virtual" | "metal";
  className?: string;
}

interface TiltState {
  rotateX: number;
  rotateY: number;
  glareX: number;
  glareY: number;
}

export const CardMiniature = ({ type, className = "" }: CardMiniatureProps) => {
  const [tilt, setTilt] = useState<TiltState>({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const [hasPermission, setHasPermission] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const beta = event.beta ?? 0;  // Front-back tilt
      const gamma = event.gamma ?? 0; // Left-right tilt
      
      // Normalize and limit values for subtle effect
      const rotateX = Math.max(-15, Math.min(15, beta * 0.3));
      const rotateY = Math.max(-15, Math.min(15, gamma * 0.3));
      
      // Calculate glare position based on tilt
      const glareX = 50 + gamma * 1.5;
      const glareY = 50 + beta * 1.5;
      
      setTilt({ rotateX, rotateY, glareX, glareY });
    };

    const initGyroscope = async () => {
      if (typeof DeviceOrientationEvent !== 'undefined') {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
          // iOS 13+ requires permission
          try {
            const permission = await (DeviceOrientationEvent as any).requestPermission();
            if (permission === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation, true);
              setHasPermission(true);
            }
          } catch (error) {
            console.log('Gyroscope permission denied');
          }
        } else {
          // Non-iOS devices
          window.addEventListener('deviceorientation', handleOrientation, true);
          setHasPermission(true);
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
    if (!card || hasPermission) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * 8;
      const rotateX = -((e.clientY - centerY) / (rect.height / 2)) * 8;
      
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
  }, [hasPermission]);

  // Glare styles - more intense for metal
  const glareStyle = {
    background: `radial-gradient(ellipse 80% 50% at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.12) 0%, transparent 50%)`,
  };
  
  // More intense glare for metal card
  const metalGlareStyle = {
    background: `radial-gradient(ellipse 100% 60% at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 30%, transparent 60%)`,
  };

  // Thin reflection band that moves across card
  const bandPosition = 50 + tilt.rotateY * 3;
  const reflectionStyle = {
    background: `linear-gradient(${110 + tilt.rotateY * 3}deg, transparent ${bandPosition - 15}%, rgba(255,255,255,0.08) ${bandPosition - 5}%, rgba(255,255,255,0.18) ${bandPosition}%, rgba(255,255,255,0.08) ${bandPosition + 5}%, transparent ${bandPosition + 15}%)`,
  };
  
  // More intense reflection for metal card
  const metalReflectionStyle = {
    background: `linear-gradient(${105 + tilt.rotateY * 4}deg, transparent ${bandPosition - 20}%, rgba(255,255,255,0.12) ${bandPosition - 8}%, rgba(255,255,255,0.35) ${bandPosition}%, rgba(255,255,255,0.12) ${bandPosition + 8}%, transparent ${bandPosition + 20}%)`,
  };
  
  // Secondary shine band for metal
  const metalSecondaryShine = {
    background: `linear-gradient(${80 + tilt.rotateX * 2}deg, transparent ${30 + tilt.rotateX}%, rgba(255,255,255,0.06) ${45 + tilt.rotateX}%, rgba(255,255,255,0.12) ${50 + tilt.rotateX}%, rgba(255,255,255,0.06) ${55 + tilt.rotateX}%, transparent ${70 + tilt.rotateX}%)`,
  };

  if (type === "virtual") {
    return (
      <motion.div 
        ref={cardRef}
        className={`relative w-full aspect-[1.586/1] rounded-md overflow-hidden ${className}`}
        style={{
          background: 'linear-gradient(135deg, #d4f94e 0%, #a8e030 50%, #8bc926 100%)',
          transformStyle: 'preserve-3d',
          perspective: '1000px',
        }}
        animate={{
          rotateX: tilt.rotateX,
          rotateY: tilt.rotateY,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Subtle mesh gradient overlay */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: 'radial-gradient(ellipse at 20% 20%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(0,0,0,0.1) 0%, transparent 50%)',
          }}
        />
        
        {/* Dynamic glass reflection */}
        <motion.div 
          className="absolute inset-0 pointer-events-none z-10"
          style={glareStyle}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
        />
        
        {/* Moving light reflection band */}
        <motion.div 
          className="absolute inset-0 pointer-events-none z-10"
          style={reflectionStyle}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
        />
        
        {/* Card content */}
        <div className="relative h-full p-4 flex flex-col justify-between">
          {/* Top row - Card name */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-black/70 tracking-wide">VIRTUAL</span>
          </div>
          
          {/* Center logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
              <svg width="16" height="12" viewBox="0 0 60 40" fill="none">
                <path d="M30 5L45 20L30 35L15 20L30 5Z" fill="rgba(0,0,0,0.3)" />
                <path d="M30 12L38 20L30 28L22 20L30 12Z" fill="rgba(200,245,66,0.8)" />
              </svg>
            </div>
          </div>
          
          {/* Bottom row - Visa branding */}
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-4 rounded bg-black/10" />
              <div className="w-4 h-4 rounded-full bg-black/10" />
            </div>
            <span className="text-base font-bold text-[#1a1f71] italic tracking-tight">VISA</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      ref={cardRef}
      className={`relative w-full aspect-[1.586/1] rounded-md overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(145deg, #3a3a3a 0%, #1f1f1f 50%, #0a0a0a 100%)',
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      animate={{
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Metal shine overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.08) 35%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.08) 45%, transparent 60%)',
        }}
      />
      
      {/* Dynamic glass reflection - intense */}
      <motion.div 
        className="absolute inset-0 pointer-events-none z-10"
        style={metalGlareStyle}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1 }}
      />
      
      {/* Primary light reflection band - bright */}
      <motion.div 
        className="absolute inset-0 pointer-events-none z-10"
        style={metalReflectionStyle}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1 }}
      />
      
      {/* Secondary horizontal shine */}
      <motion.div 
        className="absolute inset-0 pointer-events-none z-10"
        style={metalSecondaryShine}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1 }}
      />
      
      {/* Subtle texture */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
        }}
      />
      
      {/* Card content */}
      <div className="relative h-full p-4 flex flex-col justify-between">
        {/* Top row - Card name */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/50 tracking-wide">METAL</span>
        </div>
        
        {/* Center logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <svg width="16" height="12" viewBox="0 0 60 40" fill="none">
              <path d="M30 5L45 20L30 35L15 20L30 5Z" fill="rgba(255,255,255,0.2)" />
              <path d="M30 12L38 20L30 28L22 20L30 12Z" fill="rgba(255,255,255,0.1)" />
            </svg>
          </div>
        </div>
        
        {/* Bottom row - Visa branding */}
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-4 rounded bg-white/10" />
            <div className="w-4 h-4 rounded-full bg-white/10" />
          </div>
          <span className="text-base font-bold text-white/70 italic tracking-tight">VISA</span>
        </div>
      </div>
    </motion.div>
  );
};
