import React, { useState, useMemo, useEffect } from 'react';
import { ViewMode, UserProfile, RecentInterviewItem, QuestionItem } from '../../types';
import {
  RankedRecommendation,
  LearningFilterOptions,
  UserLearningProgress
} from '../../types/learning';
import { ALL_SUPPORTED_ROLES } from '../../data/learningTaxonomy';
import { LEARNING_RESOURCES_CATALOG, STRUCTURED_LEARNING_PATHS } from '../../data/learningResourcesCatalog';
import { analyzeSkillGaps } from '../../services/skillGapService';
import { rankLearningResources, getLearningPathsForRole } from '../../services/recommendationService';
import {
  loadUserLearningProgress,
  toggleBookmarkResource,
  markResourceComplete,
  markResourceInProgress,
  togglePathStepComplete
} from '../../services/learningResourceService';
import { ResourceCard } from './ResourceCard';
import { ResourceDetailModal } from './ResourceDetailModal';
import { SkillGapSummaryBanner } from './SkillGapSummaryBanner';
import { LearningPathsSection } from './LearningPathsSection';

interface LearningResourcesViewProps {
  onNavigate: (view: ViewMode) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  userProfile?: UserProfile | null;
  recentInterviews?: RecentInterviewItem[];
  questions?: QuestionItem[];
  onPracticeQuestion?: (question: QuestionItem) => void;
  onAddRole?: (role: string) => void;
}

