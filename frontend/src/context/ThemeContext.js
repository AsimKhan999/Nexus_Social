import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

const getSystemTheme = () => window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  const applyTheme = useCallback((t) => {
    const resolved = t === 'system' ? systemTheme : t;
    document.documentElement.setAttribute('data-theme', resolved === 'light' ? 'light' : '');
  }, [systemTheme]);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('theme', theme);
  }, [theme, applyTheme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e) => {
      setSystemTheme(e.matches ? 'light' : 'dark');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (theme === 'system') {
      applyTheme('system');
    }
  }, [systemTheme, theme, applyTheme]);

  const setThemeMode = (mode) => setTheme(mode);
  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'system') {
        return systemTheme === 'light' ? 'dark' : 'light';
      }
      return prev === 'light' ? 'dark' : 'light';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, systemTheme, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
