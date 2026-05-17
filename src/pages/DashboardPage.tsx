import { Link } from 'react-router-dom';
import { achievements, challengeById, levels, topics } from '../data/content';
import { useAuth } from '../context/useAuth';
import { useProgress } from '../context/useProgress';
import { getLevelProgress } from '../lib/engine';
import { Badge, Card, ProgressBar, StatCard } from '../components/ui';

export function DashboardPage() {
  const { user } = useAuth();
  const { progress, level, completedCount, attemptsCount, unlockedAchievementIds } = useProgress();
  const levelInfo = getLevelProgress(progress?.totalXp ?? 0);
  const levelStartXp = levelInfo.requiredXp;
  const nextLevelXp = levelInfo.nextLevel?.requiredXp ?? levelStartXp + 100;
  const levelBand = Math.max(1, nextLevelXp - levelStartXp);
  const levelProgress = progress ? Math.min(100, Math.max(0, ((progress.totalXp - levelStartXp) / levelBand) * 100)) : 0;
  const totalChallenges = topics.reduce((sum, topic) => sum + topic.challengeIds.length, 0);
  const unlockedAchievements = achievements.filter((achievement) => unlockedAchievementIds.includes(achievement.id));
  const recentAttempts = progress?.attempts.slice(0, 4) ?? [];

  return (
    <div className="section-stack">
      <section className="dashboard-hero card">
        <div>
          <span className="eyebrow">Mission dashboard</span>
          <h1>{user ? `Welcome back, ${user.displayName}.` : 'Your mission dashboard.'}</h1>
          <p>
            Review your active cyber missions, keep your XP climbing, and unlock new achievements as you progress.
          </p>
          <div className="button-row">
            <Link className="button button-primary" to="/app/challenges/phish-hunter">
              Start first mission
            </Link>
            <Link className="button button-ghost" to="/app/profile">
              View profile
            </Link>
          </div>
        </div>

        <Card className="dashboard-status">
          <span className="eyebrow">Live status</span>
          <div className="dashboard-status-row">
            <strong>Level {level} · {levelInfo.name}</strong>
            <Badge>{completedCount}/{totalChallenges} missions</Badge>
          </div>
          <ProgressBar value={levelProgress} />
          <small>{progress?.totalXp ?? 0} XP total</small>
        </Card>
      </section>

      <div className="stats-row">
        <StatCard label="Completed" value={`${completedCount}`} note="Missions cleared" />
        <StatCard label="Attempts" value={`${attemptsCount}`} note="Training sessions" />
        <StatCard label="Unlocked" value={`${unlockedAchievements.length}`} note="Achievements earned" />
        <StatCard label="Next tier" value={`${levelInfo.nextLevel ? levelInfo.xpToNext : 0}`} note={levelInfo.nextLevel ? `XP to ${levelInfo.nextLevel.name}` : 'Max level reached'} />
      </div>

      <section className="two-column">
        <Card>
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Campaign ladder</span>
              <h2>Level progression</h2>
            </div>
            <Badge>Level {levelInfo.level}</Badge>
          </div>

          <div className="level-stack">
            {levels.map((levelTier) => {
              const active = levelInfo.level >= levelTier.level;

              return (
                <div key={levelTier.level} className={`level-item ${active ? 'active' : ''}`}>
                  <div>
                    <strong>
                      Level {levelTier.level}: {levelTier.name}
                    </strong>
                    <small>{levelTier.summary}</small>
                  </div>
                  <Badge>{levelTier.requiredXp} XP</Badge>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Game modes</span>
              <h2>What players unlock</h2>
            </div>
            <Badge>2 modes</Badge>
          </div>

          <div className="mode-grid">
            <div className="mode-card">
              <strong>Question & answer</strong>
              <p>Pick the safest response, read the explanation, and bank XP from quiz missions.</p>
            </div>
            <div className="mode-card">
              <strong>Drag & drop</strong>
              <p>Sort clues into the right security zone by dragging or clicking items into place.</p>
            </div>
            <div className="mode-card">
              <strong>Badges and achievements</strong>
              <p>Unlock milestone badges as you clear missions and push through higher levels.</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="section-stack">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Missions</span>
            <h2>Choose the next challenge</h2>
          </div>
          <Badge>{topics.length} topic lanes</Badge>
        </div>

        <div className="topic-grid">
          {topics.map((topic) => {
            const topicCompleted = topic.challengeIds.filter((id) => progress?.completedChallengeIds.includes(id)).length;
            const nextChallengeId = topic.challengeIds.find((id) => !progress?.completedChallengeIds.includes(id)) ?? topic.challengeIds[0];
            const nextChallenge = challengeById[nextChallengeId];

            return (
              <Card className="topic-card" key={topic.id}>
                <div className="topic-dot" style={{ background: topic.accent }} />
                <h3>{topic.title}</h3>
                <p>{topic.description}</p>
                <div className="topic-meta">
                  <span>{topicCompleted}/{topic.challengeIds.length} complete</span>
                  <span>{nextChallenge.difficulty}</span>
                </div>
                <Link className="button button-accent" to={`/app/challenges/${nextChallenge.id}`}>
                  {topicCompleted === 0 ? 'Launch mission' : 'Continue path'}
                </Link>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="two-column">
        <Card>
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Achievements</span>
              <h2>Unlocked badges</h2>
            </div>
            <Badge>{unlockedAchievements.length}/{achievements.length}</Badge>
          </div>

          <div className="achievement-grid">
            {achievements.map((achievement) => {
              const unlocked = unlockedAchievementIds.includes(achievement.id);
              return (
                <div key={achievement.id} className={`achievement-card ${unlocked ? 'unlocked' : ''}`}>
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
              <span className="eyebrow">Recent work</span>
              <h2>Latest attempts</h2>
            </div>
            <Badge>{recentAttempts.length} entries</Badge>
          </div>

          <div className="attempt-list">
            {recentAttempts.length ? (
              recentAttempts.map((attempt) => {
                const challenge = challengeById[attempt.challengeId];
                return (
                  <div key={attempt.id} className="attempt-item">
                    <div>
                      <strong>{challenge.title}</strong>
                      <small>{new Date(attempt.completedAt).toLocaleString()}</small>
                    </div>
                    <div className="attempt-score">
                      <strong>{attempt.score}%</strong>
                      <small>{attempt.earnedXp} XP</small>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="empty-state">No attempts yet. Start a mission to begin tracking progress.</p>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
