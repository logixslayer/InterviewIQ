export type ResourceType =
  | 'documentation'
  | 'video'
  | 'course'
  | 'article'
  | 'exercise'
  | 'path'
  | 'project';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type PricingType = 'free' | 'paid' | 'freemium';

export type VerificationStatus = 'verified' | 'search_link' | 'curated';

export type FreshnessStatus = 'fresh' | 'current' | 'evergreen' | 'recheck_needed';

export type SkillEvidenceState =
  | 'needs_improvement'   // Supported by actual assessment or practice evidence
  | 'developing'          // Inconsistent evidence or scores in 70-84% range
  | 'on_track'            // Meets documented threshold (>=85% or consistently passed)
  | 'not_assessed'        // Insufficient evidence to judge
  | 'recommended_role';   // Important foundational/standard topic for selected role

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  provider: string;
  url: string;
  type: ResourceType;
  roles: string[];
  category: string;
  topic: string;
  subtopics: string[];
  difficulty: DifficultyLevel;
  language?: string;
  estimatedDuration: string;
  pricing: PricingType;
  isOfficial: boolean;
  verificationStatus: VerificationStatus;
  verificationDate: string;
  lastUpdated?: string;
  freshnessStatus: FreshnessStatus;
  whyRecommended: string;
  relatedQuestionIds?: string[];
  learningOutcomes: string[];
  prerequisites: string[];
  handsOnExercise: string;
  nextStep: string;
  searchQuery?: string;
  tags: string[];
}

export interface SkillGapItem {
  id: string;
  topic: string;
  category: string;
  role: string;
  state: SkillEvidenceState;
  score?: number;
  evidenceSource: 'assessment_report' | 'question_review' | 'user_profile' | 'role_standard';
  evidenceDetails: string;
  lastEvaluatedDate?: string;
  priorityScore: number; // 1-100 calculated by ranking service
  recommendedResourceIds: string[];
  relatedQuestionIds: string[];
}

export interface LearningPathStep {
  stepNumber: number;
  title: string;
  topic: string;
  description: string;
  resourceIds: string[];
  questionIds: string[];
  handsOnExercise: string;
  estimatedHours: string;
  prerequisites?: string[];
}

export interface LearningPath {
  id: string;
  title: string;
  role: string;
  category: string;
  description: string;
  difficulty: DifficultyLevel;
  estimatedHours: string;
  completionCriteria: string;
  targetOutcome: string;
  steps: LearningPathStep[];
}

export interface UserLearningProgress {
  uid: string;
  bookmarkedResourceIds: string[];
  completedResourceIds: string[];
  inProgressResourceIds: {
    resourceId: string;
    startedAt: string;
    lastAccessedAt: string;
    progressPercent?: number;
  }[];
  dismissedResourceIds: string[];
  completedPathStepIds: Record<string, number[]>; // pathId -> stepNumbers
  updatedAt: string;
}

export interface RecommendationExplanation {
  headline: string;
  detail: string;
  badgeLabel: string;
  badgeType: 'urgent' | 'warning' | 'info' | 'success';
}

export interface RankedRecommendation {
  resource: LearningResource;
  rankingScore: number;
  matchedGap?: SkillGapItem;
  explanation: RecommendationExplanation;
  actionableNextStep: string;
}

export interface LearningFilterOptions {
  searchQuery: string;
  selectedRole: string;
  selectedTopic: string;
  selectedType: string;
  selectedDifficulty: string;
  selectedPricing: string;
  statusFilter: 'all' | 'saved' | 'in_progress' | 'completed' | 'recommended';
  sortBy: 'recommended' | 'shortest' | 'beginner' | 'advanced' | 'recently_verified';
}
