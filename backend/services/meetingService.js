import { randomUUID } from 'node:crypto';
import { AppError } from '../utils/AppError.js';
import {
  asArray,
  normaliseDateOnly,
  normaliseDeadline,
  optionalText,
  requireText,
} from '../utils/validate.js';
import { mutateDatabase, readDatabase } from './store.js';

const REVIEW_STATUSES = ['unreviewed', 'revised', 'contradiction', 'unrelated'];
const AI_CLASSIFICATIONS = ['revised', 'contradiction', 'unrelated'];

function countForMeeting(database, meetingId) {
  return {
    taskCount: database.tasks.filter((task) => task.meetingId === meetingId).length,
    decisionCount: database.decisions.filter((decision) => decision.meetingId === meetingId).length,
  };
}

function toMeetingSummary(meeting, database) {
  return {
    id: meeting.id,
    title: meeting.title,
    meetingDate: meeting.meetingDate,
    summary: meeting.analysis?.executiveSummary || meeting.summary || '',
    createdAt: meeting.createdAt,
    ...countForMeeting(database, meeting.id),
  };
}

function normaliseForMatch(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function listMeetings() {
  const database = readDatabase();

  return database.meetings
    .map((meeting) => toMeetingSummary(meeting, database))
    .sort((a, b) => {
      const byDate = new Date(b.meetingDate) - new Date(a.meetingDate);
      if (byDate !== 0) return byDate;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
}

export function getMeetingById(id) {
  const database = readDatabase();
  const meeting = database.meetings.find((entry) => entry.id === id);

  if (!meeting) {
    throw new AppError('Meeting not found.', 404);
  }

  const decisions = database.decisions.filter((decision) => decision.meetingId === id);
  const decisionIds = new Set(decisions.map((decision) => decision.id));
  const decisionMap = new Map(database.decisions.map((decision) => [decision.id, decision]));

  const conflicts = database.conflicts
    .filter(
      (conflict) =>
        decisionIds.has(conflict.previousDecisionId) || decisionIds.has(conflict.newDecisionId),
    )
    .map((conflict) => ({
      ...conflict,
      previousDecision: decisionMap.get(conflict.previousDecisionId) || null,
      newDecision: decisionMap.get(conflict.newDecisionId) || null,
    }));

  return {
    meeting,
    tasks: database.tasks.filter((task) => task.meetingId === id),
    decisions,
    conflicts,
  };
}

export function createMeeting(payload) {
  const title = requireText(payload.title, 'title', { min: 2, max: 180 });
  const meetingDate = normaliseDateOnly(payload.meetingDate, 'meetingDate');
  const transcript = requireText(payload.transcript, 'transcript', { min: 20, max: 120000 });
  const analysis = payload.analysis && typeof payload.analysis === 'object' ? payload.analysis : null;

  if (!analysis) {
    throw new AppError('A structured analysis is required to save a meeting.', 400);
  }

  const confirmedDecisions = asArray(payload.decisions);
  const confirmedActionItems = asArray(payload.actionItems);
  const conflictInputs = asArray(payload.conflicts);

  return mutateDatabase((database) => {
    const now = new Date().toISOString();
    const meetingId = randomUUID();
    const existingDecisionIds = new Set(database.decisions.map((decision) => decision.id));

    const meeting = {
      id: meetingId,
      title,
      meetingDate,
      transcript,
      summary: optionalText(analysis.executiveSummary, 4000),
      analysis,
      createdAt: now,
      updatedAt: now,
    };

    const decisions = confirmedDecisions
      .map((decision) => {
        const text = optionalText(decision.text ?? decision.decisionText, 1200);
        if (!text) return null;

        return {
          id: randomUUID(),
          meetingId,
          decisionText: text,
          decisionStatus: 'confirmed',
          evidence: optionalText(decision.evidence, 1200),
          createdAt: now,
        };
      })
      .filter(Boolean);

    const tasks = confirmedActionItems
      .map((item) => {
        const taskTitle = optionalText(item.title, 240);
        if (!taskTitle) return null;

        return {
          id: randomUUID(),
          meetingId,
          title: taskTitle,
          description: optionalText(item.description, 3000),
          assignedTo: optionalText(item.assignedTo, 160),
          deadline: normaliseDeadline(item.deadline, 'deadline'),
          status: 'pending',
          evidence: optionalText(item.evidence, 1200),
          createdAt: now,
          updatedAt: now,
        };
      })
      .filter(Boolean);

    const conflicts = [];
    const seenConflicts = new Set();

    for (const input of conflictInputs) {
      if (!input || typeof input !== 'object') continue;

      const previousDecisionId = optionalText(input.previousDecisionId, 100);
      if (!existingDecisionIds.has(previousDecisionId)) continue;

      const targetText = normaliseForMatch(input.newDecision ?? input.newDecisionText);
      let newDecision = targetText
        ? decisions.find((decision) => normaliseForMatch(decision.decisionText) === targetText)
        : null;

      if (!newDecision) {
        const index = Number(input.newDecisionIndex);
        if (Number.isInteger(index) && index >= 0 && index < decisions.length) {
          newDecision = decisions[index];
        }
      }

      if (!newDecision) continue;

      const dedupeKey = `${previousDecisionId}:${newDecision.id}`;
      if (seenConflicts.has(dedupeKey)) continue;
      seenConflicts.add(dedupeKey);

      const suggestedClassification = AI_CLASSIFICATIONS.includes(input.suggestedClassification)
        ? input.suggestedClassification
        : 'unrelated';
      const reviewStatus = REVIEW_STATUSES.includes(input.reviewStatus)
        ? input.reviewStatus
        : 'unreviewed';

      conflicts.push({
        id: randomUUID(),
        previousDecisionId,
        newDecisionId: newDecision.id,
        explanation:
          optionalText(input.explanation, 2000) ||
          'A possible decision change was detected during review.',
        suggestedClassification,
        reviewStatus,
        createdAt: now,
        updatedAt: now,
      });
    }

    database.meetings.push(meeting);
    database.decisions.push(...decisions);
    database.tasks.push(...tasks);
    database.conflicts.push(...conflicts);

    return {
      meeting: toMeetingSummary(meeting, database),
      tasksCreated: tasks.length,
      decisionsCreated: decisions.length,
      conflictsCreated: conflicts.length,
    };
  });
}
