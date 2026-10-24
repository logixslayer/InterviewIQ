import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { OpenAI } from 'openai';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import {
  recordDeliveredQuestion,
  getAllQuestions,
  getUserQuestions,
  getSessionQuestions,
  saveSessionRecord,
  getSessionRecord,
  listUserSessions,
  checkQuestionDuplication,
  computeContentFingerprint,
  normalizeQuestionText,
  saveVoicePreferences,
  getVoicePreferences,
  StoredQuestion,
  StoredSession,
  StoredTurn,
} from './server/db.js';
import {
  getAvailableTtsVoices,
  synthesizeSpeechAudio,
} from './server/tts.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Helper to clean extracted text from PDF / Word documents
function cleanExtractedText(text: string): string {
  if (!text) return '';
  return text
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Helper to detect if content is raw binary PDF data
function isRawPdfArtifact(text: string): boolean {
  if (!text) return false;
  return (
    text.startsWith('%PDF-') ||
    text.includes('/Creator <FEFF') ||
    text.includes('/Producer <FEFF') ||
    (text.includes('/Type /Page') && text.includes('stream')) ||
    (text.includes('/Filter /FlateDecode') && text.includes('stream'))
  );
}

// Initialize AI client with OpenRouter or NVIDIA integrate support
interface AiClientConfig {
  client: OpenAI;
  models: string[];
  provider: 'openrouter' | 'nvidia';
}

const getAiClientConfig = (): AiClientConfig | null => {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey || apiKey === 'MY_NVIDIA_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  const trimmed = apiKey.trim();
  if (trimmed.startsWith('sk-or-v1-')) {
    return {
      client: new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: trimmed,
        defaultHeaders: {
          'HTTP-Referer': 'https://interviewiq.ai',
          'X-Title': 'InterviewIQ AI Coach',
        },
      }),
      models: [
        'nvidia/nemotron-3.5-lightning:free',
        'google/gemini-2.0-flash-exp:free',
        'google/gemini-2.0-flash-thinking-exp:free',
        'qwen/qwen-2.5-coder-32b-instruct:free',
        'meta-llama/llama-3.2-3b-instruct:free',
        'nvidia/nemotron-3.5-super-vl:free',
      ],
      provider: 'openrouter',
    };
  }
  return {
    client: new OpenAI({
      baseURL: 'https://integrate.api.nvidia.com/v1',
      apiKey: trimmed,
    }),
    models: [
      'nvidia/nemotron-3.5-super-vl-120b-a12b',
      'meta/llama-3.3-70b-instruct',
    ],
    provider: 'nvidia',
  };
};

// Robust helper to extract clean JSON from model output (handling <think> tags, code blocks, etc.)
function extractJsonFromModelOutput(text: string): any {
  if (!text) return null;
  // Strip <think>...</think> reasoning blocks if present
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Check for ```json ... ``` code fence
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (_e) {
      cleaned = codeBlockMatch[1].trim();
    }
  } else {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (_e) {
    // Locate first '{' or '[' and matching last '}' or ']'
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let startIdx = -1;
    let endIdx = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endIdx = cleaned.lastIndexOf('}');
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endIdx = cleaned.lastIndexOf(']');
    }

    if (startIdx !== -1 && endIdx > startIdx) {
      const slice = cleaned.slice(startIdx, endIdx + 1);
      try {
        return JSON.parse(slice);
      } catch (_e2) {
        // Fix common LLM json flaws like trailing commas
        const sanitized = slice.replace(/,\s*([}\]])/g, '$1');
        try {
          return JSON.parse(sanitized);
        } catch (_e3) {
          // Fall through
        }
      }
    }
    throw new Error('Failed to parse valid JSON from AI model output');
  }
}

// Resilient AI caller with model fallback
async function callAiWithFallback(systemPrompt: string, userPrompt: string, maxTokens = 2500, temperature = 0.2, timeoutMs = 4500): Promise<string> {
  const config = getAiClientConfig();
  if (!config) throw new Error('API key not configured');

  let lastError: any = null;
  for (const model of config.models) {
    try {
      const completionPromise = config.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Model ${model} request timeout after ${timeoutMs}ms`)), timeoutMs)
      );

      const completion: any = await Promise.race([completionPromise, timeoutPromise]);

      const message = completion.choices[0]?.message;
      let text = message?.content?.trim() || '';
      if (!text && (message as any)?.reasoning) {
        text = (message as any).reasoning;
      }
      if (text) {
        return text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} encountered an issue:`, err?.message);
      lastError = err;
    }
  }
  throw lastError || new Error('All candidate AI models failed');
}

import fs from 'fs';

// Data storage directory for persistent user profiles and settings
const USERS_DATA_DIR = path.join(__dirname, '.data', 'users');
if (!fs.existsSync(USERS_DATA_DIR)) {
  try {
    fs.mkdirSync(USERS_DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn('Could not create .data/users directory:', e);
  }
}

function getUserProfilePath(uid: string): string {
  const sanitized = uid.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(USERS_DATA_DIR, `${sanitized}-profile.json`);
}

function getUserSettingsPath(uid: string): string {
  const sanitized = uid.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(USERS_DATA_DIR, `${sanitized}-settings.json`);
}

function getUserInterviewsPath(uid: string): string {
  const sanitized = uid.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(USERS_DATA_DIR, `${sanitized}-interviews.json`);
}

function getUserLearningPath(uid: string): string {
  const sanitized = uid.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(USERS_DATA_DIR, `${sanitized}-learning.json`);
}

// Health & Config Check
app.get('/api/status', (_req, res) => {
  const key = process.env.NVIDIA_API_KEY;
  const isConfigured = !!key && key !== 'MY_NVIDIA_API_KEY' && key.trim().length > 5;
  const config = getAiClientConfig();
  res.json({
    status: 'ok',
    nvidiaKeyConfigured: isConfigured,
    provider: config?.provider || 'none',
    engine: config?.provider === 'openrouter' ? 'OpenRouter / NVIDIA Nemotron 3.5' : 'NVIDIA Nemotron 3.5 Native',
  });
});

// User Profile Persistence Endpoints
app.get('/api/user/profile/:uid', (req, res) => {
  const { uid } = req.params;
  if (!uid || typeof uid !== 'string') return res.status(400).json({ error: 'UID is required' });
  const filePath = getUserProfilePath(uid);
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return res.json({ profile: data });
    } catch (e: any) {
      console.warn('Failed to parse profile for uid', uid, e?.message);
    }
  }
  return res.json({ profile: null });
});

app.post('/api/user/profile/:uid', (req, res) => {
  const { uid } = req.params;
  const profile = req.body;
  if (!uid || typeof uid !== 'string' || !profile) {
    return res.status(400).json({ error: 'Valid UID and profile data are required' });
  }
  try {
    const filePath = getUserProfilePath(uid);
    const dataToSave = {
      ...profile,
      uid,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
    return res.json({ success: true, profile: dataToSave });
  } catch (e: any) {
    console.error('Failed to save profile for uid', uid, e);
    return res.status(500).json({ error: 'Internal server error saving profile' });
  }
});

// User Settings Persistence Endpoints
app.get('/api/user/settings/:uid', (req, res) => {
  const { uid } = req.params;
  if (!uid || typeof uid !== 'string') return res.status(400).json({ error: 'UID is required' });
  const filePath = getUserSettingsPath(uid);
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return res.json({ settings: data });
    } catch (e: any) {
      console.warn('Failed to parse settings for uid', uid, e?.message);
    }
  }
  return res.json({ settings: null });
});

app.post('/api/user/settings/:uid', (req, res) => {
  const { uid } = req.params;
  const settings = req.body;
  if (!uid || typeof uid !== 'string' || !settings) {
    return res.status(400).json({ error: 'Valid UID and settings are required' });
  }
  try {
    const filePath = getUserSettingsPath(uid);
    const dataToSave = {
      ...settings,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
    return res.json({ success: true, settings: dataToSave });
  } catch (e: any) {
    console.error('Failed to save settings for uid', uid, e);
    return res.status(500).json({ error: 'Internal server error saving settings' });
  }
});

// User Interviews History Persistence Endpoints
app.get('/api/user/interviews/:uid', (req, res) => {
  const { uid } = req.params;
  if (!uid || typeof uid !== 'string') return res.status(400).json({ error: 'UID is required' });
  const filePath = getUserInterviewsPath(uid);
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return res.json({ interviews: Array.isArray(data) ? data : [] });
    } catch (e: any) {
      console.warn('Failed to parse interviews for uid', uid, e?.message);
    }
  }
  return res.json({ interviews: [] });
});

app.post('/api/user/interviews/:uid', (req, res) => {
  const { uid } = req.params;
  const { session, interviews } = req.body;
  if (!uid || typeof uid !== 'string') {
    return res.status(400).json({ error: 'Valid UID is required' });
  }

  try {
    const filePath = getUserInterviewsPath(uid);
    let currentInterviews: any[] = [];
    if (fs.existsSync(filePath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (Array.isArray(existing)) currentInterviews = existing;
      } catch (_e) {}
    }

    let updatedList: any[];
    if (session) {
      updatedList = [session, ...currentInterviews];
    } else if (Array.isArray(interviews)) {
      updatedList = interviews;
    } else {
      return res.status(400).json({ error: 'Provide session or interviews array' });
    }

    fs.writeFileSync(filePath, JSON.stringify(updatedList, null, 2), 'utf-8');
    return res.json({ success: true, interviews: updatedList });
  } catch (e: any) {
    console.error('Failed to save interviews for uid', uid, e);
    return res.status(500).json({ error: 'Internal server error saving interview history' });
  }
});

// User Learning Progress Persistence Endpoints
app.get('/api/user/learning/:uid', (req, res) => {
  const { uid } = req.params;
  if (!uid || typeof uid !== 'string') return res.status(400).json({ error: 'UID is required' });
  const filePath = getUserLearningPath(uid);
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return res.json({ progress: data });
    } catch (e: any) {
      console.warn('Failed to parse learning progress for uid', uid, e?.message);
    }
  }
  return res.json({ progress: null });
});

