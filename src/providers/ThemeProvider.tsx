'use client';

import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';

interface ThemeData {
  id: number;
  displayName: string;
  cssVariables: Record<string, string>;
}

interface ThemeContextValue {
  theme: ThemeData | null;
  isLoading: boolean;
  refreshTheme: () => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: null,
  isLoading: true,
  refreshTheme: async () => {},
});

function applyTheme(cssVariables: Record<string, string>) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(cssVariables)) {
    root.style.setProperty(key, value);
  }
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTheme = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/theme');
      const data = await res.json();
      if (data.success && data.data) {
        setTheme(data.data);
        applyTheme(data.data.cssVariables);
      }
    } catch {
      // Use default theme from CSS
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTheme();
  }, [refreshTheme]);

  return (
    <ThemeContext.Provider value={{ theme, isLoading, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
