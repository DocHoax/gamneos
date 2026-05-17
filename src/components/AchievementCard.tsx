import type { Achievement } from '../types';
import { AchievementBadge } from './AchievementBadge';

interface AchievementCardProps {
  achievement: Achievement;
  unlocked: boolean;
}

export function AchievementCard({ achievement, unlocked }: AchievementCardProps) {
  return (
    <article className={`achievement-tile ${unlocked ? 'unlocked' : 'locked'}`}>
      <AchievementBadge achievement={achievement} unlocked={unlocked} />
      <div className="achievement-tile-copy">
        <strong>{achievement.title}</strong>
        <small>{achievement.description}</small>
      </div>
    </article>
  );
}
