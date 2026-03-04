import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import type { User } from '@/types';
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const checkedRef = useRef(false);

  const refreshProfile = async () => {
    try {
      const profile = await api.getProfile();
      setUser(profile);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    // Run checkAuth exactly ONCE
    if (checkedRef.current) return;
    checkedRef.current = true;

    const checkAuth = async () => {
      try {
        // Try to get profile — if access token is valid, this succeeds
        const profile = await api.getProfile();
        setUser(profile);
      } catch {
        // getProfile failed (401) and fetchWithRefresh already tried refresh once.
        // If we're here, session is invalid.
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    // Cookies set by server automatically. Just store user in state.
    setUser(response.user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAdmin,
        login,
        logout,
        refreshProfile,
      }}
    >
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
