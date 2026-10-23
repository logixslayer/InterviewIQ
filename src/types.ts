export type ViewMode = 
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
  status: 'Passed' | 'Strong' | 'Needs Practice' | 'Needs Review';
  statusClass: string;
  scoreClass: string;
  duration?: string;
}
