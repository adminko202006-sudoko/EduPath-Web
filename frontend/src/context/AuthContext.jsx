import { useCallback, useEffect, useRef, useState } from 'react';
import authService from '../services/authService';
import { AuthContext } from './authContextInstance';
import { restoreSession } from '../services/sessionRecovery';
import { subscribeRefresh } from '../services/refreshBus';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [staffAccessError, setStaffAccessError] = useState('');
  const sessionVersion = useRef(0);

  const invalidateSessionCheck = useCallback(() => { sessionVersion.current++; }, []);
  const retrySession = useCallback(async () => {
    const version = ++sessionVersion.current;
    const savedToken = localStorage.getItem('token');
    setLoading(true);
    setSessionError('');
    const result = await restoreSession(savedToken, authService.getUser);
    if (version !== sessionVersion.current || localStorage.getItem('token') !== savedToken) return;
    setUser(result.user);
    if (result.status === 'expired') {
      localStorage.removeItem('token');
      setToken(null);
    } else {
      setToken(savedToken);
      if (result.status === 'unavailable') {
        setSessionError('Your session could not be verified. Check your connection and try again.');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { retrySession(); }, 0);
    return () => { clearTimeout(timer); invalidateSessionCheck(); };
  }, [retrySession, invalidateSessionCheck]);

  // Admin changes must reach an already signed-in Staff account. Refresh in
  // the background without unmounting forms or showing the session loader.
  const accountId = user?.id;
  const accountRole = user?.role;
  useEffect(() => {
    if (!token || accountRole !== 'staff') return;
    let disposed = false;
    let pending = false;
    const version = sessionVersion.current;
    const refreshAccess = async () => {
      if (pending || document.visibilityState === 'hidden') return;
      pending = true;
      try {
        const result = await restoreSession(token, authService.getUser);
        if (disposed || version !== sessionVersion.current || localStorage.getItem('token') !== token) return;
        if (result.status === 'authenticated' && result.user.id === accountId) {
          setUser((current) => current?.id === accountId ? result.user : current);
          setStaffAccessError('');
        } else if (result.status === 'expired') {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setStaffAccessError('');
        } else {
          setStaffAccessError('Unable to refresh staff access. Check your connection; permissions will be checked again automatically.');
        }
      } finally { pending = false; }
    };
    const unsubscribe = subscribeRefresh(refreshAccess);
    const timer = window.setInterval(refreshAccess, 30000);
    window.addEventListener('focus', refreshAccess);
    document.addEventListener('visibilitychange', refreshAccess);
    return () => {
      disposed = true;
      unsubscribe();
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshAccess);
      document.removeEventListener('visibilitychange', refreshAccess);
    };
  }, [token, accountId, accountRole]);

  const login = async (credentials) => {
    const response = await authService.login(credentials);

    const newToken = response.token;
    invalidateSessionCheck();
    setLoading(false);
    setSessionError('');

    localStorage.setItem('token', newToken);

    setToken(newToken);
    setUser(response.data?.user || response.user || response.data || response);

    return response;
  };

  const register = async (userData) => {
    const response = await authService.register(userData);

    const newToken = response.token;
    invalidateSessionCheck();
    setLoading(false);
    setSessionError('');

    localStorage.setItem('token', newToken);

    setToken(newToken);
    setUser(response.data?.user || response.user || response.data || response);

    return response;
  };

  const logout = async () => {
    invalidateSessionCheck();
    try {
      if (token) {
        await authService.logout(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setLoading(false);
      setSessionError('');
    }
  };

  const updateUser = useCallback((changes) => {
    setUser((current) => current ? { ...current, ...changes } : current);
  }, []);

  const value = {
    user,
    token,
    loading,
    sessionError,
    staffAccessError: accountRole === 'staff' ? staffAccessError : '',
    retrySession,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
