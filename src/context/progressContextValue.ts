import { createContext } from 'react';
import type { ChallengeResult, ChallengeSubmission, UserProgress } from '../types';

export interface ProgressContextValue {
  progress: UserProgress | null;
  level: number;
  completedCount: number;
  attemptsCount: number;
  recentChallengeIds: string[];
  unlockedAchievementIds: string[];
  completeChallenge: (challengeId: string, submission: ChallengeSubmission) => Promise<ChallengeResult>;
  refreshProgress: () => Promise<void>;
}

export const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);
