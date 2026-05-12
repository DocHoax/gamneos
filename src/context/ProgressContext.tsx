import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { achievements, challengeById } from '../data/content';
import type { ChallengeResult, ChallengeSubmission, UserProgress } from '../types';
import { completeChallenge as completeChallengeRecord, getProgressSnapshot } from '../services/progressService';
import { useAuth } from './AuthContext';

interface ProgressContextValue {
  progress: UserProgress | null;
  level: number;
  completedCount: number;
  attemptsCount: number;
  recentChallengeIds: string[];
  unlockedAchievementIds: string[];
  completeChallenge: (challengeId: string, submission: ChallengeSubmission) => Promise<ChallengeResult>;
  refreshProgress: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    let active = true;

    if (!user) {
      setProgress(null);
      return;
    }

    async function bootstrapProgress() {
      const snapshot = await getProgressSnapshot(user.id);
      if (active) {
        setProgress(snapshot);
      }
    }
    void bootstrapProgress();

    return () => {
      active = false;
    };
  }, [user]);

  async function refreshProgress() {
    if (!user) {
      setProgress(null);
      return;
    }

    setProgress(await getProgressSnapshot(user.id));
  }

  async function completeChallenge(challengeId: string, submission: ChallengeSubmission) {
    if (!user) {
      throw new Error('You must be signed in to complete a challenge.');
    }

    const challenge = challengeById[challengeId];
    if (!challenge) {
      throw new Error('Challenge not found.');
    }

    const result = await completeChallengeRecord(user, challenge, submission);
    setProgress(await getProgressSnapshot(user.id));
    return result;
  }

  const value = useMemo<ProgressContextValue>(() => {
    const level = progress ? Math.max(1, Math.floor(progress.totalXp / 100) + 1) : 1;

    return {
      progress,
      level,
      completedCount: progress?.completedChallengeIds.length ?? 0,
      attemptsCount: progress?.attempts.length ?? 0,
      recentChallengeIds: progress?.attempts.slice(0, 3).map((attempt) => attempt.challengeId) ?? [],
      unlockedAchievementIds: progress?.unlockedAchievementIds ?? [],
      completeChallenge,
      refreshProgress,
    };
  }, [progress, user]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const value = useContext(ProgressContext);

  if (!value) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }

  return value;
}

export function useUnlockedAchievements() {
  const { unlockedAchievementIds } = useProgress();
  return achievements.filter((achievement) => unlockedAchievementIds.includes(achievement.id));
}