app.post('/api/user/learning/:uid', (req, res) => {
  const { uid } = req.params;
  const { progress } = req.body;
  if (!uid || typeof uid !== 'string' || !progress) {
    return res.status(400).json({ error: 'Valid UID and progress data are required' });
  }

  try {
    const filePath = getUserLearningPath(uid);
    const dataToSave = {
      ...progress,
      uid,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
    return res.json({ success: true, progress: dataToSave });
  } catch (e: any) {
    console.error('Failed to save learning progress for uid', uid, e);
    return res.status(500).json({ error: 'Internal server error saving learning progress' });
  }
});

app.delete('/api/user/data/:uid', (req, res) => {
  const { uid } = req.params;
  if (!uid || typeof uid !== 'string') return res.status(400).json({ error: 'UID is required' });
  try {
    const pPath = getUserProfilePath(uid);
    const sPath = getUserSettingsPath(uid);
    const iPath = getUserInterviewsPath(uid);
    const lPath = getUserLearningPath(uid);
    if (fs.existsSync(pPath)) fs.unlinkSync(pPath);
    if (fs.existsSync(sPath)) fs.unlinkSync(sPath);
    if (fs.existsSync(iPath)) fs.unlinkSync(iPath);
    if (fs.existsSync(lPath)) fs.unlinkSync(lPath);
    return res.json({ success: true, message: 'User data removed' });
  } catch (e: any) {
    console.error('Failed to delete data for uid', uid, e);
    return res.status(500).json({ error: 'Internal server error deleting user data' });
  }
});

// Document Parsing Endpoint (PDF, DOCX, TXT, MD)
app.post('/api/parse-document', async (req, res) => {
  try {
    const { filename = 'resume.pdf', base64 } = req.body;
    if (!base64 || typeof base64 !== 'string') {
      return res.status(400).json({ error: 'Please provide valid file content.' });
    }

    const base64Data = base64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const lowerName = filename.toLowerCase();

    let extractedText = '';
    let pageCount = 1;

    if (lowerName.endsWith('.pdf') || buffer.slice(0, 5).toString() === '%PDF-') {
      try {
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        await parser.destroy();
        extractedText = result.text || '';
        pageCount = result.total || 1;
      } catch (pdfErr: any) {
        console.warn('PDFParse failed for', filename, ':', pdfErr?.message);
        return res.status(422).json({
          error: 'Failed to extract text from this PDF file. The file may be image-scanned or password-protected. Please paste your resume text directly.',
        });
      }
    } else if (lowerName.endsWith('.docx')) {
      try {
        const docxResult = await mammoth.extractRawText({ buffer });
        extractedText = docxResult.value || '';
      } catch (docxErr: any) {
        console.warn('Mammoth failed for', filename, ':', docxErr?.message);
        return res.status(422).json({
          error: 'Failed to extract text from this DOCX file. Please paste your resume text directly.',
        });
      }
    } else {
      // Plain text, markdown, json, etc.
      extractedText = buffer.toString('utf-8');
    }

    const cleanedText = cleanExtractedText(extractedText);

    if (!cleanedText || cleanedText.length < 15) {
      return res.status(422).json({
        error: 'The uploaded file does not contain readable text (it may be a scanned image without OCR). Please copy and paste your resume text directly.',
      });
    }

    return res.json({
      success: true,
      text: cleanedText,
      pageCount,
      filename,
      charCount: cleanedText.length,
    });
  } catch (err: any) {
    console.error('Error parsing document:', err);
    res.status(500).json({ error: err?.message || 'Failed to parse document' });
  }
});

// Resume Analysis Endpoint: Analyzes candidate resume and extracts primary major role & calibration
app.post('/api/analyze-resume', async (req, res) => {
  try {
    const { resumeText, targetDate } = req.body;
    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 15) {
      return res.status(400).json({ error: 'Please provide valid resume text or document content.' });
    }

    if (isRawPdfArtifact(resumeText)) {
      return res.status(400).json({
        error: 'Raw unparsed PDF binary detected instead of text. Please use the "Upload File" button so the system can extract your resume text properly.',
      });
    }

    const aiConfig = getAiClientConfig();

    if (aiConfig) {
      try {
        const systemPrompt = `You are a Senior Bar-Raiser Technical Recruiter and Hiring Committee Lead.
Analyze the following resume text. Determine the candidate's SINGLE PRIMARY MAJOR ROLE (e.g., "Blockchain Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Data Scientist", "Machine Learning Engineer", "DevOps Engineer", etc.).
Calibrate their experience level ("Beginner", "Entry Level", "Intermediate", or "Experienced").
Return STRICT JSON format only (no markdown, pure JSON object):
{
  "fullName": "Candidate full name or extracted name",
  "email": "Candidate email address",
  "primaryRole": "The candidate's single most prominent primary role (e.g. Blockchain Engineer)",
  "experienceLevel": "Entry Level" | "Intermediate" | "Experienced",
  "currentStage": "e.g. Senior Undergrad / Active Job Hunter or Senior Blockchain Engineer",
  "experienceYears": number (e.g. 3.5),
  "targetRoles": [
    {
      "title": "Role title (e.g. Blockchain Engineer)",
      "desc": "Key specialization, frameworks, and architecture",
      "match": number (percentage e.g. 96),
      "reason": "Why this candidate aligns with this role"
    }
  ],
  "topSkills": ["Skill 1", "Skill 2", ... at least 6],
  "targetInterviewDate": "${targetDate || 'October 28, 2026'}",
  "readinessTier": "Tier A+" | "Tier A" | "Tier B+",
  "keyAchievements": ["Achievement 1", "Achievement 2", "Achievement 3"],
  "suggestedFocus": "Priority area to practice (e.g. Smart contract reentrancy security & gas optimization)",
  "summary": "2-sentence executive synopsis highlighting primary track and capabilities."
}`;

        const rawText = await callAiWithFallback(systemPrompt, `Here is the candidate resume:\n\n${resumeText.slice(0, 8000)}`, 2500, 0.2);
        const parsed = extractJsonFromModelOutput(rawText);

        if (parsed) {
          if (!parsed.primaryRole && parsed.targetRoles?.length > 0) {
            parsed.primaryRole = parsed.targetRoles[0].title;
          }
          if (!parsed.experienceLevel) {
            const yrs = Number(parsed.experienceYears) || 3;
            parsed.experienceLevel = yrs >= 5 ? 'Experienced' : yrs >= 2 ? 'Intermediate' : 'Entry Level';
          }

          return res.json({
            success: true,
            profile: parsed,
            source: aiConfig.provider,
          });
        }
      } catch (aiErr: any) {
        console.warn('AI resume analysis encountered error, falling back to heuristic engine:', aiErr?.message);
      }
    }

    // Heuristic Analysis Fallback
    const fallbackProfile = analyzeResumeHeuristically(resumeText, targetDate);
    return res.json({
      success: true,
      profile: fallbackProfile,
      source: aiConfig ? 'heuristic_fallback' : 'local_analyzer',
      note: !aiConfig ? 'NVIDIA_API_KEY not configured in environment. Using built-in semantic extractor.' : undefined,
    });
  } catch (err: any) {
    console.error('Error analyzing resume:', err);
    res.status(500).json({ error: err?.message || 'Failed to analyze resume' });
  }
});

// Dynamic Question Generation Endpoint: Generates realistic questions tailored to candidate's role & level
app.post('/api/generate-questions', async (req, res) => {
  try {
    const {
      role = 'Frontend Developer',
      category = 'Technical Architecture',
      difficulty = 'Medium',
      type = 'Technical',
      count = 5,
      resumeContext = ''
    } = req.body;

    const aiConfig = getAiClientConfig();

    if (aiConfig) {
      try {
        const systemPrompt = `You are a Principal Technical Bar-Raiser conducting engineering interviews at Google, Meta, and OpenAI.
Generate ${count} realistic, challenging interview questions tailored specifically for:
- Candidate Target Role: ${role}
- Interview Type: ${type}
- Difficulty Level: ${difficulty}
${resumeContext ? `- Candidate Skills Context: ${resumeContext.slice(0, 800)}` : ''}

CRITICAL RULES:
1. Every question must be deeply relevant to ${role}. For example, if role is "Blockchain Engineer", ask about EVM storage, Solidity reentrancy/gas optimization, consensus, smart contract upgradeability, and DeFi security.
2. Rank questions progressively from foundational concepts to advanced architectural edge cases.
3. Output STRICT JSON only (an array of objects). No markdown code blocks.

Schema per question:
[
  {
    "id": "gen-timestamp-number",
    "title": "Exact interview question prompt (1-2 clear, rigorous sentences)",
    "category": "${role} Core" | "Architecture & System Design" | "Security & Edge Cases" | "STAR Behavioral",
    "difficulty": "Easy" | "Medium" | "Hard",
    "roleTarget": "${role}",
    "estimatedTime": "3–5 mins response",
    "description": "2-sentence rubric guide on what interviewers look for (specific technical considerations, metrics, trade-offs)",
    "companies": ["Top Tech Firm A", "Top Tech Firm B", "Top Tech Firm C"],
    "status": "unattempted",
    "statusLabel": "AI Generated • ${difficulty}",
    "isBookmarked": false
  }
]`;

        const rawText = await callAiWithFallback(systemPrompt, `Generate ${count} calibrated questions for ${role} (${difficulty} / ${type}).`, 2500, 0.4);
        const questions = extractJsonFromModelOutput(rawText);

        if (Array.isArray(questions) && questions.length > 0) {
          return res.json({
            success: true,
            questions,
            source: aiConfig.provider,
          });
        }
      } catch (aiErr: any) {
        console.warn('AI question generation error, falling back to dynamic generator:', aiErr?.message);
      }
    }

    // Heuristic generator fallback tailored to role
    const fallbackQuestions = generateDynamicQuestions(role, category, difficulty, count);
    return res.json({
      success: true,
      questions: fallbackQuestions,
      source: aiConfig ? 'heuristic_fallback' : 'local_generator',
    });
  } catch (err: any) {
    console.error('Error generating questions:', err);
    res.status(500).json({ error: err?.message || 'Failed to generate questions' });
  }
});

