import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('hackbuddy_user') || 'null');
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const persistAuth = useCallback(({ token, user: nextUser }) => {
    if (token) {
      localStorage.setItem('hackbuddy_token', token);
    }
    if (nextUser) {
      localStorage.setItem('hackbuddy_user', JSON.stringify(nextUser));
      setUser(nextUser);
    }
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('hackbuddy_token');
    localStorage.removeItem('hackbuddy_user');
    setUser(null);
  }, []);

  // Rehydrate authenticated session from server on application boot
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (isMounted && data.success && data.user) {
          setUser(data.user);
          localStorage.setItem('hackbuddy_user', JSON.stringify(data.user));
        }
      } catch (_error) {
        if (isMounted) {
          // If server rejects session (or user is unverified), clean local cache
          clearAuth();
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    verifySession();

    const handleUnauthorized = () => {
      clearAuth();
    };

    window.addEventListener('hackbuddy:unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('hackbuddy:unauthorized', handleUnauthorized);
    };
  }, [clearAuth]);

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/login', credentials);
      if (data.token && data.user) {
        persistAuth(data);
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (profile) => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/register', profile);
      if (data.token && data.user) {
        persistAuth(data);
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async (email) => {
    const { data } = await api.post('/auth/resend-verification', { email });
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_error) {
      // Proceed with local logout regardless of network error
    } finally {
      clearAuth();
    }
  };

  const updateUser = (nextUser) => {
    localStorage.setItem('hackbuddy_user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isInitializing,
      isAuthenticated: Boolean(user),
      login,
      register,
      resendVerification,
      logout,
      persistAuth,
      updateUser,
    }),
    [user, isLoading, isInitializing, persistAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
};
