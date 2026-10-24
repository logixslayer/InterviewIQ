import { UserProfile } from '../types';
import {
  LearningResource,
  SkillGapItem,
  UserLearningProgress,
  RankedRecommendation,
  LearningFilterOptions
} from '../types/learning';
import { LEARNING_RESOURCES_CATALOG, STRUCTURED_LEARNING_PATHS } from '../data/learningResourcesCatalog';

export interface RecommendationEngineOutput {
  allRanked: RankedRecommendation[];
  recommendedForYou: RankedRecommendation[];
  skillsToImproveResources: RankedRecommendation[];
  continueLearning: RankedRecommendation[];
  savedResources: RankedRecommendation[];
  totalMatchesCount: number;
}

/**
 * Normalizes string for comparative matching
 */
function normalize(str: string): string {
  return (str || '').toLowerCase().trim();
}

/**
 * Calculates a transparent ranking score based on evidence, role relevance, difficulty fit, and completion state.
 */
export function rankLearningResources(
  selectedRoleTitle: string,
  skillGaps: SkillGapItem[],
  userProfile?: UserProfile | null,
  userProgress?: UserLearningProgress | null,
  catalog: LearningResource[] = LEARNING_RESOURCES_CATALOG,
  filters?: Partial<LearningFilterOptions>
): RecommendationEngineOutput {
  const normSelectedRole = normalize(selectedRoleTitle);
  const completedIds = new Set(userProgress?.completedResourceIds || []);
  const bookmarkedIds = new Set(userProgress?.bookmarkedResourceIds || []);
  const inProgressMap = new Map((userProgress?.inProgressResourceIds || []).map(item => [item.resourceId, item]));
  const dismissedIds = new Set(userProgress?.dismissedResourceIds || []);

  // Map of gap items by normalized topic name for quick lookup
  const gapByTopic = new Map<string, SkillGapItem>();
  for (const gap of skillGaps) {
    gapByTopic.set(normalize(gap.topic), gap);
  }

  // 1. Filter candidates
  const filtered = catalog.filter(resource => {
    // If user explicitly dismissed recommendation
    if (dismissedIds.has(resource.id) && filters?.statusFilter !== 'saved') {
      return false;
    }

    // Role filter: if not 'All Roles', check if resource associates with this role
    if (normSelectedRole !== 'all roles' && normSelectedRole !== '') {
      const matchesRole = resource.roles.some(r => {
        const normR = normalize(r);
        return normR.includes(normSelectedRole) || normSelectedRole.includes(normR);
      });
      if (!matchesRole) return false;
    }

    // Search query filter
    if (filters?.searchQuery && filters.searchQuery.trim()) {
      const q = normalize(filters.searchQuery);
      const matchesSearch =
        normalize(resource.title).includes(q) ||
        normalize(resource.description).includes(q) ||
        normalize(resource.provider).includes(q) ||
        normalize(resource.topic).includes(q) ||
        resource.tags.some(t => normalize(t).includes(q)) ||
        resource.learningOutcomes.some(o => normalize(o).includes(q));
      if (!matchesSearch) return false;
    }

    // Topic filter
    if (filters?.selectedTopic && filters.selectedTopic !== 'All Topics') {
      const targetTopic = normalize(filters.selectedTopic);
      const matchesTopic = normalize(resource.topic) === targetTopic ||
        resource.subtopics.some(st => normalize(st) === targetTopic);
      if (!matchesTopic) return false;
    }

    // Resource type filter
    if (filters?.selectedType && filters.selectedType !== 'All Types') {
      const normType = normalize(filters.selectedType);
      if (normalize(resource.type) !== normType) return false;
    }

    // Difficulty filter
    if (filters?.selectedDifficulty && filters.selectedDifficulty !== 'All Levels') {
      if (resource.difficulty !== filters.selectedDifficulty) return false;
    }

    // Pricing filter
    if (filters?.selectedPricing && filters.selectedPricing !== 'All Pricing') {
      const normPrice = normalize(filters.selectedPricing);
      if (normalize(resource.pricing) !== normPrice) return false;
    }

    // Status filter
    if (filters?.statusFilter === 'saved' && !bookmarkedIds.has(resource.id)) return false;
    if (filters?.statusFilter === 'in_progress' && !inProgressMap.has(resource.id)) return false;
    if (filters?.statusFilter === 'completed' && !completedIds.has(resource.id)) return false;

    return true;
  });

  // 2. Score and generate transparent explanations for each resource
  const rankedItems: RankedRecommendation[] = filtered.map(resource => {
    let score = 50; // Baseline score
    const matchedGap = gapByTopic.get(normalize(resource.topic));

    let badgeLabel = 'Recommended';
    let badgeType: 'urgent' | 'warning' | 'info' | 'success' = 'info';
    let headline = `${resource.topic}`;
    let detail = resource.whyRecommended;
    let nextStep = resource.nextStep;

    // Check completion state
    const isCompleted = completedIds.has(resource.id);
    const isInProgress = inProgressMap.has(resource.id);
    const isSaved = bookmarkedIds.has(resource.id);

    // Apply Evidence-Based Scoring Multipliers
    if (matchedGap) {
      if (matchedGap.state === 'needs_improvement') {
        // High priority: verified weakness in assessment or practice
        score += 45;
        badgeLabel = 'Needs Improvement';
        badgeType = 'urgent';
        headline = `${matchedGap.topic} — Growth Area`;
        detail = `${matchedGap.evidenceDetails} Studying this resource directly addresses this feedback.`;
      } else if (matchedGap.state === 'developing') {
        // Developing topic
        score += 25;
        badgeLabel = 'Developing';
        badgeType = 'warning';
        headline = `${matchedGap.topic} — Deepen Mastery`;
        detail = matchedGap.evidenceDetails;
      } else if (matchedGap.state === 'recommended_role') {
        // Role essential curriculum
        score += 20;
        badgeLabel = 'Role Standard';
        badgeType = 'info';
        headline = `${matchedGap.topic} — Essential Curriculum`;
        detail = `Essential foundational topic for ${selectedRoleTitle}. Complete this to prepare for upcoming loops.`;
      } else if (matchedGap.state === 'on_track') {
        // Already on track: lower priority for new material, but great for revision
        score -= 10;
        badgeLabel = 'On Track';
        badgeType = 'success';
        headline = `${matchedGap.topic} — Refresh & Advance`;
        detail = `You've demonstrated solid competence in this area. Use this resource for advanced nuances.`;
      } else if (matchedGap.state === 'not_assessed') {
        score += 10;
        badgeLabel = 'Not Assessed Yet';
        badgeType = 'info';
        headline = `${matchedGap.topic} — Exploratory`;
        detail = `No assessment data recorded yet. Learn this topic then test your readiness with a question drill.`;
      }
    }

    // Official documentation and verified quality boost
    if (resource.isOfficial) score += 8;
    if (resource.verificationStatus === 'verified') score += 5;

    // Difficulty matching with User Profile experience level
    const exp = normalize(userProfile?.experienceLevel || '');
    if (exp.includes('senior') || exp.includes('lead') || exp.includes('l5')) {
      if (resource.difficulty === 'Advanced') score += 10;
      else if (resource.difficulty === 'Intermediate') score += 5;
    } else if (exp.includes('junior') || exp.includes('entry')) {
      if (resource.difficulty === 'Beginner') score += 10;
      else if (resource.difficulty === 'Intermediate') score += 5;
    } else {
      // Intermediate default
      if (resource.difficulty === 'Intermediate') score += 8;
      else if (resource.difficulty === 'Beginner') score += 4;
    }

    // Active in-progress boost (user is actively learning this)
    if (isInProgress) {
      score += 15;
      badgeLabel = 'In Progress';
      badgeType = 'info';
      headline = `Continue: ${resource.title.slice(0, 40)}...`;
      detail = 'Resume from where you left off to complete this learning activity.';
    }

    // Saved bookmark boost
    if (isSaved) {
      score += 10;
    }

    // Completed resource adjustment: deprioritize from new suggestions unless filtering by completed
    if (isCompleted) {
      score -= 35;
      badgeLabel = 'Completed';
      badgeType = 'success';
      headline = `Completed: ${resource.topic}`;
      detail = 'You marked this resource as completed. Available for quick revision.';
      nextStep = 'Take a related practice question to reassess your retention.';
    }

    return {
      resource,
      rankingScore: Math.max(1, Math.min(100, score)),
      matchedGap,
      explanation: {
        headline,
        detail,
        badgeLabel,
        badgeType
      },
      actionableNextStep: nextStep
    };
  });

  // 3. Sorting logic
  const sortBy = filters?.sortBy || 'recommended';
  rankedItems.sort((a, b) => {
    if (sortBy === 'recommended') {
      return b.rankingScore - a.rankingScore;
    } else if (sortBy === 'shortest') {
      const getDurationMinutes = (dur: string): number => {
        const match = dur.match(/(\d+)\s*(min|hour|hr)/i);
        if (!match) return 999;
        const num = parseInt(match[1], 10);
        return match[2].toLowerCase().startsWith('h') ? num * 60 : num;
      };
      return getDurationMinutes(a.resource.estimatedDuration) - getDurationMinutes(b.resource.estimatedDuration);
    } else if (sortBy === 'beginner') {
      const rank = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
      return (rank[a.resource.difficulty] || 2) - (rank[b.resource.difficulty] || 2);
    } else if (sortBy === 'advanced') {
      const rank = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
      return (rank[b.resource.difficulty] || 2) - (rank[a.resource.difficulty] || 2);
    } else if (sortBy === 'recently_verified') {
      return new Date(b.resource.verificationDate).getTime() - new Date(a.resource.verificationDate).getTime();
    }
    return b.rankingScore - a.rankingScore;
  });

  // 4. Extract categorized segments
  const recommendedForYou = rankedItems
    .filter(item => !completedIds.has(item.resource.id))
    .slice(0, 6);

  const skillsToImproveResources = rankedItems
    .filter(item => item.matchedGap?.state === 'needs_improvement' && !completedIds.has(item.resource.id))
    .slice(0, 8);

  const continueLearning = rankedItems
    .filter(item => inProgressMap.has(item.resource.id) && !completedIds.has(item.resource.id));

  const savedResources = rankedItems
    .filter(item => bookmarkedIds.has(item.resource.id));

  return {
    allRanked: rankedItems,
    recommendedForYou,
    skillsToImproveResources,
    continueLearning,
    savedResources,
    totalMatchesCount: rankedItems.length
  };
}

/**
 * Returns learning paths relevant to the selected role
 */
export function getLearningPathsForRole(selectedRoleTitle: string) {
  const normRole = normalize(selectedRoleTitle);
  if (normRole === 'all roles' || normRole === '') {
    return STRUCTURED_LEARNING_PATHS;
  }
  return STRUCTURED_LEARNING_PATHS.filter(p => {
    const normPRole = normalize(p.role);
    return normPRole.includes(normRole) || normRole.includes(normPRole) ||
      (normRole.includes('frontend') && normPRole.includes('frontend')) ||
      (normRole.includes('backend') && normPRole.includes('backend')) ||
      (normRole.includes('full stack') && (normPRole.includes('full stack') || normPRole.includes('frontend') || normPRole.includes('backend')));
  });
}
