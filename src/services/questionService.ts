/**
 * InterviewIQ Question Service & Recommendation Engine
 *
 * Provides:
 * 1. Multi-signal intelligent question recommendation scoring
 * 2. Prerequisite, follow-up, and role-based learning path discovery
 * 3. Search and compound filtering
 * 4. User-isolated bookmarks, custom questions, and study history persistence
 */

import { QuestionItem, RoleLearningPath } from '../types';
import { ALL_QUESTIONS, QUESTIONS_BY_ID } from '../data/questionBank';
import { ROLE_LEARNING_PATHS } from '../data/taxonomy';

// Storage keys
function getBookmarksKey(uid: string): string {
  return `interviewiq_bookmarks_${uid || 'guest'}`;
}

function getCustomQuestionsKey(uid: string): string {
  return `interviewiq_custom_questions_${uid || 'guest'}`;
}

function getRecentQuestionsKey(uid: string): string {
  return `interviewiq_recent_questions_${uid || 'guest'}`;
}

// -------------------------------------------------------------
// 1. Storage Helpers (Bookmarks, Custom Questions, Recent History)
// -------------------------------------------------------------

export function getUserBookmarks(uid: string): string[] {
  try {
    const raw = localStorage.getItem(getBookmarksKey(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load bookmarks', e);
    return [];
  }
}

export function toggleUserBookmark(uid: string, questionId: string): { isBookmarked: boolean; allBookmarks: string[] } {
  try {
    const current = getUserBookmarks(uid);
    const exists = current.includes(questionId);
    const updated = exists ? current.filter(id => id !== questionId) : [...current, questionId];
    localStorage.setItem(getBookmarksKey(uid), JSON.stringify(updated));
    return { isBookmarked: !exists, allBookmarks: updated };
  } catch (e) {
    console.error('Failed to toggle bookmark', e);
    return { isBookmarked: false, allBookmarks: [] };
  }
}

export function isQuestionBookmarked(uid: string, questionId: string): boolean {
  return getUserBookmarks(uid).includes(questionId);
}

export function getUserCustomQuestions(uid: string): QuestionItem[] {
  try {
    const raw = localStorage.getItem(getCustomQuestionsKey(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load custom questions', e);
    return [];
  }
}

export function saveUserCustomQuestion(
  uid: string,
  questionData: Omit<QuestionItem, 'id' | 'createdAt'>
): QuestionItem {
  const current = getUserCustomQuestions(uid);
  const newQuestion: QuestionItem = {
    ...questionData,
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    createdAt: new Date().toISOString(),
    isCustom: true,
  };

  const updated = [newQuestion, ...current];
  try {
    localStorage.setItem(getCustomQuestionsKey(uid), JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save custom question', e);
  }

  return newQuestion;
}

export function recordRecentQuestionView(uid: string, questionId: string): void {
  try {
    const raw = localStorage.getItem(getRecentQuestionsKey(uid));
    const list: string[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter(id => id !== questionId);
    const updated = [questionId, ...filtered].slice(0, 30); // Keep last 30
    localStorage.setItem(getRecentQuestionsKey(uid), JSON.stringify(updated));
  } catch (e) {
    // Ignore storage quota errors
  }
}

export function getRecentQuestionViews(uid: string): string[] {
  try {
    const raw = localStorage.getItem(getRecentQuestionsKey(uid));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// 2. Intelligent Recommendation Engine
// -------------------------------------------------------------

export interface RecommendationOptions {
  activeRole?: string;
  userInterests?: string[];
  limit?: number;
  excludeIds?: string[];
}

/**
 * Calculates a multi-signal relevance score between a target question and candidate questions.
 * Signals evaluated:
 * - Direct relatedQuestionIds (+100)
 * - Identical subtopicId (+40) / topicId (+60) / categoryId (+30)
 * - Shared tags & keywords (+12 per shared tag/keyword)
 * - Target role relevance (+35)
 * - Prerequisite / follow-up connection (+50)
 * - Difficulty alignment / natural progression (+20)
 * - User interest tags (+20)
 */
export function scoreQuestionRelevance(
  source: QuestionItem,
  candidate: QuestionItem,
  options: RecommendationOptions = {}
): number {
  if (source.id === candidate.id) return -1; // Never recommend self

  let score = 0;

  // 1. Direct explicit question links
  if (source.relatedQuestionIds?.includes(candidate.id)) {
    score += 100;
  }
  if (candidate.relatedQuestionIds?.includes(source.id)) {
    score += 80;
  }

  // 2. Hierarchical topic affinity
  if (source.subtopicId && candidate.subtopicId && source.subtopicId === candidate.subtopicId) {
    score += 50;
  }
  if (source.topicId && candidate.topicId && source.topicId === candidate.topicId) {
    score += 60;
  }
  if (source.categoryId && candidate.categoryId && source.categoryId === candidate.categoryId) {
    score += 30;
  }

  // 3. Prerequisite / Follow-up links
  if (source.nextTopicIds?.some(tid => candidate.topicId === tid || candidate.categoryId === tid)) {
    score += 45;
  }
  if (source.prerequisiteTopicIds?.some(tid => candidate.topicId === tid || candidate.categoryId === tid)) {
    score += 40;
  }

  // 4. Role alignment
  if (options.activeRole) {
    const normalizedRole = options.activeRole.toLowerCase().replace(/\s+/g, '-');
    if (candidate.roleIds?.includes(normalizedRole) || candidate.roleTarget.toLowerCase().includes(options.activeRole.toLowerCase())) {
      score += 35;
    }
  }

  // 5. Shared tags
  if (source.tags && candidate.tags) {
    const candidateTagsLower = candidate.tags.map(t => t.toLowerCase());
    for (const tag of source.tags) {
      if (candidateTagsLower.includes(tag.toLowerCase())) {
        score += 15;
      }
    }
  }

  // 6. Shared keywords
  if (source.keywords && candidate.keywords) {
    const candidateKeywords = new Set(candidate.keywords.map(k => k.toLowerCase()));
    for (const kw of source.keywords) {
      if (candidateKeywords.has(kw.toLowerCase())) {
        score += 12;
      }
    }
  }

  // 7. Difficulty progression (Easy -> Medium, Medium -> Hard, Hard -> Hard/Architectural)
  const diffOrder: Record<string, number> = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
  const sDiff = diffOrder[source.difficulty] || 2;
  const cDiff = diffOrder[candidate.difficulty] || 2;
  if (cDiff === sDiff || cDiff === sDiff + 1) {
    score += 20;
  }

  // 8. User interest matches
  if (options.userInterests && options.userInterests.length > 0) {
    for (const interest of options.userInterests) {
      const intLower = interest.toLowerCase();
      if (candidate.tags?.some(t => t.toLowerCase().includes(intLower)) ||
          candidate.keywords?.some(k => k.toLowerCase().includes(intLower))) {
        score += 25;
      }
    }
  }

  return score;
}

/**
 * Returns strongly related questions for a given question.
 */
export function getRelatedQuestions(
  question: QuestionItem,
  allQuestions: QuestionItem[] = ALL_QUESTIONS,
  options: RecommendationOptions = {}
): QuestionItem[] {
  const limit = options.limit || 4;
  const exclude = new Set([question.id, ...(options.excludeIds || [])]);

  const scored = allQuestions
    .filter(q => !exclude.has(q.id))
    .map(q => ({
      question: q,
      score: scoreQuestionRelevance(question, q, options),
    }))
    .filter(item => item.score > 20)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(item => item.question);
}

/**
 * Returns "Continue Learning" questions - progressive difficulty or next-topic questions.
 */
export function getContinueLearningQuestions(
  question: QuestionItem,
  allQuestions: QuestionItem[] = ALL_QUESTIONS,
  options: RecommendationOptions = {}
): QuestionItem[] {
  const limit = options.limit || 3;
  const exclude = new Set([question.id, ...(options.excludeIds || [])]);

  // First priority: questions matching nextTopicIds
  let nextQuestions: QuestionItem[] = [];
  if (question.nextTopicIds && question.nextTopicIds.length > 0) {
    nextQuestions = allQuestions.filter(q =>
      !exclude.has(q.id) &&
      (question.nextTopicIds?.includes(q.topicId || '') || question.nextTopicIds?.includes(q.categoryId || ''))
    );
  }

  // Fallback / complement: slightly higher difficulty in the same category/topic
  if (nextQuestions.length < limit) {
    const more = allQuestions.filter(q =>
      !exclude.has(q.id) &&
      !nextQuestions.some(nq => nq.id === q.id) &&
      (q.categoryId === question.categoryId || q.topicId === question.topicId) &&
      (q.difficulty === 'Hard' || q.difficulty === 'Medium')
    );
    nextQuestions = [...nextQuestions, ...more];
  }

  return nextQuestions.slice(0, limit);
}

/**
 * Returns high-priority questions recommended for a candidate's selected role.
 */
export function getRecommendedForRole(
  roleTitle: string,
  allQuestions: QuestionItem[] = ALL_QUESTIONS,
  limit: number = 6
): QuestionItem[] {
  const normalized = roleTitle.toLowerCase().replace(/\s+/g, '-');
  return allQuestions
    .filter(q => {
      const hasId = q.roleIds?.includes(normalized);
      const matchesTarget = q.roleTarget.toLowerCase().includes(roleTitle.toLowerCase());
      return hasId || matchesTarget;
    })
    .slice(0, limit);
}

/**
 * Returns "Strengthen Fundamentals" prerequisite questions for a topic.
 */
export function getStrengthenFundamentals(
  question: QuestionItem,
  allQuestions: QuestionItem[] = ALL_QUESTIONS,
  limit: number = 3
): QuestionItem[] {
  const prereqs = question.prerequisiteTopicIds || [];
  if (prereqs.length === 0) {
    // If no explicit prereqs, return Easy/Medium in same category
    return allQuestions
      .filter(q => q.id !== question.id && q.categoryId === question.categoryId && q.difficulty === 'Easy')
      .slice(0, limit);
  }

  return allQuestions
    .filter(q => q.id !== question.id && (prereqs.includes(q.topicId || '') || prereqs.includes(q.categoryId || '')))
    .slice(0, limit);
}

// -------------------------------------------------------------
// 3. Search and Multi-Filter Engine
// -------------------------------------------------------------

export interface FilterOptions {
  searchQuery?: string;
  selectedRole?: string;
  selectedCategory?: string;
  selectedTopic?: string;
  selectedDifficulty?: string;
  selectedQuestionType?: string;
  onlyBookmarked?: boolean;
  onlyCustom?: boolean;
  bookmarkedIds?: string[];
  sortBy?: 'recommended' | 'difficulty-asc' | 'difficulty-desc' | 'alphabetical' | 'newest';
}

export function searchAndFilterQuestions(
  allQuestions: QuestionItem[],
  filters: FilterOptions
): QuestionItem[] {
  let result = [...allQuestions];

  // 1. Saved / Bookmarked filter
  if (filters.onlyBookmarked) {
    const bookmarkedSet = new Set(filters.bookmarkedIds || []);
    result = result.filter(q => bookmarkedSet.has(q.id));
  }

  // 2. Custom Questions filter
  if (filters.onlyCustom) {
    result = result.filter(q => q.isCustom);
  }

  // 3. Role filter
  if (filters.selectedRole && filters.selectedRole !== 'All Roles' && filters.selectedRole !== 'all') {
    const roleNormalized = filters.selectedRole.toLowerCase().replace(/\s+/g, '-');
    const roleCollapsed = filters.selectedRole.toLowerCase().replace(/[\s-]+/g, '');
    const roleShort = roleNormalized.replace('-developer', '-dev').replace('-engineer', '-eng');
    result = result.filter(q => {
      const inRoleIds = q.roleIds?.some(r => {
        const rLower = r.toLowerCase();
        const rCollapsed = rLower.replace(/[\s-]+/g, '');
        return (
          rLower === roleNormalized ||
          rLower === roleShort ||
          rCollapsed === roleCollapsed ||
          rCollapsed.includes(roleCollapsed) ||
          roleCollapsed.includes(rCollapsed) ||
          roleNormalized.includes(rLower) ||
          rLower.includes(roleNormalized) ||
          rLower.includes(roleShort)
        );
      });
      const targetMatches =
        q.roleTarget.toLowerCase().includes(filters.selectedRole!.toLowerCase()) ||
        filters.selectedRole!.toLowerCase().includes(q.roleTarget.toLowerCase());
      return inRoleIds || targetMatches;
    });
  }

  // 4. Category filter
  if (filters.selectedCategory && filters.selectedCategory !== 'All Categories' && filters.selectedCategory !== 'all') {
    result = result.filter(q =>
      q.categoryId === filters.selectedCategory ||
      q.category.toLowerCase() === filters.selectedCategory!.toLowerCase()
    );
  }

  // 5. Topic filter
  if (filters.selectedTopic && filters.selectedTopic !== 'All Topics' && filters.selectedTopic !== 'all') {
    result = result.filter(q =>
      q.topicId === filters.selectedTopic ||
      q.subtopicId === filters.selectedTopic
    );
  }

  // 6. Difficulty filter
  if (filters.selectedDifficulty && filters.selectedDifficulty !== 'All Difficulties' && filters.selectedDifficulty !== 'all') {
    result = result.filter(q => q.difficulty.toLowerCase() === filters.selectedDifficulty!.toLowerCase());
  }

  // 7. Question Type filter
  if (filters.selectedQuestionType && filters.selectedQuestionType !== 'All Types' && filters.selectedQuestionType !== 'all') {
    result = result.filter(q => q.questionType?.toLowerCase() === filters.selectedQuestionType!.toLowerCase());
  }

  // 8. Global Free-text Search
  if (filters.searchQuery && filters.searchQuery.trim()) {
    const query = filters.searchQuery.trim().toLowerCase();
    const queryTokens = query.split(/\s+/).filter(Boolean);

    result = result.filter(q => {
      const titleLower = q.title.toLowerCase();
      const textLower = (q.questionText || '').toLowerCase();
      const shortAnsLower = (q.shortAnswer || '').toLowerCase();
      const descLower = (q.description || '').toLowerCase();
      const tagsStr = (q.tags || []).join(' ').toLowerCase();
      const kwStr = (q.keywords || []).join(' ').toLowerCase();
      const roleTargetLower = q.roleTarget.toLowerCase();

      // Check if all search tokens match somewhere in the question item
      return queryTokens.every(token =>
        titleLower.includes(token) ||
        textLower.includes(token) ||
        shortAnsLower.includes(token) ||
        descLower.includes(token) ||
        tagsStr.includes(token) ||
        kwStr.includes(token) ||
        roleTargetLower.includes(token)
      );
    });
  }

  // 9. Sorting
  const diffOrder: Record<string, number> = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };

  switch (filters.sortBy) {
    case 'difficulty-asc':
      result.sort((a, b) => (diffOrder[a.difficulty] || 2) - (diffOrder[b.difficulty] || 2));
      break;
    case 'difficulty-desc':
      result.sort((a, b) => (diffOrder[b.difficulty] || 2) - (diffOrder[a.difficulty] || 2));
      break;
    case 'alphabetical':
      result.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'newest':
      result.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      break;
    case 'recommended':
    default:
      // If role is active, sort by role relevance first
      if (filters.selectedRole && filters.selectedRole !== 'All Roles') {
        const norm = filters.selectedRole.toLowerCase().replace(/\s+/g, '-');
        result.sort((a, b) => {
          const aMatch = a.roleIds?.includes(norm) ? 1 : 0;
          const bMatch = b.roleIds?.includes(norm) ? 1 : 0;
          return bMatch - aMatch;
        });
      }
      break;
  }

  return result;
}

/**
 * Returns learning path for the specified role.
 */
export function getLearningPathForRole(roleTitle: string): RoleLearningPath | undefined {
  const normalized = roleTitle.toLowerCase().replace(/\s+/g, '-');
  return (
    ROLE_LEARNING_PATHS[normalized] ||
    ROLE_LEARNING_PATHS['frontend-dev'] // fallback standard
  );
}
