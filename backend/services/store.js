import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(currentDir, '..', 'data');
const databaseFile = path.join(dataDir, 'db.json');

const EMPTY_DATABASE = {
  meetings: [],
  tasks: [],
  decisions: [],
  conflicts: [],
};

function ensureDatabase() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(databaseFile)) {
    fs.writeFileSync(databaseFile, JSON.stringify(EMPTY_DATABASE, null, 2), 'utf8');
  }
}

export function readDatabase() {
  ensureDatabase();

  try {
    const raw = fs.readFileSync(databaseFile, 'utf8');
    const parsed = JSON.parse(raw);

    return {
      meetings: Array.isArray(parsed.meetings) ? parsed.meetings : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      conflicts: Array.isArray(parsed.conflicts) ? parsed.conflicts : [],
    };
  } catch (error) {
    throw new Error(`Could not read the local database: ${error.message}`);
  }
}

export function writeDatabase(database) {
  ensureDatabase();

  const temporaryFile = `${databaseFile}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(database, null, 2), 'utf8');
  fs.renameSync(temporaryFile, databaseFile);
}

/**
 * Read, change, and persist the database in one synchronous step.
 * This keeps the JSON fallback safe for a single-user hackathon demo.
 */
export function mutateDatabase(mutator) {
  const database = readDatabase();
  const result = mutator(database);
  writeDatabase(database);
  return result;
}

export const storageInfo = {
  type: 'json-file',
  location: 'backend/data/db.json',
};
