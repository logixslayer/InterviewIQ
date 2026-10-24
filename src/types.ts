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
  | 'learning-resources'
  | 'profile'
  | 'settings';

export type InterviewState = 
  | 'idle'
  | 'requesting_permission'
  | 'preparing'
  | 'interviewer_speaking'
  | 'speaking'
  | 'listening'
  | 'transcribing'
  | 'processing_answer'
  | 'generating_response'
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

export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

export type QuestionType =
  | 'Conceptual'
  | 'Coding'
  | 'Debugging'
  | 'Output Prediction'
  | 'Scenario-based'
  | 'System Design'
  | 'Database Query'
  | 'Behavioral'
  | 'Trade-off Analysis'
  | 'Practical Trade-off'
  | 'Practical Trade-off Analysis'
  | 'Technical Architecture';

export interface CodeExample {
  language: string;
  code: string;
  explanation?: string;
  input?: string;
  output?: string;
  exampleInput?: string;
  exampleOutput?: string;
}

export interface QuestionItem {
  id: string; // Persistent UUID
  slug?: string;
  title: string;
  questionText?: string;
  normalizedQuestionText?: string;
  contentFingerprint?: string;
  category: string;
  categoryId?: string;
  topicId?: string;
  subtopicId?: string;
  difficulty: QuestionDifficulty;
  questionType?: QuestionType;
  roleTarget: string;
  roleIds?: string[];
  estimatedTime: string;
  estimatedMinutes?: number;
  description: string;
  shortAnswer?: string;
  detailedAnswer?: string;
  explanation?: string;
  codeExample?: CodeExample;
  commonMistakes?: string[];
  realWorldUseCases?: string[];
  tradeOffs?: string[];
  followUpQuestions?: string[];
  relatedQuestionIds?: string[];
  relatedTopicIds?: string[];
  prerequisiteTopicIds?: string[];
  nextTopicIds?: string[];
  tags?: string[];
  keywords?: string[];
  companies?: string[];
  status?: 'passed' | 'review' | 'unattempted';
  statusLabel?: string;
  isBookmarked?: boolean;
  isCustom?: boolean;
  source?: 'curated' | 'generated' | 'follow-up';
  parentQuestionId?: string;
  evaluationCriteria?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleCategory {
  id: string;
  name: string;
  description: string;
  roles: {
    id: string;
    title: string;
    description: string;
    icon?: string;
  }[];
}

export interface TopicSubtopic {
  id: string;
  name: string;
  description?: string;
  estimatedMinutes?: number;
}

export interface TopicCategory {
  id: string;
  name: string;
  icon?: string;
  description: string;
  topics: {
    id: string;
    name: string;
    description: string;
    subtopics?: TopicSubtopic[];
    prerequisites?: string[];
    nextTopics?: string[];
  }[];
}

export interface LearningPathTopic {
  id: string;
  title: string;
  category: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedHours: number;
  prerequisites: string[];
  questionIds: string[];
}

export interface RoleLearningPath {
  roleId: string;
  roleTitle: string;
  description: string;
  stages: {
    stage: number;
    title: string;
    description: string;
    topics: LearningPathTopic[];
  }[];
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
  uid?: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  primaryRole?: string;
  experienceLevel?: string;
  currentStage: string;
  experienceYears: number;
  targetRoles: AnalyzedRole[];
  topSkills: string[];
  targetCompanies?: string[];
  careerGoals?: string;
  preferredInterviewType?: string;
  targetInterviewDate: string;
  readinessTier: string;
  keyAchievements: string[];
  suggestedFocus: string;
  summary: string;
  rawResumeText?: string;
  analyzedAt?: string;
  updatedAt?: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface InterviewDefaults {
  defaultRole: string;
  defaultLevel: string;
  defaultType: string;
  defaultDifficulty: string;
  duration: string;
  questionsPerSession: number;
  feedbackRigor: 'Lenient' | 'Calibrated' | 'Rigorous';
  preferredRole?: string;
  preferredType?: string;
  durationMinutes?: number;
}

export interface NotificationPreferences {
  practiceReminders: boolean;
  weeklyProgressUpdates: boolean;
  productAnnouncements: boolean;
  frequency: 'daily' | 'weekly' | 'never';
}

export interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  soundEffects: boolean;
}

export interface UserSettings {
  theme: ThemeMode;
  interviewDefaults: InterviewDefaults;
  notifications: NotificationPreferences;
  accessibility: AccessibilitySettings;
  updatedAt?: string;
}

export interface RecentInterviewItem {
  id: string;
  role: string;
  roleShort: string;
  roleBadgeColor: string;
  track: string;
  scope: string;
  completed: string;
  completedAt?: string;
  score: number;
  status: 'Passed' | 'Strong' | 'Needs Practice' | 'Needs Review' | 'Pass' | 'Solid' | 'Review' | string;
  statusClass: string;
  scoreClass: string;
  duration?: string;
  durationMinutes?: number;
  report?: SessionEvaluationReport;
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
  speechAnalytics?: {
    totalWords: number;
    averageWpm: number;
    fillerWordsTotal: number;
    fillerWordsPerMinute: number;
    fillerWordBreakdown: Record<string, number>;
    speakingDurationSeconds: number;
    pacingFeedback: string;
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
