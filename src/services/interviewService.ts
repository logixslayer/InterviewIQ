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
