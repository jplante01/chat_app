import { createContext, useContext, ReactNode } from 'react';
import type { Profile } from '../types/database.types';

// Mock AuthContext matching reference/authcontext.md pattern
// TODO: Replace with real implementation using Session, onAuthStateChange, etc.
interface AuthContextType {
  profile: Profile | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // TODO: Replace with real Supabase auth later
  // For now, hardcode to Alice from seed data
  // To test as different users, change the profile below
  const profile: Profile = {
    id: '00000000-0000-0000-0000-000000000001', // Alice's fixed ID from seed script
    username: 'alice',
    avatar_url: null,
    status: 'online',
    last_seen_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const value: AuthContextType = {
    profile,
    isLoading: false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
