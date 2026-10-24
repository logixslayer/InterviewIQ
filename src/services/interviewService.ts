import { AnswerEvaluationResult, SessionEvaluationReport, QuestionItem } from '../types';

export interface EvaluateAnswerParams {
  questionTitle: string;
  candidateAnswer: string;
  codeSnippet?: string;
  role?: string;
  difficulty?: string;
}

export interface GenerateReportParams {
  role?: string;
  duration?: string;
  answers: Array<{
    question: string;
    answer: string;
    score?: number;
  }>;
}

export interface GenerateQuestionsParams {
  role?: string;
  category?: string;
  difficulty?: string;
  count?: number;
  resumeContext?: string;
}

/**
 * Sends candidate's verbal/written answer to AI interviewer
 * Returns real-time score, strengths, gaps, rubric ratings, and follow-up drill-down question.
 */
export async function evaluateLiveAnswer(
  params: EvaluateAnswerParams
): Promise<{ success: boolean; evaluation: AnswerEvaluationResult; source?: string }> {
  const response = await fetch('/api/interview/evaluate-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Evaluation failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Generates comprehensive final debrief report after interview session concludes.
 */
export async function generateSessionReport(
  params: GenerateReportParams
): Promise<{ success: boolean; report: SessionEvaluationReport; source?: string }> {
  const response = await fetch('/api/interview/generate-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Report generation failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Dynamically synthesizes tailored interview questions for candidate's target track.
 */
export async function generateInterviewQuestions(
  params: GenerateQuestionsParams
): Promise<{ success: boolean; questions: QuestionItem[]; source?: string }> {
  const response = await fetch('/api/generate-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Question generation failed with status ${response.status}`);
  }

  return response.json();
}

export interface StreamEvaluationCallbacks {
  onStatus?: (message: string) => void;
  onToken?: (token: string) => void;
  onDone?: (evaluation: AnswerEvaluationResult, source?: string) => void;
  onError?: (error: string) => void;
}

/**
 * Streams real-time token-by-token evaluation via Server-Sent Events (SSE).
 */
export async function streamEvaluateLiveAnswer(
  params: EvaluateAnswerParams,
  callbacks: StreamEvaluationCallbacks
): Promise<void> {
  const response = await fetch('/api/interview/stream-evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Streaming failed with status ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Response body stream is not available');

  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() || '';

    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      const eventMatch = chunk.match(/^event:\s*(\w+)/m);
      const dataMatch = chunk.match(/^data:\s*(.+)$/m);
      const event = eventMatch ? eventMatch[1] : 'message';
      const rawData = dataMatch ? dataMatch[1] : '';

      try {
        const parsed = JSON.parse(rawData);
        if (event === 'status') {
          callbacks.onStatus?.(parsed.message);
        } else if (event === 'token') {
          callbacks.onToken?.(parsed.token);
        } else if (event === 'done') {
          callbacks.onDone?.(parsed.evaluation, parsed.source);
        } else if (event === 'error') {
          callbacks.onError?.(parsed.error);
        }
      } catch (_e) {
        // Ignore chunk parse error
      }
    }
  }
}

export interface InterviewerTurnParams {
  role?: string;
  questionTitle?: string;
  candidateMessage: string;
  context?: string;
  mode?: 'clarification' | 'challenge' | 'interjection';
}

export interface InterviewerTurnResponse {
  success: boolean;
  turn: {
    spokenResponse: string;
    followUpPrompt: string;
    category: string;
  };
  source?: string;
}

/**
 * Sends a real-time conversational question or clarification to the AI interviewer.
 */
export async function requestInterviewerTurn(
  params: InterviewerTurnParams
): Promise<InterviewerTurnResponse> {
  const response = await fetch('/api/interview/interviewer-turn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Interviewer turn failed with status ${response.status}`);
  }

  return response.json();
}

// ==========================================
// GOOGLE CLOUD TTS & VOICE SERVICE API
// ==========================================

export async function fetchAvailableTtsVoices(lang = 'en'): Promise<{
  success: boolean;
  provider: 'google' | 'browser';
  isLive: boolean;
  voices: any[];
}> {
  const res = await fetch(`/api/tts/voices?lang=${lang}`);
  if (!res.ok) throw new Error('Failed to retrieve TTS voices');
  return res.json();
}

export async function previewTtsVoice(params: {
  voiceName: string;
  locale?: string;
  gender?: string;
  speakingRate?: number;
  pitch?: number;
}): Promise<{
  success: boolean;
  sampleText: string;
  audioContent?: string;
  format?: string;
  fallback?: boolean;
  voiceUsed: string;
  provider: 'google' | 'browser';
}> {
  const res = await fetch('/api/tts/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Voice preview synthesis failed');
  return res.json();
}

export async function synthesizeTtsAudio(params: {
  text: string;
  voiceName?: string;
  locale?: string;
  gender?: string;
  speakingRate?: number;
  pitch?: number;
}): Promise<{
  success: boolean;
  audioContent?: string;
  format?: string;
  fallback?: boolean;
  voiceUsed: string;
  provider: 'google' | 'browser';
}> {
  const res = await fetch('/api/tts/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('TTS synthesis failed');
  return res.json();
}

export async function fetchUserVoiceSettings(userId = 'default_user'): Promise<any> {
  const res = await fetch(`/api/user/voice-settings?userId=${userId}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.settings;
}

export async function saveUserVoiceSettings(settings: any, userId = 'default_user'): Promise<void> {
  await fetch('/api/user/voice-settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, settings }),
  });
}

// ==========================================
// PERSISTENT SESSION & DEDUPLICATION API
// ==========================================

export async function startPersistentSession(params: {
  userId?: string;
  role: string;
  level: string;
  type: string;
  difficulty: string;
  duration: string;
  voiceSettings?: any;
}): Promise<{ success: boolean; sessionId: string; session: any }> {
  try {
    const res = await fetch('/api/interview/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Session start returned status ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn('Network session start fallback:', err);
    const localSessionId = `session_${Date.now()}`;
    return {
      success: true,
      sessionId: localSessionId,
      session: {
        sessionId: localSessionId,
        userId: params.userId || 'candidate_main',
        role: params.role || 'Frontend Developer',
        level: params.level || 'Entry Level',
        type: params.type || 'Technical',
        difficulty: params.difficulty || 'Medium',
        duration: params.duration || '20 min (5 questions)',
        voiceSettings: params.voiceSettings || { provider: 'browser', voiceName: 'en-US-Journey-F', locale: 'en-US' },
        state: 'preparing',
        turns: [],
        currentQuestionIndex: 0,
        totalQuestions: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }
}

export async function fetchNextSessionTurn(params: {
  sessionId?: string;
  userId?: string;
  role: string;
  difficulty: string;
  type: string;
  targetCategory?: string;
}): Promise<{
  success: boolean;
  question: QuestionItem;
  audio?: any;
  state: string;
  questionNumber: number;
  totalQuestions: number;
}> {
  try {
    const res = await fetch('/api/interview/session/next-turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Next turn returned status ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn('Network next-turn fallback:', err);
    const fallbackId = `q_curated_${Date.now()}`;
    return {
      success: true,
      question: {
        id: fallbackId,
        title: `Explain how you would architect and scale a mission-critical ${params.role || 'Frontend Developer'} system with high availability and low latency.`,
        description: `Highlight core data flow, asynchronous decoupled messaging, trade-offs, and failure recovery protocols expected in ${params.difficulty || 'Medium'} interviews.`,
        category: params.targetCategory || 'System Architecture',
        difficulty: (params.difficulty || 'Medium') as any,
        roleTarget: params.role || 'Frontend Developer',
        estimatedTime: '3-4 mins',
        companies: ['Google', 'Meta', 'Netflix'],
        status: 'unattempted',
        statusLabel: `AI Calibrated • ${params.difficulty || 'Medium'}`,
        isBookmarked: false,
        source: 'curated',
        createdAt: new Date().toISOString(),
      },
      state: 'listening',
      questionNumber: 1,
      totalQuestions: 5,
    };
  }
}

export async function submitSessionAnswer(params: {
  sessionId?: string;
  questionId?: string;
  questionTitle: string;
  candidateAnswer: string;
  codeSnippet?: string;
  durationSeconds?: number;
  metrics?: any;
  role: string;
  type: string;
  difficulty: string;
}): Promise<{
  success: boolean;
  evaluation: AnswerEvaluationResult;
  hasFollowUp: boolean;
  followUpQuestion?: QuestionItem | null;
  followUpAudio?: any;
  nextState: string;
}> {
  const res = await fetch('/api/interview/session/submit-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to submit answer');
  return res.json();
}

export async function completePersistentSession(params: {
  sessionId: string;
  report?: SessionEvaluationReport;
}): Promise<any> {
  const res = await fetch('/api/interview/session/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to complete session');
  return res.json();
}

export async function fetchSessionDetails(sessionId: string): Promise<any> {
  const res = await fetch(`/api/interview/session/${sessionId}`);
  if (!res.ok) throw new Error('Session not found');
  return res.json();
}

export async function fetchUserQuestionHistory(userId = 'default_user'): Promise<{
  success: boolean;
  totalDelivered: number;
  questions: any[];
}> {
  const res = await fetch(`/api/interview/questions/history?userId=${userId}`);
  if (!res.ok) throw new Error('Failed to fetch question history');
  return res.json();
}


