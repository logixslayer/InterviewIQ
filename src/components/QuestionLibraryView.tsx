import React, { useState, useMemo, useEffect } from 'react';
import { ViewMode, QuestionItem, UserProfile } from '../types';
import { ALL_QUESTIONS } from '../data/questionBank';
import {
  getUserBookmarks,
  toggleUserBookmark,
  getUserCustomQuestions,
  searchAndFilterQuestions,
  getLearningPathForRole,
  getRecommendedForRole,
} from '../services/questionService';
import { QuestionDetailModal } from './QuestionDetailModal';
import { RoleSelectorModal } from './RoleSelectorModal';
import { LearningPathView } from './LearningPathView';
import { AddCustomQuestionModal } from './AddCustomQuestionModal';

interface QuestionLibraryViewProps {
  onNavigate: (view: ViewMode) => void;
  onPracticeQuestion: (question: QuestionItem) => void;
  searchQuery: string;
  userProfile?: UserProfile | null;
  onAddRole?: (role: string) => void;
}

export const QuestionLibraryView: React.FC<QuestionLibraryViewProps> = ({
  onNavigate: _onNavigate,
  onPracticeQuestion,
  searchQuery: initialSearch,
  userProfile,
}) => {
  const userId = userProfile?.uid || 'guest';
  const defaultUserRole = userProfile?.primaryRole || userProfile?.targetRoles?.[0]?.title || 'Frontend Developer';

  // State
  const [selectedRole, setSelectedRole] = useState<string>(defaultUserRole);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All Difficulties');
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>('All Types');
  const [sortBy, setSortBy] = useState<'recommended' | 'difficulty-asc' | 'difficulty-desc' | 'alphabetical' | 'newest'>('recommended');
  const [search, setSearch] = useState<string>(initialSearch || '');
  const [activeTab, setActiveTab] = useState<'browse' | 'learning-path' | 'saved'>('browse');

  // Bookmarks & Custom Questions
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => getUserBookmarks(userId));
  const [customQuestions, setCustomQuestions] = useState<QuestionItem[]>(() => getUserCustomQuestions(userId));

  // Modals
  const [inspectingQuestion, setInspectingQuestion] = useState<QuestionItem | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [aiCategory, setAiCategory] = useState('Technical Architecture');
  const [aiDifficulty, setAiDifficulty] = useState('Medium');
  const [aiCount, setAiCount] = useState(3);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Refresh bookmarks when userId changes
  useEffect(() => {
    setBookmarkedIds(getUserBookmarks(userId));
    setCustomQuestions(getUserCustomQuestions(userId));
  }, [userId]);

  // Aggregate all shared questions + user's private custom questions
  const combinedQuestions = useMemo(() => {
    return [...customQuestions, ...ALL_QUESTIONS];
  }, [customQuestions]);

  // Filter and sort questions using questionService
  const filteredQuestions = useMemo(() => {
    return searchAndFilterQuestions(combinedQuestions, {
      searchQuery: search,
      selectedRole,
      selectedCategory,
      selectedDifficulty,
      selectedQuestionType,
      onlyBookmarked: activeTab === 'saved',
      bookmarkedIds,
      sortBy,
    });
  }, [
    combinedQuestions,
    search,
    selectedRole,
    selectedCategory,
    selectedDifficulty,
    selectedQuestionType,
    activeTab,
    bookmarkedIds,
    sortBy,
  ]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedRole, selectedCategory, selectedDifficulty, selectedQuestionType, sortBy, activeTab]);

  // Paginated questions
  const totalQuestions = filteredQuestions.length;
  const totalPages = Math.max(1, Math.ceil(totalQuestions / pageSize));
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  // Role Learning Path
  const currentLearningPath = useMemo(() => {
    return getLearningPathForRole(selectedRole);
  }, [selectedRole]);

  // Recommended high-yield questions for the role
  const recommendedRoleQuestions = useMemo(() => {
    return getRecommendedForRole(selectedRole, combinedQuestions, 3);
  }, [selectedRole, combinedQuestions]);

  // Bookmark toggle handler
  const handleToggleBookmark = (questionId: string) => {
    const res = toggleUserBookmark(userId, questionId);
    setBookmarkedIds(res.allBookmarks);
  };

  // Custom question added handler
  const handleQuestionAdded = (newQ: QuestionItem) => {
    setCustomQuestions(prev => [newQ, ...prev]);
  };

  // NVIDIA AI Question Generation Handler
  const handleGenerateAiQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setAiError(null);

    try {
      const resumeContext = userProfile
        ? `Candidate: ${userProfile.fullName || 'Candidate'}. Role: ${selectedRole}. Skills: ${userProfile.topSkills?.join(', ')}`
        : '';

      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          category: aiCategory,
          difficulty: aiDifficulty,
          count: aiCount,
          resumeContext,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'AI generation failed or is currently unconfigured.');
      }

      const generated: QuestionItem[] = (data.questions || []).map((q: any) => ({
        ...q,
        isCustom: true,
        tags: [...(q.tags || []), 'AI-Generated'],
      }));

      // Add to custom questions state
      setCustomQuestions(prev => [...generated, ...prev]);
      setIsAiModalOpen(false);
      setAiSuccessMessage(`Generated ${generated.length} AI-calibrated questions for ${selectedRole}!`);
      setTimeout(() => setAiSuccessMessage(null), 5000);
    } catch (err: any) {
      console.warn('AI question generation fallback:', err);
      setAiError(err?.message || 'AI service endpoint returned an error.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Hard':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  const activeFilterCount = [
    selectedCategory !== 'All Categories',
    selectedDifficulty !== 'All Difficulties',
    selectedQuestionType !== 'All Types',
    Boolean(search.trim()),
  ].filter(Boolean).length;

  const resetAllFilters = () => {
    setSelectedCategory('All Categories');
    setSelectedDifficulty('All Difficulties');
    setSelectedQuestionType('All Types');
    setSearch('');
  };

  return (
    <div className="flex flex-col w-full pb-16 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Intelligent Question Library
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-primary border border-indigo-200/80 shadow-xs">
              {combinedQuestions.length} Questions
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Master verified technical answers, study connected topics, and practice with real-time feedback.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsCustomModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Custom Question
          </button>

          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-primary hover:bg-primary/95 text-white shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 text-indigo-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate with AI
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {aiSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-xs">
          <span>{aiSuccessMessage}</span>
          <button onClick={() => setAiSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-3 cursor-pointer">✕</button>
        </div>
      )}

      {/* Active Role Banner */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-primary shrink-0 shadow-xs">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-500">Active Target Role:</span>
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-primary border border-indigo-200/70 text-xs font-bold">
                {selectedRole}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 truncate">
              Questions and topic roadmaps are calibrated to this position.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsRoleModalOpen(true)}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
          Change Role ({selectedRole})
        </button>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('browse')}
          className={`pb-3 font-semibold text-sm transition-all cursor-pointer relative ${
            activeTab === 'browse'
              ? 'text-primary font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          All Questions ({combinedQuestions.length})
        </button>

        <button
          onClick={() => setActiveTab('learning-path')}
          className={`pb-3 font-semibold text-sm transition-all cursor-pointer relative flex items-center gap-1.5 ${
            activeTab === 'learning-path'
              ? 'text-primary font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Learning Path</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-3 font-semibold text-sm transition-all cursor-pointer relative flex items-center gap-1.5 ${
            activeTab === 'saved'
              ? 'text-primary font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Saved Questions</span>
          <span className="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
            {bookmarkedIds.length}
          </span>
        </button>
      </div>

      {/* LEARNING PATH VIEW */}
      {activeTab === 'learning-path' && currentLearningPath && (
        <LearningPathView
          learningPath={currentLearningPath}
          onSelectQuestion={q => setInspectingQuestion(q)}
          onPracticeQuestion={onPracticeQuestion}
          onBrowseAllQuestions={() => setActiveTab('browse')}
        />
      )}

      {/* BROWSE & SAVED QUESTIONS VIEW */}
      {activeTab !== 'learning-path' && (
        <div className="space-y-6">
          {/* Search & Compound Filters Bar */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search questions by title, answer, tech (e.g. React hooks, SQL joins, Docker)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all shadow-2xs"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-slate-500 shrink-0">Sort:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="px-3 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-xs cursor-pointer"
                >
                  <option value="recommended">Role Recommended</option>
                  <option value="difficulty-asc">Difficulty: Easy → Hard</option>
                  <option value="difficulty-desc">Difficulty: Hard → Easy</option>
                  <option value="alphabetical">Alphabetical</option>
                  <option value="newest">Recently Added</option>
                </select>
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
              {/* Category Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 focus:border-primary rounded-lg text-xs font-medium text-slate-700 outline-none shadow-xs cursor-pointer"
                >
                  <option value="All Categories">All Categories</option>
                  <option value="frontend-core">Frontend Architecture</option>
                  <option value="backend-architecture">Backend & APIs</option>
                  <option value="databases">Databases & SQL</option>
                  <option value="system-design">System Design</option>
                  <option value="dsa">Data Structures & Algo</option>
                  <option value="ai-ml">AI & Machine Learning</option>
                  <option value="devops-cloud">Cloud & Infrastructure</option>
                  <option value="qa-security">Testing & Security</option>
                  <option value="behavioral">Behavioral & Leadership</option>
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Difficulty
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={e => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 focus:border-primary rounded-lg text-xs font-medium text-slate-700 outline-none shadow-xs cursor-pointer"
                >
                  <option value="All Difficulties">All Difficulties</option>
                  <option value="Easy">Easy (Fundamentals)</option>
                  <option value="Medium">Medium (Application)</option>
                  <option value="Hard">Hard (Architecture / Scale)</option>
                </select>
              </div>

              {/* Question Type Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Question Type
                </label>
                <select
                  value={selectedQuestionType}
                  onChange={e => setSelectedQuestionType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 focus:border-primary rounded-lg text-xs font-medium text-slate-700 outline-none shadow-xs cursor-pointer"
                >
                  <option value="All Types">All Question Types</option>
                  <option value="Conceptual">Conceptual</option>
                  <option value="Coding">Coding</option>
                  <option value="System Design">System Design</option>
                  <option value="Behavioral">Behavioral</option>
                  <option value="Practical Trade-off Analysis">Trade-off Analysis</option>
                </select>
              </div>
            </div>

            {/* Active Filters Summary */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-600">
                  Showing <strong>{filteredQuestions.length}</strong> matching questions
                </span>
                <button
                  onClick={resetAllFilters}
                  className="text-primary hover:text-primary/80 font-semibold cursor-pointer"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>

          {/* Role Recommendations Strip (Shown when browsing All Questions) */}
          {activeTab === 'browse' && recommendedRoleQuestions.length > 0 && !search && (
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 sm:p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    High-Priority for {selectedRole}
                  </h3>
                </div>
                <span className="text-xs text-slate-500">Core Evaluation Bank</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {recommendedRoleQuestions.map(rec => (
                  <div
                    key={rec.id}
                    onClick={() => setInspectingQuestion(rec)}
                    className="p-3.5 rounded-xl bg-white hover:bg-slate-50/80 border border-slate-200/80 hover:border-primary/40 cursor-pointer transition-all flex flex-col justify-between group shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getDifficultyBadge(rec.difficulty)}`}>
                          {rec.difficulty}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">{rec.category}</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {rec.title}
                      </h4>
                    </div>
                    <div className="mt-2 text-xs text-primary font-semibold flex items-center gap-1">
                      Read Complete Answer →
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Question Cards Grid */}
          {paginatedQuestions.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-3">
              <svg className="w-12 h-12 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-base font-bold text-slate-900">No questions found</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                {activeTab === 'saved'
                  ? "You haven't bookmarked any questions yet. Bookmark questions to quickly revisit them."
                  : "No questions match your current combination of filters and search keywords."}
              </p>
              <button
                onClick={resetAllFilters}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              {paginatedQuestions.map(q => {
                const isBookmarked = bookmarkedIds.includes(q.id);

                return (
                  <div
                    key={q.id}
                    className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200/90 hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between group shadow-xs"
                  >
                    <div>
                      {/* Top Metadata Row */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getDifficultyBadge(q.difficulty)}`}>
                            {q.difficulty}
                          </span>
                          <span className="px-2.5 py-0.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-full border border-slate-200">
                            {q.category}
                          </span>
                          {q.isCustom && (
                            <span className="px-2 py-0.5 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 rounded-md">
                              Custom
                            </span>
                          )}
                        </div>

                        {/* Bookmark Button */}
                        <button
                          onClick={() => handleToggleBookmark(q.id)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isBookmarked
                              ? 'bg-amber-50 border-amber-200 text-amber-600'
                              : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                          }`}
                          title={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
                        >
                          <svg className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                      </div>

                      {/* Question Title */}
                      <h3
                        onClick={() => setInspectingQuestion(q)}
                        className="text-[16px] sm:text-[17px] font-bold text-slate-900 group-hover:text-primary cursor-pointer transition-colors leading-snug tracking-tight mt-2.5 mb-2.5"
                      >
                        {q.title}
                      </h3>

                      {/* Short Answer / Preview */}
                      <p className="text-[13px] sm:text-sm text-slate-600 line-clamp-3 leading-relaxed mb-3.5">
                        {q.shortAnswer || q.description}
                      </p>

                      {/* Role & Response Time */}
                      <div className="text-xs text-slate-500 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="truncate pr-2">
                          Target: <strong className="text-slate-700 font-medium">{q.roleTarget}</strong>
                        </span>
                        <span className="shrink-0">{q.estimatedTime || '3-4 mins'}</span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-4 pt-3 flex items-center justify-between gap-2.5 border-t border-slate-100">
                      <button
                        onClick={() => setInspectingQuestion(q)}
                        className="px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Answer
                      </button>

                      <button
                        onClick={() => onPracticeQuestion(q)}
                        className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-all shadow-xs hover:shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Practice
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs sm:text-sm">
              <span className="text-slate-500">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalQuestions} total)
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-2xs font-medium cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-2xs font-medium cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QUESTION DETAIL MODAL */}
      <QuestionDetailModal
        question={inspectingQuestion}
        allQuestions={combinedQuestions}
        activeRole={selectedRole}
        userId={userId}
        isOpen={Boolean(inspectingQuestion)}
        onClose={() => setInspectingQuestion(null)}
        onSelectQuestion={q => setInspectingQuestion(q)}
        onPracticeQuestion={onPracticeQuestion}
        onBookmarkChanged={(qid) => handleToggleBookmark(qid)}
      />

      {/* ROLE SELECTOR MODAL */}
      <RoleSelectorModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        selectedRole={selectedRole}
        onSelectRole={role => setSelectedRole(role)}
      />

      {/* ADD CUSTOM QUESTION MODAL */}
      <AddCustomQuestionModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        userId={userId}
        defaultRole={selectedRole}
        onQuestionAdded={handleQuestionAdded}
      />

      {/* NVIDIA NEMOTRON AI GENERATION MODAL */}
      {isAiModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsAiModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                <h3 className="text-base font-bold text-slate-900">Generate Interview Questions</h3>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold">✕</button>
            </div>

            {aiError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {aiError}
              </div>
            )}

            <form onSubmit={handleGenerateAiQuestions} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Role</label>
                <input
                  type="text"
                  value={selectedRole}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Focus Area</label>
                <select
                  value={aiCategory}
                  onChange={e => setAiCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none cursor-pointer"
                >
                  <option value="Technical Architecture">Technical Architecture</option>
                  <option value="System Design & Scale">System Design & Scale</option>
                  <option value="Coding & Problem Solving">Coding & Problem Solving</option>
                  <option value="STAR Behavioral & Incident Response">STAR Behavioral & Leadership</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Difficulty</label>
                  <select
                    value={aiDifficulty}
                    onChange={e => setAiDifficulty(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Question Count</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={aiCount}
                    onChange={e => setAiCount(parseInt(e.target.value) || 3)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/95 text-white font-semibold flex items-center gap-2 disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {isGenerating ? 'Generating...' : 'Generate Questions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
