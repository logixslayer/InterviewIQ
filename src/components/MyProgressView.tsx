import React, { useState, useEffect, useMemo } from 'react';
import { ViewMode, UserProfile } from '../types';
import { AuthUser } from '../services/authService';
import { fetchUserSessions } from '../services/interviewService';
import {
  TimeRangeFilter,
  CompetencyCategory,
  NormalizedSession,
  normalizeSessionRecord,
  filterSessionsByTimeRange,
  calculateMetrics,
  calculateTrajectoryPoints,
  calculateCompetencies,
  generatePracticeHeatmap,
  deriveDiagnostics,
  deriveRecommendation,
  HeatmapCell,
} from '../services/progressAnalytics';
import { RECENT_INTERVIEWS_DATA } from '../data/mockData';

export interface MyProgressViewProps {
  onNavigate: (view: ViewMode) => void;
  authUser?: AuthUser | null;
  userProfile?: UserProfile | null;
  recentInterviews?: any[];
}

export const MyProgressView: React.FC<MyProgressViewProps> = ({
  onNavigate,
  authUser,
  userProfile,
  recentInterviews,
}) => {
  // Filter and view controls
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('30days');
  const [searchQuery, setSearchQuery] = useState('');
  const [competencyTab, setCompetencyTab] = useState<CompetencyCategory>('all');
  const [activeChartPointIndex, setActiveChartPointIndex] = useState<number | null>(null);
  const [hoveredHeatmapCell, setHoveredHeatmapCell] = useState<HeatmapCell | null>(null);

  // Live session state
  const [serverSessions, setServerSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load real user sessions from backend
  useEffect(() => {
    let isMounted = true;
    const userId = authUser?.uid || authUser?.id || 'candidate_main';

    async function loadSessions() {
      setIsLoading(true);
      try {
        const res = await fetchUserSessions(userId);
        if (isMounted && res.success && Array.isArray(res.sessions)) {
          setServerSessions(res.sessions);
        }
      } catch (err) {
        console.warn('Unable to load server sessions for progress analytics:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSessions();

    return () => {
      isMounted = false;
    };
  }, [authUser]);

  // Combine and normalize all session records
  const allNormalizedSessions: NormalizedSession[] = useMemo(() => {
    const sessionMap = new Map<string, NormalizedSession>();

    // 1. Process server-persisted sessions
    serverSessions.forEach((s, idx) => {
      const norm = normalizeSessionRecord(s, idx);
      sessionMap.set(norm.id, norm);
    });

    // 2. Process recent sessions from localStorage/App state
    const localList = Array.isArray(recentInterviews) && recentInterviews.length > 0
      ? recentInterviews
      : [];

    localList.forEach((s, idx) => {
      const norm = normalizeSessionRecord(s, idx);
      if (!sessionMap.has(norm.id)) {
        sessionMap.set(norm.id, norm);
      }
    });

    // 3. Fallback: If user has neither server nor local sessions, check if mock data is used
    if (sessionMap.size === 0 && RECENT_INTERVIEWS_DATA.length > 0) {
      RECENT_INTERVIEWS_DATA.forEach((s, idx) => {
        const norm = normalizeSessionRecord(s, idx);
        sessionMap.set(norm.id, norm);
      });
    }

    // Sort by completion date descending (most recent first)
    return Array.from(sessionMap.values()).sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
  }, [serverSessions, recentInterviews]);

  // Filter sessions by active time range
  const { currentPeriodSessions, priorPeriodSessions } = useMemo(() => {
    const { currentPeriod, priorPeriod } = filterSessionsByTimeRange(
      allNormalizedSessions,
      timeRange
    );
    return { currentPeriodSessions: currentPeriod, priorPeriodSessions: priorPeriod };
  }, [allNormalizedSessions, timeRange]);

  // Key performance metrics
  const metrics = useMemo(() => {
    return calculateMetrics(
      currentPeriodSessions,
      priorPeriodSessions,
      timeRange,
      userProfile
    );
  }, [currentPeriodSessions, priorPeriodSessions, timeRange, userProfile]);

  // Trajectory points for the score curve
  const trajectoryPoints = useMemo(() => {
    return calculateTrajectoryPoints(currentPeriodSessions);
  }, [currentPeriodSessions]);

  // Default active chart point to the latest observation
  useEffect(() => {
    if (trajectoryPoints.length > 0) {
      setActiveChartPointIndex(trajectoryPoints.length - 1);
    } else {
      setActiveChartPointIndex(null);
    }
  }, [trajectoryPoints]);

  const activePoint = activeChartPointIndex !== null && trajectoryPoints[activeChartPointIndex]
    ? trajectoryPoints[activeChartPointIndex]
    : null;

  // Competency dimensions
  const allCompetencies = useMemo(() => {
    return calculateCompetencies(currentPeriodSessions);
  }, [currentPeriodSessions]);

  const filteredCompetencies = useMemo(() => {
    if (competencyTab === 'technical') {
      return allCompetencies.filter(c => c.category === 'technical');
    }
    if (competencyTab === 'behavioral') {
      return allCompetencies.filter(c => c.category === 'behavioral');
    }
    return allCompetencies;
  }, [allCompetencies, competencyTab]);

  // Practice activity heatmap (past 8 weeks)
  const heatmap = useMemo(() => {
    return generatePracticeHeatmap(allNormalizedSessions);
  }, [allNormalizedSessions]);

  // Evidence-based diagnostics
  const diagnostics = useMemo(() => {
    return deriveDiagnostics(currentPeriodSessions);
  }, [currentPeriodSessions]);

  // Recommended practice drill
  const recommendedDrill = useMemo(() => {
    return deriveRecommendation(currentPeriodSessions, allCompetencies, userProfile);
  }, [currentPeriodSessions, allCompetencies, userProfile]);

  // Evaluated mock assessments list with search filtering
  const filteredAssessments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentPeriodSessions;

    return currentPeriodSessions.filter((s) => {
      return (
        s.title.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.persona.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    });
  }, [currentPeriodSessions, searchQuery]);

  // Heatmap level styling
  const getHeatmapColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-primary-fixed hover:ring-2 hover:ring-primary/40';
      case 2:
        return 'bg-primary-container hover:ring-2 hover:ring-primary/50 text-white';
      case 3:
        return 'bg-primary hover:ring-2 hover:ring-primary/60 text-white';
      default:
        return 'bg-surface-container-high hover:bg-surface-container-highest';
    }
  };

  // Target candidate role name
  const candidateRole = userProfile?.primaryRole || 'Engineering Candidate';
  const candidateLevel = userProfile?.experienceLevel || 'Intermediate';

  return (
    <div className="flex flex-col w-full pb-20 max-w-7xl mx-auto space-y-6">
      
      {/* =========================================================================
          PRINT-ONLY EXECUTIVE REPORT HEADER
          Visible only when printing or exporting via browser print
      ========================================================================= */}
      <div className="hidden print:block mb-6 pb-4 border-b border-black">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-black">InterviewIQ Candidate Progress Report</h1>
            <p className="text-sm text-gray-700 mt-1">
              Candidate: <strong>{userProfile?.fullName || authUser?.fullName || 'Candidate'}</strong> ({userProfile?.email || authUser?.email || ''})
            </p>
            <p className="text-sm text-gray-700">
              Role Target: <strong>{candidateRole}</strong> ({candidateLevel})
            </p>
          </div>
          <div className="text-right text-xs text-gray-600">
            <p>Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
            <p>Window: {timeRange === '30days' ? 'Last 30 Days' : timeRange === 'quarter' ? 'Last Quarter' : 'All Time'}</p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION A: ADVANCED PAGE HEADER & TELEMETRY COMMAND BAR
      ========================================================================= */}
      <header className="flex flex-col gap-4 pb-4 border-b border-surface-variant/40">
        {/* Breadcrumb strip */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-outline font-medium tracking-wide">
          <button 
            type="button" 
            onClick={() => onNavigate('overview')}
            className="hover:text-primary transition-colors cursor-pointer flex items-center gap-1 focus:outline-none focus:underline"
          >
            <span className="material-symbols-outlined text-[14px]">grid_view</span>
            Workspace
          </button>
          <span className="text-outline-variant" aria-hidden="true">/</span>
          <span className="text-on-surface-variant">Improvement</span>
          <span className="text-outline-variant" aria-hidden="true">/</span>
          <span className="text-primary font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
            My Progress
          </span>
        </nav>

        {/* Title & Evidence-Based Status Cluster */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                My Progress
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Evidence-Based Readiness Badge */}
                {metrics.readinessIndex !== null ? (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-xs ${
                    metrics.readinessIndex >= 80
                      ? 'bg-secondary-container/30 text-secondary border-secondary/20'
                      : metrics.readinessIndex >= 65
                      ? 'bg-primary-fixed/30 text-primary border-primary/20'
                      : 'bg-tertiary-container/20 text-tertiary border-tertiary/20'
                  }`}>
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        metrics.readinessIndex >= 80 ? 'bg-secondary' : 'bg-primary'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${
                        metrics.readinessIndex >= 80 ? 'bg-secondary' : 'bg-primary'
                      }`}></span>
                    </span>
                    {metrics.readinessStatus} ({metrics.readinessIndex}%)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium border border-surface-variant shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-outline"></span>
                    Awaiting Baseline
                  </span>
                )}

                {/* Target Role & Level */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high/60 text-on-surface text-xs font-medium border border-surface-variant/80 shadow-xs">
                  <span className="material-symbols-outlined text-[14px] text-primary">target</span>
                  {candidateRole} ({candidateLevel})
                </span>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant max-w-2xl font-normal leading-relaxed">
              Track your interview readiness trajectory, competence progression, and practice consistency across roles.
            </p>
          </div>

          {/* Controls Bar: Search + Time Range Selector + Download */}
          <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto no-print">
            {/* Search Input */}
            <div className="relative flex items-center">
              <span className="material-symbols-outlined text-[16px] text-outline absolute left-2.5 pointer-events-none" aria-hidden="true">
                search
              </span>
              <input
                type="text"
                id="progress-search-input"
                aria-label="Search mock sessions and competencies"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sessions or roles..."
                className="h-9 pl-8 pr-7 text-xs bg-surface-container-lowest border border-surface-variant/80 rounded-lg text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-44 sm:w-56 transition-all shadow-xs"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-outline hover:text-on-surface text-xs p-0.5 rounded cursor-pointer"
                  title="Clear search"
                  aria-label="Clear search query"
                >
                  ✕
                </button>
              ) : (
                <kbd className="hidden sm:inline-block absolute right-2 px-1.5 py-0.5 text-[10px] text-outline bg-surface-container rounded border border-surface-variant font-mono pointer-events-none">
                  /
                </kbd>
              )}
            </div>

            {/* Time window selector */}
            <div className="inline-flex p-1 bg-surface-container rounded-lg border border-surface-variant/40 shadow-xs" role="group" aria-label="Filter analytics time range">
              <button
                type="button"
                id="filter-range-30days"
                onClick={() => setTimeRange('30days')}
                aria-pressed={timeRange === '30days'}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                  timeRange === '30days'
                    ? 'text-on-surface bg-surface-container-lowest shadow-xs font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                id="filter-range-quarter"
                onClick={() => setTimeRange('quarter')}
                aria-pressed={timeRange === 'quarter'}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                  timeRange === 'quarter'
                    ? 'text-on-surface bg-surface-container-lowest shadow-xs font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Last Quarter
              </button>
              <button
                type="button"
                id="filter-range-all"
                onClick={() => setTimeRange('all')}
                aria-pressed={timeRange === 'all'}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                  timeRange === 'all'
                    ? 'text-on-surface bg-surface-container-lowest shadow-xs font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                All Time
              </button>
            </div>

            {/* Download / Print Report */}
            <button
              type="button"
              id="export-progress-report-btn"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-on-surface text-xs font-medium border border-surface-variant/80 shadow-xs transition-colors cursor-pointer active:scale-[0.98]"
              title="Print or export progress summary"
              aria-label="Export or print progress summary"
            >
              <span className="material-symbols-outlined text-[16px] text-outline">file_download</span>
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          SECTION B: KEY PERFORMANCE BENTO GRID (4 EVIDENCE-BASED METRIC CARDS)
      ========================================================================= */}
      <section aria-label="Key Performance Overview" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Readiness Index */}
        <div className="bg-surface-container-lowest rounded-xl p-4.5 border border-surface-variant/50 shadow-xs hover:border-primary/30 transition-all flex flex-col justify-between min-h-[168px] group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-outline uppercase tracking-wider">
              Readiness Index
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
              metrics.readinessIndex !== null && metrics.readinessIndex >= 80
                ? 'bg-secondary-container/25 text-secondary border-secondary/20'
                : metrics.readinessIndex !== null && metrics.readinessIndex >= 65
                ? 'bg-primary-fixed/20 text-primary border-primary/20'
                : 'bg-surface-container text-outline border-surface-variant'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                metrics.readinessIndex !== null && metrics.readinessIndex >= 80
                  ? 'bg-secondary'
                  : metrics.readinessIndex !== null
                  ? 'bg-primary'
                  : 'bg-outline'
              }`}></span>
              {metrics.readinessStatus}
            </span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold text-on-surface tracking-tight font-mono">
                {metrics.readinessIndex !== null ? `${metrics.readinessIndex}%` : '—'}
              </span>
              {metrics.scoreChangeVsPrior !== null && (
                <span className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${
                  metrics.scoreChangeVsPrior >= 0
                    ? 'text-secondary bg-secondary-container/20'
                    : 'text-tertiary bg-tertiary-container/20'
                }`}>
                  <span className="material-symbols-outlined text-[14px] mr-0.5">
                    {metrics.scoreChangeVsPrior >= 0 ? 'trending_up' : 'trending_down'}
                  </span>
                  {metrics.scoreChangeVsPrior >= 0 ? `+${metrics.scoreChangeVsPrior}%` : `${metrics.scoreChangeVsPrior}%`} vs prior
                </span>
              )}
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-2 mt-2.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  (metrics.readinessIndex || 0) >= 80 ? 'bg-secondary' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(100, metrics.readinessIndex || 0)}%` }}
              ></div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-outline pt-1 border-t border-surface-variant/30">
            <span>Target benchmark</span>
            <span className="font-semibold text-on-surface-variant">80% passing bar</span>
          </div>
        </div>

        {/* Metric 2: Average Score */}
        <div className="bg-surface-container-lowest rounded-xl p-4.5 border border-surface-variant/50 shadow-xs hover:border-primary/30 transition-all flex flex-col justify-between min-h-[168px] group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-outline uppercase tracking-wider">
              Average Score
            </span>
            <span className="text-[11px] text-outline font-medium px-2 py-0.5 rounded bg-surface-container">
              {metrics.evaluatedSessionsCount} {metrics.evaluatedSessionsCount === 1 ? 'evaluated session' : 'evaluated sessions'}
            </span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-bold text-on-surface tracking-tight font-mono">
                {metrics.averageScore !== null ? metrics.averageScore : '—'}
              </span>
              <span className="text-sm font-semibold text-outline">/ 100</span>
            </div>
            <div className="flex items-center gap-1 mt-3" title="Competency spread">
              {metrics.evaluatedSessionsCount > 0 ? (
                <>
                  <span className="h-2 flex-1 rounded-full bg-secondary" title="Passing threshold met"></span>
                  <span className="h-2 flex-1 rounded-full bg-secondary" title="Technical competency"></span>
                  <span className="h-2 flex-1 rounded-full bg-primary" title="Communication clarity"></span>
                  <span className="h-2 flex-1 rounded-full bg-primary-container" title="System architecture"></span>
                  <span className="h-2 flex-1 rounded-full bg-surface-container-high" title="Target reserve"></span>
                </>
              ) : (
                <div className="w-full h-2 rounded-full bg-surface-container-high" title="No evaluated sessions"></div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-outline pt-1 border-t border-surface-variant/30">
            <span>Evaluated volume</span>
            <span className="font-semibold text-on-surface-variant">
              {metrics.totalSessions > 0 ? `${metrics.evaluatedSessionsCount} of ${metrics.totalSessions} sessions scored` : 'No data yet'}
            </span>
          </div>
        </div>

        {/* Metric 3: Practice Frequency */}
        <div className="bg-surface-container-lowest rounded-xl p-4.5 border border-surface-variant/50 shadow-xs hover:border-primary/30 transition-all flex flex-col justify-between min-h-[168px] group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-outline uppercase tracking-wider">
              Practice Frequency
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-medium border border-surface-variant">
              Target: 3.0/wk
            </span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-bold text-on-surface tracking-tight font-mono">
                {metrics.practiceFrequencyPerWeek}
              </span>
              <span className="text-xs text-outline font-medium">sessions / wk</span>
            </div>
            <div className="flex items-center justify-between mt-2.5 text-xs font-medium">
              <span className={`flex items-center gap-1 ${
                metrics.practiceFrequencyPerWeek >= 3.0 ? 'text-secondary' : 'text-on-surface-variant'
              }`}>
                <span className="material-symbols-outlined text-[15px]">
                  {metrics.practiceFrequencyPerWeek >= 3.0 ? 'check_circle' : 'schedule'}
                </span>
                {metrics.practiceFrequencyPerWeek >= 3.0 ? 'On Target pace' : 'Building pace'}
              </span>
              <span className="text-outline text-[11px]">{metrics.activeDaysCount} active days</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-outline pt-1 border-t border-surface-variant/30">
            <span>Rhythm pace</span>
            <span className="font-semibold text-on-surface-variant">
              {metrics.practiceFrequencyPerWeek >= 3.0 ? 'Consistent sustained' : metrics.totalSessions > 0 ? 'Regular practice' : 'Start initial drill'}
            </span>
          </div>
        </div>

        {/* Metric 4: Total Practice Time & Streak */}
        <div className="bg-surface-container-lowest rounded-xl p-4.5 border border-surface-variant/50 shadow-xs hover:border-primary/30 transition-all flex flex-col justify-between min-h-[168px] group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-outline uppercase tracking-wider">
              Practice Time
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
              metrics.currentStreakDays > 0
                ? 'bg-tertiary-container/15 text-tertiary border-tertiary/20'
                : 'bg-surface-container text-outline border-surface-variant'
            }`}>
              <span className="material-symbols-outlined text-[13px]">local_fire_department</span>
              {metrics.currentStreakDays}-Day Streak
            </span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-bold text-on-surface tracking-tight font-mono">
                {metrics.totalDurationLabel}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2.5 text-xs text-outline">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                Active drills
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary inline-block"></span>
                {metrics.totalSessions} completed
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-outline pt-1 border-t border-surface-variant/30">
            <span>Consistency milestone</span>
            <span className="font-semibold text-on-surface-variant">
              {metrics.currentStreakDays >= 5 ? '5-Day Streak reached' : `${metrics.currentStreakDays} of 5 days goal`}
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MAIN ANALYTICAL AREA: 12-COLUMN ASYMMETRIC BENTO GRID
          Left (7 cols): Section C (Score Trajectory) + Section E (Consistency Rhythm Heatmap)
          Right (5 cols): Section D (Competency Matrix) + Benchmark & Recommended Action
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* =======================================================================
            LEFT COLUMN (7 COLS): CORE QUANTITATIVE TELEMETRY
        ======================================================================= */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* SECTION C: READINESS SCORE TRAJECTORY (INTERACTIVE SVG HERO CHART) */}
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-surface-variant/50 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 gap-2 border-b border-surface-variant/30">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-outline uppercase tracking-wider">
                      Score Trajectory
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    <span className="text-xs font-semibold text-primary">
                      Historical Observations
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-on-surface mt-0.5 tracking-tight">
                    Composite Readiness Progression
                  </h2>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                    <span className="w-3 h-1 bg-primary rounded-full"></span>
                    <span>Actual Evaluation</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-outline">
                    <span className="w-3 h-0.5 bg-outline rounded-full border-dashed"></span>
                    <span>Standard Passing Target (80)</span>
                  </div>
                </div>
              </div>

              {/* Chart Content Area */}
              {trajectoryPoints.length > 0 ? (
                <div className="w-full relative mt-3 bg-surface-container-low/70 rounded-xl p-3 border border-surface-variant/30">
                  <svg 
                    className="w-full h-48 text-on-surface transition-all select-none" 
                    fill="none" 
                    preserveAspectRatio="none" 
                    viewBox="0 0 600 170"
                    role="img"
                    aria-label={`Score trajectory chart showing ${trajectoryPoints.length} evaluated mock interview sessions`}
                  >
                    {/* Grid Lines */}
                    <line stroke="currentColor" strokeDasharray="3 3" strokeOpacity="0.08" x1="40" x2="580" y1="25" y2="25" />
                    <text fill="currentColor" fillOpacity="0.4" fontFamily="Geist" fontSize="10" textAnchor="end" x="32" y="29">100</text>
                    
                    {/* Standard Passing Target Baseline (80) */}
                    <line stroke="#107e54" strokeDasharray="4 4" strokeOpacity="0.35" strokeWidth="1.5" x1="40" x2="580" y1="65" y2="65" />
                    <text fill="#107e54" fontFamily="Geist" fontSize="10" fontWeight="600" textAnchor="end" x="32" y="69">80</text>
                    <text fill="#107e54" fontFamily="Geist" fontSize="9" fontWeight="600" textAnchor="end" x="575" y="58">Target Standard (80)</text>
                    
                    <line stroke="currentColor" strokeDasharray="3 3" strokeOpacity="0.08" x1="40" x2="580" y1="105" y2="105" />
                    <text fill="currentColor" fillOpacity="0.4" fontFamily="Geist" fontSize="10" textAnchor="end" x="32" y="109">60</text>

                    {/* Gradient Area Definition */}
                    <defs>
                      <linearGradient id="scoreTrajectoryGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#5267D8" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#5267D8" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>

                    {/* Shaded Area Under Curve (only if >= 2 points) */}
                    {trajectoryPoints.length > 1 && (
                      <path 
                        d={`M ${trajectoryPoints[0].x} ${trajectoryPoints[0].y} ` +
                          trajectoryPoints.map(p => `L ${p.x} ${p.y}`).join(' ') +
                          ` L ${trajectoryPoints[trajectoryPoints.length - 1].x} 150 L ${trajectoryPoints[0].x} 150 Z`} 
                        fill="url(#scoreTrajectoryGrad)" 
                      />
                    )}
                    
                    {/* Actual Evaluated Score Path (only if >= 2 points) */}
                    {trajectoryPoints.length > 1 && (
                      <path 
                        d={`M ${trajectoryPoints[0].x} ${trajectoryPoints[0].y} ` +
                          trajectoryPoints.map(p => `L ${p.x} ${p.y}`).join(' ')} 
                        stroke="#5267D8" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="3" 
                      />
                    )}

                    {/* Data Points */}
                    {trajectoryPoints.map((pt, idx) => {
                      const isSelected = activePoint?.index === idx;
                      return (
                        <g 
                          key={pt.id || idx} 
                          className="cursor-pointer focus:outline-none" 
                          tabIndex={0}
                          role="button"
                          aria-label={`Session on ${pt.dateLabel}: score ${pt.score}`}
                          onClick={() => setActiveChartPointIndex(idx)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setActiveChartPointIndex(idx);
                            }
                          }}
                        >
                          <circle 
                            cx={pt.x} 
                            cy={pt.y} 
                            fill={isSelected ? '#5267D8' : '#ffffff'} 
                            r={isSelected ? '6.5' : '4.5'} 
                            stroke="#5267D8" 
                            strokeWidth="2.5" 
                          />
                          <rect 
                            fill={isSelected ? '#5267D8' : '#ffffff'} 
                            filter="drop-shadow(0 1px 2px rgba(0,0,0,0.1))" 
                            height="16" 
                            rx="3.5" 
                            width="30" 
                            x={pt.x - 15} 
                            y={pt.y - 22} 
                          />
                          <text 
                            fill={isSelected ? '#ffffff' : '#191919'} 
                            fontFamily="Geist" 
                            fontSize="9.5" 
                            fontWeight="700" 
                            textAnchor="middle" 
                            x={pt.x} 
                            y={pt.y - 11}
                          >
                            {pt.score}
                          </text>
                          <text 
                            fill="currentColor" 
                            fillOpacity="0.6" 
                            fontFamily="Geist" 
                            fontSize="9" 
                            textAnchor="middle" 
                            x={pt.x} 
                            y="162"
                          >
                            {pt.dateLabel}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Interactive Tooltip Callout */}
                  {activePoint && (
                    <div className="mt-2 px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-variant/80 shadow-xs flex items-center justify-between text-xs animate-enter-fade flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">{activePoint.dateLabel}:</span>
                        <span className="text-on-surface font-medium truncate max-w-xs">{activePoint.title}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-on-surface">{activePoint.score} / 100</span>
                        <span className={`font-semibold text-[11px] px-1.5 py-0.5 rounded ${
                          activePoint.deltaFromBaseline >= 0
                            ? 'text-secondary bg-secondary-container/20'
                            : 'text-tertiary bg-tertiary-container/20'
                        }`}>
                          {activePoint.deltaFromBaseline >= 0 ? `+${activePoint.deltaFromBaseline} pts vs baseline` : `${activePoint.deltaFromBaseline} pts vs baseline`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Accessible Table for Screen Readers */}
                  <details className="mt-2 text-xs text-outline cursor-pointer no-print">
                    <summary className="font-medium hover:text-on-surface">View accessible data table</summary>
                    <table className="w-full mt-2 text-left border-collapse border border-surface-variant">
                      <thead>
                        <tr className="bg-surface-container">
                          <th className="p-1 border border-surface-variant">Date</th>
                          <th className="p-1 border border-surface-variant">Session</th>
                          <th className="p-1 border border-surface-variant">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trajectoryPoints.map(p => (
                          <tr key={p.id}>
                            <td className="p-1 border border-surface-variant">{p.dateLabel}</td>
                            <td className="p-1 border border-surface-variant">{p.title}</td>
                            <td className="p-1 border border-surface-variant">{p.score} / 100</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                </div>
              ) : (
                /* Understandable Empty State when 0 evaluated sessions */
                <div className="w-full mt-3 p-8 bg-surface-container-low/70 rounded-xl border border-surface-variant/30 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-outline mb-2">
                    <span className="material-symbols-outlined text-[24px]">show_chart</span>
                  </div>
                  <h3 className="text-sm font-bold text-on-surface">No Evaluated Sessions Yet</h3>
                  <p className="text-xs text-on-surface-variant mt-1 max-w-sm leading-relaxed">
                    Complete your first mock interview simulation to establish your baseline score and start plotting your performance trajectory.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('mock-interviews')}
                    className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-xs cursor-pointer active:scale-[0.98] transition-all"
                  >
                    <span>Start First Mock Interview</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3 Telemetry Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-surface-variant/30 text-center">
              <div className="p-3 rounded-lg bg-surface-container-low/80 border border-surface-variant/30 flex flex-col justify-between">
                <span className="text-xs font-semibold text-outline uppercase tracking-wider">
                  Baseline Gain
                </span>
                <span className="text-xl font-bold text-secondary font-mono mt-1">
                  {trajectoryPoints.length > 1
                    ? `${trajectoryPoints[trajectoryPoints.length - 1].score - trajectoryPoints[0].score >= 0 ? '+' : ''}${trajectoryPoints[trajectoryPoints.length - 1].score - trajectoryPoints[0].score} pts`
                    : '—'}
                </span>
                <span className="text-xs text-outline mt-0.5">
                  {trajectoryPoints.length > 1 ? `over ${trajectoryPoints.length} sessions` : 'Requires 2+ sessions'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low/80 border border-surface-variant/30 flex flex-col justify-between">
                <span className="text-xs font-semibold text-outline uppercase tracking-wider">
                  Pacing Status
                </span>
                <span className="text-xl font-bold text-on-surface font-mono mt-1">
                  {metrics.practiceFrequencyPerWeek >= 3.0 ? 'Optimal' : metrics.totalSessions > 0 ? 'Calibrating' : 'Pending'}
                </span>
                <span className="text-xs text-secondary font-medium mt-0.5">
                  {metrics.practiceFrequencyPerWeek >= 3.0 ? 'Ahead of target' : 'Regular pace'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low/80 border border-surface-variant/30 flex flex-col justify-between">
                <span className="text-xs font-semibold text-outline uppercase tracking-wider">
                  Latest Score
                </span>
                <span className="text-xl font-bold text-primary font-mono mt-1">
                  {trajectoryPoints.length > 0 ? `${trajectoryPoints[trajectoryPoints.length - 1].score} / 100` : '—'}
                </span>
                <span className="text-xs text-outline mt-0.5">
                  {trajectoryPoints.length > 0 ? trajectoryPoints[trajectoryPoints.length - 1].dateLabel : 'No drills yet'}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION E: CONSISTENCY RHYTHM (8-WEEK PRACTICE HEATMAP) */}
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-surface-variant/50 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3.5 flex-wrap gap-2 border-b border-surface-variant/30">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-outline uppercase tracking-wider">
                      Consistency Rhythm
                    </span>
                    <span className="text-xs font-semibold text-secondary bg-secondary-container/20 px-2 py-0.5 rounded-full">
                      {heatmap.totalDrills} completed drills in view
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-on-surface mt-0.5 tracking-tight">
                    Past 8 Weeks Practice Matrix
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-outline">
                  <span>Less</span>
                  <span className="w-2.5 h-2.5 rounded-xs bg-surface-container-high inline-block" title="0 drills"></span>
                  <span className="w-2.5 h-2.5 rounded-xs bg-primary-fixed inline-block" title="1 drill"></span>
                  <span className="w-2.5 h-2.5 rounded-xs bg-primary-container inline-block" title="2 drills"></span>
                  <span className="w-2.5 h-2.5 rounded-xs bg-primary inline-block" title="3+ drills"></span>
                  <span>More</span>
                </div>
              </div>

              {/* Matrix Table with Horizontal Scroll */}
              <div className="p-3.5 bg-surface-container-low/70 rounded-xl border border-surface-variant/30 overflow-x-auto mt-3">
                <div className="min-w-[480px]">
                  <div className="flex text-xs text-outline font-medium mb-2 pl-9 justify-between pr-2">
                    <span>W1</span>
                    <span>W2</span>
                    <span>W3</span>
                    <span>W4</span>
                    <span>W5</span>
                    <span>W6</span>
                    <span>W7</span>
                    <span className="font-semibold text-primary">W8 (Now)</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {heatmap.rows.map((row) => (
                      <div key={row.day} className="flex items-center gap-2">
                        <span className="w-7 text-xs font-medium text-outline text-left">
                          {row.day}
                        </span>
                        <div className="grid grid-cols-8 gap-2 flex-1">
                          {row.cells.map((cell) => (
                            <div
                              key={`${cell.dayLabel}-${cell.weekIndex}`}
                              onMouseEnter={() => setHoveredHeatmapCell(cell)}
                              onMouseLeave={() => setHoveredHeatmapCell(null)}
                              tabIndex={0}
                              role="button"
                              aria-label={`${cell.dayLabel} Week ${cell.weekIndex + 1} (${cell.dateStr}): ${cell.count} drills`}
                              className={`h-5 rounded-xs transition-all cursor-pointer ${getHeatmapColor(cell.level)}`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hover Status Info */}
              {hoveredHeatmapCell && (
                <div className="mt-2 text-xs text-on-surface-variant font-medium bg-surface-container px-3 py-1.5 rounded-md flex items-center justify-between animate-enter-fade">
                  <span>{hoveredHeatmapCell.dateStr} ({hoveredHeatmapCell.dayLabel})</span>
                  <span className="font-semibold text-primary">
                    {hoveredHeatmapCell.count === 0 
                      ? 'Rest day (0 drills)' 
                      : `${hoveredHeatmapCell.count} mock drill${hoveredHeatmapCell.count > 1 ? 's' : ''} completed`}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-variant/30 text-xs text-outline flex-wrap gap-2">
              <span className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-[15px] text-secondary">verified</span>
                {metrics.currentStreakDays > 0 ? `${metrics.currentStreakDays}-day consecutive practice streak` : 'Ready for next session'}
              </span>
              <button 
                type="button"
                onClick={() => onNavigate('practice-plan')}
                className="text-primary font-semibold hover:underline inline-flex items-center gap-0.5 cursor-pointer no-print"
              >
                View full practice plan
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>

        </div>

        {/* =======================================================================
            RIGHT COLUMN (5 COLS): COMPETENCY BREAKDOWN & ACTIONABLE COACHING
        ======================================================================= */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* SECTION D: COMPETENCY MATRIX */}
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-surface-variant/50 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-surface-variant/30">
                <div>
                  <span className="text-xs font-semibold text-outline uppercase tracking-wider">
                    Competency Matrix
                  </span>
                  <h2 className="text-lg font-bold text-on-surface mt-0.5 tracking-tight">
                    Skill-by-Skill Precision
                  </h2>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant border border-surface-variant">
                  {filteredCompetencies.length} Dimensions
                </span>
              </div>

              {/* Functional Filter Tabs */}
              <div className="flex items-center gap-1 mt-3 p-1 bg-surface-container rounded-lg text-xs" role="tablist" aria-label="Filter competencies">
                <button
                  type="button"
                  role="tab"
                  aria-selected={competencyTab === 'all'}
                  onClick={() => setCompetencyTab('all')}
                  className={`flex-1 py-1 rounded text-center font-medium transition-all cursor-pointer ${
                    competencyTab === 'all'
                      ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  All ({allCompetencies.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={competencyTab === 'technical'}
                  onClick={() => setCompetencyTab('technical')}
                  className={`flex-1 py-1 rounded text-center font-medium transition-all cursor-pointer ${
                    competencyTab === 'technical'
                      ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  Technical ({allCompetencies.filter(c => c.category === 'technical').length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={competencyTab === 'behavioral'}
                  onClick={() => setCompetencyTab('behavioral')}
                  className={`flex-1 py-1 rounded text-center font-medium transition-all cursor-pointer ${
                    competencyTab === 'behavioral'
                      ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  Behavioral ({allCompetencies.filter(c => c.category === 'behavioral').length})
                </button>
              </div>

              {/* Dimension Progress Bars */}
              <div className="flex flex-col gap-4 mt-4">
                {filteredCompetencies.map((item) => (
                  <div key={item.id} className="flex flex-col gap-1.5 group">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-on-surface font-mono">
                          {item.percentage !== null ? `${item.percentage}%` : '—'}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${item.statusClass}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`${item.barColor} h-full rounded-full transition-all duration-700 ease-out`} 
                        style={{ width: `${item.percentage || 0}%` }}
                      ></div>
                    </div>
                    {item.evaluationsCount === 0 && (
                      <span className="text-[10px] text-outline italic">
                        Insufficient evaluation data to calculate score
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-surface-variant/30 text-xs text-outline flex items-center justify-between flex-wrap gap-2">
              <span>Target standard: 80%</span>
              <span className="text-secondary font-medium">
                {allCompetencies.filter(c => (c.percentage || 0) >= 80).length} of {allCompetencies.length} meet passing bar
              </span>
            </div>
          </div>

          {/* SECTION F & G: BENCHMARK DIFFERENTIAL & RECOMMENDED DRILL */}
          <div className="grid grid-cols-1 gap-4">
            
            {/* SECTION F: BENCHMARK DIFFERENTIAL */}
            <div className="bg-surface-container-lowest rounded-xl p-4.5 border border-surface-variant/50 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-semibold text-outline uppercase tracking-wider">
                    Benchmark Differential
                  </span>
                  <span className="text-xs font-medium text-on-surface-variant px-2 py-0.5 rounded bg-surface-container border border-surface-variant/60">
                    {candidateRole} ({candidateLevel})
                  </span>
                </div>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low/80 border border-surface-variant/30 my-2.5">
                  <div className="flex flex-col">
                    <span className="text-xs text-outline">Your Score</span>
                    <span className="text-xl font-bold text-on-surface font-mono">
                      {metrics.averageScore !== null ? `${metrics.averageScore}%` : '—'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center px-3">
                    {metrics.benchmarkDifferential !== null ? (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        metrics.benchmarkDifferential >= 0
                          ? 'text-secondary bg-secondary-container/30 border-secondary/20'
                          : 'text-error bg-error-container/40 border-error/20'
                      }`}>
                        {metrics.benchmarkDifferential >= 0 ? `Surplus: +${metrics.benchmarkDifferential} pts` : `Gap: ${metrics.benchmarkDifferential} pts`}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-outline px-2 py-0.5 rounded-full bg-surface-container">
                        Awaiting data
                      </span>
                    )}
                    <span className="material-symbols-outlined text-[16px] text-outline mt-1">
                      {metrics.benchmarkDifferential !== null && metrics.benchmarkDifferential >= 0 ? 'trending_up' : 'trending_flat'}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-outline">Passing Standard</span>
                    <span className="text-xl font-bold text-on-surface font-mono">
                      {metrics.passingBenchmark}%
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {metrics.benchmarkDifferential !== null
                  ? metrics.benchmarkDifferential >= 0
                    ? `Performance exceeds the calibrated passing threshold of ${metrics.passingBenchmark}%. Maintain consistency to solidify your interview readiness.`
                    : `Closing the ${Math.abs(metrics.benchmarkDifferential)}-point gap requires focused drills on your lowest competency.`
                  : `Complete your initial mock interview to evaluate your differential against the ${metrics.passingBenchmark}% passing threshold.`}
              </p>
            </div>

            {/* SECTION G: RECOMMENDED AI DRILL */}
            <div className="bg-surface-container-lowest rounded-xl p-4.5 border border-primary/30 shadow-xs flex flex-col justify-between bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-primary-fixed/10">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex p-2 rounded-lg bg-primary-fixed text-primary shrink-0">
                    <span className="material-symbols-outlined text-[20px]">bolt</span>
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                      Recommended Practice Drill
                    </span>
                    <h3 className="text-sm font-bold text-on-surface">
                      {recommendedDrill.title}
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant mt-2.5 mb-3 leading-relaxed">
                  {recommendedDrill.reason}
                </p>
              </div>
              <button
                type="button"
                id="start-recommended-drill-btn"
                onClick={() => onNavigate('mock-interview-workspace')}
                className="w-full flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.98] no-print"
              >
                <span>{recommendedDrill.actionText}</span>
                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* =========================================================================
          SECTION H: DIAGNOSTICS & COACHING INSIGHTS
      ========================================================================= */}
      <section aria-label="Diagnostics" className="bg-surface-container-lowest rounded-xl p-5 border border-surface-variant/50 shadow-xs">
        <div className="flex items-center justify-between pb-3.5 border-b border-surface-variant/30 mb-4">
          <div>
            <span className="text-xs font-semibold text-outline uppercase tracking-wider">
              Diagnostics
            </span>
            <h2 className="text-lg font-bold text-on-surface mt-0.5 tracking-tight">
              Strongest &amp; Focus Areas
            </h2>
          </div>
          <span className="text-xs text-outline font-medium">
            AI Automated Telemetry Analysis
          </span>
        </div>

        {diagnostics.hasData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Strength Assets */}
            <div className="p-4 rounded-xl bg-surface-container-low/80 border border-secondary/20 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-secondary text-xs font-semibold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                Observed Strengths
              </div>
              <div className="flex flex-col gap-2 text-on-surface text-xs leading-relaxed mt-1">
                {diagnostics.topStrengths.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[15px] text-secondary mt-0.5 shrink-0">check</span>
                    <span>
                      <strong className="font-semibold">{item.title}:</strong> {item.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Focus Adjustments */}
            <div className="p-4 rounded-xl bg-tertiary-container/10 border border-tertiary/20 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-tertiary text-xs font-semibold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]">priority_high</span>
                Target Focus Adjustments
              </div>
              <div className="flex flex-col gap-2 text-on-surface text-xs leading-relaxed mt-1">
                {diagnostics.focusAreas.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[15px] text-tertiary mt-0.5 shrink-0">arrow_right</span>
                    <span>
                      <strong className="font-semibold">{item.title}:</strong> {item.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-surface-container-low/60 text-center text-xs text-on-surface-variant flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-[28px] text-outline mb-1">psychology</span>
            <p className="font-medium text-on-surface">Diagnostics Unlock with Practice</p>
            <p className="mt-0.5 max-w-md">
              Complete a mock interview simulation to allow AI evaluators to extract verified strengths and targeted growth areas.
            </p>
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION I: EVALUATED MOCK ASSESSMENTS TABLE
      ========================================================================= */}
      <section aria-label="Evaluated Sessions" className="w-full bg-surface-container-lowest rounded-xl shadow-xs border border-surface-variant/50 overflow-hidden">
        <div className="p-4.5 flex items-center justify-between border-b border-surface-variant/40 flex-wrap gap-2">
          <div>
            <span className="text-xs font-semibold text-outline uppercase tracking-wider">
              Evaluated Sessions
            </span>
            <h2 className="text-lg font-bold text-on-surface mt-0.5 tracking-tight">
              Recent Mock Assessments
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-outline px-2.5 py-1 rounded-full bg-surface-container border border-surface-variant">
              {filteredAssessments.length === currentPeriodSessions.length 
                ? `Showing ${currentPeriodSessions.length} total sessions in range` 
                : `Showing ${filteredAssessments.length} of ${currentPeriodSessions.length} matching`}
            </span>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-surface-variant/30">
          {filteredAssessments.length > 0 ? (
            filteredAssessments.map((session) => (
              <div 
                key={session.id} 
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-surface-container-low/60 transition-colors gap-3.5 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shrink-0 border border-surface-variant/40 group-hover:border-primary/30 transition-colors">
                    <span className={`material-symbols-outlined text-[20px] ${
                      session.category === 'behavioral'
                        ? 'text-tertiary'
                        : session.category === 'system-design'
                        ? 'text-on-surface-variant'
                        : 'text-primary'
                    }`}>
                      {session.category === 'behavioral' ? 'record_voice_over' : session.category === 'system-design' ? 'hub' : 'code'}
                    </span>
                  </div>
                  <div className="flex flex-col truncate">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                        {session.title}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        session.status === 'Passed'
                          ? 'bg-secondary-container/25 text-secondary border-secondary/20'
                          : session.status === 'Strong'
                          ? 'bg-surface-container-high text-on-surface-variant border-outline-variant/30'
                          : 'bg-tertiary-container/15 text-tertiary border-tertiary/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          session.status === 'Passed'
                            ? 'bg-secondary'
                            : session.status === 'Strong'
                            ? 'bg-outline'
                            : 'bg-tertiary'
                        }`}></span>
                        {session.status}
                      </span>
                    </div>
                    <span className="text-xs text-outline mt-0.5">
                      {session.dateLabel} · {session.durationLabel} · {session.persona}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-variant/20">
                  <div className="flex flex-col items-start sm:items-end">
                    <span className="text-sm font-bold text-on-surface font-mono">
                      {session.score !== null ? session.score : '—'} <span className="text-xs text-outline font-normal">/ 100</span>
                    </span>
                    <span className={`text-[11px] font-semibold ${
                      (session.score || 0) >= 80 ? 'text-secondary' : 'text-on-surface-variant'
                    }`}>
                      {session.score !== null && metrics.averageScore !== null
                        ? session.score - metrics.averageScore >= 0
                          ? `+${session.score - metrics.averageScore} pts vs avg`
                          : `${session.score - metrics.averageScore} pts vs avg`
                        : session.isEvaluated ? 'Calibrated' : 'In review'}
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => onNavigate('evaluation-report')}
                    className="px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-all cursor-pointer border border-surface-variant/60 shadow-xs hover:border-primary/40 active:scale-[0.98] no-print"
                  >
                    View Feedback
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-3xl text-outline mb-1">search_off</span>
              <p className="text-xs text-on-surface font-medium">
                {searchQuery ? `No assessments match "${searchQuery}"` : 'No mock sessions recorded for this time range.'}
              </p>
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs text-primary font-semibold hover:underline cursor-pointer"
                >
                  Clear search filter
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('mock-interviews')}
                  className="mt-2 text-xs text-primary font-semibold hover:underline cursor-pointer"
                >
                  Start a new practice interview
                </button>
              )}
            </div>
          )}
        </div>

        <div className="p-3.5 bg-surface-container-low/60 text-center border-t border-surface-variant/30 no-print">
          <button 
            type="button"
            onClick={() => onNavigate('evaluation-report')}
            className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            Review Latest Mock Evaluation &amp; Feedback Report
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>
      </section>

    </div>
  );
};
