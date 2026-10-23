import React from 'react';
import { ViewMode, UserProfile, RecentInterviewItem } from '../types';

interface OverviewViewProps {
  onNavigate: (view: ViewMode) => void;
  onStartInterview: () => void;
  onOpenQuestion: (questionTitle: string) => void;
  userProfile?: UserProfile | null;
  recentInterviews: RecentInterviewItem[];
  onOpenResumeModal?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onStartInterview,
  onOpenQuestion,
  userProfile,
  recentInterviews,
  onOpenResumeModal,
}) => {
  const completedCount = recentInterviews.length;
  const avgScore = completedCount > 0
    ? Math.round(recentInterviews.reduce((acc, item) => acc + item.score, 0) / completedCount)
    : 78;

  const candidateFirstName = userProfile?.fullName ? userProfile.fullName.split(' ')[0] : 'Alex';
  const targetRolesLabel = userProfile?.targetRoles && userProfile.targetRoles.length > 0
    ? userProfile.targetRoles.slice(0, 2).map(r => r.title).join(' & ')
    : 'Frontend Lead & Software Eng II';

  return (
    <div className="flex flex-col w-full gap-space-lg pb-12">
      {/* Top Greeting & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-lowest p-space-lg rounded-lg shadow-sm">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-space-xs flex-wrap">
            <h1 className="font-headline-xl text-headline-xl text-on-surface font-semibold tracking-tight">
              Good morning, {candidateFirstName}
            </h1>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-surface-container text-outline font-label-micro text-label-micro uppercase tracking-wider font-semibold">
              Active Cycle
            </span>
            {userProfile?.readinessTier && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-fixed/40 text-primary font-label-micro text-label-micro font-bold">
                {userProfile.readinessTier}
              </span>
            )}
            {userProfile && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-secondary-container/40 text-secondary text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                NVIDIA Calibrated
              </span>
            )}
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-1.5 flex-wrap">
            <span>Your next opportunity starts with better practice. Target roles:</span>
            <span className="font-medium text-on-surface">{targetRolesLabel}</span>
            {userProfile?.targetInterviewDate && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-surface-container text-outline text-xs">
                <span className="material-symbols-outlined text-[13px]">event</span>
                Target: {userProfile.targetInterviewDate}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-space-md shrink-0 pt-1 sm:pt-0 flex-wrap">
          {onOpenResumeModal && (
            <button
              type="button"
              onClick={onOpenResumeModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors font-label-md text-label-md font-medium cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">assignment_ind</span>
              <span>{userProfile ? 'Update Resume' : 'Analyze Resume'}</span>
            </button>
          )}
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="font-label-md text-label-md font-medium text-on-surface">
              Monday, Oct 5 • 8:46 AM
            </span>
            <span className="font-label-micro text-label-micro text-secondary font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              3 slots available today
            </span>
          </div>
          <button 
            type="button"
            onClick={onStartInterview}
            className="inline-flex items-center gap-space-xs px-space-md py-2 rounded bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors shadow-sm font-label-md text-label-md font-medium cursor-pointer active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            <span>Start an interview</span>
          </button>
        </div>
      </div>

      {/* 4 Compact Telemetry KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {/* Card 1: Completed */}
        <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between gap-space-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-micro text-label-micro uppercase text-outline tracking-wider font-semibold">
              Interviews Completed
            </span>
            <span className="material-symbols-outlined text-outline text-[16px]">videocam</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-headline-xl text-headline-xl font-bold text-on-surface leading-none">
              {completedCount}
            </span>
            <div className="flex items-end gap-1 h-5 w-16">
              <span className="w-2.5 h-2 bg-surface-container rounded-sm"></span>
              <span className="w-2.5 h-3 bg-surface-container rounded-sm"></span>
              <span className="w-2.5 h-4 bg-primary-fixed-dim rounded-sm"></span>
              <span className="w-2.5 h-5 bg-primary rounded-sm"></span>
            </div>
          </div>
          <div className="flex items-center justify-between text-outline">
            <span className="font-body-sm text-body-sm text-on-surface-variant">Across active tracks</span>
            <span className="font-label-micro text-label-micro text-outline font-medium">Real-time sync</span>
          </div>
        </div>

        {/* Card 2: Average Score */}
        <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between gap-space-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-micro text-label-micro uppercase text-outline tracking-wider font-semibold">
              Average Score
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-micro text-label-micro font-medium">
              <span className="w-1 h-1 rounded-full bg-secondary"></span>
              {avgScore >= 75 ? 'Strong Pace' : 'Building'}
            </span>
          </div>
          <div className="flex items-baseline gap-space-xs">
            <span className="font-headline-xl text-headline-xl font-bold text-on-surface leading-none">
              {avgScore}
            </span>
            <span className="font-body-sm text-body-sm text-outline">/ 100</span>
          </div>
          <div className="flex items-center gap-1 font-body-sm text-body-sm text-secondary font-medium">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            <span>+4 pts from last week</span>
          </div>
        </div>

        {/* Card 3: Practice Streak */}
        <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between gap-space-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-micro text-label-micro uppercase text-outline tracking-wider font-semibold">
              Practice Streak
            </span>
            <span className="material-symbols-outlined text-tertiary text-[16px]">local_fire_department</span>
          </div>
          <div className="flex items-baseline gap-space-xs">
            <span className="font-headline-xl text-headline-xl font-bold text-on-surface leading-none">
              5
            </span>
            <span className="font-body-md text-body-md text-on-surface font-medium">days</span>
          </div>
          <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
            <span>Personal best: 8 days</span>
            <span className="font-label-micro text-label-micro text-outline font-medium">Oct 1 - Oct 5</span>
          </div>
        </div>

        {/* Card 4: Readiness Status */}
        <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col justify-between gap-space-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-micro text-label-micro uppercase text-outline tracking-wider font-semibold">
              Readiness Status
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-micro text-label-micro font-medium">
              Tier B+
            </span>
          </div>
          <div className="flex items-baseline gap-space-xs">
            <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              Building confidence
            </span>
          </div>
          <div className="flex items-center justify-between font-body-sm text-body-sm text-outline">
            <span>Target benchmark: 85+</span>
            <button 
              type="button"
              onClick={() => onNavigate('my-progress')}
              className="font-label-micro text-label-micro text-primary font-medium hover:underline cursor-pointer"
            >
              Adjust
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Columns: 68% Left, 32% Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column (8 cols ~ 67-68%) */}
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          {/* Recent Interviews Module */}
          <div className="bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="px-space-lg py-space-md flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-space-sm">
                <span className="font-label-micro text-label-micro uppercase text-outline tracking-wider font-semibold">
                  Assessment Feed
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Recent Interviews
                </span>
              </div>
              <button 
                type="button"
                onClick={() => onNavigate('my-progress')}
                className="font-label-md text-label-md text-primary font-medium hover:text-on-primary-fixed-variant transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                View all ({completedCount})
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-lowest text-outline font-label-micro text-label-micro uppercase tracking-wider">
                    <th className="py-2.5 px-space-lg font-medium">Target Role</th>
                    <th className="py-2.5 px-space-md font-medium">Assessment Scope</th>
                    <th className="py-2.5 px-space-md font-medium">Completed</th>
                    <th className="py-2.5 px-space-md font-medium">Score</th>
                    <th className="py-2.5 px-space-md font-medium">Status</th>
                    <th className="py-2.5 px-space-lg text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y-0 text-body-sm font-body-sm">
                  {recentInterviews.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="py-3 px-space-lg font-medium text-on-surface flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-label-md text-label-md font-bold shrink-0 ${item.roleBadgeColor}`}>
                          {item.roleShort}
                        </div>
                        <div>
                          <div className="font-headline-sm text-[13px] leading-tight text-on-surface font-medium">
                            {item.role}
                          </div>
                          <div className="font-label-micro text-label-micro text-outline">
                            {item.track}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-space-md text-on-surface-variant font-normal">
                        {item.scope}
                      </td>
                      <td className="py-3 px-space-md text-outline whitespace-nowrap">
                        {item.completed}
                      </td>
                      <td className="py-3 px-space-md">
                        <span className={`inline-flex items-center gap-1 font-semibold ${item.scoreClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.score >= 80 ? 'bg-secondary' : 'bg-tertiary'}`}></span>
                          {item.score}
                          <span className="text-outline font-normal text-[10px]">/100</span>
                        </span>
                      </td>
                      <td className="py-3 px-space-md">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-micro text-label-micro font-medium ${item.statusClass}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-space-lg text-right">
                        <button
                          type="button"
                          onClick={() => onNavigate('evaluation-report')}
                          className="font-label-md text-label-md text-primary font-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                        >
                          Review report
                          <span className="material-symbols-outlined text-[13px]">chevron_right</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="py-2 px-space-lg bg-surface-container-low flex items-center justify-between font-label-micro text-label-micro text-outline">
              <span>AI Feedback version 3.4.1 active</span>
              <span>Latency: 280ms average speech turn</span>
            </div>
          </div>

          {/* Weekly Practice Volume & Score Trend */}
          <div className="bg-surface-container-lowest p-space-lg rounded-lg shadow-sm flex flex-col gap-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
              <div>
                <div className="font-label-micro text-label-micro uppercase text-outline tracking-wider font-semibold">
                  Telemetry &amp; Pacing
                </div>
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Practice Volume &amp; Score Trend
                </h2>
              </div>
              <div className="flex items-center gap-space-md font-label-micro text-label-micro">
                <span className="flex items-center gap-1 text-on-surface-variant">
                  <span className="w-2.5 h-2.5 rounded-sm bg-primary"></span> Completed minutes
                </span>
                <span className="flex items-center gap-1 text-outline">
                  <span className="w-2.5 h-0.5 bg-outline"></span> Target baseline (40m)
                </span>
              </div>
            </div>

            {/* Custom SVG Chart Visualization */}
            <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-sm">
              <div className="relative w-full h-44">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 160">
                  <defs>
                    <linearGradient id="barGradActive" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#374dbe" />
                      <stop offset="100%" stopColor="#5267d8" />
                    </linearGradient>
                    <linearGradient id="barGradMuted" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#bac3ff" />
                      <stop offset="100%" stopColor="#dee0ff" />
                    </linearGradient>
                  </defs>

                  {/* Target Baseline Line */}
                  <line stroke="#c5c5d5" strokeDasharray="3 3" strokeWidth="1.5" x1="20" x2="680" y1="65" y2="65" />
                  <text fill="#757685" fontFamily="Geist" fontSize="10" textAnchor="start" x="682" y="68">
                    40m
                  </text>

                  {/* Grid Horizontal Guide lines */}
                  <line stroke="#eae7e7" strokeWidth="1" x1="20" x2="680" y1="20" y2="20" />
                  <line stroke="#eae7e7" strokeWidth="1" x1="20" x2="680" y1="110" y2="110" />
                  <line stroke="#dcd9d9" strokeWidth="1" x1="20" x2="680" y1="145" y2="145" />

                  {/* Day 1: Mon (45m) */}
                  <rect fill="url(#barGradActive)" height="90" rx="3" width="44" x="50" y="55" />
                  <text fill="#1c1b1b" fontFamily="Geist" fontSize="11" fontWeight="600" textAnchor="middle" x="72" y="47">
                    45m
                  </text>
                  <circle cx="72" cy="55" fill="#374dbe" r="3" />

                  {/* Day 2: Tue (30m) */}
                  <rect fill="url(#barGradMuted)" height="60" rx="3" width="44" x="145" y="85" />
                  <text fill="#757685" fontFamily="Geist" fontSize="11" textAnchor="middle" x="167" y="77">
                    30m
                  </text>

                  {/* Day 3: Wed (60m Peak) */}
                  <rect fill="url(#barGradActive)" height="120" rx="3" width="44" x="240" y="25" />
                  <text fill="#374dbe" fontFamily="Geist" fontSize="11" fontWeight="700" textAnchor="middle" x="262" y="17">
                    60m
                  </text>
                  <circle cx="262" cy="25" fill="#374dbe" r="3.5" />

                  {/* Day 4: Thu (20m) */}
                  <rect fill="url(#barGradMuted)" height="40" rx="3" width="44" x="335" y="105" />
                  <text fill="#757685" fontFamily="Geist" fontSize="11" textAnchor="middle" x="357" y="97">
                    20m
                  </text>

                  {/* Day 5: Fri (50m) */}
                  <rect fill="url(#barGradActive)" height="100" rx="3" width="44" x="430" y="45" />
                  <text fill="#1c1b1b" fontFamily="Geist" fontSize="11" fontWeight="600" textAnchor="middle" x="452" y="37">
                    50m
                  </text>
                  <circle cx="452" cy="45" fill="#374dbe" r="3" />

                  {/* Day 6: Sat (0m - Rest) */}
                  <rect fill="#c5c5d5" height="3" rx="1.5" width="44" x="525" y="142" />
                  <text fill="#757685" fontFamily="Geist" fontSize="10" textAnchor="middle" x="547" y="135">
                    Rest
                  </text>

                  {/* Day 7: Sun (35m) */}
                  <rect fill="url(#barGradMuted)" height="70" rx="3" width="44" x="620" y="75" />
                  <text fill="#1c1b1b" fontFamily="Geist" fontSize="11" fontWeight="500" textAnchor="middle" x="642" y="67">
                    35m
                  </text>
                </svg>
              </div>

              {/* Axis Labels */}
              <div className="grid grid-cols-7 text-center font-label-micro text-label-micro uppercase text-outline tracking-wider pt-1">
                <span>Mon</span>
                <span>Tue</span>
                <span className="text-primary font-bold">Wed • Peak</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>

            {/* Weekly Summary Footer Note */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-body-sm font-body-sm text-on-surface-variant pt-1 gap-1">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
                <span>Weekly practice quota completed (240 / 210 mins goal).</span>
              </div>
              <span className="font-label-micro text-label-micro text-outline uppercase">
                Synced with Target: FAANG L5
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols ~ 32-33%) */}
        <div className="lg:col-span-4 flex flex-col gap-space-lg">
          {/* Readiness Overview Gauge Card */}
          <div className="bg-surface-container-lowest p-space-lg rounded-lg shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <span className="font-label-micro text-label-micro uppercase text-outline tracking-wider font-semibold">
                Diagnostic Radar
              </span>
              <span className="material-symbols-outlined text-outline text-[18px]">query_stats</span>
            </div>

            <div className="flex flex-col items-center justify-center pt-space-xs pb-space-sm">
              {/* Circular Score Graphic */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="none" r="40" stroke="#eae7e7" strokeWidth="8" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    fill="none" 
                    r="40" 
                    stroke="#374dbe" 
                    strokeDasharray="251.2" 
                    strokeDashoffset="70.3" 
                    strokeLinecap="round" 
                    strokeWidth="8" 
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="font-headline-xl text-headline-xl font-bold text-on-surface leading-none">
                    72%
                  </span>
                  <span className="font-label-micro text-label-micro text-outline uppercase tracking-wider mt-1">
                    Readiness
                  </span>
                </div>
              </div>

              <span className="font-headline-sm text-headline-sm font-semibold text-on-surface mt-2">
                Current Readiness Index
              </span>
              <span className="font-body-sm text-body-sm text-outline text-center mt-0.5">
                Based on 12 rubric checkpoints across pacing, syntax, and clarity.
              </span>
            </div>

            {/* Metric Breakdown Wells */}
            <div className="flex flex-col gap-space-xs">
              <div className="bg-surface-container-low p-space-sm rounded flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[16px]">check_circle</span>
                  <span className="font-body-sm text-body-sm text-on-surface font-medium">Technical knowledge</span>
                </div>
                <span className="font-label-md text-label-md font-semibold text-secondary">88%</span>
              </div>

              <div className="bg-surface-container-low p-space-sm rounded flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-tertiary text-[16px]">warning</span>
                  <span className="font-body-sm text-body-sm text-on-surface font-medium">Answer structure</span>
                </div>
                <span className="font-label-md text-label-md font-semibold text-tertiary">64%</span>
              </div>

              <div className="bg-surface-container-high/60 p-space-sm rounded flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-micro text-label-micro uppercase text-outline font-semibold">
                    Suggested Focus
                  </span>
                  <span className="inline-flex px-1.5 py-0.2 rounded bg-primary-fixed text-on-primary-fixed-variant font-label-micro text-label-micro font-medium">
                    Priority
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface font-medium">
                  Behavioral Interview (STAR Method)
                </span>
                <span className="font-body-sm text-body-sm text-outline text-[11px] leading-snug">
                  Sharpen conciseness during the action &amp; result phases.
                </span>
              </div>
            </div>

            {/* Quick 10-min Session CTA Prompt */}
            <button 
              type="button"
              onClick={onStartInterview}
              className="w-full py-2.5 px-space-md rounded bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors flex items-center justify-center gap-space-xs font-label-md text-label-md font-semibold shadow-sm cursor-pointer active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-[16px]">timer</span>
              <span>Quick 10-min Session</span>
            </button>
          </div>

          {/* Upcoming Recommended Questions */}
          <div className="bg-surface-container-lowest p-space-lg rounded-lg shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">lightbulb</span>
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Curated for Today
                </h3>
              </div>
              <span className="font-label-micro text-label-micro uppercase text-outline tracking-wider">
                3 Daily
              </span>
            </div>

            <div className="flex flex-col gap-space-sm">
              {/* Question 1 */}
              <div 
                onClick={() => onOpenQuestion("How would you optimize re-renders in a virtualized infinite table component?")}
                className="p-space-sm rounded bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer group flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-micro text-label-micro px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-medium">
                    React / Frontend
                  </span>
                  <span className="font-label-micro text-label-micro text-secondary font-semibold">Medium</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface font-medium group-hover:text-primary transition-colors leading-snug">
                  "How would you optimize re-renders in a virtualized infinite table component?"
                </p>
                <div className="flex items-center justify-between text-outline font-label-micro text-label-micro pt-0.5">
                  <span>Avg response: 3.5 min</span>
                  <span className="text-primary font-medium group-hover:translate-x-0.5 transition-transform">Practice →</span>
                </div>
              </div>

              {/* Question 2 */}
              <div 
                onClick={() => onOpenQuestion("Describe a disagreement with a product manager regarding technical debt versus feature velocity.")}
                className="p-space-sm rounded bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer group flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-micro text-label-micro px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-medium">
                    Behavioral / Leadership
                  </span>
                  <span className="font-label-micro text-label-micro text-tertiary font-semibold">Hard</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface font-medium group-hover:text-primary transition-colors leading-snug">
                  "Describe a disagreement with a product manager regarding technical debt versus feature velocity."
                </p>
                <div className="flex items-center justify-between text-outline font-label-micro text-label-micro pt-0.5">
                  <span>STAR framework prompt</span>
                  <span className="text-primary font-medium group-hover:translate-x-0.5 transition-transform">Practice →</span>
                </div>
              </div>

              {/* Question 3 */}
              <div 
                onClick={() => onOpenQuestion("Design an idempotent webhook processing pipeline with guaranteed delivery order.")}
                className="p-space-sm rounded bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer group flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-micro text-label-micro px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-medium">
                    System Architecture
                  </span>
                  <span className="font-label-micro text-label-micro text-secondary font-semibold">Medium</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface font-medium group-hover:text-primary transition-colors leading-snug">
                  "Design an idempotent webhook processing pipeline with guaranteed delivery order."
                </p>
                <div className="flex items-center justify-between text-outline font-label-micro text-label-micro pt-0.5">
                  <span>Architecture whiteboarding</span>
                  <span className="text-primary font-medium group-hover:translate-x-0.5 transition-transform">Practice →</span>
                </div>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => onNavigate('question-library')}
              className="w-full py-2 rounded bg-surface-container-low hover:bg-surface-container-high transition-colors text-on-surface font-label-md text-label-md font-medium text-center cursor-pointer"
            >
              Open Question Library
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
