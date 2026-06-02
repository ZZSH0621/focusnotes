import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "./useReducedMotion";

type LaunchScreenProps = {
  onComplete: () => void;
};

const containerVariants = {
  enter: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.25, ease: "easeIn" },
  },
};

const itemVariants = {
  enter: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 20, mass: 0.6 },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.18 },
  },
};

export default function LaunchScreen({ onComplete }: LaunchScreenProps) {
  const shouldReduce = useReducedMotion();

  const logoTransition = shouldReduce
    ? { duration: 0.01 }
    : { type: "spring" as const, stiffness: 180, damping: 18, mass: 0.5 };

  const handleClick = () => {
    onComplete();
  };

  return (
    <AnimatePresence onExitComplete={onComplete}>
      <motion.div
        className="launch-screen"
        key="launch"
        initial={{ opacity: 1 }}
        exit={shouldReduce ? { opacity: 0 } : "exit"}
        variants={containerVariants}
        onClick={handleClick}
      >
        <div className="launch-content">
          <motion.div
            className="launch-logo"
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={logoTransition}
          >
            <span className="launch-icon">📝</span>
            <h1>Focus Notes</h1>
          </motion.div>

          <motion.p
            className="launch-tagline"
            variants={itemVariants}
            initial={{ opacity: 0, y: 16 }}
            animate="enter"
          >
            有仪式感的专注工具
          </motion.p>

          <motion.span
            className="launch-version"
            variants={itemVariants}
            initial={{ opacity: 0 }}
            animate="enter"
          >
            v2.0
          </motion.span>

          <motion.p
            className="launch-skip-hint"
            variants={itemVariants}
            initial={{ opacity: 0 }}
            animate="enter"
          >
            点击任意处进入
          </motion.p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
