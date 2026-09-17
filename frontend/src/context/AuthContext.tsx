import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  switchRoleDemo: (role: UserRole) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('coopconnect_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    if (!localStorage.getItem('coopconnect_token')) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const data = await api.getMe();
      setUser(data);
    } catch (err) {
      console.error('Failed to load profile', err);
      localStorage.removeItem('coopconnect_token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    localStorage.setItem('coopconnect_token', res.access_token);
    setToken(res.access_token);
    await refreshProfile();
    return res.user;
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    localStorage.setItem('coopconnect_token', res.access_token);
    setToken(res.access_token);
    await refreshProfile();
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('coopconnect_token');
    setToken(null);
    setUser(null);
  };

  const switchRoleDemo = async (role: UserRole) => {
    const accounts = {
      ADMIN: 'admin@coopconnect.demo',
      WORKER: 'worker@coopconnect.demo',
      CUSTOMER: 'customer@coopconnect.demo',
    };
    await login(accounts[role], 'coopconnect123');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, switchRoleDemo, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
