export type UserRole = 'player' | 'admin';

export interface LevelTier {
  level: number;
  name: string;
  requiredXp: number;
  summary: string;
}

export interface GameUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  joinedAt: string;
}

export type ChallengeMode = 'quiz' | 'drag-drop';

export interface ChallengeQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface DragDropZone {
  id: string;
  label: string;
  hint: string;
}

export interface DragDropItem {
  id: string;
  label: string;
  targetZoneId: string;
  explanation: string;
}

export interface DragDropGame {
  prompt: string;
  guidance: string;
  zones: DragDropZone[];
  items: DragDropItem[];
}

export interface Challenge {
  id: string;
  topicId: string;
  title: string;
  summary: string;
  story: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  mode: ChallengeMode;
  xpReward: number;
  questions: ChallengeQuestion[];
  dragDrop?: DragDropGame;
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

export type AchievementBadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  badgeTier: AchievementBadgeTier;
  requirement: AchievementRequirement;
}

export interface MissionSession {
  challengeId: string;
  questions: ChallengeQuestion[];
  dragDrop?: DragDropGame;
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

export interface QuizChallengeSubmission {
  kind: 'quiz';
  answers: Record<string, number | null>;
}

export interface DragDropChallengeSubmission {
  kind: 'drag-drop';
  placements: Record<string, string | null>;
}

export type ChallengeSubmission = QuizChallengeSubmission | DragDropChallengeSubmission;

export interface LevelProgressInfo {
  level: number;
  name: string;
  requiredXp: number;
  nextLevel: LevelTier | null;
  xpToNext: number;
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
