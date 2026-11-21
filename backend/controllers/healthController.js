import { env, isGeminiConfigured } from '../config/env.js';
import { readDatabase, storageInfo } from '../services/store.js';

export function getHealth(req, res) {
  const database = readDatabase();

  res.json({
    data: {
      status: 'ok',
      service: 'MeetPilot AI API',
      version: '1.0.0',
      storage: storageInfo.type,
      ai: {
        configured: isGeminiConfigured(),
        provider: 'Google Gemini',
        model: env.geminiModel,
      },
      supabase: {
        configured: Boolean(env.supabaseUrl && env.supabasePublishableKey),
      },
      counts: {
        meetings: database.meetings.length,
        tasks: database.tasks.length,
        decisions: database.decisions.length,
      },
      timestamp: new Date().toISOString(),
    },
  });
}
