import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { challengeById } from '../data/content';
import type { ChallengeResult, ChallengeSubmission, UserProgress } from '../types';
import { completeChallenge as completeChallengeRecord, getProgressSnapshot } from '../services/progressService';
import { getLevelProgress } from '../lib/engine';
import { useAuth } from './useAuth';
import { ProgressContext, type ProgressContextValue } from './progressContextValue';

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    let active = true;
    const activeUser = user;

    if (!activeUser) {
      setProgress(null);
      return;
    }

    const userId = activeUser.id;

    async function bootstrapProgress() {
      const snapshot = await getProgressSnapshot(userId);
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
    const level = progress ? getLevelProgress(progress.totalXp).level : 1;

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
