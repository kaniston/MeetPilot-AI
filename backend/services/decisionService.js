import { AppError } from '../utils/AppError.js';
import { mutateDatabase, readDatabase } from './store.js';

const REVIEW_STATUSES = ['unreviewed', 'revised', 'contradiction', 'unrelated'];

function decorateDecision(decision, database) {
  const meeting = database.meetings.find((entry) => entry.id === decision.meetingId);

  return {
    ...decision,
    meetingTitle: meeting?.title || 'Unknown meeting',
    meetingDate: meeting?.meetingDate || null,
  };
}

export function listDecisions() {
  const database = readDatabase();

  const decisions = database.decisions
    .map((decision) => decorateDecision(decision, database))
    .sort((a, b) => {
      const byMeetingDate = new Date(b.meetingDate || 0) - new Date(a.meetingDate || 0);
      if (byMeetingDate !== 0) return byMeetingDate;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const decisionMap = new Map(decisions.map((decision) => [decision.id, decision]));

  const conflicts = database.conflicts
    .map((conflict) => ({
      ...conflict,
      previousDecision: decisionMap.get(conflict.previousDecisionId) || null,
      newDecision: decisionMap.get(conflict.newDecisionId) || null,
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return { decisions, conflicts };
}

export function updateConflictReview(id, reviewStatus) {
  if (!REVIEW_STATUSES.includes(reviewStatus)) {
    throw new AppError('Invalid conflict review status.', 400, { field: 'reviewStatus' });
  }

  return mutateDatabase((database) => {
    const conflict = database.conflicts.find((entry) => entry.id === id);

    if (!conflict) {
      throw new AppError('Decision conflict not found.', 404);
    }

    conflict.reviewStatus = reviewStatus;
    conflict.updatedAt = new Date().toISOString();

    return {
      id: conflict.id,
      reviewStatus: conflict.reviewStatus,
      updatedAt: conflict.updatedAt,
    };
  });
}
