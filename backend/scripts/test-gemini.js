import { generateJson } from '../services/geminiService.js';

try {
  const result = await generateJson('Return exactly this JSON object: {"ok":true}', {
    maxOutputTokens: 200,
  });
  console.log('MODEL:', result.model);
  console.log('DATA:', JSON.stringify(result.data));
} catch (error) {
  console.error('FAILED:', error.message);
  process.exitCode = 1;
}
