import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole } from '../models/insurance';
import { authService } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<UserProfile>;
  register: (
    email: string, 
    pass: string, 
    name: string, 
    role?: UserRole, 
    details?: Partial<UserProfile>
  ) => Promise<UserProfile>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Subscribe to Firebase Auth state listener
    const unsubscribe = authService.onAuthStateChangedListener((profile) => {
      setUser(profile);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      const profile = await authService.login(email, pass);
      setUser(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string, 
    pass: string, 
    name: string, 
    role?: UserRole, 
    details?: Partial<UserProfile>
  ): Promise<UserProfile> => {
    setLoading(true);
    try {
      const profile = await authService.register(email, pass, name, role, details);
      setUser(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    await authService.sendPasswordReset(email);
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = useCallback(async (): Promise<UserProfile | null> => {
    if (!user?.uid) return null;
    try {
      const fresh = await authService.getUserProfile(user.uid, user.email);
      setUser(fresh);
      return fresh;
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
      return user;
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        loading,
        login,
        register,
        resetPassword,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
