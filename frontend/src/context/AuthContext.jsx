import { useCallback, useEffect, useRef, useState } from 'react';
import authService from '../services/authService';
import { AuthContext } from './authContextInstance';
import { restoreSession } from '../services/sessionRecovery';
import { subscribeRefresh } from '../services/refreshBus';
import api from '../services/api';
import { startPresenceHeartbeat } from '../services/presenceHeartbeat';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const [staffAccessError, setStaffAccessError] = useState('');
  const [verification, setVerification] = useState(null);
  const [verificationError, setVerificationError] = useState('');
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
  const refreshVerification = useCallback(async () => {
    if (!accountId || accountRole !== 'applicant') return;
    const version = sessionVersion.current;
    try {
      const response = await api.get('/applicant/verification');
      if (version !== sessionVersion.current) return;
      setVerification({ ...response.data.data, user_id: accountId });
      setVerificationError('');
    } catch {
      if (version !== sessionVersion.current) return;
      // Keep an unfinished correction form mounted during a network interruption,
      // while withholding every application action until status can be checked.
      setVerification((current) => current?.user_id === accountId
        ? { ...current, can_apply: false, can_apply_admission: false, scholarship_admission_satisfied: false }
        : null);
      setVerificationError('Verification status could not be loaded. Retry before applying.');
    }
  }, [accountId, accountRole]);
  useEffect(() => {
    if (!token || accountRole !== 'applicant') return;
    const refresh = () => { if (document.visibilityState !== 'hidden') void refreshVerification(); };
    const initial = window.setTimeout(refresh, 0);
    const timer = window.setInterval(refresh, 30000);
    const unsubscribe = subscribeRefresh(refresh);
    window.addEventListener('focus', refresh);
    return () => { clearTimeout(initial); clearInterval(timer); unsubscribe(); window.removeEventListener('focus', refresh); };
  }, [token, accountRole, refreshVerification]);
  useEffect(() => {
    if (!token || !accountId) return;
    return startPresenceHeartbeat(() => api.post('/auth/presence', {}, { timeout: 5000 }), {
      window, document,
      onError: (error) => { if (import.meta.env.DEV) console.debug('Presence heartbeat unavailable:', error.response?.status ?? 'network'); },
    });
  }, [token, accountId]);
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
    verification: verification?.user_id === accountId ? verification : null,
    verificationError,
    refreshVerification,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
