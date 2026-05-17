import type { Achievement } from '../types';

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
}

export function AchievementBadge({ achievement, unlocked }: AchievementBadgeProps) {
  return (
    <div
      className={`achievement-badge achievement-badge-${achievement.badgeTier} ${unlocked ? 'unlocked' : 'locked'}`}
      title={achievement.title}
    >
      <span className="achievement-badge-ring" aria-hidden />
      <span className="achievement-badge-core">
        <span className="achievement-badge-icon">{achievement.icon}</span>
      </span>
      {!unlocked ? <span className="achievement-badge-lock" aria-hidden>🔒</span> : null}
    </div>
  );
}
