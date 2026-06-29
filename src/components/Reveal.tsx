"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

/**
 * Scroll-reveal — motion ile akıcı giriş (Linear/Stripe cilası).
 * Görünür alana girince yumuşak belirir; prefers-reduced-motion'da anında görünür.
 */
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  const variants: Variants = {
    gizli: { opacity: 0, y: reduce ? 0 : 22 },
    gor: { opacity: 1, y: 0, transition: { duration: 0.6, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] } },
  };
  return (
    <motion.div className={className} variants={variants} initial="gizli" whileInView="gor" viewport={{ once: true, margin: "0px 0px -8% 0px" }}>
      {children}
    </motion.div>
  );
}
