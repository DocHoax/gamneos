import { levels } from '../data/content';
import type { Achievement, Challenge, ChallengeSubmission, LevelProgressInfo, UserProgress } from '../types';

export function levelFromXp(totalXp: number): number {
  return getLevelProgress(totalXp).level;
}

export function getLevelProgress(totalXp: number): LevelProgressInfo {
  let currentLevel = levels[0];

  for (const level of levels) {
    if (totalXp >= level.requiredXp) {
      currentLevel = level;
      continue;
    }

    break;
  }

  const nextLevel = levels.find((level) => level.requiredXp > currentLevel.requiredXp) ?? null;

  return {
    level: currentLevel.level,
    name: currentLevel.name,
    requiredXp: currentLevel.requiredXp,
    nextLevel,
    xpToNext: nextLevel ? Math.max(0, nextLevel.requiredXp - totalXp) : 0,
  };
}

export function evaluateChallenge(challenge: Challenge, submission: ChallengeSubmission) {
  const isDragDrop = challenge.mode === 'drag-drop';
  const totalQuestions = isDragDrop ? challenge.dragDrop?.items.length ?? 0 : challenge.questions.length;
  const correctCount = isDragDrop
    ? (challenge.dragDrop?.items.reduce((count, item) => {
        const selectedZoneId = submission.kind === 'drag-drop' ? submission.placements[item.id] : null;
        return selectedZoneId === item.targetZoneId ? count + 1 : count;
      }, 0) ?? 0)
    : challenge.questions.reduce((count, question) => {
        const selected = submission.kind === 'quiz' ? submission.answers[question.id] : null;
        return selected === question.correctIndex ? count + 1 : count;
      }, 0);

  const score = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);
  const earnedXp = totalQuestions === 0
    ? challenge.xpReward
    : correctCount === totalQuestions
      ? challenge.xpReward + 20
      : Math.max(20, Math.round((score / 100) * challenge.xpReward));

  return {
    score,
    totalQuestions,
    correctCount,
    earnedXp,
  };
}

export function resolveAchievementUnlocks(
  progress: UserProgress,
  achievements: Achievement[],
): string[] {
  const unlocked = new Set(progress.unlockedAchievementIds);
  const completedCount = progress.completedChallengeIds.length;

  for (const achievement of achievements) {
    if (unlocked.has(achievement.id)) {
      continue;
    }

    if (achievement.requirement.kind === 'completions' && completedCount >= achievement.requirement.value) {
      unlocked.add(achievement.id);
    }

    if (achievement.requirement.kind === 'xp' && progress.totalXp >= achievement.requirement.value) {
      unlocked.add(achievement.id);
    }
  }

  return achievements.filter((achievement) => unlocked.has(achievement.id) && !progress.unlockedAchievementIds.includes(achievement.id)).map((achievement) => achievement.id);
}
