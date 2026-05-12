import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { achievements, challengeById, topicById } from '../data/content';
import { useProgress } from '../context/ProgressContext';
import type { ChallengeResult, ChallengeSubmission } from '../types';
import { Badge, Button, Card } from '../components/ui';

function createAnswerState(questionIds: string[]) {
  return Object.fromEntries(questionIds.map((id) => [id, null])) as Record<string, number | null>;
}

export function ChallengePage() {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const { progress, completeChallenge } = useProgress();
  const challenge = challengeId ? challengeById[challengeId] : undefined;
  const topic = challenge ? topicById[challenge.topicId] : undefined;
  const [answers, setAnswers] = useState<Record<string, number | null>>(() => createAnswerState(challenge?.questions.map((question) => question.id) ?? []));
  const [result, setResult] = useState<ChallengeResult | null>(null);

  useEffect(() => {
    if (!challenge) {
      return;
    }

    setAnswers(createAnswerState(challenge.questions.map((question) => question.id)));
    setResult(null);
  }, [challengeId]);

  const nextChallenge = useMemo(() => {
    if (!challenge || !topic) {
      return null;
    }

    const remaining = topic.challengeIds.filter((id) => id !== challenge.id);
    return remaining.length ? challengeById[remaining[0]] : null;
  }, [challenge, topic]);

  if (!challenge || !topic) {
    return (
      <Card>
        <h1>Mission not found</h1>
        <p>The challenge you requested does not exist yet.</p>
        <Link className="button button-primary" to="/app">
          Return to dashboard
        </Link>
      </Card>
    );
  }

  function setAnswer(questionId: string, optionIndex: number) {
    setAnswers((current) => ({ ...current, [questionId]: optionIndex }));
  }

  function handleSubmit() {
    const activeChallenge = challenge;
    if (!activeChallenge) {
      throw new Error('Mission unavailable.');
    }

    const submission: ChallengeSubmission = { answers };
    const nextResult = completeChallenge(activeChallenge.id, submission);
    setResult(nextResult);
  }

  const completed = progress?.completedChallengeIds.includes(challenge.id) ?? false;

  return (
    <div className="section-stack">
      <Card className="challenge-hero">
        <div>
          <Badge>{topic.title}</Badge>
          <h1>{challenge.title}</h1>
          <p>{challenge.story}</p>
          <div className="topic-meta">
            <span>{challenge.difficulty}</span>
            <span>{challenge.xpReward} XP reward</span>
            <span>{challenge.questions.length} questions</span>
          </div>
        </div>
        <div className="challenge-hero-side">
          <div className="mini-stat">
            <strong>{completed ? 'Completed' : 'Active'}</strong>
            <small>{completed ? 'Retakes do not add XP again' : 'Submit to claim progress'}</small>
          </div>
          <Button variant="ghost" onClick={() => navigate('/app')}>
            Back to dashboard
          </Button>
        </div>
      </Card>

      {result ? (
        <Card className="result-card">
          <div className="result-head">
            <div>
              <span className="eyebrow">Mission complete</span>
              <h2>{result.score}% score</h2>
            </div>
            <Badge>{result.earnedXp} XP earned</Badge>
          </div>
          <p>{result.alreadyCompleted ? 'This mission was already cleared, so the attempt was recorded without extra XP.' : 'Your new score has been saved to your progress record.'}</p>
          <div className="result-grid">
            <StatBlock label="Correct answers" value={`${result.correctCount}/${result.totalQuestions}`} />
            <StatBlock label="Unlocked this round" value={`${result.newlyUnlockedAchievementIds.length}`} />
            <StatBlock label="Recorded attempts" value={`${progress?.attempts.length ?? 0}`} />
          </div>
          <div className="explanation-list">
            {challenge.questions.map((question) => {
              const selected = answers[question.id];
              const correct = selected === question.correctIndex;
              return (
                <div className={`explanation-item ${correct ? 'correct' : 'wrong'}`} key={question.id}>
                  <strong>{question.prompt}</strong>
                  <p>{question.explanation}</p>
                </div>
              );
            })}
          </div>
          <div className="button-row">
            <Link className="button button-primary" to="/app">
              Return to dashboard
            </Link>
            {nextChallenge ? (
              <Link className="button button-accent" to={`/app/challenges/${nextChallenge.id}`}>
                Next mission
              </Link>
            ) : null}
          </div>
        </Card>
      ) : (
        <div className="question-stack">
          {challenge.questions.map((question, index) => (
            <Card className="question-card" key={question.id}>
              <div className="question-head">
                <span className="eyebrow">Question {index + 1}</span>
                <Badge>{challenge.difficulty}</Badge>
              </div>
              <h2>{question.prompt}</h2>
              <div className="option-grid">
                {question.options.map((option, optionIndex) => {
                  const selected = answers[question.id] === optionIndex;
                  return (
                    <button
                      key={option}
                      type="button"
                      className={`option-card ${selected ? 'selected' : ''}`}
                      onClick={() => setAnswer(question.id, optionIndex)}
                    >
                      <span>{String.fromCharCode(65 + optionIndex)}</span>
                      <strong>{option}</strong>
                    </button>
                  );
                })}
              </div>
            </Card>
          ))}

          <div className="button-row sticky-actions">
            <Button onClick={handleSubmit}>Submit mission</Button>
            <Link className="button button-ghost" to="/app">
              Save for later
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="result-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
