import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    setUser(data.user);
    return data.user;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('luckio_token');
    if (!token) {
      setLoading(false);
      return;
    }
    refreshUser()
      .catch(() => localStorage.removeItem('luckio_token'))
      .finally(() => setLoading(false));
  }, [refreshUser]);

  const handleAuth = (data) => {
    localStorage.setItem('luckio_token', data.token);
    setUser(data.user);
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    handleAuth(data);
  };

  const register = async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, email, password });
    handleAuth(data);
  };

  const logout = () => {
    localStorage.removeItem('luckio_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);