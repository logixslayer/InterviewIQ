import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { OpenAI } from 'openai';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

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
        'nvidia/nemotron-3.5-super-vl:free',
        'meta-llama/llama-3.3-70b-instruct:free',
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
  // Strip markdown code fences
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();

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
      return JSON.parse(slice);
    }
    throw new Error('Failed to parse valid JSON from AI model output');
  }
}

// Resilient AI caller with model fallback
async function callAiWithFallback(systemPrompt: string, userPrompt: string, maxTokens = 2500, temperature = 0.2): Promise<string> {
  const config = getAiClientConfig();
  if (!config) throw new Error('API key not configured');

  let lastError: any = null;
  for (const model of config.models) {
    try {
      const completion = await config.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      });

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

app.delete('/api/user/data/:uid', (req, res) => {
  const { uid } = req.params;
  if (!uid || typeof uid !== 'string') return res.status(400).json({ error: 'UID is required' });
  try {
    const pPath = getUserProfilePath(uid);
    const sPath = getUserSettingsPath(uid);
    const iPath = getUserInterviewsPath(uid);
    if (fs.existsSync(pPath)) fs.unlinkSync(pPath);
    if (fs.existsSync(sPath)) fs.unlinkSync(sPath);
    if (fs.existsSync(iPath)) fs.unlinkSync(iPath);
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

    const fallbackEval = evaluateAnswerHeuristically(questionTitle, candidateAnswer, codeSnippet, role);
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

// AI Final Session Report Generation Endpoint: Comprehensive debrief
app.post('/api/interview/generate-report', async (req, res) => {
  try {
    const { role = 'Frontend Developer', duration = '15 mins', answers = [] } = req.body;

    const aiConfig = getAiClientConfig();
    if (aiConfig && answers.length > 0) {
      try {
        const systemPrompt = `You are the Lead Hiring Committee Chair at a Tier-1 tech company.
Generate an executive interview debrief report for a ${role} candidate who completed a ${duration} mock interview session.
Candidate session log:
${JSON.stringify(answers.slice(0, 6))}

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
          return res.json({ success: true, report, source: aiConfig.provider });
        }
      } catch (aiErr: any) {
        console.warn('AI report generation error, falling back:', aiErr?.message);
      }
    }

    const avgScore = answers.length > 0
      ? Math.round(answers.reduce((acc: number, a: any) => acc + (a.score || 82), 0) / answers.length)
      : 84;

    const report = {
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

    return res.json({ success: true, report, source: 'heuristic' });
  } catch (err: any) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: err?.message || 'Failed to generate report' });
  }
});

function evaluateAnswerHeuristically(
  _questionTitle: string,
  answer: string,
  code: string,
  role: string
) {
  const words = answer.trim().split(/\s+/).length;
  const lower = (answer + ' ' + code).toLowerCase();

  const hasTradeoffs = lower.includes('trade-off') || lower.includes('however') || lower.includes('alternatively') || lower.includes('versus') || lower.includes('vs');
  const hasArchitecture = lower.includes('decouple') || lower.includes('layer') || lower.includes('pattern') || lower.includes('pipeline') || lower.includes('state') || lower.includes('cache') || lower.includes('queue');
  const hasPerformance = lower.includes('latency') || lower.includes('optimize') || lower.includes('virtual') || lower.includes('batch') || lower.includes('memory') || lower.includes('throughput');
  const hasStar = lower.includes('first') || lower.includes('second') || lower.includes('result') || lower.includes('metric') || lower.includes('approach');

  let baseScore = 65;
  if (words > 40) baseScore += 10;
  if (words > 80) baseScore += 8;
  if (hasTradeoffs) baseScore += 6;
  if (hasArchitecture) baseScore += 5;
  if (hasPerformance) baseScore += 4;
  if (code.trim().length > 30) baseScore += 5;
  const finalScore = Math.min(96, Math.max(50, baseScore));

  const strengths = [];
  if (hasArchitecture) strengths.push('Clear separation of concerns and architectural boundaries.');
  if (hasPerformance) strengths.push('Demonstrates concrete awareness of latency and memory bottlenecks.');
  if (code.trim().length > 20) strengths.push('Backed up verbal reasoning with structured implementation details.');
  if (strengths.length === 0) strengths.push('Direct response addressing the primary requirements of the question.');

  const gaps = [];
  if (!hasTradeoffs) gaps.push('Discuss alternative trade-offs and edge failure modes more explicitly.');
  if (words < 50) gaps.push('Expand response depth with concrete production metrics and real-world scale examples.');
  if (!lower.includes('monitor') && !lower.includes('telemetry') && !lower.includes('metric')) {
    gaps.push('Mention observability, SLAs, and error logging strategies.');
  }
  if (gaps.length === 0) gaps.push('Could further quantify business and latency impact using concrete benchmarks.');

  return {
    score: finalScore,
    summary: `Strong technical grounding for ${role}. Response demonstrated clear domain intuition with actionable implementation steps.`,
    strengths,
    gaps,
    rubricScores: {
      technicalAccuracy: Math.min(95, finalScore + 2),
      architectureDepth: hasArchitecture ? 88 : 72,
      communicationDelivery: hasStar ? 86 : 74,
      performanceOptimization: hasPerformance ? 85 : 68,
    },
    followUpQuestion: `How would your proposed solution scale if traffic or payload volume increased by a factor of 50x under network partition?`,
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

  return selected.map((item, i) => ({
    id: `gen-${Date.now()}-${i}`,
    title: item.title,
    category: item.category || category,
    difficulty: item.difficulty,
    roleTarget: role,
    estimatedTime: item.time,
    description: item.desc,
    companies: item.companies,
    status: (i === 0 ? 'passed' : i === 1 ? 'review' : 'unattempted') as 'passed' | 'review' | 'unattempted',
    statusLabel: i === 0 ? 'Practiced 2x • High Score: 86%' : i === 1 ? 'Needs Review • Last Score: 62%' : 'Not attempted yet',
    isBookmarked: i === 0 || i === 2
  }));
}

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
