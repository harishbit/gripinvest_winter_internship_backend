'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import { safeLocalStorage } from '@/lib/client-only';
import { User, AuthResponse, SignupData, GetMeResponse } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount (client-side only)
    const storedToken = safeLocalStorage().getItem('token');
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (authToken: string) => {
    try {
      const data: GetMeResponse = await apiClient.getMe();
      setUser(data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Only remove token if it's an authentication error, not a network error
      if (error instanceof Error && error.message.includes('401')) {
        safeLocalStorage().removeItem('token');
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data: AuthResponse = await apiClient.login({ email, password });
      setToken(data.token);
      setUser(data.user);
      safeLocalStorage().setItem('token', data.token);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData: SignupData) => {
    setLoading(true);
    try {
      const data: AuthResponse = await apiClient.signup(userData);
      setToken(data.token);
      setUser(data.user);
      safeLocalStorage().setItem('token', data.token);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    safeLocalStorage().removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
