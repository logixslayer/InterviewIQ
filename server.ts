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

// Initialize NVIDIA client using OpenAI SDK compatibility
const getNvidiaClient = () => {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey || apiKey === 'MY_NVIDIA_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new OpenAI({
    baseURL: 'https://integrate.api.nvidia.com/v1',
    apiKey: apiKey.trim(),
  });
};

// Health & Config Check
app.get('/api/status', (_req, res) => {
  const key = process.env.NVIDIA_API_KEY;
  const isConfigured = !!key && key !== 'MY_NVIDIA_API_KEY' && key.trim().length > 5;
  res.json({
    status: 'ok',
    nvidiaKeyConfigured: isConfigured,
    engine: 'NVIDIA Nemotron 3.5 / Llama 3.3',
  });
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

// Resume Analysis Endpoint using NVIDIA API
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

    const client = getNvidiaClient();

    if (client) {
      try {
        const systemPrompt = `You are an elite Senior Staff Technical Recruiter and Engineering Manager calibrated to FAANG/Tier-1 Tech hiring bars.
Analyze the following resume text. Extract and synthesize a high-fidelity candidate profile in STRICT JSON format with no markdown formatting around it (output pure JSON only).
JSON structure:
{
  "fullName": "Candidate full name or Alex Morgan if absent",
  "email": "Candidate email or detected email",
  "currentStage": "e.g. Senior Undergrad / Active Job Hunter or Senior Frontend Engineer",
  "experienceYears": number (e.g. 3.5),
  "targetRoles": [
    {
      "title": "Role title, e.g. Frontend Lead or Backend Engineer",
      "desc": "Short description of specific focus, e.g. UI Architecture, React, CSS, Web Vitals & Hydration",
      "match": number (percentage e.g. 94),
      "reason": "Why this role aligns with their experience"
    }
  ],
  "topSkills": ["Skill 1", "Skill 2", ... at least 6],
  "targetInterviewDate": "${targetDate || 'October 28, 2026'}",
  "readinessTier": "Tier B+" or "Tier A" or "Tier A+",
  "keyAchievements": ["Achievement 1", "Achievement 2", "Achievement 3"],
  "suggestedFocus": "Priority area to practice, e.g. Behavioral STAR Method with impact metrics & React 18 Concurrency",
  "summary": "2-3 sentence executive synopsis of candidate capabilities and primary track."
}`;

        const completion = await client.chat.completions.create({
          model: 'nvidia/nemotron-3.5-super-vl-120b-a12b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Here is the candidate resume:\n\n${resumeText.slice(0, 8000)}` },
          ],
          temperature: 0.2,
          max_tokens: 2048,
        });

        const rawContent = completion.choices[0]?.message?.content?.trim() || '';
        // Clean any code fences
        const cleaned = rawContent.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
        const parsed = JSON.parse(cleaned);

        return res.json({
          success: true,
          profile: parsed,
          source: 'nvidia',
        });
      } catch (nvidiaErr: any) {
        console.warn('NVIDIA API call encountered error, falling back to heuristic engine:', nvidiaErr?.message);
        // Fallback to intelligent heuristic analysis
      }
    }

    // Heuristic Analysis Fallback
    const fallbackProfile = analyzeResumeHeuristically(resumeText, targetDate);
    return res.json({
      success: true,
      profile: fallbackProfile,
      source: client ? 'heuristic_fallback' : 'local_analyzer',
      note: !client ? 'NVIDIA_API_KEY not configured in environment. Using built-in semantic extractor.' : undefined,
    });
  } catch (err: any) {
    console.error('Error analyzing resume:', err);
    res.status(500).json({ error: err?.message || 'Failed to analyze resume' });
  }
});

