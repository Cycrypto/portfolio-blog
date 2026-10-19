"use client";
import { useEffect, useState } from "react";

// Recovery is scoped to the current browser tab. It never publishes content.
export function useSessionDraft<T>(
  key: string,
  value: T,
  dirty: boolean,
  valid: (value: unknown) => value is T,
) {
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<T | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(key);
      const stored: unknown = raw ? JSON.parse(raw) : null;
      if (valid(stored)) setRecovery(stored);
      else {
        sessionStorage.removeItem(key);
        setRecovery(null);
      }
    } catch {
      setRecovery(null);
    }
    setLoadedKey(key);
  }, [key, valid]);
  useEffect(() => {
    if (loadedKey !== key || recovery) return;
    try {
      if (dirty) sessionStorage.setItem(key, JSON.stringify(value));
      else sessionStorage.removeItem(key);
      setUnavailable(false);
    } catch {
      setUnavailable(true);
    }
  }, [key, value, dirty, loadedKey, recovery]);
  const clear = () => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* Editing remains available without browser storage. */
    }
    setRecovery(null);
  };
  return { recovery, clear, unavailable };
}
