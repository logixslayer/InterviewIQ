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

export interface InterviewConfig {
  role: string;
  level: string;
  type: string;
  difficulty: string;
  duration: string;
  jobDescription: string;
}

export interface QuestionItem {
  id: string;
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  roleTarget: string;
  estimatedTime: string;
  description: string;
  companies: string[];
  status: 'passed' | 'review' | 'unattempted';
  statusLabel?: string;
  isBookmarked: boolean;
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

