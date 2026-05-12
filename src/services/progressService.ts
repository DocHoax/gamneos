import { achievements } from '../data/content';
import type { Challenge, ChallengeResult, ChallengeSubmission, GameUser, UserProgress } from '../types';
import { createId, readJson, writeJson } from '../lib/storage';
import { evaluateChallenge, levelFromXp, resolveAchievementUnlocks } from '../lib/engine';

const PROGRESS_KEY = 'gamneos.progress';

function readAllProgress(): Record<string, UserProgress> {
  return readJson<Record<string, UserProgress>>(PROGRESS_KEY, {});
}

function writeAllProgress(progressMap: Record<string, UserProgress>): void {
  writeJson(PROGRESS_KEY, progressMap);
}

function createEmptyProgress(userId: string): UserProgress {
  return {
    userId,
    totalXp: 0,
    completedChallengeIds: [],
    unlockedAchievementIds: [],
    attempts: [],
    lastPlayedAt: undefined,
  };
}

export function ensureProgressRecord(user: GameUser): UserProgress {
  const progressMap = readAllProgress();
  const existing = progressMap[user.id];

  if (existing) {
    return existing;
  }

  const fresh = createEmptyProgress(user.id);
  progressMap[user.id] = fresh;
  writeAllProgress(progressMap);
  return fresh;
}

export function getProgress(userId: string): UserProgress {
  const progressMap = readAllProgress();
  return progressMap[userId] ?? createEmptyProgress(userId);
}

export function completeChallenge(
  user: GameUser,
  challenge: Challenge,
  submission: ChallengeSubmission,
): ChallengeResult {
  const progressMap = readAllProgress();
  const current = progressMap[user.id] ?? createEmptyProgress(user.id);
  const evaluation = evaluateChallenge(challenge, submission);
  const alreadyCompleted = current.completedChallengeIds.includes(challenge.id);
  const earnedXp = alreadyCompleted ? 0 : evaluation.earnedXp;
  const nextCompletedChallengeIds = alreadyCompleted
    ? current.completedChallengeIds
    : [...current.completedChallengeIds, challenge.id];
  const attempt = {
    id: createId(),
    challengeId: challenge.id,
    score: evaluation.score,
    totalQuestions: evaluation.totalQuestions,
    earnedXp,
    completedAt: new Date().toISOString(),
  };

  const nextProgress: UserProgress = {
    ...current,
    totalXp: current.totalXp + earnedXp,
    completedChallengeIds: nextCompletedChallengeIds,
    attempts: [attempt, ...current.attempts].slice(0, 12),
    lastPlayedAt: attempt.completedAt,
  };

  nextProgress.unlockedAchievementIds = [
    ...new Set([
      ...current.unlockedAchievementIds,
      ...resolveAchievementUnlocks(
        {
          ...nextProgress,
          unlockedAchievementIds: current.unlockedAchievementIds,
        },
        achievements,
      ),
    ]),
  ];

  progressMap[user.id] = {
    ...nextProgress,
    level: levelFromXp(nextProgress.totalXp),
  } as UserProgress & { level?: number };
  writeAllProgress(progressMap);

  return {
    ...evaluation,
    earnedXp,
    alreadyCompleted,
    newlyUnlockedAchievementIds: nextProgress.unlockedAchievementIds.filter(
      (achievementId) => !current.unlockedAchievementIds.includes(achievementId),
    ),
    attempt,
  };
}

export function getProgressSnapshot(userId: string) {
  const progress = getProgress(userId);
  return {
    ...progress,
    level: levelFromXp(progress.totalXp),
  };
}
