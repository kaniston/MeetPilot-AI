import { isGeminiConfigured } from '../config/env.js';
import { analyseMeeting, chatWithAssistant, compareDecisions } from '../services/aiService.js';
import { transcribeAudio } from '../services/geminiService.js';
import { AppError } from '../utils/AppError.js';
import { asArray, normaliseDateOnly, requireText } from '../utils/validate.js';

function ensureConfigured() {
  if (!isGeminiConfigured()) {
    throw new AppError(
      'Gemini is not configured. Add GEMINI_API_KEY to backend/.env and restart the server.',
      503,
      { code: 'AI_NOT_CONFIGURED' },
    );
  }
}

export async function postAnalyzeMeeting(req, res) {
  ensureConfigured();

  const body = req.body || {};
  const title = requireText(body.title, 'title', { min: 2, max: 180 });
  const meetingDate = normaliseDateOnly(body.meetingDate, 'meetingDate');
  const transcript = requireText(body.transcript, 'transcript', { min: 20, max: 120000 });

  const result = await analyseMeeting({ title, meetingDate, transcript });
  res.json({ data: result });
}

export async function postCompareDecisions(req, res) {
  ensureConfigured();

  const body = req.body || {};
  const decisions = asArray(body.decisions)
    .map((decision) => {
      const value = typeof decision === 'string' ? decision : decision?.text;
      return typeof value === 'string' ? value.trim().slice(0, 1500) : '';
    })
    .filter(Boolean);

  if (!decisions.length) {
    throw new AppError('At least one decision is required to compare.', 400, {
      field: 'decisions',
    });
  }

  if (decisions.length > 20) {
    throw new AppError('Compare at most 20 decisions at a time.', 400, { field: 'decisions' });
  }

  const meetingDate = body.meetingDate
    ? normaliseDateOnly(body.meetingDate, 'meetingDate')
    : null;

  const result = await compareDecisions({ decisions, meetingDate });
  res.json({ data: result });
}

export async function postAssistantChat(req, res) {
  ensureConfigured();

  const body = req.body || {};
  const message = requireText(body.message, 'message', { min: 2, max: 2000 });
  const history = asArray(body.history).slice(-10);

  const result = await chatWithAssistant({ message, history });
  res.json({ data: result });
}

export async function postTranscribeAudio(req, res) {
  if (!req.file) {
    throw new AppError('An audio file is required.', 400, { field: 'audio' });
  }
  if (req.file.size > 25 * 1024 * 1024) {
    throw new AppError('Audio files must be 25 MB or smaller.', 413, { field: 'audio' });
  }

  ensureConfigured();

  const result = await transcribeAudio({
    base64: req.file.buffer.toString('base64'),
    mimeType: req.file.mimetype,
  });
  res.json({ data: result });
}
