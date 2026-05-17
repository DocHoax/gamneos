import { useEffect, useMemo, useState, type DragEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { challengeById, topicById } from '../data/content';
import { useProgress } from '../context/useProgress';
import { buildMissionSession, missionQuestionCount } from '../lib/missionSession';
import type { ChallengeResult, ChallengeSubmission, MissionSession } from '../types';
import { Badge, Button, Card, ProgressBar } from '../components/ui';

function createAnswerState(questionIds: string[]) {
  return Object.fromEntries(questionIds.map((id) => [id, null])) as Record<string, number | null>;
}

function createDragPlacementState(itemIds: string[]) {
  return Object.fromEntries(itemIds.map((id) => [id, null])) as Record<string, string | null>;
}

function shuffledIds(ids: string[]) {
  const next = [...ids];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
}

export function ChallengePage() {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const { progress, completeChallenge } = useProgress();
  const challenge = challengeId ? challengeById[challengeId] : undefined;
  const topic = challenge ? topicById[challenge.topicId] : undefined;

  const session = useMemo<MissionSession | null>(() => (challenge ? buildMissionSession(challenge) : null), [challengeId]);
  const dragDrop = session?.dragDrop ?? null;
  const isDragDrop = Boolean(dragDrop);
  const missionSize = session ? missionQuestionCount(session) : 0;

  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [dragPlacements, setDragPlacements] = useState<Record<string, string | null>>({});
  const [selectedDragItemId, setSelectedDragItemId] = useState<string | null>(null);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [questionOrder, setQuestionOrder] = useState<string[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);

  useEffect(() => {
    if (!session) {
      return;
    }

    const questionIds = session.questions.map((question) => question.id);
    const itemIds = session.dragDrop?.items.map((item) => item.id) ?? [];

    setAnswers(createAnswerState(questionIds));
    setQuestionOrder(shuffledIds(questionIds));
    setDragPlacements(createDragPlacementState(itemIds));
    setSelectedDragItemId(null);
    setResult(null);
    setQuestionIndex(0);
  }, [challengeId, session]);

  const orderedQuestions = useMemo(() => {
    if (!session || isDragDrop) {
      return [];
    }

    const indexById = new Map(session.questions.map((question) => [question.id, question]));
    const byStateOrder = questionOrder.map((id) => indexById.get(id)).filter(Boolean) as typeof session.questions;

    return byStateOrder.length === session.questions.length ? byStateOrder : session.questions;
  }, [session, questionOrder, isDragDrop]);

  const currentQuestion = orderedQuestions[questionIndex] ?? null;
  const answeredCount = orderedQuestions.filter((question) => answers[question.id] !== null).length;
  const quizProgress = orderedQuestions.length ? (answeredCount / orderedQuestions.length) * 100 : 0;
  const placedCount = dragDrop ? dragDrop.items.filter((item) => dragPlacements[item.id]).length : 0;
  const dragProgress = dragDrop?.items.length ? (placedCount / dragDrop.items.length) * 100 : 0;

  const nextChallenge = useMemo(() => {
    if (!challenge || !topic) {
      return null;
    }

    const remaining = topic.challengeIds.filter((id) => id !== challenge.id);
    return remaining.length ? challengeById[remaining[0]] : null;
  }, [challenge, topic]);

  if (!challenge || !topic || !session) {
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

  const activeChallenge = challenge;
  const activeSession = session;
  const activeTopic = topic;

  function setAnswer(questionId: string, optionIndex: number) {
    setAnswers((current) => ({ ...current, [questionId]: optionIndex }));
  }

  function setDragPlacement(itemId: string, zoneId: string) {
    setDragPlacements((current) => ({ ...current, [itemId]: zoneId }));
    setSelectedDragItemId(null);
  }

  function clearDragPlacement(itemId: string) {
    setDragPlacements((current) => ({ ...current, [itemId]: null }));
    if (selectedDragItemId === itemId) {
      setSelectedDragItemId(null);
    }
  }

  function handleDragStart(event: DragEvent<HTMLButtonElement>, itemId: string) {
    event.dataTransfer.setData('text/plain', itemId);
    event.dataTransfer.effectAllowed = 'move';
    setSelectedDragItemId(itemId);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, zoneId: string) {
    event.preventDefault();
    const itemId = event.dataTransfer.getData('text/plain') || selectedDragItemId;

    if (itemId) {
      setDragPlacement(itemId, zoneId);
    }
  }

  function handleZoneClick(zoneId: string) {
    if (selectedDragItemId) {
      setDragPlacement(selectedDragItemId, zoneId);
    }
  }

  const completed = progress?.completedChallengeIds.includes(activeChallenge.id) ?? false;

  async function handleSubmit() {
    const submission: ChallengeSubmission = isDragDrop
      ? { kind: 'drag-drop', placements: dragPlacements }
      : { kind: 'quiz', answers };
    const nextResult = await completeChallenge(activeChallenge.id, submission, activeSession);
    setResult(nextResult);
  }

  return (
    <div className="section-stack">
      <Card className="challenge-hero">
        <div>
          <Badge>{activeTopic.title}</Badge>
          <h1>{activeChallenge.title}</h1>
          <p>{activeChallenge.story}</p>
          <div className="topic-meta">
            <span>{activeChallenge.difficulty}</span>
            <span>{activeChallenge.xpReward} XP reward</span>
            <span>{missionSize} {isDragDrop ? 'clues' : 'questions'} this run</span>
            <span>{isDragDrop ? 'Drag & drop' : 'Question & answer'}</span>
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
          {dragDrop ? (
            <div className="explanation-list explanation-list-compact">
              {dragDrop.items.map((item) => {
                const selectedZoneId = dragPlacements[item.id];
                const selectedZone = dragDrop.zones.find((zone) => zone.id === selectedZoneId);
                const correctZone = dragDrop.zones.find((zone) => zone.id === item.targetZoneId);
                const correct = selectedZoneId === item.targetZoneId;

                return (
                  <div className={`explanation-item ${correct ? 'correct' : 'wrong'}`} key={item.id}>
                    <strong>{item.label}</strong>
                    <p>
                      Placed in {selectedZone?.label ?? 'nothing yet'}; correct zone is {correctZone?.label ?? 'unknown'}.
                    </p>
                    <small>{item.explanation}</small>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="explanation-list explanation-list-compact">
              {orderedQuestions.map((question) => {
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
          )}
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
      ) : isDragDrop && dragDrop ? (
        <div className="drag-drop-shell">
          <Card className="drag-drop-card">
            <div className="section-heading compact">
              <div>
                <span className="eyebrow">Drag and drop mission</span>
                <h2>{dragDrop.prompt}</h2>
              </div>
              <Badge>
                {placedCount}/{dragDrop.items.length} sorted
              </Badge>
            </div>
            <p>{dragDrop.guidance}</p>
            <ProgressBar value={dragProgress} />

            <div className="drag-drop-layout">
              <section className="drag-bank">
                <div className="drag-bank-head">
                  <span className="eyebrow">Available clues</span>
                  <span className="muted small">Drag each tile into a zone below</span>
                </div>
                <div className="drag-item-list">
                  {dragDrop.items
                    .filter((item) => !dragPlacements[item.id])
                    .map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`drag-item ${selectedDragItemId === item.id ? 'selected' : ''}`}
                        draggable
                        onDragStart={(event) => handleDragStart(event, item.id)}
                        onClick={() => setSelectedDragItemId(item.id)}
                      >
                        <span>Clue</span>
                        <strong>{item.label}</strong>
                      </button>
                    ))}
                </div>
              </section>

              <section className="drag-zone-list">
                {dragDrop.zones.map((zone) => {
                  const zoneItems = dragDrop.items.filter((item) => dragPlacements[item.id] === zone.id);

                  return (
                    <div
                      key={zone.id}
                      className={`drop-zone ${zoneItems.length ? 'filled' : ''}`}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => handleDrop(event, zone.id)}
                      onClick={() => handleZoneClick(zone.id)}
                    >
                      <div className="drop-zone-head">
                        <div>
                          <strong>{zone.label}</strong>
                          <small>{zone.hint}</small>
                        </div>
                        <Badge>{zoneItems.length} placed</Badge>
                      </div>

                      <div className="drop-zone-items">
                        {zoneItems.length ? (
                          zoneItems.map((item) => (
                            <div className="drop-zone-chip" key={item.id}>
                              <strong>{item.label}</strong>
                              <button
                                type="button"
                                className="drop-clear"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  clearDragPlacement(item.id);
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          ))
                        ) : (
                          <span className="drop-zone-empty">Drop or click clues here</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>
            </div>
          </Card>

          <div className="button-row sticky-actions">
            <Button onClick={() => void handleSubmit()}>Submit mission</Button>
            <Link className="button button-ghost" to="/app">
              Save for later
            </Link>
          </div>
        </div>
      ) : (
        <div className="question-runner">
          <Card className="question-progress-card">
            <div className="question-progress-head">
              <span className="eyebrow">
                Question {questionIndex + 1} of {orderedQuestions.length}
              </span>
              <Badge>
                {answeredCount}/{orderedQuestions.length} answered
              </Badge>
            </div>
            <ProgressBar value={quizProgress} />
          </Card>

          {currentQuestion ? (
            <Card className="question-card">
              <div className="question-head">
                <span className="eyebrow">Mission prompt</span>
                <Badge>{activeChallenge.difficulty}</Badge>
              </div>
              <h2>{currentQuestion.prompt}</h2>
              <div className="option-grid">
                {currentQuestion.options.map((option, optionIndex) => {
                  const selected = answers[currentQuestion.id] === optionIndex;
                  return (
                    <button
                      key={option}
                      type="button"
                      className={`option-card ${selected ? 'selected' : ''}`}
                      onClick={() => setAnswer(currentQuestion.id, optionIndex)}
                    >
                      <span>{String.fromCharCode(65 + optionIndex)}</span>
                      <strong>{option}</strong>
                    </button>
                  );
                })}
              </div>
            </Card>
          ) : null}

          <div className="button-row sticky-actions question-nav">
            <Button
              variant="ghost"
              disabled={questionIndex === 0}
              onClick={() => setQuestionIndex((index) => Math.max(0, index - 1))}
            >
              Previous
            </Button>
            {questionIndex < orderedQuestions.length - 1 ? (
              <Button
                disabled={answers[currentQuestion?.id ?? ''] === null}
                onClick={() => setQuestionIndex((index) => Math.min(orderedQuestions.length - 1, index + 1))}
              >
                Next question
              </Button>
            ) : (
              <Button onClick={() => void handleSubmit()}>Submit mission</Button>
            )}
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
