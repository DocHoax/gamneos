import { achievements, challengeById, challenges, topics } from '../data/content';
import { useAuth } from '../context/useAuth';
import { useProgress } from '../context/useProgress';
import { getLevelProgress } from '../lib/engine';
import { Badge, Card, LinkButton, ProgressBar, StatCard } from '../components/ui';

export function HomePage() {
  const { user } = useAuth();
  const { progress, level, completedCount } = useProgress();
  const levelInfo = getLevelProgress(progress?.totalXp ?? 0);
  const totalQuestions = challenges.reduce((sum, challenge) => sum + challenge.questions.length, 0);
  const answeredQuestions = progress?.attempts.reduce((sum, attempt) => sum + attempt.totalQuestions, 0) ?? 0;

  return (
    <div className="page-grid">
      <section className="hero card card-hero">
        <div>
          <Badge>Interactive training platform</Badge>
          <h1>Master safe online behavior through gamified cyber missions.</h1>
          <p>
            Learn to spot phishing, strengthen passwords, and harden your devices through short missions that feel like a
            game and track progress like a real product.
          </p>
          <div className="button-row">
            <LinkButton to={user ? '/app' : '/sign-up'}>{user ? 'Open dashboard' : 'Start mission'}</LinkButton>
            <LinkButton to="/sign-in" variant="ghost">
              {user ? 'Switch account' : 'Sign in'}
            </LinkButton>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-orb" />
          <div className="hero-card">
            <span>Active operations</span>
            <strong>{topics.length} topics</strong>
            <small>{challenges.length} missions, {totalQuestions} questions</small>
          </div>
          <div className="hero-card hero-card-alt">
            <span>Player status</span>
            <strong>{user ? `Level ${level}` : 'Guest'}</strong>
            <small>{user ? `${completedCount} missions completed` : 'Create an account to keep progress'}</small>
          </div>
        </div>
      </section>

      <div className="stats-row">
        <StatCard label="Missions" value={`${challenges.length}`} note="Curated scenarios" />
        <StatCard label="Achievements" value={`${achievements.length}`} note="Milestones and streaks" />
        <StatCard label="Topics" value={`${topics.length}`} note="Phishing, passwords, devices" />
        <StatCard label="Questions" value={`${totalQuestions}`} note="Decision points to solve" />
      </div>

      <section className="two-column">
        <Card>
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Game modes</span>
              <h2>Mission styles available</h2>
            </div>
            <Badge>2 styles</Badge>
          </div>

          <div className="mode-grid">
            <div className="mode-card">
              <strong>Question & answer</strong>
              <p>Choose the best response, compare results, and earn XP from scenario-based questions.</p>
            </div>
            <div className="mode-card">
              <strong>Drag & drop</strong>
              <p>Sort clues into the right security zone by dragging or clicking items into place.</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Levels</span>
              <h2>Campaign ladder</h2>
            </div>
            <Badge>Level {levelInfo.level}</Badge>
          </div>

          <div className="level-stack">
            <div className="level-item active">
              <div>
                <strong>{levelInfo.name}</strong>
                <small>{levelInfo.nextLevel ? `Next: ${levelInfo.nextLevel.name}` : 'Top tier reached'}</small>
              </div>
              <Badge>{levelInfo.requiredXp} XP</Badge>
            </div>
            <div className="level-item">
              <div>
                <strong>Progress to next level</strong>
                <small>{levelInfo.nextLevel ? `${levelInfo.xpToNext} XP remaining` : 'No further level'}</small>
              </div>
              <Badge>{progress?.totalXp ?? 0} XP</Badge>
            </div>
          </div>
        </Card>
      </section>

      <section className="section-stack">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Progress snapshot</span>
            <h2>{user ? 'Your active mission record' : 'What players unlock after signing in'}</h2>
          </div>
          {user ? <Badge>{answeredQuestions} answered</Badge> : <Badge>Sign in required</Badge>}
        </div>

        <Card className="progress-card">
          <div className="progress-copy">
            <h3>{user ? `${user.displayName}'s progress` : 'Build a mission record'}</h3>
            <p>
              {user
                ? 'Complete challenges to fill the XP bar, unlock achievements, and see your strongest security habits at a glance.'
                : 'Create an account, finish missions, and return to the dashboard to see your progress persist between sessions.'}
            </p>
          </div>
          <div className="progress-meter">
            <div className="progress-meter-head">
              <span>Level {user ? level : 1}</span>
              <strong>{progress?.totalXp ?? 0} XP</strong>
            </div>
            <ProgressBar value={progress ? progress.totalXp % 100 : 0} />
            <small>{progress ? `${progress.totalXp % 100}/100 XP to the next level` : '100 XP to the next level'}</small>
          </div>
        </Card>
      </section>

      <section className="section-stack">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Mission map</span>
            <h2>Topics and challenge paths</h2>
          </div>
          <Badge>Designed for expansion</Badge>
        </div>

        <div className="topic-grid">
          {topics.map((topic) => {
            const topicChallenges = topic.challengeIds.map((challengeId) => challengeById[challengeId]);
            const completedInTopic = progress?.completedChallengeIds.filter((challengeId) => topic.challengeIds.includes(challengeId)).length ?? 0;
            return (
              <Card className="topic-card" key={topic.id}>
                <div className="topic-dot" style={{ background: topic.accent }} />
                <h3>{topic.title}</h3>
                <p>{topic.description}</p>
                <div className="topic-meta">
                  <span>{completedInTopic}/{topicChallenges.length} complete</span>
                  <span>{topicChallenges.length} missions</span>
                </div>
                <div className="mini-list">
                  {topicChallenges.map((challenge) => (
                    <div key={challenge.id} className="mini-list-item">
                      <div>
                        <strong>{challenge.title}</strong>
                        <small>{challenge.summary}</small>
                      </div>
                      <Badge>{challenge.difficulty}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