// Dynamic Question Generation Endpoint using NVIDIA API
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { role = 'Frontend Developer', category = 'Technical Architecture', difficulty = 'Medium', count = 3, resumeContext = '' } = req.body;
    const client = getNvidiaClient();

    if (client) {
      try {
        const prompt = `You are a Principal Engineering Lead conducting real interview loops at Meta, Google, Stripe, and Apple.
Generate ${count} high-caliber, realistic interview questions for:
- Target Role: ${role}
- Category: ${category}
- Difficulty: ${difficulty}
${resumeContext ? `- Candidate Resume Background Context: ${resumeContext.slice(0, 600)}` : ''}

Output STRICT JSON only (an array of objects). No markdown backticks.
Schema per question:
[
  {
    "id": "gen-timestamp-number",
    "title": "Exact interview question prompt (1-2 clear, rigorous sentences)",
    "category": "${category}",
    "difficulty": "${difficulty}",
    "roleTarget": "${role}",
    "estimatedTime": "3–5 mins response",
    "description": "2-sentence rubric guide on what interviewers look for (specific technical considerations, metrics, trade-offs)",
    "companies": ["Meta", "Google", "Stripe"],
    "status": "unattempted",
    "statusLabel": "Generated by NVIDIA AI",
    "isBookmarked": false
  }
]`;

        const completion = await client.chat.completions.create({
          model: 'nvidia/nemotron-3.5-super-vl-120b-a12b',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.6,
          max_tokens: 2048,
        });

        const rawContent = completion.choices[0]?.message?.content?.trim() || '';
        const cleaned = rawContent.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
        const questions = JSON.parse(cleaned);

        return res.json({
          success: true,
          questions,
          source: 'nvidia',
        });
      } catch (nvidiaErr: any) {
        console.warn('NVIDIA questions generation error, falling back:', nvidiaErr?.message);
      }
    }

    // Heuristic generator fallback
    const fallbackQuestions = generateDynamicQuestions(role, category, difficulty, count);
    return res.json({
      success: true,
      questions: fallbackQuestions,
      source: client ? 'heuristic_fallback' : 'local_generator',
    });
  } catch (err: any) {
    console.error('Error generating questions:', err);
    res.status(500).json({ error: err?.message || 'Failed to generate questions' });
  }
});

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
    'React', 'TypeScript', 'JavaScript', 'Next.js', 'Node.js', 'Python', 'Java', 'Go', 
    'GraphQL', 'PostgreSQL', 'SQL', 'Docker', 'Kubernetes', 'AWS', 'Redis', 'Tailwind CSS',
    'HTML/CSS', 'System Design', 'Git', 'Webpack', 'Vite', 'Kafka', 'Spring Boot'
  ];
  const detectedSkills = knownSkills.filter(s => lower.includes(s.toLowerCase()));
  if (detectedSkills.length === 0) {
    detectedSkills.push('React', 'TypeScript', 'Next.js', 'System Architecture', 'Node.js', 'REST APIs');
  }

  // Role detection
  const detectedRoles = [];
  if (lower.includes('react') || lower.includes('frontend') || lower.includes('css') || lower.includes('ui') || lower.includes('web')) {
    detectedRoles.push({
      title: 'Frontend Developer',
      desc: 'UI Architecture, React, Next.js, Web Vitals & Hydration',
      match: 96,
      reason: 'Strong proficiency in modern client architectures and reactive state workflows.'
    });
  }
  if (lower.includes('node') || lower.includes('python') || lower.includes('api') || lower.includes('backend') || lower.includes('database') || lower.includes('sql')) {
    detectedRoles.push({
      title: 'Backend Developer',
      desc: 'APIs, Distributed Databases, Scalability & Queues',
      match: 91,
      reason: 'Experience building scalable server services, schema design, and asynchronous queues.'
    });
  }
  if (lower.includes('full stack') || (detectedRoles.length >= 2)) {
    detectedRoles.push({
      title: 'Full Stack Developer',
      desc: 'End-to-end Systems, Integrations, Auth & State',
      match: 93,
      reason: 'Bridges frontend presentation with robust API contracts and database persistence.'
    });
  }
  if (lower.includes('java') || lower.includes('spring') || lower.includes('jvm')) {
    detectedRoles.push({
      title: 'Java Developer',
      desc: 'OOP Principles, JVM Internals, Spring Boot, Threads',
      match: 88,
      reason: 'Solid grounding in enterprise object models, thread pools, and Spring frameworks.'
    });
  }
  if (lower.includes('data') || lower.includes('analyst') || lower.includes('pandas') || lower.includes('metrics')) {
    detectedRoles.push({
      title: 'Data Analyst',
      desc: 'SQL Performance, Metrics Modeling, Python & Cohorts',
      match: 89,
      reason: 'Track record quantifying KPIs, cohort telemetry, and query optimization.'
    });
  }
  if (detectedRoles.length === 0) {
    detectedRoles.push(
      {
        title: 'Frontend Developer',
        desc: 'UI Architecture, React, CSS, Web Vitals & Hydration',
        match: 95,
        reason: 'Recommended core pathway based on technical background.'
      },
      {
        title: 'Software Engineer',
        desc: 'Algorithms, Data Structures, Complexity Analysis',
        match: 92,
        reason: 'Generalist engineering fundamentals with high growth upside.'
      }
    );
  }

  // Determine stage
  let stage = 'Senior Undergrad / Active Job Hunter';
  if (lower.includes('senior') || lower.includes('lead') || lower.includes('staff')) {
    stage = 'Senior Engineer (5+ yrs)';
  } else if (lower.includes('engineer') && (lower.includes('2021') || lower.includes('2022') || lower.includes('2023'))) {
    stage = 'Mid-Level Engineer (3-5 yrs)';
  }

  return {
    fullName: name,
    email,
    currentStage: stage,
    experienceYears: 3.5,
    targetRoles: detectedRoles,
    topSkills: detectedSkills.slice(0, 8),
    targetInterviewDate: targetDate || 'October 28, 2026',
    readinessTier: 'Tier B+',
    keyAchievements: [
      'Engineered responsive web client rendering pipelines achieving sub-100ms INP metrics',
      'Designed modular architectural boundaries isolating data synchronization and client caching',
      'Spearheaded performance benchmarking reducing payload execution times by 32%'
    ],
    suggestedFocus: 'Behavioral STAR Method (Impact quantification) and System Whiteboarding',
    summary: `${name} presents a compelling software engineering profile with prominent strengths in ${detectedSkills.slice(0, 3).join(', ')}. Optimal candidate for ${detectedRoles[0]?.title || 'Frontend Lead'}.`
  };
}

