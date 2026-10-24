export type ViewMode = 
  | 'welcome'
  | 'login'
  | 'signup'
  | 'overview'
  | 'mock-interviews'
  | 'mock-interview-workspace'
  | 'evaluation-report'
  | 'question-library'
  | 'my-progress'
  | 'practice-plan'
  | 'profile'
  | 'settings';

export type InterviewState = 
  | 'preparing'
  | 'interviewer_speaking'
  | 'listening'
  | 'transcribing'
  | 'evaluating'
  | 'generating_follow_up'
  | 'generating_next_question'
  | 'paused'
  | 'completed'
  | 'error';

export interface VoiceSettings {
  provider: 'google' | 'browser';
  voiceName: string;
  locale: string;
  gender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
  voiceType?: string; // Journey, Neural2, WaveNet, Standard, Studio
  speakingRate?: number;
  pitch?: number;
}

export interface InterviewConfig {
  role: string;
  level: string;
  type: string;
  difficulty: string;
  duration: string;
  jobDescription: string;
  voiceSettings?: VoiceSettings;
}

export interface QuestionItem {
  id: string; // Persistent UUID
  title: string;
  normalizedQuestionText?: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  roleTarget: string;
  estimatedTime: string;
  description: string;
  companies: string[];
  status: 'passed' | 'review' | 'unattempted';
  statusLabel?: string;
  isBookmarked: boolean;
  source?: 'curated' | 'generated' | 'follow-up';
  parentQuestionId?: string;
  contentFingerprint?: string;
  evaluationCriteria?: string[];
  createdAt?: string;
}

export interface SessionTurnRecord {
  turnId: string;
  question: QuestionItem;
  candidateAnswer: string;
  codeSnippet?: string;
  evaluation?: AnswerEvaluationResult;
  durationSeconds: number;
  metrics?: RealTimeSpeechMetrics;
  isFollowUp?: boolean;
  timestamp: string;
}

export interface InterviewSessionData {
  sessionId: string;
  userId: string;
  role: string;
  level: string;
  type: string;
  difficulty: string;
  duration: string;
  voiceSettings: VoiceSettings;
  state: InterviewState;
  turns: SessionTurnRecord[];
  currentQuestionIndex: number;
  totalQuestions: number;
  createdAt: string;
  updatedAt: string;
  report?: SessionEvaluationReport;
}

export interface SessionOutlineItem {
  id: number;
  title: string;
  subtitle: string;
  duration: string;
  status: 'completed' | 'active' | 'upcoming';
}

export interface AnalyzedRole {
  title: string;
  desc: string;
  match: number;
  reason: string;
  icon?: string;
}

export interface UserProfile {
  fullName: string;
  email: string;
  primaryRole?: string;
  experienceLevel?: string;
  currentStage: string;
  experienceYears: number;
  targetRoles: AnalyzedRole[];
  topSkills: string[];
  targetInterviewDate: string;
  readinessTier: string;
  keyAchievements: string[];
  suggestedFocus: string;
  summary: string;
  rawResumeText?: string;
  analyzedAt?: string;
}

export interface RecentInterviewItem {
  id: string;
  role: string;
  roleShort: string;
  roleBadgeColor: string;
  track: string;
  scope: string;
  completed: string;
  score: number;
  status: 'Passed' | 'Strong' | 'Needs Practice' | 'Needs Review' | 'Pass' | 'Solid' | 'Review' | string;
  statusClass: string;
  scoreClass: string;
  duration?: string;
}

export interface AnswerEvaluationResult {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  rubricScores: {
    communicationDelivery: number;
    technicalKnowledge: number;
    problemSolving: number;
    systemArchitecture: number;
  };
  sampleIdealAnswer?: string;
  followUpQuestion: string;
  coachingTip: string;
}

export interface SessionEvaluationReport {
  overallScore: number;
  grade: string;
  hireRecommendation: 'Strong Hire' | 'Hire' | 'Lean Hire' | 'Needs Practice' | 'Needs Work' | string;
  summary: string;
  competencyBreakdown?: {
    communication: { score: number; feedback: string };
    technicalKnowledge: { score: number; feedback: string };
    problemSolving: { score: number; feedback: string };
  };
  keyStrengths: string[];
  growthAreas: string[];
  actionItems: string[];
  role?: string;
  duration?: string;
  completedAt?: string;
}

export interface RealTimeSpeechMetrics {
  wpm: number;
  pacingLabel: string;
  pacingStatus: 'slow' | 'optimal' | 'fast';
  fillerWordsCount: number;
  fillerWordDetails: Record<string, number>;
  silenceDurationSeconds: number;
  rubricCoverage: {
    context: boolean;
    architecture: boolean;
    metrics: boolean;
    tradeoffs: boolean;
  };
}

export interface InterviewerTurnMessage {
  id: string;
  speaker: 'interviewer' | 'candidate';
  text: string;
  timestamp: string;
  type?: 'question' | 'clarification' | 'feedback' | 'followup';
}
