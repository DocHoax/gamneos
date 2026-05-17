import { useContext } from 'react';
import { achievements } from '../data/content';
import { ProgressContext } from './progressContextValue';

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
