"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type NotFoundChromeContextValue = {
  suppressNav: boolean;
  set404Active: (active: boolean) => void;
};

const NotFoundChromeContext =
  createContext<NotFoundChromeContextValue | null>(null);

export function NotFoundChromeProvider({ children }: { children: ReactNode }) {
  const [suppressNav, setSuppressNav] = useState(false);
  const set404Active = useCallback((active: boolean) => {
    setSuppressNav(active);
  }, []);
  const value = useMemo(
    () => ({ suppressNav, set404Active }),
    [suppressNav, set404Active],
  );
  return (
    <NotFoundChromeContext.Provider value={value}>
      {children}
    </NotFoundChromeContext.Provider>
  );
}

export function useNotFoundChrome() {
  return useContext(NotFoundChromeContext);
}
