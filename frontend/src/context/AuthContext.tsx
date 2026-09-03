'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginRequest } from '@/types';
import { api } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkSession() {
      try {
        const currentUser = await api.getCurrentUser();
        setUser(currentUser);
        if (!currentUser && !pathname.startsWith('/login')) {
          router.push('/login');
        }
      } catch {
        setUser(null);
        if (!pathname.startsWith('/login')) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, [pathname, router]);

  const login = async (credentials: LoginRequest) => {
    try {
      const res = await api.login(credentials);
      if (res.user) {
        setUser(res.user);
        router.push('/conversations');
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email or password';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
