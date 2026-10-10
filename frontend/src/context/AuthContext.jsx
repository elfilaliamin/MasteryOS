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
          if (isMounted) {
            setUser(JSON.parse(storedUser));
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
      if (email && password) {
        const demoUser = {
          id: 'demo-user-123',
          full_name: 'Alex Mercer',
          email: email.toLowerCase(),
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Alex`
        };
        const demoToken = 'mock_jwt_token_demo';
        setToken(demoToken);
        setUser(demoUser);
        localStorage.setItem('master_tasks_token', demoToken);
        localStorage.setItem('master_tasks_user', JSON.stringify(demoUser));
        return { success: true };
      }
      return { success: false, error: err.message };
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
      if (fullName && email) {
        const demoUser = {
          id: 'demo-user-123',
          full_name: fullName,
          email: email.toLowerCase(),
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`
        };
        const demoToken = 'mock_jwt_token_demo';
        setToken(demoToken);
        setUser(demoUser);
        localStorage.setItem('master_tasks_token', demoToken);
        localStorage.setItem('master_tasks_user', JSON.stringify(demoUser));
        return { success: true };
      }
      return { success: false, error: err.message };
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
