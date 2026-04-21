import { createContext, useContext, useState, useEffect } from 'react';
import api, { setToken } from '../api/axiosInstance';
import type { User } from '../types/auth.types';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (accessToken: string, userData: User) => void;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: try to restore session using the HttpOnly refresh token cookie.
  // If the cookie is valid, the backend issues a new access token.
  // No localStorage — token lives in memory only.
  useEffect(() => {
    api.post('/auth/refresh', {})
      .then(res => {
        const payload = res.data?.data;
        if (payload?.accessToken) {
          setToken(payload.accessToken);
          setUser(payload.user);
        }
      })
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (accessToken: string, userData: User) => {
    setToken(accessToken);
    setUser(userData);
  };

  const logout = () => {
    api.post('/auth/logout', {}).finally(() => {
      setToken(null);
      setUser(null);
    });
  };

  const updateUser = (partial: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...partial } : prev);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthCtx => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
