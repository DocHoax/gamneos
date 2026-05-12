import type { Achievement, Challenge, ChallengeSubmission, UserProgress } from '../types';

export function levelFromXp(totalXp: number): number {
  return Math.max(1, Math.floor(totalXp / 100) + 1);
}

export function evaluateChallenge(challenge: Challenge, submission: ChallengeSubmission) {
  const totalQuestions = challenge.questions.length;
  const correctCount = challenge.questions.reduce((count, question) => {
    const selected = submission.answers[question.id];
    return selected === question.correctIndex ? count + 1 : count;
  }, 0);

  const score = Math.round((correctCount / totalQuestions) * 100);
  const earnedXp = correctCount === totalQuestions
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
