'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Role = 'CLIENT' | 'FREELANCER' | null;

interface UserProfile {
  id: string;
  name: string;
  company?: string;
  skills?: string;
}

interface UserContextType {
  role: Role;
  profile: UserProfile | null;
  loading: boolean;
  checkUser: (publicKey: string) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const checkUser = useCallback(async (publicKey: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/me?publicKey=${publicKey}`);
      if (res.ok) {
        const data = await res.json();
        setRole(data.role);
        setProfile(data.profile);
      } else {
        setRole(null);
        setProfile(null);
      }
    } catch (e) {
      console.error('Auth check failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    setRole(null);
    setProfile(null);
  };

  return (
    <UserContext.Provider value={{ role, profile, loading, checkUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
