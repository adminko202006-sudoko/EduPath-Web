import { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      const savedToken = localStorage.getItem('token');

      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await authService.getUser(savedToken);

        setUser(response.data || response.user || response);
        setToken(savedToken);
      } catch (error) {
        console.error('Authentication check failed:', error);

        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);

    const newToken = response.token;

    localStorage.setItem('token', newToken);

    setToken(newToken);
    setUser(response.data?.user || response.user || response.data || response);

    return response;
  };

  const register = async (userData) => {
    const response = await authService.register(userData);

    const newToken = response.token;

    localStorage.setItem('token', newToken);

    setToken(newToken);
    setUser(response.data?.user || response.user || response.data || response);

    return response;
  };

  const logout = async () => {
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
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};