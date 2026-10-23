import React, { useState, useMemo, useEffect } from 'react';
import { ViewMode, QuestionItem, UserProfile } from '../types';
import { INITIAL_QUESTIONS } from '../data/mockData';

interface QuestionLibraryViewProps {
  onNavigate: (view: ViewMode) => void;
  onPracticeQuestion: (question: QuestionItem) => void;
  searchQuery: string;
  userProfile?: UserProfile | null;
  onAddRole?: (role: string) => void;
}

const ALL_POSSIBLE_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Java Developer',
  'Data Analyst',
  'Software Engineer',
  'DevOps & Cloud Engineer',
  'Mobile Developer (iOS/Android)',
  'Machine Learning Engineer'
];

export const QuestionLibraryView: React.FC<QuestionLibraryViewProps> = ({
  onNavigate: _onNavigate,
  onPracticeQuestion,
  searchQuery: initialSearch,
  userProfile,
  onAddRole,
}) => {
  const [questions, setQuestions] = useState<QuestionItem[]>(INITIAL_QUESTIONS);
  const [search, setSearch] = useState(initialSearch || '');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [selectedCategory, setSelectedCategory] = useState('All Topics');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Levels');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('Easiest to Hardest');
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [showOtherRolesDropdown, setShowOtherRolesDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Custom Prompt Modal State
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customRole, setCustomRole] = useState(userProfile?.targetRoles[0]?.title || 'Frontend Developer');
  const [customCategory, setCustomCategory] = useState('Technical Architecture');

  // NVIDIA Nemotron Generation State
  const [showNvidiaModal, setShowNvidiaModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genRole, setGenRole] = useState(userProfile?.targetRoles[0]?.title || 'Frontend Developer');
  const [genCategory, setGenCategory] = useState('Technical Architecture');
  const [genDifficulty, setGenDifficulty] = useState('All Levels (Easy to Hard)');
  const [genCount, setGenCount] = useState(5);
  const [genError, setGenError] = useState<string | null>(null);
  const [genSuccessNotice, setGenSuccessNotice] = useState<string | null>(null);

  // Resume-derived roles: Extract from candidate resume if available
  const resumeRoles = useMemo(() => {
    if (userProfile?.targetRoles && userProfile.targetRoles.length > 0) {
      return userProfile.targetRoles.map(r => r.title);
    }
    return ['Frontend Developer', 'Backend Developer', 'Full Stack Developer'];
  }, [userProfile]);

  // Combined roles list for the active filter buttons: show resume roles by default
  const displayedRolePills = useMemo(() => {
    const list = ['All Roles', ...resumeRoles];
    if (selectedRole !== 'All Roles' && !list.includes(selectedRole)) {
      list.push(selectedRole);
    }
    return list;
  }, [resumeRoles, selectedRole]);

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedRole, selectedCategory, selectedDifficulty, selectedCompany, sortBy, showSavedOnly]);

  // Toggle Bookmark
  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, isBookmarked: !q.isBookmarked } : q));
  };

  // Filtered & Sorted Questions
  const filteredAndSortedQuestions = useMemo(() => {
    let result = questions.filter(q => {
      if (showSavedOnly && !q.isBookmarked) return false;

      // Role Filter: Scoped to selected role or candidate's resume target tracks
      if (selectedRole === 'All Roles') {
        if (resumeRoles.length > 0) {
          const matchesAnyResume = resumeRoles.some(rr => {
            const normRR = rr.toLowerCase();
            const normTarget = q.roleTarget.toLowerCase();
            return normTarget.includes(normRR) ||
                   normRR.includes(normTarget) ||
                   normTarget.includes('all') ||
                   normTarget.includes('engineering') ||
                   (normRR.includes('full stack') && normTarget.includes('full stack')) ||
                   (normRR.includes('frontend') && normTarget.includes('frontend')) ||
                   (normRR.includes('backend') && normTarget.includes('backend')) ||
                   (normRR.includes('java') && normTarget.includes('java')) ||
                   (normRR.includes('data') && normTarget.includes('data')) ||
                   (normRR.includes('software') && normTarget.includes('software'));
          });
          if (!matchesAnyResume) return false;
        }
      } else {
        const normSelected = selectedRole.toLowerCase();
        const normTarget = q.roleTarget.toLowerCase();
        const match = normTarget.includes(normSelected) ||
                      normSelected.includes(normTarget) ||
                      normTarget.includes('all') ||
                      normTarget.includes('engineering') ||
                      (normSelected.includes('full stack') && normTarget.includes('full stack')) ||
                      (normSelected.includes('frontend') && normTarget.includes('frontend')) ||
                      (normSelected.includes('backend') && normTarget.includes('backend')) ||
                      (normSelected.includes('java') && normTarget.includes('java')) ||
                      (normSelected.includes('data') && normTarget.includes('data')) ||
                      (normSelected.includes('software') && normTarget.includes('software'));
        if (!match) return false;
      }

      if (selectedCategory !== 'All Topics' && selectedCategory !== 'All Types' && selectedCategory !== 'All Types (482)' && !q.category.toLowerCase().includes(selectedCategory.split(' ')[0].toLowerCase())) return false;
      if (selectedDifficulty !== 'All Levels' && q.difficulty !== selectedDifficulty.split(' ')[0]) return false;
      if (selectedCompany && !q.companies.includes(selectedCompany)) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const match = q.title.toLowerCase().includes(query) ||
                      q.description.toLowerCase().includes(query) ||
                      q.companies.some(c => c.toLowerCase().includes(query)) ||
                      q.category.toLowerCase().includes(query);
        if (!match) return false;
      }
      return true;
    });

    const diffRank: Record<string, number> = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };

    if (sortBy === 'Easiest to Hardest') {
      result = [...result].sort((a, b) => (diffRank[a.difficulty] || 2) - (diffRank[b.difficulty] || 2));
    } else if (sortBy === 'Hardest to Easiest') {
      result = [...result].sort((a, b) => (diffRank[b.difficulty] || 2) - (diffRank[a.difficulty] || 2));
    } else if (sortBy === 'Most Practiced') {
      result = [...result].sort((a, b) => (b.status === 'passed' ? 1 : 0) - (a.status === 'passed' ? 1 : 0));
    }

    return result;
  }, [questions, showSavedOnly, selectedRole, selectedCategory, selectedDifficulty, selectedCompany, search, sortBy, resumeRoles]);

  // Pagination Slice
  const totalQuestions = filteredAndSortedQuestions.length;
  const totalPages = Math.max(1, Math.ceil(totalQuestions / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedQuestions = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredAndSortedQuestions.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedQuestions, validCurrentPage, pageSize]);

  // Generate Questions via NVIDIA Nemotron AI API
  const handleGenerateNvidiaQuestions = async (e?: React.FormEvent, customTargetRole?: string) => {
    if (e) e.preventDefault();
    const roleToUse = customTargetRole || genRole;
    setIsGenerating(true);
    setGenError(null);

    try {
      const resumeContext = userProfile 
        ? `Candidate: ${userProfile.fullName || 'Candidate'}. Target Roles: ${userProfile.targetRoles.map(r => r.title).join(', ')}. Skills: ${userProfile.topSkills.join(', ')}. Achievements: ${userProfile.keyAchievements?.join('; ') || 'Senior engineer'}`
        : '';

      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: roleToUse,
          category: genCategory,
          difficulty: genDifficulty,
          count: genCount,
          resumeContext,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate questions');
      }

      const generated: QuestionItem[] = (data.questions || []).map((q: any) => ({
        ...q,
        statusLabel: q.statusLabel || 'NVIDIA Nemotron AI • Calibrated',
        isBookmarked: true,
      }));

      setQuestions(prev => [...generated, ...prev]);
      setShowNvidiaModal(false);
      setIsGenerating(false);
      setSelectedRole(roleToUse);
      setGenSuccessNotice(`Generated ${generated.length} resume-calibrated questions for ${roleToUse} (ranked Easy → Hard)!`);
      setTimeout(() => setGenSuccessNotice(null), 6000);
    } catch (err: any) {
      console.error('NVIDIA Question Generation error:', err);
      setIsGenerating(false);
      setGenError(err?.message || 'Failed to generate questions. Please try again.');
    }
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;
    const newQ: QuestionItem = {
      id: `q-${Date.now()}`,
      title: customTitle,
      category: customCategory,
      difficulty: 'Medium',
      roleTarget: customRole,
      estimatedTime: '4 mins response',
      description: 'Customized target prompt synthesized for your specific interview preparation loop.',
      companies: ['Custom Prompt'],
      status: 'unattempted',
      statusLabel: 'Just added',
      isBookmarked: true
    };
    setQuestions([newQ, ...questions]);
    setShowCustomModal(false);
    setCustomTitle('');
    onPracticeQuestion(newQ);
  };

  const savedCount = questions.filter(q => q.isBookmarked).length;

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 font-label-micro text-label-micro text-outline uppercase tracking-wider mb-2">
        <span className="hover:text-on-surface cursor-pointer" onClick={() => _onNavigate('overview')}>Workspace</span>
        <span>/</span>
        <span className="text-primary font-semibold">Question Library</span>
      </div>

      {/* Simplified, Clear Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-on-surface tracking-tight leading-tight">
              Question Library
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-medium">
              {questions.length} questions
            </span>
          </div>
          <p className="text-sm sm:text-base text-on-surface-variant mt-1 font-normal">
            Practice real interview questions tailored to your target role.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            type="button"
            onClick={() => setShowSavedOnly(!showSavedOnly)}
            className={`h-9 px-3.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer ${
              showSavedOnly ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant/60'
            }`}
          >
            <span className={`material-symbols-outlined text-[16px] ${showSavedOnly ? 'text-on-primary' : 'text-tertiary'}`}>
              bookmark
            </span>
            <span>Saved ({savedCount})</span>
          </button>

          <button 
            type="button"
            onClick={() => {
              setGenRole(selectedRole !== 'All Roles' ? selectedRole : (userProfile?.targetRoles[0]?.title || 'Frontend Developer'));
              setShowNvidiaModal(true);
            }}
            className="h-9 px-3.5 rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-all shadow-sm font-medium text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            <span>Generate with AI</span>
          </button>

          <button 
            type="button"
            onClick={() => setShowCustomModal(true)}
            className="h-9 px-3.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant/60 transition-colors shadow-xs font-medium text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Add Custom</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {genSuccessNotice && (
        <div className="mb-4 p-3 rounded-xl bg-secondary-container text-on-secondary-container text-body-sm flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-secondary">check_circle</span>
            <span className="font-medium">{genSuccessNotice}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setGenSuccessNotice(null)}
            className="text-on-secondary-container/70 hover:text-on-secondary-container p-1"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Simple Search & Filter Controls */}
      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm mb-6 flex flex-col gap-3.5 border border-outline-variant/40">
        {/* Search Bar & Sort Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-outline pointer-events-none text-[18px]">search</span>
            <input 
              id="questionSearchInput" 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions by title, keyword, or company..."
              className="w-full h-10 pl-9 pr-9 rounded-lg bg-surface-container-low text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 text-outline hover:text-on-surface p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Sort Control */}
            <div className="flex items-center gap-1.5 px-3 h-10 rounded-lg bg-surface-container-low text-on-surface text-xs font-medium shrink-0">
              <span className="text-outline uppercase tracking-wider font-semibold">Sort:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs text-on-surface focus:outline-none cursor-pointer font-medium"
              >
                <option value="Easiest to Hardest">Easiest to Hardest</option>
                <option value="Hardest to Easiest">Hardest to Easiest</option>
                <option value="Recommended">Recommended</option>
                <option value="Most Practiced">Most Practiced</option>
              </select>
            </div>

            {(search || selectedRole !== 'All Roles' || (selectedCategory !== 'All Topics' && selectedCategory !== 'All Types (482)' && selectedCategory !== 'All Types') || selectedDifficulty !== 'All Levels' || selectedCompany || showSavedOnly) && (
              <button 
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedRole('All Roles');
                  setSelectedCategory('All Topics');
                  setSelectedDifficulty('All Levels');
                  setSelectedCompany(null);
                  setShowSavedOnly(false);
                  setSortBy('Easiest to Hardest');
                }}
                className="h-10 px-3 rounded-lg bg-surface-container-low hover:bg-surface-variant text-outline hover:text-on-surface text-xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer font-medium" 
                title="Reset Filters"
              >
                <span className="material-symbols-outlined text-[15px]">refresh</span>
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Rows */}
        <div className="flex flex-col gap-2.5 pt-1">
          {/* Roles Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-outline uppercase tracking-wider w-16 shrink-0">Role</span>
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              {displayedRolePills.map(role => {
                const isSelected = selectedRole === role;
                return (
                  <button 
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer font-medium ${
                      isSelected 
                        ? 'bg-on-surface text-surface-container-lowest shadow-xs' 
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    {role}
                  </button>
                );
              })}

              {/* Other Roles Dropdown Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowOtherRolesDropdown(!showOtherRolesDropdown)}
                  className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-variant transition-all cursor-pointer flex items-center gap-1 text-xs"
                >
                  <span className="material-symbols-outlined text-[14px]">tune</span>
                  <span>More Roles</span>
                </button>

                {showOtherRolesDropdown && (
                  <div className="absolute left-0 mt-1.5 w-60 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant p-2 z-30 flex flex-col gap-1 max-h-60 overflow-y-auto animate-in fade-in">
                    <span className="font-label-micro text-label-micro text-outline uppercase px-2 py-1">
                      Select Role:
                    </span>
                    {ALL_POSSIBLE_ROLES.map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setSelectedRole(r);
                          setShowOtherRolesDropdown(false);
                        }}
                        className={`text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          selectedRole === r ? 'bg-primary text-on-primary font-medium' : 'hover:bg-surface-container-low text-on-surface'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Topics Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-outline uppercase tracking-wider w-16 shrink-0">Topic</span>
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              {[
                { label: 'All Topics' },
                { label: 'Technical Architecture', dot: 'bg-primary' },
                { label: 'STAR Behavioral', dot: 'bg-secondary' },
                { label: 'System Design', dot: 'bg-tertiary' },
                { label: 'HR & Culture Fit' }
              ].map(cat => {
                const isSelected = selectedCategory === cat.label || (cat.label === 'All Topics' && (selectedCategory === 'All Topics' || selectedCategory === 'All Types' || selectedCategory === 'All Types (482)'));
                return (
                  <button 
                    key={cat.label}
                    type="button"
                    onClick={() => setSelectedCategory(cat.label)}
                    className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 cursor-pointer font-medium ${
                      isSelected 
                        ? 'bg-primary text-on-primary shadow-xs' 
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    {cat.dot && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : cat.dot}`}></span>}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-semibold text-outline uppercase tracking-wider w-16 shrink-0">Difficulty</span>
            <div className="flex items-center gap-1.5 text-xs">
              {[
                { label: 'All Levels' },
                { label: 'Easy' },
                { label: 'Medium' },
                { label: 'Hard' }
              ].map(diff => {
                const isSelected = selectedDifficulty === diff.label;
                return (
                  <button 
                    key={diff.label}
                    type="button"
                    onClick={() => setSelectedDifficulty(diff.label)}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer font-medium ${
                      isSelected 
                        ? 'bg-on-surface text-surface-container-lowest font-semibold shadow-xs' 
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    {diff.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Questions Stream (Full Width, Clean Layout) */}
      <div className="w-full flex flex-col gap-3">
        {/* Results Summary Header */}
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-xs sm:text-sm text-on-surface-variant font-medium">
            Showing <span className="text-on-surface font-semibold">{filteredAndSortedQuestions.length}</span> questions
          </span>
          <div className="flex items-center gap-3 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-secondary"></span> Passed</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-tertiary"></span> Review</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-outline/40"></span> Unattempted</span>
          </div>
        </div>

          {filteredAndSortedQuestions.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-lg p-10 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
              <span className="material-symbols-outlined text-[36px] text-outline">search_off</span>
              <p className="font-headline-sm text-headline-sm text-on-surface font-semibold">No questions match your current filters</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
                Clear your keyword search or filter selection to explore all vetted practice questions.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSelectedRole('All Roles');
                    setSelectedCategory('All Types (482)');
                    setSelectedDifficulty('All Levels');
                    setSelectedCompany(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-on-primary-fixed-variant transition-colors cursor-pointer"
                >
                  Reset Filters &amp; View All
                </button>
              </div>
            </div>
          ) : (
            paginatedQuestions.map((q) => (
              <div 
                key={q.id}
                className="group bg-surface-container-lowest rounded-lg p-space-md shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-space-md">
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    {/* Badges Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-primary-fixed/50 text-on-primary-fixed-variant font-label-micro text-label-micro font-semibold uppercase tracking-wider">
                        {q.category}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded font-label-micro text-label-micro font-medium ${
                        q.difficulty === 'Easy' ? 'bg-secondary-container/40 text-secondary' :
                        q.difficulty === 'Medium' ? 'bg-tertiary-fixed/40 text-tertiary' : 'bg-error-container/40 text-error'
                      }`}>
                        {q.difficulty}
                      </span>
                      <span className="text-outline font-label-micro text-label-micro">•</span>
                      <span className="text-on-surface-variant font-label-micro text-label-micro">{q.roleTarget}</span>
                      <span className="text-outline font-label-micro text-label-micro">•</span>
                      <span className="text-outline font-label-micro text-label-micro flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">schedule</span> {q.estimatedTime}
                      </span>
                    </div>

                    {/* Title / Prompt */}
                    <h2 
                      onClick={() => onPracticeQuestion(q)}
                      className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors cursor-pointer"
                    >
                      {q.title}
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                      {q.description}
                    </p>

                    {/* Company benchmark & Personal Practice Status */}
                    <div className="flex items-center justify-between pt-2 mt-1 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-outline text-[15px]">apartment</span>
                        <span className="font-label-micro text-label-micro text-outline">Frequently asked at:</span>
                        <span className="font-label-micro text-label-micro text-on-surface font-medium">{q.companies.join(', ')}</span>
                      </div>

                      {/* Status Tag */}
                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full font-label-micro text-label-micro font-medium ${
                        q.status === 'passed' ? 'bg-secondary-container/20 text-secondary' :
                        q.status === 'review' ? 'bg-error-container/20 text-error' :
                        'bg-surface-container text-on-surface-variant'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          q.status === 'passed' ? 'bg-secondary' :
                          q.status === 'review' ? 'bg-error' : 'bg-outline'
                        }`}></span>
                        <span>{q.statusLabel || (q.status === 'unattempted' ? 'Not attempted yet' : q.status)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button 
                      type="button"
                      onClick={(e) => toggleBookmark(q.id, e)}
                      className="p-1.5 rounded hover:bg-surface-container-low transition-colors cursor-pointer" 
                      title={q.isBookmarked ? "Remove Bookmark" : "Bookmark"}
                    >
                      <span 
                        className={`material-symbols-outlined text-[18px] ${q.isBookmarked ? 'text-tertiary' : 'text-outline hover:text-on-surface'}`}
                        style={q.isBookmarked ? { fontVariationSettings: "'FILL' 1" } : {}}
                      >
                        {q.isBookmarked ? 'star' : 'star'}
                      </span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => onPracticeQuestion(q)}
                      className="h-[30px] px-3 rounded bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors flex items-center gap-1 shadow-sm mt-3 cursor-pointer"
                    >
                      <span>Practice</span>
                      <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Pagination / Summary Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-space-md bg-surface-container-lowest rounded-lg shadow-sm mt-space-xs gap-3">
            <span className="font-body-sm text-body-sm text-outline">
              Showing {totalQuestions === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1}–{Math.min(validCurrentPage * pageSize, totalQuestions)} of {totalQuestions} matching loop questions
            </span>
            <div className="flex items-center gap-1 font-label-md text-label-md">
              <button 
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={validCurrentPage <= 1}
                className="px-2.5 py-1 rounded bg-surface-container-low text-on-surface-variant hover:bg-surface-variant transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              
              {/* Dynamic Page Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer font-medium ${
                    validCurrentPage === pageNum
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'hover:bg-surface-container-low text-on-surface'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button 
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage >= totalPages}
                className="px-2.5 py-1 rounded bg-surface-container-low text-on-surface-variant hover:bg-surface-variant transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>

      {/* NVIDIA AI Generation Modal */}
      {showNvidiaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-xl border border-outline-variant flex flex-col gap-4 text-on-surface">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                    Synthesize AI Interview Questions
                  </h3>
                  <span className="font-label-micro text-label-micro text-secondary font-medium">
                    Powered by NVIDIA Nemotron 3.5 AI Engine • Ranked Easy to Hard
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNvidiaModal(false)}
                disabled={isGenerating}
                className="text-outline hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {genError && (
              <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{genError}</span>
              </div>
            )}

            <form onSubmit={(e) => handleGenerateNvidiaQuestions(e)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm font-medium text-on-surface">
                  Target Role / Track (From your resume)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {userProfile?.targetRoles?.map(tr => (
                    <button
                      key={tr.title}
                      type="button"
                      onClick={() => setGenRole(tr.title)}
                      className={`px-2.5 py-1 rounded-full text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                        genRole === tr.title 
                          ? 'bg-primary text-on-primary font-medium shadow-xs' 
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      <span>{tr.title}</span>
                      <span className="text-[10px] opacity-80">({tr.match}%)</span>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={genRole}
                  onChange={(e) => setGenRole(e.target.value)}
                  placeholder="e.g., Frontend Lead or Backend Developer"
                  className="w-full p-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm font-medium text-on-surface">Category</label>
                  <select
                    value={genCategory}
                    onChange={(e) => setGenCategory(e.target.value)}
                    className="h-10 px-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface border border-outline-variant focus:outline-none"
                  >
                    <option>Technical Architecture</option>
                    <option>STAR Behavioral</option>
                    <option>System Design</option>
                    <option>React Internals</option>
                    <option>Database Internals</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm font-medium text-on-surface">Progression</label>
                  <select
                    value={genDifficulty}
                    onChange={(e) => setGenDifficulty(e.target.value)}
                    className="h-10 px-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface border border-outline-variant focus:outline-none"
                  >
                    <option value="All Levels (Easy to Hard)">Easy → Hard Progression</option>
                    <option value="Easy">Easy Only</option>
                    <option value="Medium">Medium Only</option>
                    <option value="Hard">Hard Only</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm font-medium text-on-surface flex items-center justify-between">
                  <span>Questions to Generate</span>
                  <span className="font-bold text-primary">{genCount} questions</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 4, 5, 6].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setGenCount(cnt)}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        genCount === cnt
                          ? 'bg-primary text-on-primary shadow-xs'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {cnt} Prompts
                    </button>
                  ))}
                </div>
              </div>

              {userProfile && (
                <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container flex items-start gap-2 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">verified_user</span>
                  <span>
                    Questions will be synthesized against candidate skills: <strong>{userProfile.topSkills.slice(0, 5).join(', ')}</strong>.
                  </span>
                </div>
              )}

              {isGenerating && (
                <div className="p-3 rounded-xl bg-primary-fixed/20 border border-primary/20 flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0"></div>
                  <div className="flex flex-col text-xs">
                    <span className="font-semibold text-primary">Synthesizing realistic FAANG interview questions...</span>
                    <span className="text-on-surface-variant">NVIDIA Nemotron 3.5 AI is ranking progression from Easy to Hard</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setShowNvidiaModal(false)}
                  disabled={isGenerating}
                  className="px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || !genRole.trim()}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-sm font-medium shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                      <span>Generating Progression...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                      <span>Generate Easy → Hard Progression</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Prompt Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-xl border border-outline-variant flex flex-col gap-4 text-on-surface">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                Create Custom Interview Prompt
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-outline hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm font-medium text-on-surface">Question Prompt</label>
                <textarea
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. How do you design an optimistic offline mutation sync queue in React with IndexedDB?"
                  rows={3}
                  className="w-full p-2.5 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm font-medium text-on-surface">Role</label>
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    className="w-full p-2 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface border border-outline-variant focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm font-medium text-on-surface">Category</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="h-10 px-2 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface border border-outline-variant focus:outline-none"
                  >
                    <option>Technical Architecture</option>
                    <option>STAR Behavioral</option>
                    <option>System Design</option>
                    <option>React Internals</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-container">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-surface-container text-on-surface text-sm font-medium hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!customTitle.trim()}
                  className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:bg-on-primary-fixed-variant transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  Add &amp; Practice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