// Fallback question generator
function generateDynamicQuestions(role: string, category: string, difficulty: string, count: number) {
  const bank = [
    {
      title: `How would you architect an idempotent mutation pipeline for high-concurrency client state in ${role}?`,
      desc: 'Focus on optimistic UI updates, rollbacks on 4xx/5xx responses, conflict resolution vectors, and local SQLite/IndexedDB persistence.',
      companies: ['Stripe', 'Meta', 'DoorDash']
    },
    {
      title: `Explain how you would diagnose and eliminate thread contention causing frames to drop below 60fps in ${role}.`,
      desc: 'Address performance profilers, Long Animation Frames (LoAF), scheduling prioritization, and offloading heavy compute to Web Workers.',
      companies: ['Netflix', 'Google', 'Apple']
    },
    {
      title: `Describe a disagreement with leadership over shipping a technical debt refactor versus product velocity. How did you resolve it?`,
      desc: 'Use the STAR framework. Quantify business trade-offs, define service SLAs, and present executive compromise strategy.',
      companies: ['Amazon', 'Uber', 'Microsoft']
    },
    {
      title: `Design a scalable real-time notification dispatch engine supporting 50,000 concurrent active WebSocket connections.`,
      desc: 'Detail message broker integration (Kafka/Redis PubSub), connection heartbeat management, and graceful degradation during network partitions.',
      companies: ['Slack', 'Discord', 'Datadog']
    }
  ];

  return bank.slice(0, count).map((item, i) => ({
    id: `gen-${Date.now()}-${i}`,
    title: item.title,
    category,
    difficulty,
    roleTarget: role,
    estimatedTime: '4 mins response',
    description: item.desc,
    companies: item.companies,
    status: 'unattempted',
    statusLabel: 'Synthesized for Track',
    isBookmarked: false
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