// AI Live Answer Evaluation Endpoint: Analyzes candidate answer against hiring bar
app.post('/api/interview/evaluate-answer', async (req, res) => {
  try {
    const {
      questionTitle = 'Technical Architecture Question',
      candidateAnswer = '',
      codeSnippet = '',
      role = 'Frontend Developer',
      difficulty = 'Medium'
    } = req.body;

    if (!candidateAnswer || typeof candidateAnswer !== 'string' || candidateAnswer.trim().length < 5) {
      return res.status(400).json({ error: 'Please provide a valid candidate answer to evaluate.' });
    }

    const aiConfig = getAiClientConfig();

    if (aiConfig) {
      try {
        const systemPrompt = `You are a Principal Engineering Bar-Raiser conducting a high-stakes mock interview.
Evaluate the candidate's response for:
- Role: ${role}
- Difficulty: ${difficulty}
- Question: "${questionTitle}"
- Candidate Answer: "${candidateAnswer.slice(0, 3000)}"
${codeSnippet ? `- Candidate Scratchpad/Code: "${codeSnippet.slice(0, 2000)}"` : ''}

Output STRICT JSON only (no markdown, valid JSON):
{
  "score": number (0-100),
  "summary": "1-2 concise sentences summarizing performance against staff-level hiring bar",
  "strengths": ["specific strength 1", "specific strength 2"],
  "gaps": ["actionable improvement 1", "actionable improvement 2"],
  "rubricScores": {
    "communicationDelivery": number (0-100),
    "technicalKnowledge": number (0-100),
    "problemSolving": number (0-100),
    "systemArchitecture": number (0-100)
  },
  "sampleIdealAnswer": "2-3 concise sentences demonstrating the gold standard, staff-level answer with concrete metrics and trade-offs.",
  "followUpQuestion": "A sharp, conversational follow-up drill-down question from the interviewer probing an edge case in their response",
  "coachingTip": "1 practical sentence on how to elevate this response to top 1% bar"
}`;

        const rawText = await callAiWithFallback(systemPrompt, 'Evaluate candidate answer strictly.', 1800, 0.3);
        const evaluation = extractJsonFromModelOutput(rawText);

        if (evaluation && typeof evaluation.score === 'number') {
          return res.json({
            success: true,
            evaluation,
            source: aiConfig.provider,
          });
        }
      } catch (aiErr: any) {
        console.warn('AI evaluate-answer error, using heuristic evaluator:', aiErr?.message);
      }
    }

    const { metrics = null, type = 'Technical' } = req.body;
    const fallbackEval = evaluateAnswerHeuristically(questionTitle, candidateAnswer, codeSnippet, role, metrics, type);
    return res.json({
      success: true,
      evaluation: fallbackEval,
      source: aiConfig ? 'heuristic_fallback' : 'local_evaluator',
    });
  } catch (err: any) {
    console.error('Error evaluating answer:', err);
    res.status(500).json({ error: err?.message || 'Failed to evaluate answer' });
  }
});

// AI Live Answer Streaming Evaluation Endpoint (Server-Sent Events)
app.post('/api/interview/stream-evaluate', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const {
      questionTitle = 'Technical Architecture Question',
      candidateAnswer = '',
      codeSnippet = '',
      role = 'Frontend Developer',
      difficulty = 'Medium',
    } = req.body;

    if (!candidateAnswer || typeof candidateAnswer !== 'string' || candidateAnswer.trim().length < 5) {
      sendEvent('error', { error: 'Please provide a valid candidate answer to evaluate.' });
      return res.end();
    }

    sendEvent('status', { message: 'Calibrating against staff-level hiring criteria...' });

    const aiConfig = getAiClientConfig();
    let evaluationResult: any = null;

    if (aiConfig) {
      const systemPrompt = `You are a Principal Engineering Bar-Raiser conducting a high-stakes mock interview.
Evaluate the candidate's response for:
- Role: ${role}
- Difficulty: ${difficulty}
- Question: "${questionTitle}"
- Candidate Answer: "${candidateAnswer.slice(0, 3000)}"
${codeSnippet ? `- Candidate Scratchpad/Code: "${codeSnippet.slice(0, 2000)}"` : ''}

Output STRICT JSON only (no markdown, valid JSON):
{
  "score": number (0-100),
  "summary": "1-2 concise sentences summarizing performance against staff-level hiring bar",
  "strengths": ["specific strength 1", "specific strength 2"],
  "gaps": ["actionable improvement 1", "actionable improvement 2"],
  "rubricScores": {
    "communicationDelivery": number (0-100),
    "technicalKnowledge": number (0-100),
    "problemSolving": number (0-100),
    "systemArchitecture": number (0-100)
  },
  "sampleIdealAnswer": "2-3 concise sentences demonstrating the gold standard, staff-level answer with concrete metrics and trade-offs.",
  "followUpQuestion": "A sharp, conversational follow-up drill-down question from the interviewer probing an edge case in their response",
  "coachingTip": "1 practical sentence on how to elevate this response to top 1% bar"
}`;

      for (const model of aiConfig.models) {
        try {
          const stream = await aiConfig.client.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: 'Evaluate candidate answer strictly with real-time feedback.' },
            ],
            stream: true,
            temperature: 0.3,
            max_tokens: 1800,
          });

          let accumulatedText = '';
          for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content || '';
            if (token) {
              accumulatedText += token;
              sendEvent('token', { token });
            }
          }

          evaluationResult = extractJsonFromModelOutput(accumulatedText);
          if (evaluationResult && typeof evaluationResult.score === 'number') {
            sendEvent('done', {
              success: true,
              evaluation: evaluationResult,
              source: aiConfig.provider,
            });
            return res.end();
          }
        } catch (streamErr: any) {
          console.warn(`Model ${model} stream error:`, streamErr?.message);
        }
      }
    }

    // Heuristic streaming fallback with simulated progressive token emission
    const fallbackEval = evaluateAnswerHeuristically(questionTitle, candidateAnswer, codeSnippet, role);
    const summaryWords = fallbackEval.summary.split(' ');
    for (const word of summaryWords) {
      sendEvent('token', { token: word + ' ' });
      await new Promise(r => setTimeout(r, 25));
    }

    sendEvent('done', {
      success: true,
      evaluation: fallbackEval,
      source: aiConfig ? 'heuristic_fallback' : 'local_evaluator',
    });
    return res.end();
  } catch (err: any) {
    console.error('Streaming eval error:', err);
    sendEvent('error', { error: err?.message || 'Streaming evaluation encountered an error.' });
    return res.end();
  }
});

// Conversational AI Interviewer Turn endpoint: interactive dialogue during interview
app.post('/api/interview/interviewer-turn', async (req, res) => {
  try {
    const {
      role = 'Frontend Developer',
      questionTitle = '',
      candidateMessage = '',
      context = '',
      mode = 'clarification',
    } = req.body;

    if (!candidateMessage || candidateMessage.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const aiConfig = getAiClientConfig();
    if (aiConfig) {
      try {
        const systemPrompt = `You are a Principal Engineering Bar-Raiser conducting a live mock interview for ${role}.
The candidate is currently answering: "${questionTitle}".
The candidate just said or asked: "${candidateMessage}".
Interaction mode: ${mode}.
${context ? `Prior context: ${context.slice(0, 600)}` : ''}

Respond naturally and conversationally AS THE INTERVIEWER (speaking directly to candidate):
- If candidate is asking a clarifying question (constraints, scale, throughput, boundaries): answer realistically like an experienced interviewer. Clarify the boundary and prompt them to state their assumptions.
- If candidate wants feedback, a hint, or an edge-case challenge: give a concise 1-2 sentence reaction, validating sound reasoning and prompting for trade-offs or SLAs.
- Keep the response sharp, realistic, and between 2 to 3 spoken sentences.
Return STRICT JSON only:
{
  "spokenResponse": "The exact words the interviewer speaks aloud to the candidate.",
  "followUpPrompt": "A short guidance cue or edge-case probe",
  "category": "Clarification" | "Probing" | "Bar-Raiser Cue"
}`;

        const rawText = await callAiWithFallback(systemPrompt, 'Respond to candidate in character.', 600, 0.4);
        const parsed = extractJsonFromModelOutput(rawText);
        if (parsed && parsed.spokenResponse) {
          return res.json({
            success: true,
            turn: parsed,
            source: aiConfig.provider,
          });
        }
      } catch (err: any) {
        console.warn('Interviewer turn AI error, falling back:', err?.message);
      }
    }

    // Heuristic turn response
    let responseText = '';
    const lower = candidateMessage.toLowerCase();
    if (lower.includes('scale') || lower.includes('throughput') || lower.includes('traffic') || lower.includes('qps')) {
      responseText = `Assume 50,000 queries per second at peak, with a 99.9th percentile latency budget under 80 milliseconds. How would that affect your caching and partitioning strategy?`;
    } else if (lower.includes('database') || lower.includes('sql') || lower.includes('store') || lower.includes('storage')) {
      responseText = `For primary storage, assume relational transactional consistency for orders, but append-only distributed streams for audit events. State your read/write consistency assumptions as you design.`;
    } else if (lower.includes('time') || lower.includes('duration') || lower.includes('timeout') || lower.includes('sla')) {
      responseText = `Assume downstream services have a 3-second network deadline before circuit-breaking. Keep walking me through your retry and fallback patterns.`;
    } else if (lower.includes('security') || lower.includes('auth') || lower.includes('token')) {
      responseText = `Assume stateless JWT authentication with OAuth 2.0 at the API gateway, with scoped mTLS between microservices. How will you propagate principal identity?`;
    } else {
      responseText = `Good point to consider. In production, we assume high concurrency with occasional network partitions. Go ahead and detail the trade-offs of your proposed approach under those constraints.`;
    }

    return res.json({
      success: true,
      turn: {
        spokenResponse: responseText,
        followUpPrompt: 'Walk through your trade-offs and latency boundaries.',
        category: 'Clarification',
      },
      source: 'heuristic',
    });
  } catch (err: any) {
    console.error('Interviewer turn error:', err);
    res.status(500).json({ error: err?.message || 'Failed to process interviewer turn.' });
  }
});


// AI Final Session Report Generation Endpoint: Comprehensive debrief
app.post('/api/interview/generate-report', async (req, res) => {
  try {
    const { role = 'Frontend Developer', duration = '15 mins', answers = [], speechAnalytics } = req.body;

    const aiConfig = getAiClientConfig();
    if (aiConfig && answers.length > 0) {
      try {
        const systemPrompt = `You are the Lead Hiring Committee Chair at a Tier-1 tech company.
Generate an executive interview debrief report for a ${role} candidate who completed a ${duration} mock interview session.
Candidate session log:
${JSON.stringify(answers.slice(0, 6))}
${speechAnalytics ? `Vocal Delivery & Speech Telemetry: ${JSON.stringify(speechAnalytics)}` : ''}

Output STRICT JSON only:
{
  "overallScore": number (0-100),
  "grade": "A+" | "A" | "A-" | "B+" | "B" | "B-",
  "hireRecommendation": "Strong Hire" | "Hire" | "Lean Hire" | "Needs Practice",
  "summary": "2-sentence executive hiring recommendation synthesizing strengths and readiness.",
  "competencyBreakdown": {
    "communication": { "score": number (0-100), "feedback": "assessment of articulation, clarity, and STAR delivery" },
    "technicalKnowledge": { "score": number (0-100), "feedback": "assessment of core domain accuracy and depth" },
    "problemSolving": { "score": number (0-100), "feedback": "assessment of trade-off reasoning and edge-case handling" }
  },
  "keyStrengths": ["strength 1", "strength 2", "strength 3"],
  "growthAreas": ["growth area 1", "growth area 2"],
  "actionItems": ["action item 1", "action item 2", "action item 3"]
}`;

        const rawText = await callAiWithFallback(systemPrompt, 'Generate the executive hiring debrief.', 2000, 0.3);
        const report = extractJsonFromModelOutput(rawText);

        if (report && typeof report.overallScore === 'number') {
          if (speechAnalytics) report.speechAnalytics = speechAnalytics;
          return res.json({ success: true, report, source: aiConfig.provider });
        }
      } catch (aiErr: any) {
        console.warn('AI report generation error, falling back:', aiErr?.message);
      }
    }

    const avgScore = answers.length > 0
      ? Math.round(answers.reduce((acc: number, a: any) => acc + (a.score || 82), 0) / answers.length)
      : 84;

    const report: any = {
      overallScore: avgScore,
      grade: avgScore >= 92 ? 'A+' : avgScore >= 87 ? 'A' : avgScore >= 80 ? 'B+' : 'B-',
      hireRecommendation: avgScore >= 88 ? 'Strong Hire' : avgScore >= 78 ? 'Hire' : 'Lean Hire',
      summary: `Candidate demonstrated strong core competency in ${role} patterns with clear articulation. Key differentiator was structured technical breakdown and pragmatic trade-off awareness.`,
      competencyBreakdown: {
        communication: { score: Math.min(95, avgScore + 1), feedback: 'Articulate responses with structured technical storytelling.' },
        technicalKnowledge: { score: avgScore, feedback: `Solid foundational grasp of ${role} paradigms and edge cases.` },
        problemSolving: { score: Math.max(72, avgScore - 2), feedback: 'Deconstructs multi-faceted problems systematically.' }
      },
      keyStrengths: [
        `Clear separation of architectural boundaries in ${role} contexts`,
        'Strong problem decomposition following STAR principles',
        'Proactive consideration for failure recovery and production edge-cases'
      ],
      growthAreas: [
        'Incorporate quantitative production KPIs, latency bounds, and SLAs into answers',
        'Address failover, concurrency, and degradation strategies during network partition'
      ],
      actionItems: [
        `Practice 2 deep-dive drill sessions focusing on high-throughput ${role} bottlenecks`,
        'Refine STAR framework delivery using 3-minute concise verbal summaries',
        'Prepare concrete trade-off matrices for state management and caching tiers'
      ]
    };

    if (speechAnalytics) {
      report.speechAnalytics = speechAnalytics;
    }

    return res.json({ success: true, report, source: 'heuristic' });
  } catch (err: any) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: err?.message || 'Failed to generate report' });
  }
});

