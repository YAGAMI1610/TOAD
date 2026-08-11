"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface ToadSettings {
  enabled: boolean;
  toggle: () => void;
}

const ToadSettingsContext = createContext<ToadSettings>({ enabled: true, toggle: () => {} });

const STORAGE_KEY = "toad-intel:mascot";

/**
 * Lets people switch the mascot off — and remembers the choice. A persistent
 * animated character needs an off switch to be respectful.
 */
export function ToadSettingsProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "off") setEnabled(false);
    } catch {
      // Private-mode storage errors are non-fatal; keep the default.
    }
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return <ToadSettingsContext.Provider value={{ enabled, toggle }}>{children}</ToadSettingsContext.Provider>;
}

export function useToadSettings() {
  return useContext(ToadSettingsContext);
}
