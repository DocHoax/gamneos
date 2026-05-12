import { achievements } from '../data/content';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import { Badge, Card, StatCard } from '../components/ui';

export function ProfilePage() {
  const { user } = useAuth();
  const { progress, level } = useProgress();
  const unlocked = achievements.filter((achievement) => progress?.unlockedAchievementIds.includes(achievement.id));

  return (
    <div className="section-stack">
      <Card className="profile-hero">
        <span className="eyebrow">Profile</span>
        <h1>{user?.displayName}</h1>
        <p>{user?.email}</p>
        <div className="topic-meta">
          <span>Member since {user ? new Date(user.joinedAt).toLocaleDateString() : '-'}</span>
          <span>Current level {level}</span>
        </div>
      </Card>

      <div className="stats-row">
        <StatCard label="XP" value={`${progress?.totalXp ?? 0}`} note="Total earned" />
        <StatCard label="Completed" value={`${progress?.completedChallengeIds.length ?? 0}`} note="Challenges cleared" />
        <StatCard label="Achievements" value={`${unlocked.length}`} note="Unlocked badges" />
        <StatCard label="Attempts" value={`${progress?.attempts.length ?? 0}`} note="Recorded sessions" />
      </div>

      <section className="two-column">
        <Card>
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Unlocked</span>
              <h2>Badge shelf</h2>
            </div>
            <Badge>{unlocked.length}/{achievements.length}</Badge>
          </div>

          <div className="achievement-grid">
            {achievements.map((achievement) => {
              const active = progress?.unlockedAchievementIds.includes(achievement.id) ?? false;
              return (
                <div key={achievement.id} className={`achievement-card ${active ? 'unlocked' : ''}`}>
                  <span>{achievement.icon}</span>
                  <div>
                    <strong>{achievement.title}</strong>
                    <small>{achievement.description}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Recent activity</span>
              <h2>Latest mission attempts</h2>
            </div>
            <Badge>{progress?.attempts.length ?? 0}</Badge>
          </div>

          <div className="attempt-list">
            {progress?.attempts.length ? (
              progress.attempts.map((attempt) => (
                <div key={attempt.id} className="attempt-item">
                  <div>
                    <strong>{attempt.challengeId}</strong>
                    <small>{new Date(attempt.completedAt).toLocaleString()}</small>
                  </div>
                  <div className="attempt-score">
                    <strong>{attempt.score}%</strong>
                    <small>{attempt.earnedXp} XP</small>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">No activity yet. Complete a mission to populate this profile.</p>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
