import { useState, useEffect } from 'react';
import { ViewMode, InterviewConfig, QuestionItem, UserProfile, RecentInterviewItem } from './types';
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

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('overview');
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

  const handleProfileAnalyzed = (profile: UserProfile) => {
    setUserProfile(profile);
    try {
      localStorage.setItem('interviewiq_user_profile', JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save profile to localStorage:', e);
    }

    if (profile.targetRoles && profile.targetRoles.length > 0) {
      setConfig(prev => ({
        ...prev,
        role: profile.targetRoles[0].title
      }));
    }
  };

  const handleStartInterview = () => {
    setCurrentView('mock-interviews');
  };

  const handleLaunchSession = () => {
    setCurrentView('mock-interview-workspace');
  };

  const handleCompleteSession = (sessionData?: { role: string; type: string; score: number; duration: string }) => {
    const score = sessionData?.score ?? 84;
    const isPassed = score >= 80;

    const newSession: RecentInterviewItem = {
      id: `iv-${Date.now()}`,
      role: sessionData?.role || config.role || 'Frontend Developer',
      roleShort: (sessionData?.role || config.role || 'FE').slice(0, 2).toUpperCase(),
      roleBadgeColor: 'bg-primary-fixed text-primary',
      track: 'Live Mock Simulation',
      scope: sessionData?.type || `${config.type || 'Technical'} (${config.role || 'Frontend'} & System)`,
      completed: 'Just now',
      score,
      status: isPassed ? 'Passed' : 'Needs Practice',
      statusClass: isPassed ? 'bg-secondary-container text-on-secondary-container' : 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
      scoreClass: isPassed ? 'text-secondary' : 'text-tertiary',
      duration: sessionData?.duration || '20 min'
    };

    const updated = [newSession, ...recentInterviews];
    setRecentInterviews(updated);
    try {
      localStorage.setItem('interviewiq_recent_interviews', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save recent interviews:', e);
    }

    setCurrentView('evaluation-report');
  };

  const handlePracticeQuestion = (question: QuestionItem) => {
    setConfig(prev => ({
      ...prev,
      role: question.roleTarget,
      difficulty: question.difficulty,
      type: question.category.includes('Behavioral') ? 'Behavioral' : 'Technical'
    }));
    setCurrentView('mock-interview-workspace');
  };

  const handleOpenCuratedQuestion = (title: string) => {
    setSearchQuery(title);
    setCurrentView('question-library');
  };

  return (
    <div className="bg-surface-container font-body-md text-body-md text-on-surface antialiased min-h-screen">
      {/* Navigation Bars (Desktop Sidebar + Desktop Header + Mobile Header + Mobile Bottom Nav) */}
      <Navigation
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
        userProfile={userProfile}
        onOpenResumeModal={() => setIsResumeModalOpen(true)}
      />

      {/* Main Content Area: Responsive Padding */}
      <div className="lg:pl-[230px] w-full min-h-screen">
        <main className="relative pt-[56px] lg:pt-[52px] pb-[72px] lg:pb-0 w-full min-h-screen p-space-md sm:p-space-lg">
          {currentView === 'overview' && (
            <OverviewView
              onNavigate={setCurrentView}
              onStartInterview={handleStartInterview}
              onOpenQuestion={handleOpenCuratedQuestion}
              userProfile={userProfile}
              recentInterviews={recentInterviews}
              onOpenResumeModal={() => setIsResumeModalOpen(true)}
            />
          )}

          {currentView === 'mock-interviews' && (
            <MockSetupView
              config={config}
              onConfigChange={setConfig}
              onStartSession={handleLaunchSession}
              userProfile={userProfile}
              onOpenResumeModal={() => setIsResumeModalOpen(true)}
            />
          )}

          {currentView === 'mock-interview-workspace' && (
            <LiveWorkspaceView
              config={config}
              onNavigate={setCurrentView}
              onCompleteSession={handleCompleteSession}
            />
          )}

          {currentView === 'evaluation-report' && (
            <EvaluationReportView
              onNavigate={setCurrentView}
              onRetry={handleStartInterview}
            />
          )}

          {currentView === 'question-library' && (
            <QuestionLibraryView
              onNavigate={setCurrentView}
              onPracticeQuestion={handlePracticeQuestion}
              searchQuery={searchQuery}
              userProfile={userProfile}
            />
          )}

          {currentView === 'my-progress' && (
            <MyProgressView
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'practice-plan' && (
            <PracticePlanView
              onNavigate={setCurrentView}
              onStartDrill={handleLaunchSession}
            />
          )}

          {(currentView === 'settings' || currentView === 'profile') && (
            <SettingsView />
          )}
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
