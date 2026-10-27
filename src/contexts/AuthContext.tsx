import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../models/insurance';
import { authService } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const active = authService.getCurrentProfile();
      setUser(active);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const profile = await authService.login(email, pass);
      setUser(profile);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, pass: string, name: string, role?: UserRole) => {
    setLoading(true);
    try {
      const profile = await authService.register(email, pass, name, role);
      setUser(profile);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(authService.getCurrentProfile());
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (newRole: UserRole) => {
    setLoading(true);
    try {
      const switched = await authService.switchDemoRole(newRole);
      setUser(switched);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'guardian',
        loading,
        login,
        register,
        logout,
        switchRole
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
