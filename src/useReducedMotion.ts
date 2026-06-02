import { useReducedMotion as useFramerReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Returns true when the user has requested reduced motion via OS settings.
 * Uses framer-motion's built-in detection with a fallback to raw media query.
 */
export function useReducedMotion(): boolean {
  const framerPrefers = useFramerReducedMotion();
  const [mediaPrefers, setMediaPrefers] = useState(() => {
    try {
      return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let mql: MediaQueryList;
    try {
      mql = window.matchMedia("(prefers-reduced-motion: reduce)");
      const handler = (e: MediaQueryListEvent) => setMediaPrefers(e.matches);
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    } catch {
      // SSR / old browser — no-op
    }
  }, []);

  return framerPrefers ?? mediaPrefers;
}
