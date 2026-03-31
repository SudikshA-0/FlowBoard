import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setUnauthorizedHandler } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    setUnauthorizedHandler(() => {
      disconnectSocket();
      setUser(null);
    });

    const token = localStorage.getItem('fb_token');
    if (!token) { setLoading(false); return; }

    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data.user);
        connectSocket(data.user._id);
      })
      .catch(() => localStorage.removeItem('fb_token'))
      .finally(() => setLoading(false));

    return () => setUnauthorizedHandler(null);
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/signup', {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });
    localStorage.setItem('fb_token', data.token);
    setUser(data.user);
    connectSocket(data.user._id);
    return data.user;
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });
    localStorage.setItem('fb_token', data.token);
    setUser(data.user);
    connectSocket(data.user._id);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('fb_token');
    disconnectSocket();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
