import { GoogleGenAI } from '@google/genai';
import { env, isGeminiConfigured } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

let client = null;

function getClient() {
  if (!client) {
    client = new GoogleGenAI({ apiKey: env.geminiApiKey });
  }
  return client;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Gemini sometimes wraps JSON in markdown fences or adds a sentence before it.
 * Extract the first complete JSON object instead of trusting the raw text.
 */
function extractJson(text) {
  let cleaned = String(text || '').trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('The AI response did not contain a JSON object.');
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

function statusOf(error) {
  return Number(error?.status || error?.code) || 0;
}

/**
 * Ask Gemini for a JSON object. Tries the configured model first, then the
 * fallback models, retrying once for temporary failures and malformed JSON.
 */
export async function generateJson(prompt, { maxOutputTokens = 8192, temperature = 0.2 } = {}) {
  if (!isGeminiConfigured()) {
    throw new AppError(
      'Gemini is not configured. Add GEMINI_API_KEY to backend/.env and restart the server.',
      503,
      { code: 'AI_NOT_CONFIGURED' },
    );
  }

  const models = [...new Set([env.geminiModel, ...env.geminiFallbackModels].filter(Boolean))];
  const failures = [];

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), env.aiRequestTimeoutMs);

      try {
        const response = await getClient().models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature,
            maxOutputTokens,
            responseMimeType: 'application/json',
            abortSignal: controller.signal,
          },
        });

        const text = response.text;

        if (!text || !text.trim()) {
          const finishReason = response.candidates?.[0]?.finishReason || 'unknown';
          throw new Error(`The AI returned an empty response (${finishReason}).`);
        }

        const data = extractJson(text);
        return { data, model };
      } catch (error) {
        const status = statusOf(error);
        const aborted = error?.name === 'AbortError' || controller.signal.aborted;
        const message = String(error?.message || error);

        failures.push({ model, status, aborted, message });

        if (status === 401 || status === 403) {
          throw new AppError(
            'Gemini rejected the configured API key. Check GEMINI_API_KEY in backend/.env.',
            503,
            { code: 'AI_AUTH_FAILED' },
          );
        }

        if (status === 404) {
          break;
        }

        const retryable =
          aborted ||
          status === 429 ||
          status === 500 ||
          status === 502 ||
          status === 503 ||
          status === 504;

        if (retryable && attempt === 0) {
          await sleep(1400);
          continue;
        }

        if (retryable) {
          break;
        }

        if (status === 0 && attempt === 0) {
          // Usually malformed JSON or a truncated response: ask once more.
          await sleep(500);
          continue;
        }

        if (status === 0) {
          break;
        }

        throw new AppError('Gemini could not process this request. Please try again.', 502, {
          code: 'AI_REQUEST_FAILED',
        });
      } finally {
        clearTimeout(timer);
      }
    }
  }

  console.error(
    '[gemini] All models failed:',
    failures
      .map((failure) => {
        const reason = failure.aborted ? 'timeout' : failure.status || 'error';
        return `${failure.model}:${reason} ${failure.message.slice(0, 180)}`;
      })
      .join(' | '),
  );

  throw new AppError(
    'The AI service is temporarily unavailable. Please try again in a moment.',
    503,
    { code: 'AI_UNAVAILABLE' },
  );
}

export async function transcribeAudio({ base64, mimeType }) {
  if (!isGeminiConfigured()) {
    throw new AppError(
      'Gemini is not configured. Add GEMINI_API_KEY to backend/.env and restart the server.',
      503,
      { code: 'AI_NOT_CONFIGURED' },
    );
  }

  const prompt = `Transcribe this meeting audio exactly and preserve speaker changes when identifiable.
Return valid JSON only in this exact shape:
{"transcript":"string","language":"string","speakers":["string"]}
If speakers cannot be identified, use generic labels such as Speaker 1.
Do not summarize or add commentary.`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.aiRequestTimeoutMs);

  try {
    const models = [...new Set([env.geminiModel, ...env.geminiFallbackModels].filter(Boolean))];
    let response = null;
    let usedModel = models[0];
    let lastError = null;

    for (const model of models) {
      try {
        response = await getClient().models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                { inlineData: { mimeType, data: base64 } },
                { text: prompt },
              ],
            },
          ],
          config: {
            temperature: 0.1,
            maxOutputTokens: 16384,
            responseMimeType: 'application/json',
            abortSignal: controller.signal,
          },
        });
        usedModel = model;
        break;
      } catch (error) {
        lastError = error;
        if (Number(error?.status || error?.code) === 404) continue;
        throw error;
      }
    }

    if (!response) {
      throw lastError || new Error('No transcription model is available.');
    }

    const text = response.text;
    if (!text?.trim()) {
      throw new AppError('The transcription service returned no text.', 502, {
        code: 'AI_EMPTY_TRANSCRIPT',
      });
    }

    let data;
    try {
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      data = JSON.parse(cleaned.slice(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1));
    } catch {
      throw new AppError('The transcription response was not valid JSON.', 502, {
        code: 'AI_INVALID_RESPONSE',
      });
    }

    return {
      transcript: String(data.transcript || '').trim(),
      language: String(data.language || '').trim(),
      speakers: Array.isArray(data.speakers) ? data.speakers.map(String).filter(Boolean) : [],
      model: usedModel,
    };
  } finally {
    clearTimeout(timer);
  }
}
