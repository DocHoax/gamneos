import { createContext } from 'react';
import type { GameUser } from '../types';

export interface AuthContextValue {
  user: GameUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<GameUser>;
  signUp: (displayName: string, email: string, password: string) => Promise<GameUser>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
