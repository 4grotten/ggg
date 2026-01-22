import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedDrawerItemProps {
  children: ReactNode;
  index: number;
  className?: string;
}

export const AnimatedDrawerItem = ({ children, index, className }: AnimatedDrawerItemProps) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      duration: 0.4,
      delay: index * 0.06,
      ease: [0.22, 1, 0.36, 1]
    }}
    className={className}
  >
    {children}
  </motion.div>
);

interface AnimatedDrawerContainerProps {
  children: ReactNode;
  className?: string;
}

export const AnimatedDrawerContainer = ({ children, className }: AnimatedDrawerContainerProps) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);
