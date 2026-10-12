import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AuthContext } from './authContextInstance';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Purge legacy insecure storage on application load
    try {
      localStorage.removeItem('mastery_registered_users');
      localStorage.removeItem('master_tasks_token');
      localStorage.removeItem('master_tasks_user');
    } catch {
      // ignore
    }

    const initAuth = async () => {
      try {
        const res = await api.getMe();
        if (isMounted && res.user) {
          setUser(res.user);
          if (res.user.settings) {
            if (res.user.settings.themeMode) {
              localStorage.setItem('taskmaster_theme_mode', res.user.settings.themeMode);
              window.dispatchEvent(new CustomEvent('taskmaster_settings_sync', { detail: res.user.settings }));
            }
            if (res.user.settings.dashboardConfig) {
              localStorage.setItem('mastery_dashboard_config', JSON.stringify(res.user.settings.dashboardConfig));
              window.dispatchEvent(new CustomEvent('mastery_dashboard_config_sync', { detail: res.user.settings.dashboardConfig }));
            }
            if (res.user.settings.equippedTitleId) {
              localStorage.setItem(`taskmaster_equipped_title_${res.user.id}`, res.user.settings.equippedTitleId);
              window.dispatchEvent(new CustomEvent('taskmaster_title_sync', { detail: res.user.settings.equippedTitleId }));
            }
          }
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      if (data.user?.settings) {
        if (data.user.settings.themeMode) {
          localStorage.setItem('taskmaster_theme_mode', data.user.settings.themeMode);
          window.dispatchEvent(new CustomEvent('taskmaster_settings_sync', { detail: data.user.settings }));
        }
        if (data.user.settings.dashboardConfig) {
          localStorage.setItem('mastery_dashboard_config', JSON.stringify(data.user.settings.dashboardConfig));
          window.dispatchEvent(new CustomEvent('mastery_dashboard_config_sync', { detail: data.user.settings.dashboardConfig }));
        }
        if (data.user.settings.equippedTitleId) {
          localStorage.setItem(`taskmaster_equipped_title_${data.user.id}`, data.user.settings.equippedTitleId);
          window.dispatchEvent(new CustomEvent('taskmaster_title_sync', { detail: data.user.settings.equippedTitleId }));
        }
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Invalid email or password.' };
    }
  };

  const clearUserLocalData = () => {
    try {
      localStorage.removeItem('mastery_local_habits');
      localStorage.removeItem('mastery_acknowledged_level');
      localStorage.removeItem('taskmaster_equipped_title');
    } catch {
      // ignore
    }
  };

  const register = async (fullName, email, password) => {
    clearUserLocalData();
    try {
      const data = await api.register(fullName, email, password);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to register account.' };
    }
  };

  const updateProfile = async (fullName, avatarUrl) => {
    let updatedUser = {
      ...(user || {}),
      full_name: fullName,
      avatar_url: avatarUrl || user?.avatar_url,
    };

    try {
      const res = await api.updateProfile(fullName, avatarUrl);
      if (res && res.user) {
        updatedUser = res.user;
      }
    } catch (err) {
      console.warn('API updateProfile notice:', err.message);
    }

    setUser(updatedUser);
    return updatedUser;
  };

  const updateSettings = async (partialSettings) => {
    if (!partialSettings || typeof partialSettings !== 'object') return;

    const currentSettings = user?.settings || {};
    const updatedSettings = {
      ...currentSettings,
      ...partialSettings,
    };
    const updatedUser = {
      ...(user || {}),
      settings: updatedSettings,
    };
    setUser(updatedUser);

    if (partialSettings.themeMode) {
      localStorage.setItem('taskmaster_theme_mode', partialSettings.themeMode);
    }
    if (partialSettings.dashboardConfig) {
      localStorage.setItem('mastery_dashboard_config', JSON.stringify(partialSettings.dashboardConfig));
    }
    if (partialSettings.equippedTitleId && user?.id) {
      localStorage.setItem(`taskmaster_equipped_title_${user.id}`, partialSettings.equippedTitleId);
    }

    try {
      const res = await api.updateSettings(partialSettings);
      if (res?.user) {
        setUser(res.user);
      }
    } catch (err) {
      console.warn('Persist settings to DB notice:', err.message);
    }
  };

  const logout = async () => {
    clearUserLocalData();
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        updateProfile,
        updateSettings,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
