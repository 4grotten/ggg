import { motion, MotionProps } from "framer-motion";
import { ReactNode } from "react";

export type AnimationPreset = "fadeUp" | "fadeUpScale" | "fadeUpBlur" | "fadeIn";

interface AnimationConfig {
  initial: MotionProps["initial"];
  animate: MotionProps["animate"];
  transition: (delay: number) => MotionProps["transition"];
}

interface AnimatedSectionProps {
  children: ReactNode;
  delay?: number;
  preset?: AnimationPreset;
  className?: string;
}

const presets: Record<AnimationPreset, AnimationConfig> = {
  fadeUp: {
    initial: { opacity: 0, y: 20, filter: "blur(6px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: (delay) => ({ 
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
      delay
    }),
  },
  fadeUpScale: {
    initial: { opacity: 0, y: 20, scale: 0.97, filter: "blur(8px)" },
    animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
    transition: (delay) => ({ 
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
      delay
    }),
  },
  fadeUpBlur: {
    initial: { opacity: 0, y: 25, scale: 0.98, filter: "blur(10px)" },
    animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
    transition: (delay) => ({ 
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      delay
    }),
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: (delay) => ({ 
      duration: 0.5,
      delay
    }),
  },
};

export const AnimatedSection = ({ 
  children, 
  delay = 0, 
  preset = "fadeUp",
  className,
}: AnimatedSectionProps) => {
  const config = presets[preset];
  
  return (
    <motion.div
      initial={config.initial}
      animate={config.animate}
      transition={config.transition(delay)}
      className={className}
    >
      {children}
    </motion.div>
  );
};