// ==========================================
// GOOGLE CLOUD TTS & VOICE ENGINE ENDPOINTS
// ==========================================

// Lists available voices (Google Cloud TTS with browser fallback)
app.get('/api/tts/voices', async (req, res) => {
  try {
    const lang = (req.query.lang as string) || 'en';
    const data = await getAvailableTtsVoices(lang);
    res.json({ success: true, ...data });
  } catch (err: any) {
    console.error('TTS voices fetch error:', err);
    res.status(500).json({ error: err?.message || 'Failed to list voices' });
  }
});

// Synthesizes speech audio for questions or follow-ups
app.post('/api/tts/synthesize', async (req, res) => {
  try {
    const result = await synthesizeSpeechAudio(req.body);
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('TTS synthesis error:', err);
    res.status(500).json({ error: err?.message || 'Synthesis failed' });
  }
});

// Previews a voice with the standard test sample sentence
app.post('/api/tts/preview', async (req, res) => {
  try {
    const { voiceName, locale, gender, speakingRate, pitch } = req.body;
    const sampleText = "Welcome to your mock interview. Let's begin by discussing your experience and approach to problem-solving.";
    const result = await synthesizeSpeechAudio({
      text: sampleText,
      voiceName,
      locale,
      gender,
      speakingRate,
      pitch,
    });
    res.json({ success: true, sampleText, ...result });
  } catch (err: any) {
    console.error('TTS preview error:', err);
    res.status(500).json({ error: err?.message || 'Voice preview failed' });
  }
});

// Get user saved voice preferences
app.get('/api/user/voice-settings', (req, res) => {
  const userId = (req.query.userId as string) || 'default_user';
  const settings = getVoicePreferences(userId);
  res.json({ success: true, settings });
});

// Save user voice preferences
app.post('/api/user/voice-settings', (req, res) => {
  const { userId = 'default_user', settings } = req.body;
  saveVoicePreferences(userId, settings);
  res.json({ success: true });
});

// ========================================================
// REAL-TIME SESSION ENGINE & DEDUPLICATION SYSTEM
// ========================================================

