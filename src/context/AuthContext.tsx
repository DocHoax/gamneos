import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { GameUser } from '../types';
import { getSessionUser, signIn as signInUser, signOut as signOutUser, signUp as signUpUser } from '../services/authService';

interface AuthContextValue {
  user: GameUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<GameUser>;
  signUp: (displayName: string, email: string, password: string) => Promise<GameUser>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GameUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const sessionUser = await getSessionUser();
      if (active) {
        setUser(sessionUser);
        setLoading(false);
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  async function signIn(email: string, password: string) {
    const nextUser = await signInUser({ email, password });
    setUser(nextUser);
    return nextUser;
  }

  async function signUp(displayName: string, email: string, password: string) {
    const nextUser = await signUpUser({ displayName, email, password });
    setUser(nextUser);
    return nextUser;
  }

  async function signOut() {
    await signOutUser();
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return value;
}
