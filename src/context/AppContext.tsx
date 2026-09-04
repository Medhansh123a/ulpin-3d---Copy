import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { EntityRef, Theme, Toast, ToastType } from '../types';

interface AppState {
  theme: Theme;
  toggleTheme: () => void;
  selected: EntityRef | null;
  select: (e: EntityRef | null) => void;
  toasts: Toast[];
  notify: (msg: string, type?: ToastType) => void;
  dismissToast: (id: number) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('ulpin-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      /* noop */
    }
    return 'dark';
  });

  useEffect(() => {
    const el = document.documentElement;
    if (theme === 'dark') el.classList.add('dark');
    else el.classList.remove('dark');
    try {
      localStorage.setItem('ulpin-theme', theme);
    } catch {
      /* noop */
    }
  }, [theme]);

  const [selected, setSelected] = useState<EntityRef | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const notify = useCallback(
    (msg: string, type: ToastType = 'info') => {
      const id = toastId.current++;
      setToasts((t) => [...t.slice(-3), { id, msg, type }]);
      window.setTimeout(() => dismissToast(id), 4200);
    },
    [dismissToast],
  );

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  return (
    <Ctx.Provider
      value={{
        theme,
        toggleTheme,
        selected,
        select: setSelected,
        toasts,
        notify,
        dismissToast,
        sidebarOpen,
        setSidebarOpen,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}
