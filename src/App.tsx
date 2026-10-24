import { useState, useEffect } from 'react';
import { ViewMode, InterviewConfig, QuestionItem, UserProfile, RecentInterviewItem, SessionEvaluationReport } from './types';
import { RECENT_INTERVIEWS_DATA } from './data/mockData';
import { Navigation } from './components/Navigation';
import { OverviewView } from './components/OverviewView';
import { MockSetupView } from './components/MockSetupView';
import { LiveWorkspaceView } from './components/LiveWorkspaceView';
import { EvaluationReportView } from './components/EvaluationReportView';
import { MyProgressView } from './components/MyProgressView';
import { QuestionLibraryView } from './components/QuestionLibraryView';
import { PracticePlanView } from './components/PracticePlanView';
import { SettingsView } from './components/SettingsView';
import { ResumeOnboardingModal } from './components/ResumeOnboardingModal';

import React, { Component, ErrorInfo, ReactNode } from 'react';

// Resilient Error Boundary to prevent React render failures from kicking candidates to overview
class InterviewErrorBoundary extends Component<
  { children: ReactNode; onReset?: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; onReset?: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('InterviewIQ View ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto my-12 bg-surface-container-lowest rounded-2xl shadow-md border border-error/30 text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">warning</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">Mock Interview Room Notice</h2>
          <p className="text-sm text-on-surface-variant max-w-md">
            The workspace encountered an audio or rendering exception:
            <br />
            <code className="text-xs text-error font-mono bg-surface-container px-2 py-1 rounded mt-2 inline-block">
              {this.state.error?.message || 'Component initialization error'}
            </code>
          </p>
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onReset) this.props.onReset();
              }}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:bg-on-primary-fixed-variant transition-colors cursor-pointer"
            >
              Resume Interview Room
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.setItem('interviewiq_current_view', 'overview');
                  sessionStorage.removeItem('interviewiq_session_id');
                } catch {}
                window.location.reload();
              }}
              className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-sm font-medium hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              Exit to Overview
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    try {
      // Check URL query parameter first (e.g. ?view=mock-interview-workspace)
      const urlParams = new URLSearchParams(window.location.search);
      const urlView = urlParams.get('view') as ViewMode | null;
      const validViews: ViewMode[] = [
        'overview',
        'mock-interviews',
        'mock-interview-workspace',
        'evaluation-report',
        'question-library',
        'my-progress',
        'practice-plan',
        'settings',
        'profile',
      ];
      if (urlView && validViews.includes(urlView)) {
        return urlView;
      }
      const saved = localStorage.getItem('interviewiq_current_view') as ViewMode | null;
      // Do NOT auto-restore mock-interview-workspace on fresh page loads; only enter live workspace when user clicks "Start Interview"
      if (saved && saved !== 'mock-interview-workspace' && validViews.includes(saved)) {
        return saved;
      }
    } catch {}
    return 'overview';
  });

  const handleNavigate = (view: ViewMode) => {
    try {
      // Don't persist mock-interview-workspace so page refreshes don't auto-launch live session calls
      if (view === 'mock-interview-workspace') {
        localStorage.setItem('interviewiq_current_view', 'mock-interviews');
      } else {
        localStorage.setItem('interviewiq_current_view', view);
      }
    } catch {}
    setCurrentView(view);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

  // User Profile State (persisted with fallback default)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('interviewiq_user_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading stored profile:', e);
    }
    return {
      fullName: 'Alex Morgan',
      email: 'alex.morgan@example.com',
      currentStage: 'Active Job Hunter',
      experienceYears: 5,
      targetRoles: [
        {
          title: 'Frontend Developer',
          desc: 'UI Architecture, React, CSS, Web Vitals & Hydration',
          match: 94,
          reason: 'Deep expertise in React 18, Next.js, and TypeScript performance optimization.'
        },
        {
          title: 'Full Stack Developer',
          desc: 'End-to-end Systems, Integrations, Auth & State',
          match: 88,
          reason: 'Solid fullstack delivery with Node.js, GraphQL, and database integration.'
        },
        {
          title: 'Software Engineer',
          desc: 'Algorithms, Data Structures, Complexity Analysis',
          match: 82,
          reason: 'Strong foundation in systems architecture and distributed state.'
        }
      ],
      topSkills: ['React 18', 'TypeScript', 'Next.js', 'Tailwind CSS', 'State Machines', 'Web Vitals', 'GraphQL'],
      targetInterviewDate: 'October 28, 2026',
      readinessTier: 'Tier B+',
      keyAchievements: [
        'Reduced Core Web Vitals (LCP/INP) by 42% on high-traffic consumer product',
        'Architected real-time telemetry dashboard handling 150k DAU with <50ms render response',
        'Mentored 8+ junior engineers on modern TypeScript patterns and testing SLAs'
      ],
      suggestedFocus: 'Refine STAR behavioral structure with quantitative business metrics; practice state machine trade-offs.',
      summary: 'Senior Frontend Engineer with 5+ years specializing in high-performance React architectures and web vitals.'
    };
  });

  // Real-time Recent Interviews State (persisted with fallback)
  const [recentInterviews, setRecentInterviews] = useState<RecentInterviewItem[]>(() => {
    try {
      const saved = localStorage.getItem('interviewiq_recent_interviews');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading stored interviews:', e);
    }
    return RECENT_INTERVIEWS_DATA as RecentInterviewItem[];
  });

  // Prompt onboarding on first visit if user hasn't analyzed resume yet
  useEffect(() => {
    const hasSeenModal = localStorage.getItem('interviewiq_has_seen_onboarding');
    if (!hasSeenModal) {
      setIsResumeModalOpen(true);
      localStorage.setItem('interviewiq_has_seen_onboarding', 'true');
    }
  }, []);

  const [config, setConfig] = useState<InterviewConfig>({
    role: userProfile?.targetRoles[0]?.title || 'Frontend Developer',
    level: 'Entry Level',
    type: 'Technical',
    difficulty: 'Medium',
    duration: '20 min (5 questions)',
    jobDescription: ''
  });

  // Latest session report state (persisted)
  const [activeSessionReport, setActiveSessionReport] = useState<SessionEvaluationReport | null>(() => {
    try {
      const saved = localStorage.getItem('interviewiq_latest_report');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading stored report:', e);
    }
    return null;
  });

  const handleProfileAnalyzed = (profile: UserProfile) => {
    setUserProfile(profile);
    try {
      localStorage.setItem('interviewiq_user_profile', JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save profile to localStorage:', e);
    }

    // Automatically calibrate interview config to the candidate's primary analyzed major role
    const detectedRole = profile.primaryRole || profile.targetRoles?.[0]?.title || 'Frontend Developer';
    const detectedLevel = profile.experienceLevel || (profile.experienceYears >= 5 ? 'Experienced' : profile.experienceYears >= 2 ? 'Intermediate' : 'Entry Level');
    const calibratedDifficulty = detectedLevel === 'Experienced' ? 'Hard' : detectedLevel === 'Intermediate' ? 'Medium' : 'Easy';

    setConfig(prev => ({
      ...prev,
      role: detectedRole,
      level: detectedLevel,
      difficulty: calibratedDifficulty,
    }));
  };

  const handleAddTargetRole = (newRoleTitle: string) => {
    if (!newRoleTitle || !newRoleTitle.trim()) return;
    const title = newRoleTitle.trim();

    setUserProfile(prev => {
      const existing = prev?.targetRoles || [];
      if (existing.some(r => r.title.toLowerCase() === title.toLowerCase())) {
        return prev;
      }
      const newRoleObj = {
        title,
        desc: `${title} Architecture, Systems & Implementation`,
        match: 92,
        reason: 'Added as priority candidate track.'
      };
      const updated = prev ? {
        ...prev,
        targetRoles: [...prev.targetRoles, newRoleObj]
      } : {
        fullName: 'Alex Morgan',
        email: 'alex.morgan@example.com',
        currentStage: 'Active Job Hunter',
        experienceYears: 4,
        targetRoles: [newRoleObj],
        topSkills: ['Full Stack', 'System Design', 'React', 'Node.js'],
        targetInterviewDate: 'November 28, 2026',
        readinessTier: 'Tier B+',
        keyAchievements: ['Engineered scalable web applications'],
        suggestedFocus: 'System Architecture & Behavioral Delivery',
        summary: 'Target candidate profile'
      };

      try {
        localStorage.setItem('interviewiq_user_profile', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save profile:', e);
      }
      return updated;
    });

    setConfig(prev => ({ ...prev, role: title }));
  };

  const handleStartInterview = () => {
    handleNavigate('mock-interviews');
  };

  const handleLaunchSession = () => {
    handleNavigate('mock-interview-workspace');
  };

  const handleCompleteSession = (sessionData?: {
    role: string;
    type: string;
    score: number;
    duration: string;
    report?: SessionEvaluationReport;
  }) => {
    const score = sessionData?.report?.overallScore ?? sessionData?.score ?? 84;
    const isPassed = score >= 80;
    const sessionRole = sessionData?.role || config.role || 'Frontend Developer';
    const duration = sessionData?.duration || '20 min';

    if (sessionData?.report) {
      setActiveSessionReport(sessionData.report);
      try {
        localStorage.setItem('interviewiq_latest_report', JSON.stringify(sessionData.report));
      } catch (e) {
        console.warn('Failed to save report to localStorage:', e);
      }
    }

    const newSession: RecentInterviewItem = {
      id: `iv-${Date.now()}`,
      role: sessionRole,
      roleShort: sessionRole.slice(0, 2).toUpperCase(),
      roleBadgeColor: 'bg-primary-fixed text-primary',
      track: 'Live Mock Simulation',
      scope: sessionData?.type || `${config.type || 'Technical'} (${sessionRole} & System)`,
      completed: 'Just now',
      score,
      status: isPassed ? 'Passed' : 'Needs Practice',
      statusClass: isPassed ? 'bg-secondary-container text-on-secondary-container' : 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
      scoreClass: isPassed ? 'text-secondary' : 'text-tertiary',
      duration,
    };

    const updated = [newSession, ...recentInterviews];
    setRecentInterviews(updated);
    try {
      localStorage.setItem('interviewiq_recent_interviews', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save recent interviews:', e);
    }

    handleNavigate('evaluation-report');
  };

  const handlePracticeQuestion = (question: QuestionItem) => {
    setConfig(prev => ({
      ...prev,
      role: question.roleTarget,
      difficulty: question.difficulty,
      type: question.category.includes('Behavioral') ? 'Behavioral' : 'Technical'
    }));
    handleNavigate('mock-interview-workspace');
  };

  const handleOpenCuratedQuestion = (title: string) => {
    setSearchQuery(title);
    handleNavigate('question-library');
  };

  return (
    <div className="bg-surface-container font-body-md text-body-md text-on-surface antialiased min-h-screen">
      {/* Navigation Bars (Desktop Sidebar + Desktop Header + Mobile Header + Mobile Bottom Nav) */}
      <Navigation
        currentView={currentView}
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
        userProfile={userProfile}
        onOpenResumeModal={() => setIsResumeModalOpen(true)}
      />

      {/* Main Content Area: Responsive Padding */}
      <div className="lg:pl-[230px] w-full min-h-screen">
        <main className="relative pt-[56px] lg:pt-[52px] pb-[72px] lg:pb-0 w-full min-h-screen p-space-md sm:p-space-lg">
          <InterviewErrorBoundary onReset={() => handleNavigate('mock-interviews')}>
            {currentView === 'overview' && (
              <OverviewView
                onNavigate={handleNavigate}
                onStartInterview={handleStartInterview}
                onOpenQuestion={handleOpenCuratedQuestion}
                userProfile={userProfile}
                recentInterviews={recentInterviews}
                onOpenResumeModal={() => setIsResumeModalOpen(true)}
                onAddRole={handleAddTargetRole}
              />
            )}

            {currentView === 'mock-interviews' && (
              <MockSetupView
                config={config}
                onConfigChange={setConfig}
                onStartSession={handleLaunchSession}
                userProfile={userProfile}
                onOpenResumeModal={() => setIsResumeModalOpen(true)}
                onAddRole={handleAddTargetRole}
              />
            )}

            {currentView === 'mock-interview-workspace' && (
              <LiveWorkspaceView
                config={config}
                userProfile={userProfile}
                onNavigate={handleNavigate}
                onCompleteSession={handleCompleteSession}
              />
            )}

            {currentView === 'evaluation-report' && (
              <EvaluationReportView
                report={activeSessionReport}
                config={config}
                userProfile={userProfile}
                onNavigate={handleNavigate}
                onRetry={handleStartInterview}
              />
            )}

            {currentView === 'question-library' && (
              <QuestionLibraryView
                onNavigate={handleNavigate}
                onPracticeQuestion={handlePracticeQuestion}
                searchQuery={searchQuery}
                userProfile={userProfile}
                onAddRole={handleAddTargetRole}
              />
            )}

            {currentView === 'my-progress' && (
              <MyProgressView
                onNavigate={handleNavigate}
              />
            )}

            {currentView === 'practice-plan' && (
              <PracticePlanView
                onNavigate={handleNavigate}
                onStartDrill={handleLaunchSession}
              />
            )}

            {(currentView === 'settings' || currentView === 'profile') && (
              <SettingsView />
            )}
          </InterviewErrorBoundary>
        </main>
      </div>

      {/* Candidate Resume & Profile Calibration Modal */}
      <ResumeOnboardingModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        onProfileAnalyzed={handleProfileAnalyzed}
        currentProfile={userProfile}
      />
    </div>
  );
}
