"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Magnetic CTA — cursor'a hafif yaklaşan, premium hisli buton (motion).
 * Ölçülü: max ~6px kayma + hover lift. prefers-reduced-motion'da statik.
 */
export function MagneticButton({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.4 });

  const onMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set(((e.clientX - r.left) / r.width - 0.5) * 10);
    y.set(((e.clientY - r.top) / r.height - 0.5) * 8);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div style={{ x: sx, y: sy }} className="inline-flex">
      <Link href={href} onMouseMove={onMove} onMouseLeave={onLeave} className={className}>
        {children}
      </Link>
    </motion.div>
  );
}
