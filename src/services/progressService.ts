import { achievements } from '../data/content';
import type { Challenge, ChallengeResult, ChallengeSubmission, GameUser, UserProgress } from '../types';
import { createId, readJson, writeJson } from '../lib/storage';
import { doc, getDoc, runTransaction, setDoc } from 'firebase/firestore';
import { firebaseReady, getFirebaseDb } from '../lib/firebase';
import { evaluateChallenge, levelFromXp, resolveAchievementUnlocks } from '../lib/engine';

const PROGRESS_KEY = 'gamneos.progress';

function readAllProgress(): Record<string, UserProgress> {
  return readJson<Record<string, UserProgress>>(PROGRESS_KEY, {});
}

function writeAllProgress(progressMap: Record<string, UserProgress>): void {
  writeJson(PROGRESS_KEY, progressMap);
}

function getProgressRef(userId: string) {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error('Firebase is not configured.');
  }

  return doc(db, 'progress', userId);
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

function normalizeProgress(userId: string, value: Partial<UserProgress> | undefined): UserProgress {
  const fallback = createEmptyProgress(userId);

  if (!value) {
    return fallback;
  }

  return {
    userId,
    totalXp: value.totalXp ?? 0,
    completedChallengeIds: value.completedChallengeIds ?? [],
    unlockedAchievementIds: value.unlockedAchievementIds ?? [],
    attempts: value.attempts ?? [],
    lastPlayedAt: value.lastPlayedAt,
  };
}

export async function ensureProgressRecord(user: GameUser): Promise<UserProgress> {
  if (firebaseReady) {
    const ref = getProgressRef(user.id);
    const snapshot = await getDoc(ref);

    if (snapshot.exists()) {
      return normalizeProgress(user.id, snapshot.data() as Partial<UserProgress>);
    }

    const fresh = createEmptyProgress(user.id);
    await setDoc(ref, fresh, { merge: true });
    return fresh;
  }

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

export async function getProgress(userId: string): Promise<UserProgress> {
  if (firebaseReady) {
    const ref = getProgressRef(userId);
    const snapshot = await getDoc(ref);
    return normalizeProgress(userId, snapshot.exists() ? (snapshot.data() as Partial<UserProgress>) : undefined);
  }

  const progressMap = readAllProgress();
  return progressMap[userId] ?? createEmptyProgress(userId);
}

export async function completeChallenge(
  user: GameUser,
  challenge: Challenge,
  submission: ChallengeSubmission,
): Promise<ChallengeResult> {
  if (firebaseReady) {
    const ref = getProgressRef(user.id);

    return runTransaction(getFirebaseDb()!, async (transaction) => {
      const snapshot = await transaction.get(ref);
      const current = normalizeProgress(user.id, snapshot.exists() ? (snapshot.data() as Partial<UserProgress>) : undefined);
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

      const storedProgress = {
        ...nextProgress,
        level: levelFromXp(nextProgress.totalXp),
      } as UserProgress & { level?: number };

      transaction.set(ref, storedProgress, { merge: true });

      return {
        ...evaluation,
        earnedXp,
        alreadyCompleted,
        newlyUnlockedAchievementIds: nextProgress.unlockedAchievementIds.filter(
          (achievementId) => !current.unlockedAchievementIds.includes(achievementId),
        ),
        attempt,
      };
    });
  }

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

export async function getProgressSnapshot(userId: string) {
  const progress = await getProgress(userId);
  return {
    ...progress,
    level: levelFromXp(progress.totalXp),
  };
}

export function listAllProgress(): Record<string, UserProgress> {
  if (firebaseReady) {
    // Listing all progress requires privileged access in a real deployment.
    // For now, when using Firebase mode, return an empty map to avoid exposing data.
    return {};
  }

  return readAllProgress();
}
