import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { authService } from '../services/services.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    authService.me().then((d) => setUser(d.user)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);

  const handleAuth = useCallback((data) => {
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(() => ({
    user, loading,
    login: async (email, password) => handleAuth(await authService.login(email, password)),
    signup: async (name, email, password) => handleAuth(await authService.register(name, email, password)),
    logout: async () => {
      try { await authService.logout(); } catch { /* token may already be invalid */ }
      localStorage.removeItem('token');
      setUser(null);
    },
    refreshUser: async () => setUser((await authService.me()).user),
  }), [user, loading, handleAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
