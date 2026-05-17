import { useEffect, useMemo, useState, type DragEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { achievements, challengeById, topicById } from '../data/content';
import { useProgress } from '../context/useProgress';
import type { ChallengeResult, ChallengeSubmission } from '../types';
import { Badge, Button, Card } from '../components/ui';

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
  const dragDrop = challenge?.mode === 'drag-drop' ? challenge.dragDrop ?? null : null;
  const isDragDrop = Boolean(dragDrop);
  const [answers, setAnswers] = useState<Record<string, number | null>>(() => createAnswerState(challenge?.questions.map((question) => question.id) ?? []));
  const [dragPlacements, setDragPlacements] = useState<Record<string, string | null>>(() =>
    createDragPlacementState(dragDrop?.items.map((item) => item.id) ?? []),
  );
  const [selectedDragItemId, setSelectedDragItemId] = useState<string | null>(null);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [questionOrder, setQuestionOrder] = useState<string[]>([]);

  useEffect(() => {
    if (!challenge) {
      return;
    }

    setAnswers(createAnswerState(challenge.questions.map((question) => question.id)));
    setQuestionOrder(shuffledIds(challenge.questions.map((question) => question.id)));
    setDragPlacements(createDragPlacementState(challenge.dragDrop?.items.map((item) => item.id) ?? []));
    setSelectedDragItemId(null);
    setResult(null);
  }, [challengeId]);

  const orderedQuestions = useMemo(() => {
    if (!challenge || challenge.mode === 'drag-drop') {
      return [];
    }

    const indexById = new Map(challenge.questions.map((q) => [q.id, q]));
    const byStateOrder = questionOrder.map((id) => indexById.get(id)).filter(Boolean) as typeof challenge.questions;

    // Fallback keeps compatibility if order state is missing or stale.
    return byStateOrder.length === challenge.questions.length ? byStateOrder : challenge.questions;
  }, [challenge, questionOrder]);

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

  async function handleSubmit() {
    const activeChallenge = challenge;
    if (!activeChallenge) {
      throw new Error('Mission unavailable.');
    }

    const submission: ChallengeSubmission = activeChallenge.mode === 'drag-drop'
      ? { kind: 'drag-drop', placements: dragPlacements }
      : { kind: 'quiz', answers };
    const nextResult = await completeChallenge(activeChallenge.id, submission);
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
            <span>{challenge.mode === 'drag-drop' ? `${challenge.dragDrop?.items.length ?? 0} clues` : `${challenge.questions.length} questions`}</span>
            <span>{challenge.mode === 'drag-drop' ? 'Drag & drop' : 'Question & answer'}</span>
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
            <div className="explanation-list">
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
            <div className="explanation-list">
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
      ) : (
        isDragDrop && dragDrop ? (
          <div className="drag-drop-shell">
            <Card className="drag-drop-card">
              <div className="section-heading compact">
                <div>
                  <span className="eyebrow">Drag and drop mission</span>
                  <h2>{dragDrop.prompt}</h2>
                </div>
                <Badge>{dragDrop.items.length} clues</Badge>
              </div>
              <p>{dragDrop.guidance}</p>

              <div className="drag-drop-grid">
                <div className="drag-bank">
                  <div className="drag-bank-head">
                    <span className="eyebrow">Available clues</span>
                    <span className="muted small">Drag a tile into a lane below</span>
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
                          <span>Item</span>
                          <strong>{item.label}</strong>
                        </button>
                      ))}
                  </div>
                </div>

                <div className="drag-zone-list">
                  {dragDrop.zones.map((zone) => {
                    const assignedItem = dragDrop.items.find((item) => dragPlacements[item.id] === zone.id) ?? null;

                    return (
                      <div
                        key={zone.id}
                        className={`drop-zone ${assignedItem ? 'filled' : ''}`}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => handleDrop(event, zone.id)}
                        onClick={() => handleZoneClick(zone.id)}
                      >
                        <div className="drop-zone-head">
                          <div>
                            <strong>{zone.label}</strong>
                            <small>{zone.hint}</small>
                          </div>
                          {assignedItem ? (
                            <button
                              type="button"
                              className="drop-clear"
                              onClick={(event) => {
                                event.stopPropagation();
                                clearDragPlacement(assignedItem.id);
                              }}
                            >
                              Clear
                            </button>
                          ) : (
                            <Badge>Drop here</Badge>
                          )}
                        </div>

                        <div className="drop-zone-item">
                          {assignedItem ? <strong>{assignedItem.label}</strong> : <span>Drop or click a clue into this lane</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
          <div className="question-stack">
            {orderedQuestions.map((question, index) => (
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
              <Button onClick={() => void handleSubmit()}>Submit mission</Button>
              <Link className="button button-ghost" to="/app">
                Save for later
              </Link>
            </div>
          </div>
        )
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
