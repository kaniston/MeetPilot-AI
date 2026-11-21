import dotenv from 'dotenv';

dotenv.config();

const port = Number(process.env.PORT || 5000);

function parseModelList(value, fallback) {
  const models = String(value || '')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);

  return models.length ? models : fallback;
}

export const env = {
  port,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN?.trim() || 'http://localhost:5173',
  geminiApiKey: process.env.GEMINI_API_KEY?.trim() || '',
  geminiModel: process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash',
  geminiFallbackModels: parseModelList(process.env.GEMINI_FALLBACK_MODELS, [
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
  ]),
  aiRequestTimeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS || 90000),
  supabaseUrl: process.env.SUPABASE_URL?.trim() || '',
  supabasePublishableKey:
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    '',
};

export function isGeminiConfigured() {
  return Boolean(env.geminiApiKey);
}
