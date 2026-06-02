import { type ReactNode, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "./useReducedMotion";
import Confetti from "./Confetti";

type AnimatedTaskRowProps = {
  taskId: string;
  isCompleted: boolean;
  isDeleted: boolean;
  isNew?: boolean;
  children: ReactNode;
};

const springTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 25,
  mass: 0.8,
};

const exitSpring = {
  type: "spring" as const,
  stiffness: 250,
  damping: 22,
  mass: 0.6,
};

export default function AnimatedTaskRow({
  taskId,
  isCompleted,
  isDeleted,
  isNew,
  children,
}: AnimatedTaskRowProps) {
  const shouldReduce = useReducedMotion();
  const [showConfetti, setShowConfetti] = useState(false);
  const [wasCompleted, setWasCompleted] = useState(isCompleted);
  const completeBtnRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Track completion toggle for confetti
  useEffect(() => {
    if (!wasCompleted && isCompleted) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 800);
      setWasCompleted(true);
      return () => clearTimeout(timer);
    }
    if (wasCompleted && !isCompleted) {
      setShowConfetti(false);
      setWasCompleted(false);
    }
  }, [isCompleted, wasCompleted]);

  if (shouldReduce) {
    return (
      <article
        className={`task-row ${isCompleted ? "is-completed" : ""} ${isDeleted ? "is-deleted" : ""}`}
      >
        {children}
      </article>
    );
  }

  const animateProp = isNew
    ? { opacity: 1, x: 0, scale: 1 }
    : { opacity: 1, x: 0, scale: 1 };

  const initialProp = isNew
    ? { opacity: 0, x: -80, scale: 0.95 }
    : { opacity: 0, x: -40, scale: 0.97 };

  return (
    <AnimatePresence mode="popLayout">
      <motion.article
        key={taskId}
        layout
        initial={initialProp}
        animate={animateProp}
        exit={{ opacity: 0, x: 200, scale: 0.9, transition: exitSpring }}
        transition={springTransition}
        className={`task-row ${isCompleted ? "is-completed" : ""} ${isDeleted ? "is-deleted" : ""}`}
        onContextMenu={(event) => {
          event.preventDefault();
          if (!isDeleted) {
            // The context menu handler is still inside children via the existing button
            // We need to forward this event. Let the children's handler fire.
            // Find the complete button and click it
            const btn = event.currentTarget.querySelector(".complete-button") as HTMLButtonElement | null;
            btn?.click();
          }
        }}
        ref={(el) => {
          if (el) {
            const btn = el.querySelector(".complete-button");
            if (btn) {
              const rect = btn.getBoundingClientRect();
              completeBtnRef.current = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
              };
            }
          }
        }}
      >
        {children}
        <Confetti
          active={showConfetti}
          originX={completeBtnRef.current.x}
          originY={completeBtnRef.current.y}
        />
      </motion.article>
    </AnimatePresence>
  );
}
