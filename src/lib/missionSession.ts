import type { Challenge, DragDropGame, MissionSession } from '../types';
import { MISSION_QUESTION_COUNT, pickMissionDragItems, pickMissionQuestions } from './questionGenerator';

export function buildMissionSession(challenge: Challenge): MissionSession {
  if (challenge.mode === 'drag-drop') {
    const base = challenge.dragDrop;
    if (!base) {
      return { challengeId: challenge.id, questions: [] };
    }

    const items = pickMissionDragItems(challenge.topicId, MISSION_QUESTION_COUNT);
    const dragDrop: DragDropGame = {
      prompt: base.prompt,
      guidance: base.guidance,
      zones: base.zones,
      items,
    };

    return { challengeId: challenge.id, questions: [], dragDrop };
  }

  return {
    challengeId: challenge.id,
    questions: pickMissionQuestions(challenge.topicId, MISSION_QUESTION_COUNT),
  };
}

export function missionQuestionCount(session: MissionSession): number {
  if (session.dragDrop) {
    return session.dragDrop.items.length;
  }

  return session.questions.length;
}