// Starts a persistent interview session
app.post('/api/interview/session/start', (req, res) => {
  try {
    const {
      userId = 'default_user',
      role = 'Frontend Developer',
      level = 'Entry Level',
      type = 'Technical',
      difficulty = 'Medium',
      duration = '20 min (5 questions)',
      voiceSettings = { provider: 'browser', voiceName: 'en-US-Journey-F', locale: 'en-US' },
    } = req.body;

    const sessionId = crypto.randomUUID();
    const countMatch = duration.match(/\b(\d+)\s*questions?\b/i);
    const totalQuestions = countMatch ? parseInt(countMatch[1], 10) : 5;

    const newSession: StoredSession = {
      sessionId,
      userId,
      role,
      level,
      type,
      difficulty,
      duration,
      voiceSettings,
      state: 'preparing',
      turns: [],
      currentQuestionIndex: 0,
      totalQuestions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveSessionRecord(newSession);
    res.json({ success: true, sessionId, session: newSession });
  } catch (err: any) {
    console.error('Session start error:', err);
    res.status(500).json({ error: err?.message || 'Failed to start interview session' });
  }
});

// Generates or selects the next non-duplicate question and advances turn
app.post('/api/interview/session/next-turn', async (req, res) => {
  try {
    const {
      sessionId,
      userId = 'default_user',
      role = 'Frontend Developer',
      difficulty = 'Medium',
      type = 'Technical',
      targetCategory = 'System Architecture',
    } = req.body;

    const session = sessionId ? getSessionRecord(sessionId) : null;
    const sessionHistory = sessionId ? getSessionQuestions(sessionId) : [];
    const userHistory = getUserQuestions(userId);

    // Combine current session questions (100% deduplication) and user history
    const allHistoryToAvoid = [...sessionHistory, ...userHistory];

    const aiConfig = getAiClientConfig();
    let approvedQuestion: StoredQuestion | null = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (!approvedQuestion && attempts < maxAttempts) {
      attempts++;

      // Attempt AI calibrated question generation
      let candidateTitle = '';
      let candidateDesc = '';
      let candidateCategory = targetCategory;
      let candidateCompanies = ['Meta', 'Google', 'Stripe'];
      let candidateTime = '3-4 mins response';

      if (aiConfig) {
        try {
          const excludeSummaries = allHistoryToAvoid.slice(-8).map(q => `"${q.questionText}"`).join(', ');
          const systemPrompt = `You are a Principal Engineering Bar-Raiser conducting a high-stakes mock interview for ${role} (${difficulty} / ${type}).
Generate ONE fresh, rigorous question.
CRITICAL DEDUPLICATION RULE: The question MUST NOT repeat or resemble any of these previously delivered questions: [${excludeSummaries}].

Output STRICT JSON only:
{
  "title": "Exact interview question prompt (1-2 clear, rigorous sentences)",
  "category": "${role} Core" | "Architecture & System Design" | "Trade-offs & Resilience" | "STAR Behavioral",
  "difficulty": "${difficulty}",
  "estimatedTime": "3-4 mins",
  "description": "2-sentence rubric guide on what interviewers look for (trade-offs, SLAs, failure modes).",
  "companies": ["Top Tech Firm A", "Top Tech Firm B"]
}`;

          const raw = await callAiWithFallback(systemPrompt, `Generate next calibrated question for ${role}.`, 900, 0.4);
          const parsed = extractJsonFromModelOutput(raw);
          if (parsed && parsed.title) {
            candidateTitle = parsed.title;
            candidateDesc = parsed.description || 'Discuss architectural boundaries and trade-offs.';
            candidateCategory = parsed.category || targetCategory;
            candidateCompanies = parsed.companies || ['Amazon', 'Google'];
          }
        } catch (e: any) {
          console.warn('AI question candidate generation error:', e?.message);
        }
      }

      // Fallback candidate if AI was unavailable
      if (!candidateTitle) {
        const fallbackPool = generateDynamicQuestions(role, targetCategory, difficulty, 6);
        const unasked = fallbackPool.find(q => !allHistoryToAvoid.some(h => computeContentFingerprint(h.questionText) === computeContentFingerprint(q.title)));
        const chosen = unasked || fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
        candidateTitle = chosen.title;
        candidateDesc = chosen.description;
        candidateCategory = chosen.category;
        candidateCompanies = chosen.companies;
      }

      // Run deduplication check: if duplicate and more attempts remain, retry. Otherwise accept to prevent stall.
      const dupCheck = checkQuestionDuplication(candidateTitle, allHistoryToAvoid, 0.65);
      if (dupCheck.isDuplicate && attempts < maxAttempts) {
        console.warn(`[Deduplication] Retrying non-duplicate candidate (Attempt ${attempts}): "${candidateTitle}". Reason: ${dupCheck.reason}`);
        continue;
      }

      // Approved question
      const questionId = crypto.randomUUID();
      approvedQuestion = {
        questionId,
        userId,
        sessionId: sessionId || 'standalone',
        roleTarget: role,
        questionText: candidateTitle,
        normalizedQuestionText: normalizeQuestionText(candidateTitle),
        contentFingerprint: computeContentFingerprint(candidateTitle),
        category: candidateCategory,
        difficulty: difficulty as any,
        experienceLevel: session?.level || 'Intermediate',
        questionType: type,
        source: aiConfig ? 'generated' : 'curated',
        companies: candidateCompanies,
        estimatedTime: candidateTime,
        description: candidateDesc,
        createdAt: new Date().toISOString(),
      };
    }

    if (!approvedQuestion) {
      // Dynamic fallback probe tailored to candidate role
      const questionId = crypto.randomUUID();
      const dynamicTopic = `${role} Architecture & Trade-offs`;
      approvedQuestion = {
        questionId,
        userId,
        sessionId: sessionId || 'standalone',
        roleTarget: role,
        questionText: `Walk me through your architectural strategy for high-concurrency state synchronization and fault isolation in a production ${role} platform.`,
        normalizedQuestionText: normalizeQuestionText(`high concurrency state synchronization in ${role}`),
        contentFingerprint: computeContentFingerprint(`${role} state synchronization ${Date.now()}`),
        category: dynamicTopic,
        difficulty: difficulty as any,
        experienceLevel: session?.level || 'Intermediate',
        questionType: type,
        source: 'curated',
        companies: ['Stripe', 'Google', 'Netflix'],
        estimatedTime: '3-4 mins',
        description: 'Address component isolation, backpressure handling, data consistency guarantees, and recovery SLAs.',
        createdAt: new Date().toISOString(),
      };
    }

    // Persist delivered question
    recordDeliveredQuestion(approvedQuestion);

    // Synthesize audio with selected voice
    const voiceSettings = session?.voiceSettings || { voiceName: 'en-US-Journey-F', locale: 'en-US', gender: 'FEMALE' };
    const audioResult = await synthesizeSpeechAudio({
      text: `${approvedQuestion.questionText}. ${approvedQuestion.description || ''}`,
      voiceName: voiceSettings.voiceName,
      locale: voiceSettings.locale,
      gender: voiceSettings.gender,
    });

    // Update session state
    if (session) {
      session.state = 'interviewer_speaking';
      session.currentQuestionIndex = (session.turns.length);
      saveSessionRecord(session);
    }

    return res.json({
      success: true,
      question: {
        id: approvedQuestion.questionId,
        title: approvedQuestion.questionText,
        category: approvedQuestion.category,
        difficulty: approvedQuestion.difficulty,
        roleTarget: approvedQuestion.roleTarget,
        estimatedTime: approvedQuestion.estimatedTime,
        description: approvedQuestion.description,
        companies: approvedQuestion.companies,
        status: 'unattempted',
        statusLabel: `AI Calibrated • ${approvedQuestion.difficulty}`,
        isBookmarked: false,
        source: approvedQuestion.source,
        contentFingerprint: approvedQuestion.contentFingerprint,
        normalizedQuestionText: approvedQuestion.normalizedQuestionText,
      },
      audio: audioResult,
      state: 'interviewer_speaking',
      questionNumber: (session?.turns.length || 0) + 1,
      totalQuestions: session?.totalQuestions || 5,
    });
  } catch (err: any) {
    console.error('Session next-turn error:', err);
    res.status(500).json({ error: err?.message || 'Failed to advance to next interview question' });
  }
});

// Submits candidate answer, evaluates response, and decides adaptive follow-up
app.post('/api/interview/session/submit-answer', async (req, res) => {
  try {
    const {
      sessionId,
      questionId,
      questionTitle,
      candidateAnswer = '',
      codeSnippet = '',
      durationSeconds = 60,
      metrics = null,
      role = 'Frontend Developer',
      type = 'Technical',
      difficulty = 'Medium',
    } = req.body;

    if (!candidateAnswer || candidateAnswer.trim().length < 5) {
      return res.status(400).json({ error: 'Please provide a valid answer to submit.' });
    }

    const session = sessionId ? getSessionRecord(sessionId) : null;
    const aiConfig = getAiClientConfig();

    // Select calibrated rubric prompt based on interview type
    let rubricInstructions = '';
    if (type.toLowerCase().includes('behavioral')) {
      rubricInstructions = `Assess strictly on STAR methodology:
- Situation & Task: Was the business context and objective clear?
- Action: Did candidate describe specific, personal ownership actions rather than vague "we"?
- Result: Were quantifiable business impact, metrics, or learnings shared?
- Rubric keys: communicationDelivery, technicalKnowledge (domain context), problemSolving (STAR effectiveness), systemArchitecture (organizational alignment)`;
    } else if (type.toLowerCase().includes('hr')) {
      rubricInstructions = `Assess on candidate motivation, communication professionalism, cultural values, and self-awareness.`;
    } else {
      rubricInstructions = `Assess on technical correctness, architecture decoupling, trade-off analysis, latency/scalability constraints, and clarity.`;
    }

    let evaluation: any = null;

    if (aiConfig) {
      try {
        const systemPrompt = `You are a Principal Technical Bar-Raiser conducting an interview for ${role}.
${rubricInstructions}
Evaluate:
- Question: "${questionTitle}"
- Candidate Answer: "${candidateAnswer.slice(0, 3000)}"
${codeSnippet ? `- Candidate Scratchpad/Code: "${codeSnippet.slice(0, 1500)}"` : ''}

Output STRICT JSON only:
{
  "score": number (0-100),
  "summary": "1-2 concise sentences summarizing performance against staff-level hiring bar",
  "strengths": ["specific strength 1", "specific strength 2"],
  "gaps": ["actionable improvement 1", "actionable improvement 2"],
  "rubricScores": {
    "communicationDelivery": number (0-100),
    "technicalKnowledge": number (0-100),
    "problemSolving": number (0-100),
    "systemArchitecture": number (0-100)
  },
  "sampleIdealAnswer": "2-3 concise sentences demonstrating the gold standard, staff-level answer with concrete metrics and trade-offs.",
  "followUpQuestion": "A sharp, conversational follow-up drill-down question from the interviewer probing an edge case or specific trade-off in candidate's answer",
  "coachingTip": "1 practical sentence on how to elevate this response to top 1% bar"
}`;

        const raw = await callAiWithFallback(systemPrompt, 'Evaluate answer strictly against rubric.', 1800, 0.3);
        evaluation = extractJsonFromModelOutput(raw);
      } catch (err: any) {
        console.warn('AI evaluation error, using heuristic evaluator:', err?.message);
      }
    }

    if (!evaluation || typeof evaluation.score !== 'number') {
      evaluation = evaluateAnswerHeuristically(questionTitle, candidateAnswer, codeSnippet, role, metrics, type);
    }

    // Adaptive follow-up decision
    // Only ask follow-up if candidate score is decent (>= 60) AND session turn count allows it
    const existingFollowUpsCount = session?.turns.filter(t => t.isFollowUp).length || 0;
    const shouldAskFollowUp = existingFollowUpsCount < 2 && evaluation.score >= 65 && evaluation.followUpQuestion;

    let followUpQuestionRecord: StoredQuestion | null = null;
    let followUpAudioResult: any = null;

    if (shouldAskFollowUp && evaluation.followUpQuestion) {
      const followUpId = crypto.randomUUID();
      followUpQuestionRecord = {
        questionId: followUpId,
        userId: session?.userId || 'default_user',
        sessionId: sessionId || 'standalone',
        roleTarget: role,
        questionText: evaluation.followUpQuestion,
        normalizedQuestionText: normalizeQuestionText(evaluation.followUpQuestion),
        contentFingerprint: computeContentFingerprint(evaluation.followUpQuestion),
        category: 'Follow-up Drill-down',
        difficulty: difficulty as any,
        experienceLevel: session?.level || 'Intermediate',
        questionType: type,
        source: 'follow-up',
        parentQuestionId: questionId,
        companies: ['Interviewer Drill-down'],
        estimatedTime: '2-3 mins',
        description: 'Contextual follow-up probing the specific implementation details of your previous answer.',
        createdAt: new Date().toISOString(),
      };

      recordDeliveredQuestion(followUpQuestionRecord);

      // Synthesize follow-up audio
      const voiceSettings = session?.voiceSettings || { voiceName: 'en-US-Journey-F', locale: 'en-US', gender: 'FEMALE' };
      followUpAudioResult = await synthesizeSpeechAudio({
        text: evaluation.followUpQuestion,
        voiceName: voiceSettings.voiceName,
        locale: voiceSettings.locale,
        gender: voiceSettings.gender,
      });
    }

    // Record turn in session
    if (session) {
      const turnRecord: StoredTurn = {
        turnId: crypto.randomUUID(),
        question: {
          questionId: questionId || crypto.randomUUID(),
          userId: session.userId,
          sessionId: session.sessionId,
          roleTarget: role,
          questionText: questionTitle,
          normalizedQuestionText: normalizeQuestionText(questionTitle),
          contentFingerprint: computeContentFingerprint(questionTitle),
          category: 'Interview Turn',
          difficulty: difficulty as any,
          experienceLevel: session.level,
          questionType: type,
          source: 'curated',
          createdAt: new Date().toISOString(),
        },
        candidateAnswer,
        codeSnippet,
        evaluation,
        durationSeconds,
        metrics,
        isFollowUp: false,
        timestamp: new Date().toISOString(),
      };

      session.turns.push(turnRecord);
      session.state = shouldAskFollowUp ? 'generating_follow_up' : 'generating_next_question';
      saveSessionRecord(session);
    }

    return res.json({
      success: true,
      evaluation,
      hasFollowUp: shouldAskFollowUp,
      followUpQuestion: followUpQuestionRecord ? {
        id: followUpQuestionRecord.questionId,
        title: followUpQuestionRecord.questionText,
        category: followUpQuestionRecord.category,
        difficulty: followUpQuestionRecord.difficulty,
        roleTarget: followUpQuestionRecord.roleTarget,
        estimatedTime: followUpQuestionRecord.estimatedTime,
        description: followUpQuestionRecord.description,
        companies: followUpQuestionRecord.companies,
        status: 'unattempted',
        statusLabel: 'Follow-up Probe',
        isBookmarked: false,
        source: 'follow-up',
        parentQuestionId: questionId,
      } : null,
      followUpAudio: followUpAudioResult,
      nextState: shouldAskFollowUp ? 'generating_follow_up' : 'generating_next_question',
    });
  } catch (err: any) {
    console.error('Submit answer error:', err);
    res.status(500).json({ error: err?.message || 'Failed to submit answer' });
  }
});

// Concludes session and saves report
app.post('/api/interview/session/complete', async (req, res) => {
  try {
    const { sessionId, report } = req.body;
    const session = sessionId ? getSessionRecord(sessionId) : null;

    if (session) {
      session.state = 'completed';
      if (report) {
        session.report = report;
      }
      saveSessionRecord(session);
    }

    res.json({ success: true, session });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to complete session' });
  }
});

// Retrieves stored session for resume / reload
app.get('/api/interview/session/:sessionId', (req, res) => {
  const session = getSessionRecord(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Interview session not found' });
  }
  res.json({ success: true, session });
});

// Lists completed and recorded interview sessions for a candidate
app.get('/api/interview/sessions', (req, res) => {
  try {
    const userId = (req.query.userId as string) || '';
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const sessions = listUserSessions(userId);
    res.json({ success: true, sessions });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list user sessions' });
  }
});

// Retrieves delivered question history for user (deduplication verification)
app.get('/api/interview/questions/history', (req, res) => {
  const userId = (req.query.userId as string) || 'default_user';
  const questions = getUserQuestions(userId);
  res.json({
    success: true,
    totalDelivered: questions.length,
    questions: questions.map(q => ({
      questionId: q.questionId,
      title: q.questionText,
      roleTarget: q.roleTarget,
      difficulty: q.difficulty,
      source: q.source,
      contentFingerprint: q.contentFingerprint,
      createdAt: q.createdAt,
    })),
  });
});


function evaluateAnswerHeuristically(
  questionTitle: string,
  answer: string,
  code: string = '',
  role: string = 'Software Engineer',
  metrics?: any,
  _type: string = 'Technical'
) {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  const lowerAnswer = (answer + ' ' + (code || '')).toLowerCase();
  const lowerQuestion = (questionTitle || '').toLowerCase();

  // 1. Evaluate Communication Skill strictly depending on speaking pace (WPM) & articulation
  const wpm = metrics?.wpm ? Number(metrics.wpm) : Math.round((words / Math.max(1, (metrics?.durationSeconds || 45))) * 60);
  let communicationDelivery = 80;
  let pacingFeedback = '';

  if (wpm >= 120 && wpm <= 160) {
    // Optimal executive interview pace
    communicationDelivery = Math.min(96, 90 + Math.min(5, Math.floor(words / 30)));
    pacingFeedback = `Optimal cadence (${wpm} WPM). Fluid, confident articulation that is easy to follow in an engineering interview.`;
  } else if (wpm >= 95 && wpm < 120) {
    // Deliberate, thoughtful pace
    communicationDelivery = Math.min(88, 82 + Math.min(4, Math.floor(words / 40)));
    pacingFeedback = `Measured, deliberate pacing (${wpm} WPM). Thoughts were structured; accelerating slightly towards 130 WPM will project higher velocity.`;
  } else if (wpm >= 70 && wpm < 95) {
    // Slower pace
    communicationDelivery = Math.max(72, 75 + Math.min(4, Math.floor(words / 40)));
    pacingFeedback = `Deliberate delivery (${wpm} WPM). Clear speech, though picking up the cadence to ~125 WPM will convey greater conviction.`;
  } else if (wpm < 70) {
    // Very slow or brief response
    communicationDelivery = Math.max(55, 62 + Math.min(6, Math.floor(words / 20)));
    pacingFeedback = `Pacing was hesitant (${wpm} WPM). Practice continuous vocal flow to avoid prolonged thinking pauses.`;
  } else {
    // > 160 WPM: fast/rushed
    communicationDelivery = Math.max(68, 78 - Math.floor((wpm - 160) / 10));
    pacingFeedback = `Fast speaking pace (${wpm} WPM). Be mindful to insert natural breath pauses so the interviewer can absorb complex points.`;
  }

  // Structural discourse markers
  const hasDiscourse = lowerAnswer.includes('first') || lowerAnswer.includes('second') || lowerAnswer.includes('specifically') || lowerAnswer.includes('for example') || lowerAnswer.includes('in summary') || lowerAnswer.includes('key');
  if (hasDiscourse) communicationDelivery = Math.min(97, communicationDelivery + 3);

  // 2. Evaluate Technical Depth & Domain Relevance
  const questionKeywords = lowerQuestion.match(/\b[a-z]{3,}\b/g) || [];
  let keywordMatches = 0;
  for (const kw of questionKeywords) {
    if (!['what', 'how', 'when', 'with', 'your', 'this', 'that', 'explain', 'describe', 'difference', 'between'].includes(kw)) {
      if (lowerAnswer.includes(kw)) keywordMatches++;
    }
  }

  const hasTradeoffs = lowerAnswer.includes('trade-off') || lowerAnswer.includes('tradeoff') || lowerAnswer.includes('however') || lowerAnswer.includes('alternatively') || lowerAnswer.includes('versus') || lowerAnswer.includes('vs') || lowerAnswer.includes('drawback') || lowerAnswer.includes('advantage');
  const hasArchitecture = lowerAnswer.includes('decouple') || lowerAnswer.includes('layer') || lowerAnswer.includes('pattern') || lowerAnswer.includes('pipeline') || lowerAnswer.includes('state') || lowerAnswer.includes('cache') || lowerAnswer.includes('queue') || lowerAnswer.includes('server') || lowerAnswer.includes('client');
  const hasPerformance = lowerAnswer.includes('latency') || lowerAnswer.includes('optimize') || lowerAnswer.includes('memory') || lowerAnswer.includes('throughput') || lowerAnswer.includes('tti') || lowerAnswer.includes('lcp') || lowerAnswer.includes('load') || lowerAnswer.includes('performance');
  const hasCode = (code || '').trim().length > 30;

  let techScore = 70;
  if (keywordMatches >= 2) techScore += 8;
  if (keywordMatches >= 4) techScore += 7;
  if (hasArchitecture) techScore += 5;
  if (hasPerformance) techScore += 4;
  if (hasCode) techScore += 4;
  if (words > 40) techScore += 4;
  const technicalKnowledge = Math.min(96, Math.max(55, techScore));

  // 3. Problem Solving & Tradeoff Analysis
  let problemScore = 70;
  if (hasTradeoffs) problemScore += 11;
  if (lowerAnswer.includes('because') || lowerAnswer.includes('therefore') || lowerAnswer.includes('reason') || lowerAnswer.includes('handle')) problemScore += 6;
  if (lowerAnswer.includes('scale') || lowerAnswer.includes('fallback') || lowerAnswer.includes('failover') || lowerAnswer.includes('edge')) problemScore += 5;
  if (words > 50) problemScore += 4;
  const problemSolving = Math.min(95, Math.max(52, problemScore));

  // 4. System Architecture
  let archScore = hasArchitecture ? 84 : 74;
  if (hasPerformance) archScore += 6;
  if (hasTradeoffs) archScore += 5;
  const systemArchitecture = Math.min(95, Math.max(58, archScore));

  // Overall Score (weighted)
  const finalScore = Math.round(
    technicalKnowledge * 0.4 +
    problemSolving * 0.3 +
    communicationDelivery * 0.2 +
    systemArchitecture * 0.1
  );

  // Dynamic tailored Strengths & Gaps
  const strengths: string[] = [];
  if (keywordMatches >= 2) strengths.push(`Addressed core concepts in the question with role-appropriate terminology.`);
  if (hasTradeoffs) strengths.push(`Articulated architectural trade-offs rather than assuming a single ideal pattern.`);
  if (wpm >= 115 && wpm <= 165) strengths.push(`Maintained an optimal conversational delivery cadence of ${wpm} WPM.`);
  if (hasPerformance) strengths.push(`Demonstrated conscious awareness of latency, caching, and execution bottlenecks.`);
  if (hasCode) strengths.push(`Reinforced verbal explanation with structured scratchpad code.`);
  if (strengths.length === 0) strengths.push(`Provided a responsive, clear answer addressing the interviewer's prompt.`);

  const gaps: string[] = [];
  if (!hasTradeoffs) gaps.push(`Discuss edge cases, failure states, or alternative architecture trade-offs more explicitly.`);
  if (words < 50) gaps.push(`Elaborate on production scale: mention data volumes, SLAs, or concrete business impact.`);
  if (wpm < 95) gaps.push(`Pick up verbal cadence from ${wpm} WPM towards 125-140 WPM to project authoritative confidence.`);
  if (!lowerAnswer.includes('monitor') && !lowerAnswer.includes('metric') && !lowerAnswer.includes('test')) {
    gaps.push(`Cite observability metrics, P99 latency thresholds, or automated test strategies.`);
  }
  if (gaps.length === 0) gaps.push(`Provide specific quantitative benchmarks from past production deployments.`);

  // Follow-up question tailored to the topic
  let followUp = `How would your proposed solution scale if traffic or payload volume increased by a factor of 50x under network partition?`;
  if (lowerQuestion.includes('csr') || lowerQuestion.includes('ssr') || lowerQuestion.includes('ssg') || lowerQuestion.includes('rendering')) {
    followUp = `How does streaming SSR or progressive hydration affect your Time-To-Interactive (TTI) and server memory footprint under concurrent peak traffic?`;
  } else if (lowerQuestion.includes('state') || lowerQuestion.includes('redux') || lowerQuestion.includes('zustand') || lowerQuestion.includes('cache')) {
    followUp = `How do you handle stale cache invalidation and race conditions when multiple client mutations arrive out of order?`;
  } else if (lowerQuestion.includes('memory') || lowerQuestion.includes('leak') || lowerQuestion.includes('performance')) {
    followUp = `What specific Chrome DevTools or memory heap profiler metrics would you inspect to confirm the leak is resolved?`;
  } else if (hasTradeoffs) {
    followUp = `If your engineering team faced a strict 200ms P99 SLA constraint, which of those trade-offs would you compromise first?`;
  }

  return {
    score: finalScore,
    summary: `Candidate demonstrated solid domain reasoning for ${role} (${finalScore}/100). ${pacingFeedback}`,
    strengths,
    gaps,
    rubricScores: {
      technicalKnowledge,
      problemSolving,
      communicationDelivery,
      systemArchitecture,
      technicalAccuracy: technicalKnowledge,
      architectureDepth: systemArchitecture,
    },
    followUpQuestion: followUp,
    coachingTip: `When concluding your answer, state the exact metric you would monitor in production dashboards to verify system stability.`
  };
}

// Heuristic Resume Parser
function analyzeResumeHeuristically(text: string, targetDate?: string) {
  const lower = text.toLowerCase();

  // Name extraction attempt (first non-empty line or Alex Morgan)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let name = 'Alex Morgan';
  if (lines.length > 0 && lines[0].length < 40 && !lines[0].toLowerCase().includes('resume') && !lines[0].includes('@')) {
    name = lines[0];
  }

  // Email extraction
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
  const email = emailMatch ? emailMatch[1] : 'alex.morgan@university.edu';

  // Detected skills
  const knownSkills = [
    'Solidity', 'EVM', 'Ethereum', 'Smart Contracts', 'Web3', 'Hardhat', 'Truffle',
    'PyTorch', 'TensorFlow', 'Machine Learning', 'Deep Learning', 'LLMs', 'NLP',
    'React', 'TypeScript', 'JavaScript', 'Next.js', 'Node.js', 'Python', 'Java', 'Go',
    'GraphQL', 'PostgreSQL', 'SQL', 'Docker', 'Kubernetes', 'AWS', 'Redis', 'Tailwind CSS',
    'HTML/CSS', 'System Design', 'Git', 'Webpack', 'Vite', 'Kafka', 'Spring Boot', 'Terraform'
  ];
  const detectedSkills = knownSkills.filter(s => lower.includes(s.toLowerCase()));
  if (detectedSkills.length === 0) {
    detectedSkills.push('TypeScript', 'System Architecture', 'Node.js', 'APIs', 'Git');
  }

  // Role detection
  const detectedRoles = [];

  // Check for Blockchain / Web3
  if (lower.includes('blockchain') || lower.includes('solidity') || lower.includes('smart contract') || lower.includes('evm') || lower.includes('web3') || lower.includes('defi')) {
    detectedRoles.push({
      title: 'Blockchain Engineer',
      desc: 'Solidity Smart Contracts, EVM Internals, DeFi Protocols & Security',
      match: 97,
      reason: 'Demonstrates domain expertise in smart contract engineering, EVM opcode execution, and decentralized protocols.'
    });
  }

  // Check for Machine Learning / AI
  if (lower.includes('machine learning') || lower.includes('deep learning') || lower.includes('pytorch') || lower.includes('tensorflow') || lower.includes('llm') || lower.includes('nlp')) {
    detectedRoles.push({
      title: 'Machine Learning Engineer',
      desc: 'Model Architecture, Training Pipelines, Vector Embeddings & Fine-Tuning',
      match: 95,
      reason: 'Strong foundation in ML modeling, distributed training, and neural network architectures.'
    });
  }

  // Check for DevOps / Cloud
  if (lower.includes('devops') || lower.includes('kubernetes') || lower.includes('terraform') || (lower.includes('ci/cd') && lower.includes('aws'))) {
    detectedRoles.push({
      title: 'DevOps / Cloud Engineer',
      desc: 'Infrastructure-as-Code, Kubernetes, CI/CD & Reliability Engineering',
      match: 93,
      reason: 'Extensive hands-on experience orchestrating multi-region cloud workloads and automated deployment pipelines.'
    });
  }

  // Frontend
  if (lower.includes('react') || lower.includes('frontend') || lower.includes('css') || lower.includes('ui') || lower.includes('web vitals')) {
    detectedRoles.push({
      title: 'Frontend Developer',
      desc: 'UI Architecture, React, Next.js, Web Vitals & Hydration',
      match: 96,
      reason: 'Strong proficiency in modern client architectures and reactive state workflows.'
    });
  }

  // Backend
  if (lower.includes('node') || lower.includes('python') || lower.includes('api') || lower.includes('backend') || lower.includes('database') || lower.includes('sql') || lower.includes('kafka')) {
    detectedRoles.push({
      title: 'Backend Developer',
      desc: 'APIs, Distributed Databases, Scalability & Queues',
      match: 92,
      reason: 'Experience building scalable server services, schema design, and asynchronous queues.'
    });
  }

  // Full Stack
  if (lower.includes('full stack') || (detectedRoles.length >= 2)) {
    detectedRoles.push({
      title: 'Full Stack Developer',
      desc: 'End-to-end Systems, Integrations, Auth & State',
      match: 94,
      reason: 'Bridges frontend presentation with robust API contracts and database persistence.'
    });
  }

  if (detectedRoles.length === 0) {
    detectedRoles.push(
      {
        title: 'Software Engineer',
        desc: 'Algorithms, Data Structures, Complexity Analysis & Clean Architecture',
        match: 94,
        reason: 'Recommended core pathway based on technical background and engineering fundamentals.'
      },
      {
        title: 'Full Stack Developer',
        desc: 'End-to-end Systems, Integrations, Auth & State',
        match: 90,
        reason: 'Versatile engineering profile across system layers.'
      }
    );
  }

  // Determine stage and experience level
  let stage = 'Senior Undergrad / Active Job Hunter';
  let experienceLevel = 'Entry Level';
  let experienceYears = 3.0;

  if (lower.includes('senior') || lower.includes('lead') || lower.includes('staff') || lower.includes('principal')) {
    stage = 'Senior Engineer (5+ yrs)';
    experienceLevel = 'Experienced';
    experienceYears = 6;
  } else if (lower.includes('mid') || lower.includes('3-5') || lower.includes('4 years') || lower.includes('3 years')) {
    stage = 'Mid-Level Engineer (3-5 yrs)';
    experienceLevel = 'Intermediate';
    experienceYears = 4;
  } else if (lower.includes('intern') || lower.includes('junior') || lower.includes('graduate')) {
    stage = 'Recent Graduate / Junior Engineer';
    experienceLevel = 'Entry Level';
    experienceYears = 1.5;
  }

  const primaryRole = detectedRoles[0]?.title || 'Software Engineer';

  return {
    fullName: name,
    email,
    primaryRole,
    experienceLevel,
    currentStage: stage,
    experienceYears,
    targetRoles: detectedRoles,
    topSkills: detectedSkills.slice(0, 8),
    targetInterviewDate: targetDate || 'October 28, 2026',
    readinessTier: experienceLevel === 'Experienced' ? 'Tier A' : 'Tier B+',
    keyAchievements: [
      `Engineered core high-throughput systems for ${primaryRole} workflows with sub-100ms response targets`,
      'Designed modular architectural boundaries isolating business logic and asynchronous queues',
      'Spearheaded performance benchmarking reducing payload execution times by over 30%'
    ],
    suggestedFocus: `${primaryRole} deep-dive architecture, failure modes, and STAR behavioral impact metrics`,
    summary: `${name} presents a compelling profile centered on ${primaryRole} with core skills in ${detectedSkills.slice(0, 4).join(', ')}. Optimal candidate for ${primaryRole} interview loops.`
  };
}

// Fallback question generator ranked strictly Easy -> Medium -> Hard
function generateDynamicQuestions(role: string, category: string, _difficulty: string, count: number) {
  const isBackend = role.toLowerCase().includes('backend') || role.toLowerCase().includes('data') || role.toLowerCase().includes('distributed') || role.toLowerCase().includes('java');

  const frontendProgression = [
    {
      title: 'Explain the difference between useEffect, useLayoutEffect, and useInsertionEffect with practical use cases.',
      category: 'React Internals',
      difficulty: 'Easy' as const,
      desc: 'Focus on render timing, browser paint synchronization, DOM mutation flicker prevention, and CSS-in-JS injection.',
      companies: ['Meta', 'Vercel', 'Shopify'],
      time: '2–3 mins response'
    },
    {
      title: 'Walk through how the CSS box model, layout recalculation, and composite layers impact browser rendering performance.',
      category: 'Technical Architecture',
      difficulty: 'Easy' as const,
      desc: 'Explain triggers for reflow vs repaint, GPU acceleration with transform/opacity, and will-change trade-offs.',
      companies: ['Google', 'Apple', 'Canva'],
      time: '3 mins response'
    },
    {
      title: 'Explain the architectural trade-offs between CSR, SSR, and SSG in high-traffic consumer web applications.',
      category: 'Technical Architecture',
      difficulty: 'Medium' as const,
      desc: 'Focus on Time-To-Interactive (TTI), Largest Contentful Paint (LCP), server load variance, and CDN caching invalidation.',
      companies: ['Meta', 'Stripe', 'Vercel'],
      time: '3–4 mins response'
    },
    {
      title: 'How do you structure an optimistic UI mutation pipeline with automatic rollback and local offline queueing?',
      category: 'System Architecture',
      difficulty: 'Medium' as const,
      desc: 'Cover cache mutation patterns, IndexedDB persistence, temporary rollback snapshots, and network reconnect reconciliation.',
      companies: ['Linear', 'Figma', 'Stripe'],
      time: '4 mins response'
    },
    {
      title: 'How do you identify, profile, and remediate memory leaks caused by lingering event listeners or closures in React 18 Concurrent Mode?',
      category: 'React Internals',
      difficulty: 'Hard' as const,
      desc: 'Explain Chrome DevTools memory allocation snapshots, retained object trees, cleanup contracts in useEffect, and RxJS/WebSocket subscriptions.',
      companies: ['Netflix', 'Uber', 'Airbnb'],
      time: '4–5 mins response'
    },
    {
      title: 'Design a micro-frontend shell integrating disparate legacy applications with zero style collisions and cross-app event communication.',
      category: 'System Design',
      difficulty: 'Hard' as const,
      desc: 'Discuss Module Federation vs Web Components, single-spa orchestrator, shared dependency isolation, and auth token propagation.',
      companies: ['Amazon', 'Spotify', 'Salesforce'],
      time: '5–6 mins response'
    }
  ];

  const backendProgression = [
    {
      title: 'What are the key trade-offs between relational database transactions (ACID) and eventual consistency in NoSQL stores?',
      category: 'Database Internals',
      difficulty: 'Easy' as const,
      desc: 'Define isolation levels, dirty reads, non-repeatable reads, phantom reads, and compare with BASE consistency models.',
      companies: ['AWS', 'Microsoft', 'Oracle'],
      time: '3 mins response'
    },
    {
      title: 'Explain how connection pooling works and how misconfigured pool exhaustion causes cascade failures across microservices.',
      category: 'Technical Architecture',
      difficulty: 'Easy' as const,
      desc: 'Cover max connection bounds, timeout queues, TCP handshake overhead, and circuit breaker protection.',
      companies: ['Stripe', 'DoorDash', 'Uber'],
      time: '3 mins response'
    },
    {
      title: 'Compare B-Tree and LSM-tree (Log-Structured Merge) architectures under heavy write-amplification versus point-lookup constraints.',
      category: 'Database Internals',
      difficulty: 'Medium' as const,
      desc: 'Explain why write-heavy stores (Cassandra, RocksDB) favor SSTables while standard OLTP engines (Postgres, MySQL) rely on B+Trees.',
      companies: ['Datadog', 'Snowflake', 'AWS'],
      time: '4 mins response'
    },
    {
      title: 'How would you architect rate-limiting across 10 distributed edge API gateways with sub-millisecond overhead?',
      category: 'System Design',
      difficulty: 'Medium' as const,
      desc: 'Discuss Token Bucket vs Leaky Bucket algorithms, Redis sliding window counters, and local in-memory token batch leases.',
      companies: ['Cloudflare', 'GitHub', 'Twilio'],
      time: '4 mins response'
    },
    {
      title: 'Design an exactly-once message processing scheme for incoming payment webhooks under network partition and timeout retries.',
      category: 'System Architecture',
      difficulty: 'Hard' as const,
      desc: 'Address distributed locking (Redis Redlock vs Postgres advisory locks), state machine transitions, exponential backoff, and DLQs.',
      companies: ['Stripe', 'Adyen', 'Coinbase'],
      time: '5 mins response'
    },
    {
      title: 'Design a real-time behavioral analytics ingestion pipeline capable of sustaining 100,000 events/second with sub-minute dashboard freshness.',
      category: 'System Design',
      difficulty: 'Hard' as const,
      desc: 'Detail message broker choice (Kafka vs Kinesis), stream processing (Flink vs Spark), ClickHouse storage, and partition keys.',
      companies: ['Segment', 'Amplitude', 'ByteDance'],
      time: '5–6 mins response'
    }
  ];

  const blockchainProgression = [
    {
      title: 'Explain the difference between storage, memory, and calldata in the Ethereum Virtual Machine (EVM) and their gas implications.',
      category: 'EVM Architecture',
      difficulty: 'Easy' as const,
      desc: 'Focus on persistence, 32-byte slot allocation costs (SSTORE vs MSTORE), non-modifiable calldata slices, and gas golf optimizations.',
      companies: ['Coinbase', 'Uniswap Labs', 'Paradigm'],
      time: '3 mins response'
    },
    {
      title: 'How does an ERC-20 transferFrom differ from a transfer, and why is approve followed by transferFrom vulnerable to front-running race conditions?',
      category: 'Smart Contract Standards',
      difficulty: 'Easy' as const,
      desc: 'Explain allowance mechanics, sandwich/front-running vectors on allowance changes, and how ERC-20 increaseAllowance or Permit (EIP-2612) fixes it.',
      companies: ['OpenZeppelin', 'Aave', 'Consensys'],
      time: '3 mins response'
    },
    {
      title: 'Explain the Mechanics of a Reentrancy attack in Solidity and contrast the Checks-Effects-Interactions pattern with ReentrancyGuard.',
      category: 'Smart Contract Security',
      difficulty: 'Medium' as const,
      desc: 'Discuss fallback/receive execution hijacking, state variable mutation timing, gas stipends in call vs transfer, and transient storage (EIP-1153) mutexes.',
      companies: ['Chainalysis', 'Trail of Bits', 'Polygon'],
      time: '4 mins response'
    },
    {
      title: 'Compare the Transparent Upgradeable Proxy pattern versus UUPS (Universal Upgradeable Proxy Standard) in terms of gas efficiency and selector clashes.',
      category: 'Smart Contract Architecture',
      difficulty: 'Medium' as const,
      desc: 'Explain DELEGATECALL storage context, proxy admin function selector clash prevention, fallback routing, and upgrade logic location.',
      companies: ['Arbitrum', 'Optimism', 'Starkware'],
      time: '4 mins response'
    },
    {
      title: 'How do you design a flash loan-resistant decentralized oracle system, and why is relying on a single spot AMM pool reserve vulnerable to oracle manipulation?',
      category: 'DeFi Architecture',
      difficulty: 'Hard' as const,
      desc: 'Detail flash swap atomic capital borrowing, Time-Weighted Average Price (TWAP) calculation, Chainlink decentralized feeds, and multi-block liquidity sampling.',
      companies: ['Chainlink', 'MakerDAO', 'Curve Finance'],
      time: '5 mins response'
    },
    {
      title: 'Walk through EVM storage layout packing and how you would audit an upgradeable protocol for storage collision across proxy implementations.',
      category: 'EVM Internals',
      difficulty: 'Hard' as const,
      desc: 'Explain 32-byte slot assignment for primitive types, mappings, dynamic arrays, ERC-7201 namespaced storage, and catastrophic collision vectors.',
      companies: ['Paradigm', 'Coinbase', 'Binance'],
      time: '5–6 mins response'
    }
  ];

  const aiMlProgression = [
    {
      title: 'Explain the fundamental architectural trade-offs between dense semantic retrieval (bi-encoders) and sparse lexical retrieval (BM25) in production RAG systems.',
      category: 'RAG & Retrieval Architecture',
      difficulty: 'Easy' as const,
      desc: 'Address vocabulary mismatch, out-of-domain generalization, vector similarity latency, hybrid re-ranking (Cross-Encoders), and reciprocal rank fusion.',
      companies: ['OpenAI', 'Anthropic', 'Google'],
      time: '3 mins response'
    },
    {
      title: 'How do you detect, monitor, and mitigate training-serving feature store skew and covariate shift in production ML pipelines?',
      category: 'MLOps & Systems',
      difficulty: 'Easy' as const,
      desc: 'Focus on statistical divergence (Population Stability Index, KS-test), online vs offline feature logging, leakage, and automated retraining triggers.',
      companies: ['Meta', 'Uber', 'Databricks'],
      time: '3 mins response'
    },
    {
      title: 'Deconstruct the multi-head self-attention mechanism in modern Transformer architectures and explain the memory-bound IO-awareness of FlashAttention.',
      category: 'Deep Learning & Architecture',
      difficulty: 'Medium' as const,
      desc: 'Cover QKV projection complexity, quadratic attention matrix memory bounds O(N^2), GPU SRAM tiling, and fused kernel memory transfers.',
      companies: ['NVIDIA', 'Scale AI', 'Cohere'],
      time: '4 mins response'
    },
    {
      title: 'Compare LoRA (Low-Rank Adaptation) and QLoRA for LLM parameter-efficient fine-tuning, explaining rank decomposition and NF4 quantization.',
      category: 'Model Optimization & Fine-tuning',
      difficulty: 'Medium' as const,
      desc: 'Detail frozen weights + adapter matrices delta W = B*A, scaling factor alpha/r, double quantization, and paged optimizers under VRAM constraints.',
      companies: ['Mistral AI', 'Hugging Face', 'Microsoft'],
      time: '4 mins response'
    },
    {
      title: 'Design a high-throughput, low-latency LLM inference engine supporting continuous dynamic batching, PagedAttention, and speculative decoding.',
      category: 'AI Systems & Serving',
      difficulty: 'Hard' as const,
      desc: 'Walk through KV cache memory fragmentation, block paging (vLLM style), small draft model verification, tensor parallelism, and TTFT vs ITL metrics.',
      companies: ['OpenAI', 'Together AI', 'Anyscale'],
      time: '5 mins response'
    },
    {
      title: 'How do you structure an RLHF and DPO (Direct Preference Optimization) pipeline to align LLMs against hallucination without mode collapse?',
      category: 'Model Alignment & Safety',
      difficulty: 'Hard' as const,
      desc: 'Explain Bradley-Terry preference modeling, implicit reward extraction in DPO, reference policy KL divergence regularization, and length bias mitigation.',
      companies: ['Anthropic', 'Google DeepMind', 'Meta AI'],
      time: '5–6 mins response'
    }
  ];

  const lowerRole = role.toLowerCase();
  const isAiMl = lowerRole.includes('ai') || lowerRole.includes('ml') || lowerRole.includes('machine learning') || lowerRole.includes('data science') || lowerRole.includes('deep learning');
  const isBlockchain = lowerRole.includes('blockchain') || lowerRole.includes('solidity') || lowerRole.includes('web3') || lowerRole.includes('smart contract');
  const pool = isAiMl ? aiMlProgression : isBlockchain ? blockchainProgression : isBackend ? backendProgression : frontendProgression;
  const selected = pool.slice(0, Math.min(count, pool.length));

  return selected.map((item, i) => {
    const questionId = crypto.randomUUID();
    return {
      id: questionId,
      questionId,
      title: item.title,
      normalizedQuestionText: normalizeQuestionText(item.title),
      contentFingerprint: computeContentFingerprint(item.title),
      category: item.category || category,
      difficulty: item.difficulty,
      roleTarget: role,
      estimatedTime: item.time,
      description: item.desc,
      companies: item.companies,
      status: (i === 0 ? 'passed' : i === 1 ? 'review' : 'unattempted') as 'passed' | 'review' | 'unattempted',
      statusLabel: i === 0 ? 'Practiced 2x • High Score: 86%' : i === 1 ? 'Needs Review • Last Score: 62%' : 'Not attempted yet',
      isBookmarked: i === 0 || i === 2,
      source: 'curated' as const,
      createdAt: new Date().toISOString(),
    };
  });
}

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: [
            '**/data/**',
            '**/data/*',
            '**/*.json',
            '**/*.log',
            '**/server/**',
            '**/server.ts',
            '**/.system_generated/**',
            '**/brain/**',
            '**/.user_uploaded/**',
            '**/.tempmediaStorage/**',
            '**/dist/**',
            '**/node_modules/**',
          ],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`InterviewIQ server running at http://0.0.0.0:${port}`);
  });
}

startServer();
