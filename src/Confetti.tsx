import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { useReducedMotion } from "./useReducedMotion";

type ConfettiProps = {
  active: boolean;
  originX: number;
  originY: number;
  color?: string;
};

const PARTICLE_COUNT = 16;

export default function Confetti({ active, originX, originY, color = "#a44536" }: ConfettiProps) {
  const shouldReduce = useReducedMotion();
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; rotation: number; scale: number }>>([]);

  const generate = useCallback(() => {
    if (shouldReduce) {
      setParticles([]);
      return;
    }
    setParticles(
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 120,
        y: (Math.random() - 0.5) * 100 - 30,
        rotation: Math.random() * 360,
        scale: 0.4 + Math.random() * 0.8,
      }))
    );
  }, [shouldReduce]);

  useEffect(() => {
    if (active) generate();
  }, [active, generate]);

  if (shouldReduce) return null;

  return (
    <AnimatePresence>
      {active && (
        <div
          className="confetti-container"
          style={{ left: originX, top: originY }}
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="confetti-particle"
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: p.scale }}
              animate={{
                x: p.x,
                y: p.y,
                opacity: 0,
                rotate: p.rotation,
                scale: 0,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.55 + Math.random() * 0.35,
                ease: "easeOut",
              }}
              style={{
                position: "absolute",
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: color,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