export const LearningResourcesView: React.FC<LearningResourcesViewProps> = ({
  onNavigate,
  searchQuery: initialSearch = '',
  onSearchChange,
  userProfile,
  recentInterviews = [],
  questions = [],
  onPracticeQuestion,
  onAddRole: _onAddRole
}) => {
  // Candidate resume derived role or default
  const defaultRole = userProfile?.primaryRole || userProfile?.targetRoles?.[0]?.title || 'Frontend Developer';

  // State
  const [selectedRole, setSelectedRole] = useState<string>(defaultRole);
  const [search, setSearch] = useState<string>(initialSearch);
  const [selectedTopic, setSelectedTopic] = useState<string>('All Topics');
  const [selectedType, setSelectedType] = useState<string>('All Types');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All Levels');
  const [selectedPricing, setSelectedPricing] = useState<string>('All Pricing');
  const [statusFilter, setStatusFilter] = useState<'all' | 'saved' | 'in_progress' | 'completed' | 'recommended'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'shortest' | 'beginner' | 'advanced' | 'recently_verified'>('recommended');
  const [showOtherRolesDropdown, setShowOtherRolesDropdown] = useState(false);

  // Active resource detail modal state
  const [activeModalItem, setActiveModalItem] = useState<RankedRecommendation | null>(null);

  // User learning progress (bookmarks, completed, in-progress)
  const [userProgress, setUserProgress] = useState<UserLearningProgress>(() => {
    const uid = userProfile?.uid || 'guest';
    try {
      const cached = localStorage.getItem(`interviewiq_learning_${uid}`);
      if (cached) return JSON.parse(cached);
    } catch {}
    return {
      uid,
      bookmarkedResourceIds: ['res-react-docs-hooks', 'res-ts-handbook-generics'],
      completedResourceIds: [],
      inProgressResourceIds: [
        {
          resourceId: 'res-react-docs-hooks',
          startedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          lastAccessedAt: new Date().toISOString(),
          progressPercent: 65
        }
      ],
      dismissedResourceIds: [],
      completedPathStepIds: {
        'path-frontend-fundamentals': [1]
      },
      updatedAt: new Date().toISOString()
    };
  });

  // Sync initialSearch if prop changes
  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  // Load progress asynchronously on mount or UID change
  useEffect(() => {
    const uid = userProfile?.uid || 'guest';
    let isMounted = true;
    loadUserLearningProgress(uid).then(progress => {
      if (isMounted && progress) {
        setUserProgress(progress);
      }
    });
    return () => { isMounted = false; };
  }, [userProfile?.uid]);

  // Handle Search Input Change
  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (onSearchChange) onSearchChange(val);
  };

  // User Roles Pills (Candidate's target roles first + All Roles)
  const displayedRoles = useMemo(() => {
    const set = new Set<string>();
    set.add('All Roles');
    if (userProfile?.primaryRole) set.add(userProfile.primaryRole);
    if (userProfile?.targetRoles) {
      userProfile.targetRoles.forEach(r => set.add(r.title));
    }
    // Add default roles if set is small
    if (set.size < 4) {
      set.add('Frontend Developer');
      set.add('Backend Developer');
      set.add('Full Stack Developer');
    }
    if (selectedRole !== 'All Roles') set.add(selectedRole);
    return Array.from(set);
  }, [userProfile, selectedRole]);

  // 1. Evidence-Based Skill Gap Analysis
  const skillGapAnalysis = useMemo(() => {
    return analyzeSkillGaps(selectedRole, userProfile, recentInterviews, questions, userProgress);
  }, [selectedRole, userProfile, recentInterviews, questions, userProgress]);

  // 2. Recommendation Engine Ranking
  const filterOptions: Partial<LearningFilterOptions> = useMemo(() => ({
    searchQuery: search,
    selectedRole,
    selectedTopic,
    selectedType,
    selectedDifficulty,
    selectedPricing,
    statusFilter,
    sortBy
  }), [search, selectedRole, selectedTopic, selectedType, selectedDifficulty, selectedPricing, statusFilter, sortBy]);

  const recommendationOutput = useMemo(() => {
    return rankLearningResources(
      selectedRole,
      skillGapAnalysis.items,
      userProfile,
      userProgress,
      LEARNING_RESOURCES_CATALOG,
      filterOptions
    );
  }, [selectedRole, skillGapAnalysis.items, userProfile, userProgress, filterOptions]);

  // 3. Learning Paths for selected role
  const learningPaths = useMemo(() => {
    return getLearningPathsForRole(selectedRole);
  }, [selectedRole]);

  // User Actions
  const handleToggleBookmark = async (resourceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = await toggleBookmarkResource(userProgress, resourceId);
    setUserProgress(updated);
  };

  const handleToggleComplete = async (resourceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlyComplete = userProgress.completedResourceIds.includes(resourceId);
    const updated = await markResourceComplete(userProgress, resourceId, !isCurrentlyComplete);
    setUserProgress(updated);
  };

  const handleMarkInProgress = async (resourceId: string) => {
    const updated = await markResourceInProgress(userProgress, resourceId);
    setUserProgress(updated);
  };

  const handleTogglePathStep = async (pathId: string, stepNumber: number) => {
    const updated = await togglePathStepComplete(userProgress, pathId, stepNumber);
    setUserProgress(updated);
  };

  const handleOpenResourceById = (resourceId: string) => {
    const found = recommendationOutput.allRanked.find(r => r.resource.id === resourceId);
    if (found) {
      setActiveModalItem(found);
    } else {
      const catalogItem = LEARNING_RESOURCES_CATALOG.find(r => r.id === resourceId);
      if (catalogItem) {
        window.open(catalogItem.url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handlePracticeQuestionId = (qid: string) => {
    const match = questions.find(q => q.id.toLowerCase() === qid.toLowerCase());
    if (match && onPracticeQuestion) {
      onPracticeQuestion(match);
    } else {
      onNavigate('question-library');
    }
  };

  const resetAllFilters = () => {
    setSearch('');
    setSelectedRole(defaultRole);
    setSelectedTopic('All Topics');
    setSelectedType('All Types');
    setSelectedDifficulty('All Levels');
    setSelectedPricing('All Pricing');
    setStatusFilter('all');
    setSortBy('recommended');
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedTopic !== 'All Topics' ||
    selectedType !== 'All Types' ||
    selectedDifficulty !== 'All Levels' ||
    selectedPricing !== 'All Pricing' ||
    statusFilter !== 'all' ||
    sortBy !== 'recommended';

  return (
    <div className="flex flex-col w-full gap-space-lg pb-16">
      {/* =========================================================================
          SECTION A: PAGE HEADER & BREADCRUMBS
         ========================================================================= */}
      <div className="flex flex-col gap-space-sm bg-surface-container-lowest p-space-md sm:p-space-lg rounded-xl shadow-sm border border-surface-variant">
        {/* Breadcrumb Row */}
        <div className="flex items-center gap-space-xs text-outline font-label-micro uppercase tracking-wider font-semibold">
          <span className="hover:text-on-surface cursor-pointer" onClick={() => onNavigate('overview')}>Workspace</span>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="text-outline">Improvement</span>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="text-primary font-semibold">Learning Resources</span>
        </div>

        {/* Title, Role Badge & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-space-md pt-0.5">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-on-surface tracking-tight leading-tight">
                Learning Resources
              </h1>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-full text-on-surface-variant font-label-sm text-label-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span>Active Track: {selectedRole}</span>
              </div>
            </div>
            <p className="text-sm sm:text-base text-on-surface-variant mt-0.5 font-normal max-w-3xl">
              High-quality tutorials, official documentation, courses, and interactive exercises calibrated to your verified interview feedback and demonstrated skill gaps.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => onNavigate('mock-interviews')}
              className="h-[34px] px-3.5 bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-surface-variant"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">videocam</span>
              <span>Diagnose Skills</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('question-library')}
              className="h-[34px] px-3.5 bg-primary text-on-primary font-label-md text-label-md rounded-lg flex items-center gap-1.5 hover:bg-primary-container transition-colors shadow-xs cursor-pointer font-semibold"
            >
              <span className="material-symbols-outlined text-[16px]">library_books</span>
              <span>Question Library</span>
            </button>
          </div>
        </div>

        {/* Global Search & Quick Filter Controls */}
        <div className="pt-2 flex flex-col md:flex-row md:items-center justify-between gap-3 border-t border-surface-variant/70 mt-1">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search tutorials, official docs, topics, or skills..."
              className="w-full h-10 pl-9 pr-9 rounded-lg bg-surface-container-low border border-surface-variant text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors font-body-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 top-2.5 text-outline hover:text-on-surface"
                title="Clear search"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
              </button>
            )}
          </div>

          {/* Status Tabs: All, Recommended, In Progress, Saved, Completed */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 self-start md:self-auto max-w-full text-xs">
            {[
              { id: 'all', label: 'All Resources' },
              { id: 'recommended', label: 'Recommended', icon: 'auto_awesome' },
              { id: 'in_progress', label: 'In Progress', icon: 'hourglass_top' },
              { id: 'saved', label: 'Saved', icon: 'star' },
              { id: 'completed', label: 'Completed', icon: 'check_circle' },
            ].map(tab => {
              const isSelected = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-on-surface text-surface-container-lowest shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  {tab.icon && (
                    <span className="material-symbols-outlined text-[14px]">
                      {tab.icon}
                    </span>
                  )}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Roles Filter Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          <span className="text-xs font-semibold text-outline uppercase tracking-wider w-16 shrink-0">Role</span>
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            {displayedRoles.map(role => {
              const isSelected = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer font-medium ${
                    isSelected
                      ? 'bg-on-surface text-surface-container-lowest shadow-xs font-semibold'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  {role}
                </button>
              );
            })}

            {/* Other Roles Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowOtherRolesDropdown(!showOtherRolesDropdown)}
                className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-variant transition-all cursor-pointer flex items-center gap-1 text-xs"
              >
                <span className="material-symbols-outlined text-[14px]">tune</span>
                <span>Other Roles</span>
              </button>

              {showOtherRolesDropdown && (
                <div className="absolute left-0 mt-1.5 w-64 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-variant p-2 z-30 flex flex-col gap-1 max-h-60 overflow-y-auto animate-in fade-in">
                  <span className="font-label-micro text-label-micro text-outline uppercase px-2 py-1">
                    Select Development Track:
                  </span>
                  {ALL_SUPPORTED_ROLES.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setSelectedRole(r.title);
                        setShowOtherRolesDropdown(false);
                      }}
                      className={`text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-2 ${
                        selectedRole === r.title
                          ? 'bg-primary text-on-primary font-medium'
                          : 'hover:bg-surface-container-low text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">{r.icon}</span>
                      <span>{r.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Filter Controls: Type, Difficulty, Pricing, Sort, Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-surface-variant/60 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Type Selector */}
            <div className="flex items-center gap-1">
              <span className="text-outline font-medium">Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="h-8 px-2.5 rounded-md bg-surface-container-low border border-surface-variant text-on-surface focus:outline-none focus:border-primary cursor-pointer text-xs"
              >
                <option value="All Types">All Types</option>
                <option value="documentation">Official Docs</option>
                <option value="video">Videos &amp; Playlists</option>
                <option value="course">Courses</option>
                <option value="article">Articles</option>
                <option value="exercise">Interactive Exercises</option>
                <option value="path">Roadmaps</option>
              </select>
            </div>

            {/* Difficulty Selector */}
            <div className="flex items-center gap-1">
              <span className="text-outline font-medium">Difficulty:</span>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="h-8 px-2.5 rounded-md bg-surface-container-low border border-surface-variant text-on-surface focus:outline-none focus:border-primary cursor-pointer text-xs"
              >
                <option value="All Levels">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            {/* Pricing Selector */}
            <div className="flex items-center gap-1">
              <span className="text-outline font-medium">Pricing:</span>
              <select
                value={selectedPricing}
                onChange={(e) => setSelectedPricing(e.target.value)}
                className="h-8 px-2.5 rounded-md bg-surface-container-low border border-surface-variant text-on-surface focus:outline-none focus:border-primary cursor-pointer text-xs"
              >
                <option value="All Pricing">All Pricing</option>
                <option value="free">100% Free</option>
                <option value="freemium">Free Portion</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1">
              <span className="text-outline font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-8 px-2.5 rounded-md bg-surface-container-low border border-surface-variant text-on-surface focus:outline-none focus:border-primary cursor-pointer text-xs font-medium"
              >
                <option value="recommended">Recommended For You</option>
                <option value="shortest">Shortest Duration</option>
                <option value="beginner">Beginner First</option>
                <option value="advanced">Advanced First</option>
                <option value="recently_verified">Recently Verified</option>
              </select>
            </div>
          </div>

          {/* Reset Filters & Result Count */}
          <div className="flex items-center gap-3">
            <span className="text-outline font-label-micro text-label-micro">
              Showing <strong className="text-on-surface">{recommendationOutput.totalMatchesCount}</strong> matching resources
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="h-8 px-2.5 rounded-md bg-surface-container hover:bg-surface-variant text-outline hover:text-on-surface flex items-center gap-1 font-medium transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span>
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION B: YOUR LEARNING OVERVIEW STRIP (4 Micro-Metric Cards)
         ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-sm">
        {/* Metric 1: Recommended Resources */}
        <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-surface-variant flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-outline font-label-micro uppercase tracking-wider font-semibold">
            <span>Recommended</span>
            <span className="material-symbols-outlined text-[16px] text-primary">auto_awesome</span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="font-headline-lg text-2xl font-bold text-on-surface">
              {recommendationOutput.recommendedForYou.length}
            </span>
            <span className="text-outline font-label-micro text-label-micro">high-priority</span>
          </div>
          <span className="font-label-micro text-label-micro text-on-surface-variant mt-2 font-medium">
            Calibrated to {selectedRole}
          </span>
        </div>

        {/* Metric 2: Completed Resources */}
        <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-surface-variant flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-outline font-label-micro uppercase tracking-wider font-semibold">
            <span>Completed</span>
            <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="font-headline-lg text-2xl font-bold text-on-surface">
              {userProgress.completedResourceIds.length}
            </span>
            <span className="text-outline font-label-micro text-label-micro">activities</span>
          </div>
          <span className="font-label-micro text-label-micro text-secondary mt-2 font-medium">
            Verified study milestones
          </span>
        </div>

        {/* Metric 3: Skills to Improve */}
        <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-surface-variant flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-outline font-label-micro uppercase tracking-wider font-semibold">
            <span>Growth Areas</span>
            <span className="material-symbols-outlined text-[16px] text-error">priority_high</span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="font-headline-lg text-2xl font-bold text-on-surface">
              {skillGapAnalysis.needsImprovementCount}
            </span>
            <span className="text-outline font-label-micro text-label-micro">topics flagged</span>
          </div>
          <span className="font-label-micro text-label-micro text-on-surface-variant mt-2 font-medium">
            {skillGapAnalysis.hasAssessmentEvidence ? 'Backed by mock interview feedback' : 'No weaknesses flagged'}
          </span>
        </div>

        {/* Metric 4: Bookmarked / Saved */}
        <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-surface-variant flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-outline font-label-micro uppercase tracking-wider font-semibold">
            <span>Saved For Later</span>
            <span className="material-symbols-outlined text-[16px] text-tertiary">star</span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="font-headline-lg text-2xl font-bold text-on-surface">
              {userProgress.bookmarkedResourceIds.length}
            </span>
            <span className="text-outline font-label-micro text-label-micro">bookmarked</span>
          </div>
          <span className="font-label-micro text-label-micro text-on-surface-variant mt-2 font-medium">
            Personal study collection
          </span>
        </div>
      </div>

      {/* =========================================================================
          SECTION D: EVIDENCE-BASED SKILL GAP DIAGNOSTICS BANNER
         ========================================================================= */}
      <SkillGapSummaryBanner
        analysis={skillGapAnalysis}
        selectedRoleTitle={selectedRole}
        onFilterByTopic={(topicName) => setSelectedTopic(topicName)}
        onNavigateToMock={() => onNavigate('mock-interviews')}
      />

      {/* =========================================================================
          SECTION E: CONTINUE LEARNING (IN-PROGRESS ACTIVITIES)
         ========================================================================= */}
      {recommendationOutput.continueLearning.length > 0 && statusFilter === 'all' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">hourglass_top</span>
              <h2 className="font-headline-sm text-lg font-bold text-on-surface">
                Continue Learning
              </h2>
            </div>
            <span className="font-label-micro text-label-micro text-outline">
              Resume where you left off
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendationOutput.continueLearning.map(item => (
              <ResourceCard
                key={item.resource.id}
                item={item}
                isBookmarked={userProgress.bookmarkedResourceIds.includes(item.resource.id)}
                isCompleted={userProgress.completedResourceIds.includes(item.resource.id)}
                isInProgress={true}
                onToggleBookmark={handleToggleBookmark}
                onToggleComplete={handleToggleComplete}
                onOpenDetails={(it) => setActiveModalItem(it)}
                onPracticeQuestion={handlePracticeQuestionId}
              />
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION C: RECOMMENDED FOR YOU (EVIDENCE-BACKED PRIORITY)
         ========================================================================= */}
      {statusFilter === 'all' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">auto_awesome</span>
                <h2 className="font-headline-sm text-lg font-bold text-on-surface">
                  Recommended For You
                </h2>
              </div>
              <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                Top learning activities prioritized by role relevance, assessment growth areas, and verified educational quality.
              </p>
            </div>

            <span className="font-label-micro text-label-micro text-outline">
              Ranked by InterviewIQ Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendationOutput.recommendedForYou.map(item => (
              <ResourceCard
                key={item.resource.id}
                item={item}
                isBookmarked={userProgress.bookmarkedResourceIds.includes(item.resource.id)}
                isCompleted={userProgress.completedResourceIds.includes(item.resource.id)}
                isInProgress={userProgress.inProgressResourceIds.some(i => i.resourceId === item.resource.id)}
                onToggleBookmark={handleToggleBookmark}
                onToggleComplete={handleToggleComplete}
                onOpenDetails={(it) => setActiveModalItem(it)}
                onPracticeQuestion={handlePracticeQuestionId}
              />
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION G: STRUCTURED LEARNING PATHS
         ========================================================================= */}
      {statusFilter === 'all' && (
        <LearningPathsSection
          paths={learningPaths}
          userProgress={userProgress}
          onToggleStepComplete={handleTogglePathStep}
          onOpenResourceById={handleOpenResourceById}
          onPracticeQuestion={handlePracticeQuestionId}
        />
      )}

      {/* =========================================================================
          SECTION F: ALL FILTERED RESOURCES CATALOG / EXPLORE BY TOPIC
         ========================================================================= */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-col">
            <h2 className="font-headline-sm text-lg font-bold text-on-surface">
              {statusFilter === 'saved' ? 'Your Saved Resources' :
               statusFilter === 'completed' ? 'Completed Study Activities' :
               statusFilter === 'in_progress' ? 'Active In-Progress Resources' :
               'Explore Resource Catalog'}
            </h2>
            <p className="font-body-sm text-xs text-on-surface-variant">
              {recommendationOutput.allRanked.length} curated resources matching your current criteria.
            </p>
          </div>
        </div>

        {recommendationOutput.allRanked.length === 0 ? (
          <div className="p-8 rounded-xl bg-surface-container-lowest border border-surface-variant flex flex-col items-center justify-center text-center gap-2">
            <span className="material-symbols-outlined text-[36px] text-outline">
              search_off
            </span>
            <h3 className="font-headline-sm text-base font-semibold text-on-surface">
              No learning resources match your current filters
            </h3>
            <p className="font-body-sm text-xs text-on-surface-variant max-w-md">
              Try clearing your search query or selecting a broader role/topic category to explore our verified catalog.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors cursor-pointer"
            >
              Reset Filters &amp; View All
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendationOutput.allRanked.map(item => (
              <ResourceCard
                key={item.resource.id}
                item={item}
                isBookmarked={userProgress.bookmarkedResourceIds.includes(item.resource.id)}
                isCompleted={userProgress.completedResourceIds.includes(item.resource.id)}
                isInProgress={userProgress.inProgressResourceIds.some(i => i.resourceId === item.resource.id)}
                onToggleBookmark={handleToggleBookmark}
                onToggleComplete={handleToggleComplete}
                onOpenDetails={(it) => setActiveModalItem(it)}
                onPracticeQuestion={handlePracticeQuestionId}
              />
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
          RESOURCE DETAIL MODAL DIALOG
         ========================================================================= */}
      <ResourceDetailModal
        item={activeModalItem}
        isOpen={!!activeModalItem}
        onClose={() => setActiveModalItem(null)}
        isBookmarked={activeModalItem ? userProgress.bookmarkedResourceIds.includes(activeModalItem.resource.id) : false}
        isCompleted={activeModalItem ? userProgress.completedResourceIds.includes(activeModalItem.resource.id) : false}
        isInProgress={activeModalItem ? userProgress.inProgressResourceIds.some(i => i.resourceId === activeModalItem.resource.id) : false}
        onToggleBookmark={handleToggleBookmark}
        onToggleComplete={handleToggleComplete}
        onMarkInProgress={handleMarkInProgress}
        onPracticeQuestion={handlePracticeQuestionId}
      />
    </div>
  );
};
