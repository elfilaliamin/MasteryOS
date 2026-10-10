import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AuthContext } from './authContextInstance';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('master_tasks_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const storedToken = localStorage.getItem('master_tasks_token');
      const storedUser = localStorage.getItem('master_tasks_user');

      if (storedToken && storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          // Purge stale mock demo account session if present
          if (parsed.id === 'demo-user-123' || parsed.email === 'demo@taskmaster.io') {
            localStorage.removeItem('master_tasks_token');
            localStorage.removeItem('master_tasks_user');
            if (isMounted) {
              setUser(null);
              setToken(null);
              setIsLoading(false);
            }
            return;
          }

          if (isMounted) {
            setUser(parsed);
            setToken(storedToken);
          }
          const res = await api.getMe();
          if (isMounted && res.user) {
            setUser(res.user);
            localStorage.setItem('master_tasks_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session verification warning:', err.message);
        }
      }
      if (isMounted) {
        setIsLoading(false);
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
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('master_tasks_token', data.token);
      localStorage.setItem('master_tasks_user', JSON.stringify(data.user));
      return { success: true };
    } catch (err) {
      // Offline fallback: check registered local users
      try {
        const localUsers = JSON.parse(localStorage.getItem('mastery_registered_users') || '[]');
        const matched = localUsers.find(
          (u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
        );
        if (matched) {
          const safeUser = {
            id: matched.id,
            full_name: matched.full_name,
            email: matched.email,
            avatar_url: matched.avatar_url,
            created_at: matched.created_at,
          };
          const localToken = `local_jwt_${Date.now()}`;
          setToken(localToken);
          setUser(safeUser);
          localStorage.setItem('master_tasks_token', localToken);
          localStorage.setItem('master_tasks_user', JSON.stringify(safeUser));
          return { success: true };
        }
      } catch {
        // ignore JSON parse errors
      }
      return { success: false, error: err.message || 'Invalid email or password.' };
    }
  };

  const register = async (fullName, email, password) => {
    try {
      const data = await api.register(fullName, email, password);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('master_tasks_token', data.token);
      localStorage.setItem('master_tasks_user', JSON.stringify(data.user));
      return { success: true };
    } catch (err) {
      // Offline fallback: register as a real user locally
      if (fullName && email) {
        try {
          const localUsers = JSON.parse(localStorage.getItem('mastery_registered_users') || '[]');
          const normalizedEmail = email.toLowerCase().trim();
          const existing = localUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
          if (existing) {
            return { success: false, error: 'An account with this email already exists.' };
          }
          const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `usr_${Date.now()}`;
          const newUser = {
            id,
            full_name: fullName.trim(),
            email: normalizedEmail,
            password,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName.trim())}`,
            created_at: new Date().toISOString()
          };
          localUsers.push(newUser);
          localStorage.setItem('mastery_registered_users', JSON.stringify(localUsers));

          const safeUser = {
            id: newUser.id,
            full_name: newUser.full_name,
            email: newUser.email,
            avatar_url: newUser.avatar_url,
            created_at: newUser.created_at,
          };
          const localToken = `local_jwt_${Date.now()}`;
          setToken(localToken);
          setUser(safeUser);
          localStorage.setItem('master_tasks_token', localToken);
          localStorage.setItem('master_tasks_user', JSON.stringify(safeUser));
          return { success: true };
        } catch {
          // ignore
        }
      }
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

    try {
      const localUsers = JSON.parse(localStorage.getItem('mastery_registered_users') || '[]');
      const idx = localUsers.findIndex((u) => u.id === updatedUser.id);
      if (idx !== -1) {
        localUsers[idx].full_name = updatedUser.full_name;
        if (updatedUser.avatar_url) localUsers[idx].avatar_url = updatedUser.avatar_url;
        localStorage.setItem('mastery_registered_users', JSON.stringify(localUsers));
      }
    } catch {
      // ignore
    }

    setUser(updatedUser);
    localStorage.setItem('master_tasks_user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('master_tasks_token');
    localStorage.removeItem('master_tasks_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
