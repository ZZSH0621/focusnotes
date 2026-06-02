import { FormEvent, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import type { Priority } from "./types";
import { priorityMeta } from "./types";
import { useReducedMotion } from "./useReducedMotion";

type QuickCaptureProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, priority: Priority) => void;
};

export default function QuickCapture({ isOpen, onClose, onAdd }: QuickCaptureProps) {
  const shouldReduce = useReducedMotion();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("high");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setPriority("high");
      // Small delay to allow the animation to start, then focus
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, priority);
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="quick-capture-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.form
            className="quick-capture-card"
            initial={shouldReduce ? {} : { opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduce ? {} : { opacity: 0, y: -20, scale: 0.95 }}
            transition={shouldReduce ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <div className="capture-header">
              <h3>快速记录</h3>
              <button className="icon-button" type="button" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <input
              ref={inputRef}
              className="capture-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="记下你脑子里冒出来的事..."
              autoFocus
            />

            <div className="capture-footer">
              <div className="capture-priority">
                {(Object.keys(priorityMeta) as Priority[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`capture-prio-btn priority-${level} ${priority === level ? "is-active" : ""}`}
                    onClick={() => setPriority(level)}
                  >
                    {priorityMeta[level].label}
                  </button>
                ))}
              </div>
              <button className="capture-submit" type="submit" disabled={!title.trim()}>
                <Plus size={18} />
                添加
              </button>
            </div>

            <p className="capture-hint">
              按 <kbd>Enter</kbd> 添加 · <kbd>Esc</kbd> 取消
            </p>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
