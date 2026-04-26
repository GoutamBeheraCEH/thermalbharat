import { useState, useEffect } from "react";

export function usePersistedState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const saved = localStorage.getItem(`thermalbharat_${key}`);
      return saved !== null ? (JSON.parse(saved) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`thermalbharat_${key}`, JSON.stringify(state));
    } catch {
      // localStorage unavailable (private mode, quota, etc.)
    }
  }, [key, state]);

  return [state, setState] as const;
}
