export type UserRole = 'player' | 'admin';

export interface GameUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  joinedAt: string;
}

export interface ChallengeQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Challenge {
  id: string;
  topicId: string;
  title: string;
  summary: string;
  story: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  xpReward: number;
  questions: ChallengeQuestion[];
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  accent: string;
  challengeIds: string[];
}

export type AchievementRequirement =
  | { kind: 'completions'; value: number }
  | { kind: 'xp'; value: number };

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: AchievementRequirement;
}

export interface ChallengeAttempt {
  id: string;
  challengeId: string;
  score: number;
  totalQuestions: number;
  earnedXp: number;
  completedAt: string;
}

export interface UserProgress {
  userId: string;
  totalXp: number;
  completedChallengeIds: string[];
  unlockedAchievementIds: string[];
  attempts: ChallengeAttempt[];
  lastPlayedAt?: string;
}

export interface ChallengeSubmission {
  answers: Record<string, number | null>;
}

export interface ChallengeResult {
  score: number;
  totalQuestions: number;
  correctCount: number;
  earnedXp: number;
  newlyUnlockedAchievementIds: string[];
  alreadyCompleted: boolean;
  attempt: ChallengeAttempt;
}
