import React from 'react';
import { ViewMode, UserProfile } from '../types';

interface NavigationProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userProfile?: UserProfile | null;
  onOpenResumeModal?: () => void;
  onSignOut?: () => void;
}

export const LOGO_URL = "https://lh3.googleusercontent.com/aida/AEtjO1W7bN-uWE4eBNeEzmIyQWD7Khfd1x6Fef-_WlxnkacRgLVf0GRPkzOdprOxVmjz61kWwKGf9Vjbpu2T6SDJkgUSCkSnXcOjFmsiVF2ZWt9f7Nhnwwso94xzh9M3sYJVFtYQvbytw8SG_RlfUe9UE_q_5w0WE0tCQ20tz08BVGSSaZx-bb8_PLJlBRDAAqAEHIe_tJR-KH1tTxarnOPa0Vm4L8mOLtfNEGCy_a5skbSzYUkzB5TorW61_dRR";
export const AVATAR_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuC-ufpXP7wA7dxSJprxCBStWlTEFsM2Vhn6daGcU_Lh5wkm8uDUj7O-xX-B-iZuk3vu1DbuEKpb0eaBe-JLvyCf8_eeXTJ9QYzgZBAFgA6KBwxHo7QYUG3FMVmiHYzLYAEDMkB_7uIefkS-VLZixwCd0xL2z65L8bygEjkK9MNkXC84BxPxEgAGC7JsgWuuSwtHHkOQftqWYSrKP75sZcmAWLJCNQ9_RCNc_xq9a3T9RtEQI4CzS2uomQ";

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onNavigate,
  searchQuery,
  onSearchChange,
  userProfile,
  onOpenResumeModal,
  onSignOut,
}) => {
  // Check if live workspace or report is active under mock interviews
  const isMockSubView = currentView === 'mock-interview-workspace' || currentView === 'evaluation-report';

  return (
    <>
      {/* DESKTOP SIDEBAR (Visible on lg: screens >= 1024px) */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-[230px] bg-surface-container-lowest z-50 flex-col justify-between border-r border-surface-variant select-none">
        <div className="flex flex-col">
          {/* Logo Header */}
          <div 
            className="h-[52px] px-space-md flex items-center gap-space-sm border-b border-surface-variant cursor-pointer hover:bg-surface-container-low/50 transition-colors"
            onClick={() => onNavigate('overview')}
          >
            <div className="w-8 h-8 rounded-lg bg-[#1c1b1b] text-white flex items-center justify-center font-bold text-sm tracking-tight shrink-0 shadow-xs">
              <span>IQ</span>
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className="font-headline-sm text-[13px] font-bold tracking-tight text-on-surface leading-none whitespace-nowrap">
                INTERVIEWIQ
              </span>
              <span className="font-label-micro text-[9px] text-outline tracking-wider uppercase mt-0.5 whitespace-nowrap">
                AI Interview Coach
              </span>
            </div>
          </div>

          {/* Navigation Groups */}
          <div className="py-space-md px-space-xs flex flex-col gap-space-lg">
            {/* Workspace Category */}
            <div className="flex flex-col gap-0.5">
              <div className="px-space-md py-1 font-label-micro text-label-micro text-outline uppercase tracking-wider">
                Workspace
              </div>
              <nav className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => onNavigate('overview')}
                  className={`flex items-center gap-space-sm px-space-md py-2 rounded transition-colors font-body-md text-body-md text-left w-full ${
                    currentView === 'overview'
                      ? 'bg-surface-container-low text-primary font-medium border-l-2 border-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">dashboard</span>
                  <span>Overview</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('mock-interviews')}
                  className={`flex items-center gap-space-sm px-space-md py-2 rounded transition-colors font-body-md text-body-md text-left w-full ${
                    currentView === 'mock-interviews'
                      ? 'bg-surface-container-low text-primary font-medium border-l-2 border-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">videocam</span>
                  <span>Mock Interviews</span>
                </button>

                {/* Nested Mock Interview Sessions Links */}
                {isMockSubView && (
                  <div className="ml-space-md pl-space-sm flex flex-col gap-0.5 border-l border-surface-variant my-0.5">
                    <button
                      type="button"
                      onClick={() => onNavigate('mock-interview-workspace')}
                      className={`flex items-center gap-space-xs px-space-sm py-1.5 rounded transition-colors font-body-sm text-body-sm text-left w-full ${
                        currentView === 'mock-interview-workspace'
                          ? 'bg-surface-container-low text-primary font-medium border-l-2 border-primary'
                          : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">record_voice_over</span>
                      <span>Live Workspace</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('evaluation-report')}
                      className={`flex items-center gap-space-xs px-space-sm py-1.5 rounded transition-colors font-body-sm text-body-sm text-left w-full ${
                        currentView === 'evaluation-report'
                          ? 'bg-surface-container-low text-primary font-medium border-l-2 border-primary'
                          : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">analytics</span>
                      <span>Evaluation Report</span>
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => onNavigate('question-library')}
                  className={`flex items-center gap-space-sm px-space-md py-2 rounded transition-colors font-body-md text-body-md text-left w-full ${
                    currentView === 'question-library'
                      ? 'bg-surface-container-low text-primary font-medium border-l-2 border-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">library_books</span>
                  <span>Question Library</span>
                </button>
              </nav>
            </div>

            {/* Improvement Category */}
            <div className="flex flex-col gap-0.5">
              <div className="px-space-md py-1 font-label-micro text-label-micro text-outline uppercase tracking-wider">
                Improvement
              </div>
              <nav className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => onNavigate('my-progress')}
                  className={`flex items-center gap-space-sm px-space-md py-2 rounded transition-colors font-body-md text-body-md text-left w-full ${
                    currentView === 'my-progress'
                      ? 'bg-surface-container-low text-primary font-medium border-l-2 border-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">insights</span>
                  <span>My Progress</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('practice-plan')}
                  className={`flex items-center gap-space-sm px-space-md py-2 rounded transition-colors font-body-md text-body-md text-left w-full ${
                    currentView === 'practice-plan'
                      ? 'bg-surface-container-low text-primary font-medium border-l-2 border-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">checklist</span>
                  <span>Practice Plan</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('question-library')}
                  className="flex items-center gap-space-sm px-space-md py-2 rounded text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors font-body-md text-body-md text-left w-full"
                >
                  <span className="material-symbols-outlined text-[18px]">school</span>
                  <span>Learning Resources</span>
                </button>
              </nav>
            </div>

            {/* Account Category */}
            <div className="flex flex-col gap-0.5">
              <div className="px-space-md py-1 font-label-micro text-label-micro text-outline uppercase tracking-wider">
                Account
              </div>
              <nav className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => onNavigate('settings')}
                  className={`flex items-center gap-space-sm px-space-md py-2 rounded transition-colors font-body-md text-body-md text-left w-full ${
                    currentView === 'profile'
                      ? 'bg-surface-container-low text-primary font-medium border-l-2 border-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  <span>Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('settings')}
                  className={`flex items-center gap-space-sm px-space-md py-2 rounded transition-colors font-body-md text-body-md text-left w-full ${
                    currentView === 'settings'
                      ? 'bg-surface-container-low text-primary font-medium border-l-2 border-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                  <span>Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSignOut ? onSignOut() : onNavigate('welcome')}
                  className="flex items-center gap-space-sm px-space-md py-2 rounded text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors font-body-md text-body-md text-left w-full cursor-pointer"
                  title="Sign Out & Return to Landing Page"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>Sign Out</span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* User Card at Bottom */}
        <div className="p-space-sm border-t border-surface-variant bg-surface-container-lowest">
          <div 
            onClick={() => onOpenResumeModal ? onOpenResumeModal() : onNavigate('settings')}
            className="flex items-center justify-between p-1.5 rounded hover:bg-surface-container-low transition-colors cursor-pointer group"
            title="Click to view/update candidate profile"
          >
            <div className="flex items-center gap-space-sm overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden relative">
                <img 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                  src={AVATAR_URL} 
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-primary font-bold text-xs">
                  {userProfile?.fullName ? userProfile.fullName.slice(0, 2).toUpperCase() : 'AH'}
                </span>
              </div>
              <div className="flex flex-col truncate">
                <span className="font-label-md text-label-md text-on-surface font-semibold tracking-tight truncate group-hover:text-primary transition-colors">
                  {userProfile?.fullName ? userProfile.fullName.toUpperCase() : 'ABIGAIL HALL'}
                </span>
                <span className="font-label-micro text-label-micro text-outline truncate flex items-center gap-1">
                  Resume Analyzed
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block"></span>
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline text-[16px]">unfold_more</span>
          </div>
        </div>
      </aside>

      {/* DESKTOP TOP HEADER (Fixed at top, left-[230px]) */}
      <header className="hidden lg:flex fixed top-0 left-[230px] right-0 h-[52px] bg-surface-container-lowest/90 backdrop-blur-md border-b border-surface-variant z-40 px-space-lg items-center justify-between">
        {/* Breadcrumb based on View */}
        <div className="flex items-center gap-space-sm text-outline font-label-md text-label-md">
          <span 
            className="hover:text-on-surface cursor-pointer transition-colors"
            onClick={() => onNavigate('overview')}
          >
            Workspace
          </span>
          <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>

          {currentView === 'overview' && (
            <span className="text-on-surface font-medium">Overview</span>
          )}

          {currentView === 'mock-interviews' && (
            <>
              <span className="hover:text-on-surface cursor-pointer" onClick={() => onNavigate('mock-interviews')}>Mock Interviews</span>
              <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
              <span className="text-on-surface font-medium">Setup</span>
            </>
          )}

          {currentView === 'mock-interview-workspace' && (
            <>
              <span className="hover:text-on-surface cursor-pointer" onClick={() => onNavigate('mock-interviews')}>Mock Interviews</span>
              <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
              <span className="text-on-surface font-medium">Session</span>
            </>
          )}

          {currentView === 'evaluation-report' && (
            <>
              <span className="hover:text-on-surface cursor-pointer" onClick={() => onNavigate('mock-interviews')}>Mock Interviews</span>
              <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
              <span className="text-on-surface font-medium">Evaluation #IV-8492</span>
            </>
          )}

          {currentView === 'my-progress' && (
            <>
              <span className="hover:text-on-surface cursor-pointer">Improvement</span>
              <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
              <span className="text-on-surface font-medium">My Progress</span>
            </>
          )}

          {currentView === 'practice-plan' && (
            <>
              <span className="hover:text-on-surface cursor-pointer">Improvement</span>
              <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
              <span className="text-on-surface font-medium">Practice Plan</span>
            </>
          )}

          {currentView === 'question-library' && (
            <span className="text-on-surface font-medium">Question Library</span>
          )}

          {currentView === 'settings' && (
            <span className="text-on-surface font-medium">Settings</span>
          )}
        </div>

        {/* Global Search & Action Icons */}
        <div className="flex items-center gap-space-md">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-2.5 text-outline pointer-events-none text-[16px]">
              search
            </span>
            <input 
              className="w-56 h-[34px] pl-8 pr-12 rounded bg-surface-container-low border border-surface-variant font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
              placeholder="Search questions, plans..." 
              type="text" 
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <div className="absolute right-2 px-1 py-0.5 bg-surface-container border border-surface-variant rounded text-[10px] font-label-micro text-outline pointer-events-none">
              ⌘K
            </div>
          </div>

          {onOpenResumeModal && (
            <button
              type="button"
              onClick={onOpenResumeModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-xs font-medium text-on-surface transition-colors cursor-pointer border border-surface-variant"
              title="Resume & Target Roles Setup"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">assignment_ind</span>
              <span>{userProfile ? 'Resume Analyzed' : 'Upload Resume'}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${userProfile ? 'bg-secondary' : 'bg-tertiary'}`}></span>
            </button>
          )}

          <div className="flex items-center gap-1 border-l border-surface-variant pl-space-md">
            <button 
              className="relative p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded transition-colors"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-[18px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-error rounded-full"></span>
            </button>
            <button 
              className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded transition-colors"
              title="Help & Documentation"
              onClick={() => onNavigate('question-library')}
            >
              <span className="material-symbols-outlined text-[18px]">help_outline</span>
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE TOP HEADER (<1024px) */}
      <header className="lg:hidden fixed top-0 w-full z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-variant">
        <div className="h-14 px-margin flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            {isMockSubView ? (
              <button 
                onClick={() => onNavigate(currentView === 'evaluation-report' ? 'overview' : 'mock-interviews')}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/40 text-on-surface -ml-1 transition-colors"
                title="Go Back"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
            ) : (
              <div 
                className="w-7 h-7 rounded-lg bg-inverse-surface flex items-center justify-center cursor-pointer"
                onClick={() => onNavigate('overview')}
              >
                <span className="text-surface font-headline-sm text-headline-sm font-bold tracking-tight">IQ</span>
              </div>
            )}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                <span className="font-label-micro text-label-micro uppercase tracking-wider text-on-surface-variant font-semibold">
                  INTERVIEWIQ
                </span>
              </div>
              <h1 className="font-headline-sm text-headline-sm text-on-surface truncate max-w-[170px] capitalize">
                {currentView === 'overview' ? 'Overview' :
                 currentView === 'mock-interviews' ? 'Practice' :
                 currentView === 'mock-interview-workspace' ? 'Live Session' :
                 currentView === 'evaluation-report' ? 'Session Report' :
                 currentView === 'question-library' ? 'Questions' :
                 currentView === 'my-progress' ? 'My Progress' :
                 currentView === 'practice-plan' ? 'Practice Plan' : 'Settings'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-space-xs">
            <button 
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/40 transition-colors relative"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-[22px]">notifications</span>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary-container ring-2 ring-surface"></span>
            </button>
            <button 
              onClick={() => onNavigate('settings')}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/40 transition-colors"
              title="Settings & Profile"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-surface-variant">
                <img src={AVATAR_URL} alt="Alex Morgan" className="w-full h-full object-cover" />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR (<1024px) */}
      <nav className="lg:hidden fixed bottom-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_-1px_8px_rgba(0,0,0,0.06)] border-t border-surface-variant">
        <div className="flex items-center justify-between h-16 px-space-xs">
          <button
            type="button"
            onClick={() => onNavigate('overview')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors min-h-[44px] ${
              currentView === 'overview' ? 'text-primary-container font-semibold' : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">dashboard</span>
            <span className="font-label-micro text-label-micro mt-0.5">Overview</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('mock-interviews')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors min-h-[44px] ${
              currentView === 'mock-interviews' || isMockSubView ? 'text-primary-container font-semibold' : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">mic</span>
            <span className="font-label-micro text-label-micro mt-0.5">Practice</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('question-library')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors min-h-[44px] ${
              currentView === 'question-library' ? 'text-primary-container font-semibold' : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">library_books</span>
            <span className="font-label-micro text-label-micro mt-0.5">Questions</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('my-progress')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors min-h-[44px] ${
              currentView === 'my-progress' ? 'text-primary-container font-semibold' : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">analytics</span>
            <span className="font-label-micro text-label-micro mt-0.5">Progress</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('practice-plan')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors min-h-[44px] ${
              currentView === 'practice-plan' ? 'text-primary-container font-semibold' : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">event_note</span>
            <span className="font-label-micro text-label-micro mt-0.5">Plan</span>
          </button>
        </div>
      </nav>
    </>
  );
};
