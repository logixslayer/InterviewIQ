import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const QUESTIONS_FILE = path.join(DATA_DIR, 'questions_db.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions_db.json');
const VOICES_FILE = path.join(DATA_DIR, 'voice_preferences.json');

export interface StoredQuestion {
  questionId: string;
  userId: string;
  sessionId: string;
  roleTarget: string;
  questionText: string;
  normalizedQuestionText: string;
  contentFingerprint: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  experienceLevel: string;
  questionType: string;
  source: 'curated' | 'generated' | 'follow-up';
  parentQuestionId?: string;
  companies?: string[];
  estimatedTime?: string;
  description?: string;
  createdAt: string;
}

export interface StoredTurn {
  turnId: string;
  question: StoredQuestion;
  candidateAnswer: string;
  codeSnippet?: string;
  evaluation?: any;
  durationSeconds: number;
  metrics?: any;
  isFollowUp?: boolean;
  timestamp: string;
}

export interface StoredSession {
  sessionId: string;
  userId: string;
  role: string;
  level: string;
  type: string;
  difficulty: string;
  duration: string;
  voiceSettings: any;
  state: string;
  turns: StoredTurn[];
  currentQuestionIndex: number;
  totalQuestions: number;
  createdAt: string;
  updatedAt: string;
  report?: any;
}

// Helper: load JSON array from disk safely
function loadJsonArray<T>(filePath: string): T[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn(`Error reading ${filePath}:`, err);
    return [];
  }
}

// Helper: save JSON array to disk safely
function saveJsonArray<T>(filePath: string, data: T[]): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error saving ${filePath}:`, err);
  }
}

// Normalizes question text for robust deduplication
export function normalizeQuestionText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/gi, '') // remove punctuation
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();
}

// Stable content fingerprint
export function computeContentFingerprint(text: string): string {
  const normalized = normalizeQuestionText(text);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

// Dice/Jaccard token similarity (0.0 to 1.0)
export function computeTokenSimilarity(textA: string, textB: string): number {
  const tokensA = new Set(normalizeQuestionText(textA).split(' ').filter(w => w.length > 2));
  const tokensB = new Set(normalizeQuestionText(textB).split(' ').filter(w => w.length > 2));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  tokensA.forEach(t => {
    if (tokensB.has(t)) intersection++;
  });

  return (2 * intersection) / (tokensA.size + tokensB.size);
}

// Deduplication check: checks both exact match & semantic similarity against history
export function checkQuestionDuplication(
  candidateText: string,
  existingQuestions: StoredQuestion[],
  threshold = 0.68
): { isDuplicate: boolean; reason?: string; matchedQuestionId?: string } {
  const candidateFingerprint = computeContentFingerprint(candidateText);
  const candidateNormalized = normalizeQuestionText(candidateText);

  for (const existing of existingQuestions) {
    // Exact fingerprint match
    if (existing.contentFingerprint === candidateFingerprint) {
      return {
        isDuplicate: true,
        reason: 'Exact fingerprint match with previous question',
        matchedQuestionId: existing.questionId,
      };
    }

    // Exact normalized text match
    if (existing.normalizedQuestionText === candidateNormalized) {
      return {
        isDuplicate: true,
        reason: 'Exact normalized text match with previous question',
        matchedQuestionId: existing.questionId,
      };
    }

    // High token similarity check
    const similarity = computeTokenSimilarity(candidateText, existing.questionText);
    if (similarity >= threshold) {
      return {
        isDuplicate: true,
        reason: `High semantic similarity (${Math.round(similarity * 100)}%) with question: "${existing.questionText.slice(0, 50)}..."`,
        matchedQuestionId: existing.questionId,
      };
    }
  }

  return { isDuplicate: false };
}

// Question repository functions
export function recordDeliveredQuestion(question: StoredQuestion): void {
  const all = loadJsonArray<StoredQuestion>(QUESTIONS_FILE);
  // Avoid duplicate key insertion
  const existingIdx = all.findIndex(q => q.questionId === question.questionId);
  if (existingIdx !== -1) {
    all[existingIdx] = question;
  } else {
    all.push(question);
  }
  saveJsonArray(QUESTIONS_FILE, all);
}

export function getAllQuestions(): StoredQuestion[] {
  return loadJsonArray<StoredQuestion>(QUESTIONS_FILE);
}

export function getUserQuestions(userId: string): StoredQuestion[] {
  return getAllQuestions().filter(q => q.userId === userId);
}

export function getSessionQuestions(sessionId: string): StoredQuestion[] {
  return getAllQuestions().filter(q => q.sessionId === sessionId);
}

// Session repository functions
export function saveSessionRecord(session: StoredSession): void {
  const all = loadJsonArray<StoredSession>(SESSIONS_FILE);
  const existingIdx = all.findIndex(s => s.sessionId === session.sessionId);
  if (existingIdx !== -1) {
    all[existingIdx] = { ...session, updatedAt: new Date().toISOString() };
  } else {
    all.push({ ...session, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  saveJsonArray(SESSIONS_FILE, all);
}

export function getSessionRecord(sessionId: string): StoredSession | null {
  const all = loadJsonArray<StoredSession>(SESSIONS_FILE);
  return all.find(s => s.sessionId === sessionId) || null;
}

export function listUserSessions(userId: string): StoredSession[] {
  const all = loadJsonArray<StoredSession>(SESSIONS_FILE);
  return all.filter(s => s.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Voice preferences functions
export function saveVoicePreferences(userId: string, preferences: any): void {
  try {
    let all: Record<string, any> = {};
    if (fs.existsSync(VOICES_FILE)) {
      all = JSON.parse(fs.readFileSync(VOICES_FILE, 'utf-8'));
    }
    all[userId] = preferences;
    fs.writeFileSync(VOICES_FILE, JSON.stringify(all, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving voice preferences:', err);
  }
}

export function getVoicePreferences(userId: string): any {
  try {
    if (!fs.existsSync(VOICES_FILE)) return null;
    const all = JSON.parse(fs.readFileSync(VOICES_FILE, 'utf-8'));
    return all[userId] || null;
  } catch (err) {
    return null;
  }
}
