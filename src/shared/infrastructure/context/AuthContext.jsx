import React, { createContext, useState, useCallback } from 'react';
import UserAuthenticationService from '../../../iamModule/domain/services/UserAuthenticationService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => UserAuthenticationService.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const loginUser = await UserAuthenticationService.login(email, password);
      setUser(loginUser);
      return loginUser;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email, password, role) => {
    setLoading(true);
    setError(null);
    try {
      await UserAuthenticationService.register(email, password, role);
      return true;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    UserAuthenticationService.logout();
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    userRole: user?.role || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

