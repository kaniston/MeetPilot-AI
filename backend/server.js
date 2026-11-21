import app from './app.js';
import { env, isGeminiConfigured } from './config/env.js';

const server = app.listen(env.port, () => {
  console.log('');
  console.log('  MeetPilot AI API');
  console.log(`  Local:      http://localhost:${env.port}`);
  console.log(`  Health:     http://localhost:${env.port}/api/health`);
  console.log(`  Storage:    local JSON fallback (backend/data/db.json)`);
  console.log(`  Gemini:     ${isGeminiConfigured() ? 'configured' : 'not configured yet'}`);
  console.log('');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${env.port} is already in use. Stop the other process or change PORT in backend/.env.`);
  } else {
    console.error('Could not start the MeetPilot AI API:', error.message);
  }
  process.exit(1);
});
