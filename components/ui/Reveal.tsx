import React, { useRef, useEffect } from 'react';
import { motion, useInView, useAnimation, Variants } from 'framer-motion';

interface RevealProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'top' | 'bottom' | 'fade' | 'scale';
  width?: "fit-content" | "100%";
  delay?: number;
  className?: string;
  duration?: number;
}

const Reveal: React.FC<RevealProps> = ({ 
  children, 
  direction = 'bottom', 
  width = "100%", 
  delay = 0,
  className = "",
  duration = 0.7
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const mainControls = useAnimation();

  useEffect(() => {
    if (isInView) {
      mainControls.start("visible");
    }
  }, [isInView, mainControls]);

  const getVariants = (): Variants => {
    const distance = 60;
    
    switch (direction) {
      case 'left':
        return {
          hidden: { opacity: 0, x: -distance, filter: 'blur(4px)' },
          visible: { opacity: 1, x: 0, filter: 'blur(0px)' },
        };
      case 'right':
        return {
          hidden: { opacity: 0, x: distance, filter: 'blur(4px)' },
          visible: { opacity: 1, x: 0, filter: 'blur(0px)' },
        };
      case 'top':
        return {
          hidden: { opacity: 0, y: -distance, filter: 'blur(4px)' },
          visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
        };
      case 'bottom':
        return {
          hidden: { opacity: 0, y: distance, filter: 'blur(4px)' },
          visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
        };
      case 'scale':
        return {
          hidden: { opacity: 0, scale: 0.85, filter: 'blur(6px)' },
          visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
        };
      case 'fade':
      default:
        return {
          hidden: { opacity: 0, filter: 'blur(4px)' },
          visible: { opacity: 1, filter: 'blur(0px)' },
        };
    }
  };

  return (
    <div ref={ref} style={{ position: "relative", width }} className={className}>
      <motion.div
        variants={getVariants()}
        initial="hidden"
        animate={mainControls}
        transition={{ 
          duration, 
          delay, 
          ease: [0.25, 0.4, 0.25, 1],
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default Reveal;