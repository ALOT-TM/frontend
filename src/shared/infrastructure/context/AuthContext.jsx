import React, { createContext, useState, useCallback } from 'react';
import UserAuthenticationService from '../../../iamModule/domain/services/UserAuthenticationService';
import { readAuthSession } from '../authStorage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => readAuthSession());
  const [user, setUser] = useState(() => readAuthSession()?.user ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const loginSession = await UserAuthenticationService.login(email, password);
      setSession(loginSession);
      setUser(loginSession?.user ?? null);
      return loginSession;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email, password, role, companyId = null) => {
    setLoading(true);
    setError(null);
    try {
      await UserAuthenticationService.register(email, password, role, companyId);
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
    setSession(null);
    setUser(null);
  }, []);

  const value = {
    user,
    session,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!session?.token,
    userRole: user?.role || null,
    userId: session?.userId ?? user?.id ?? null,
    companyId: session?.companyId ?? user?.companyId ?? null,
    authToken: session?.token ?? null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

