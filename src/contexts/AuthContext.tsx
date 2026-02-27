'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { storage } from '@/lib/storage';
import { logger } from '@/lib/logger';

interface User {
  id: string;
  email: string;
  name?: string;
  nickname?: string;
  claude_api_key?: string;
  tavily_api_key?: string;
  created_at?: string;
  last_active?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string, claudeApiKey?: string, tavilyApiKey?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = storage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Call the API using the actual method
      const userData = await apiClient.getCurrentUser();
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      storage.removeItem('auth_token');
      logger.error('Auth check failed', error);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      if (response.user) {
        setUser(response.user);
      } else {
        const userData = await apiClient.getCurrentUser();
        setUser(userData);
      }
      router.push('/dashboard');
    } catch (error) {
      logger.error('Login failed', error);
      throw error;
    }
  }, [router]);

  const register = useCallback(async (email: string, password: string, name?: string, claudeApiKey?: string, tavilyApiKey?: string) => {
    try {
      const response = await apiClient.register(
        email,
        password,
        name || email.split('@')[0],
        claudeApiKey || '',
        tavilyApiKey || ''
      );
      if (response.user) {
        setUser(response.user);
      } else {
        const userData = await apiClient.getCurrentUser();
        setUser(userData);
      }
      router.push('/dashboard');
    } catch (error) {
      logger.error('Registration failed', error);
      throw error;
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      apiClient.logout();
      storage.removeItem('auth_token');
      setUser(null);
      router.push('/login');
    } catch (error) {
      logger.error('Logout error', error);
    }
  }, [router]);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  const value = useMemo(() => ({
    user, loading, login, register, logout, updateUser,
  }), [user, loading, login, register, logout, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
