
import React, { createContext, useContext, useEffect, useState } from 'react';
import { mongodbClient } from '@/integrations/mongodb/client';

interface User {
  id: string;
  email: string;
  fullName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app load
    const token = localStorage.getItem('authToken');
    if (token) {
      // You could verify the token here if needed
      // For now, we'll just check if it exists
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          // Clear invalid user data
          localStorage.removeItem('userData');
          localStorage.removeItem('authToken');
        }
      } else {
        // Clear token if no user data
        localStorage.removeItem('authToken');
      }
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await mongodbClient.signUp(email, password, fullName);
      
      if (error) {
        return { error };
      }

      if (data?.user) {
        setUser(data.user);
        localStorage.setItem('userData', JSON.stringify(data.user));
      }
      
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await mongodbClient.signIn(email, password);
      
      if (error) {
        return { error };
      }

      if (data?.user) {
        setUser(data.user);
        localStorage.setItem('userData', JSON.stringify(data.user));
      }
      
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await mongodbClient.signOut();
      setUser(null);
      localStorage.removeItem('userData');
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
