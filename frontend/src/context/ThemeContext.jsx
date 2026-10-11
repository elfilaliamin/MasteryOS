import { useState, useEffect, useCallback } from 'react';
import { ThemeContext } from './themeContextInstance';
import { api } from '../services/api';

export const ThemeProvider = ({ children }) => {
  const getSystemTheme = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }, []);

  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('taskmaster_theme_mode') || 'system';
  });

  const [theme, setTheme] = useState(() => {
    const savedMode = localStorage.getItem('taskmaster_theme_mode');
    const legacySaved = localStorage.getItem('taskmaster_theme');
    if (savedMode === 'dark' || savedMode === 'light') return savedMode;
    if (legacySaved === 'dark' || legacySaved === 'light') return legacySaved;
    return getSystemTheme();
  });

  // Listen for settings sync from backend
  useEffect(() => {
    const handleSettingsSync = (e) => {
      const syncedMode = e.detail?.themeMode;
      if (syncedMode && (syncedMode === 'light' || syncedMode === 'dark' || syncedMode === 'system')) {
        setThemeMode(syncedMode);
        if (syncedMode === 'system') {
          setTheme(getSystemTheme());
        } else {
          setTheme(syncedMode);
        }
      }
    };
    window.addEventListener('taskmaster_settings_sync', handleSettingsSync);
    return () => window.removeEventListener('taskmaster_settings_sync', handleSettingsSync);
  }, [getSystemTheme]);

  // Listen to live system preference changes when in 'system' mode
  useEffect(() => {
    if (themeMode !== 'system') return;
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [themeMode]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('taskmaster_theme', theme);
  }, [theme]);

  const selectThemeMode = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('taskmaster_theme_mode', mode);
    if (mode === 'system') {
      setTheme(getSystemTheme());
    } else {
      setTheme(mode);
    }

    if (localStorage.getItem('master_tasks_token')) {
      api.updateSettings({ themeMode: mode }).catch(() => {});
    }
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    selectThemeMode(next);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        themeMode,
        selectThemeMode,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
