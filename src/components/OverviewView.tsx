import React, { useState } from 'react';
import { ViewMode, UserProfile, RecentInterviewItem } from '../types';

interface OverviewViewProps {
  onNavigate: (view: ViewMode) => void;
  onStartInterview: () => void;
  onOpenQuestion: (questionTitle: string) => void;
  userProfile?: UserProfile | null;
  recentInterviews: RecentInterviewItem[];
  onOpenResumeModal?: () => void;
  onAddRole?: (role: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onStartInterview,
  onOpenQuestion: _onOpenQuestion,
  userProfile,
  recentInterviews,
  onOpenResumeModal,
  onAddRole,
}) => {
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleInput, setNewRoleInput] = useState('');

  // Candidate Name
  const candidateFullName = userProfile?.fullName || 'Candidate';
  const candidateFirstName = candidateFullName.split(' ')[0].toUpperCase();

  // Target Roles Label (clean, focused format from reference image)
  const targetRolesLabel = userProfile?.targetRoles && userProfile.targetRoles.length > 0
    ? userProfile.targetRoles.slice(0, 2).map(r => r.title).join(' & ') + (userProfile.targetRoles.length > 2 ? ` +${userProfile.targetRoles.length - 2} more` : '')
    : 'Frontend Developer & Backend Developer';

  // Fallback initial items matching the reference image exactly
  const referenceRecentInterviews: RecentInterviewItem[] = [
    {
      id: 'ref-1',
      role: 'Frontend Developer',
      roleShort: 'FR',
      roleBadgeColor: 'bg-[#dee0ff] text-[#374dbe]',
      track: 'Live Mock Simulation',
      scope: 'Behavioral (Frontend Developer & System)',
      completed: 'Just now',
      score: 84,
      status: 'Passed',
      statusClass: 'bg-secondary-container/40 text-secondary',
      scoreClass: 'text-secondary',
      duration: '45 min'
    },
    {
      id: 'ref-2',
      role: 'Frontend Developer',
      roleShort: 'FE',
      roleBadgeColor: 'bg-[#dee0ff] text-[#374dbe]',
      track: 'Meta mock series',
      scope: 'Technical (React & System)',
      completed: 'Oct 4, 2:30 PM',
      score: 82,
      status: 'Passed',
      statusClass: 'bg-secondary-container/40 text-secondary',
      scoreClass: 'text-secondary',
      duration: '40 min'
    },
    {
      id: 'ref-3',
      role: 'Java Developer',
      roleShort: 'JV',
      roleBadgeColor: 'bg-[#eae7e7] text-[#444653]',
      track: 'Fintech core track',
      scope: 'Technical (OOP & Concurrency)',
      completed: 'Oct 2, 10:00 AM',
      score: 74,
      status: 'Needs Practice',
      statusClass: 'bg-[#ffe2b3] text-[#7a4c00]',
      scoreClass: 'text-[#b37800]',
      duration: '45 min'
    },
    {
      id: 'ref-4',
      role: 'Data Analyst',
      roleShort: 'DA',
      roleBadgeColor: 'bg-[#92f3be] text-[#006c45]',
      track: 'Product Analytics',
      scope: 'Behavioral & Problem Solving',
      completed: 'Sep 29, 4:15 PM',
      score: 85,
      status: 'Strong',
      statusClass: 'bg-secondary-container/40 text-secondary',
      scoreClass: 'text-secondary',
      duration: '35 min'
    },
    {
      id: 'ref-5',
      role: 'Software Engineer',
      roleShort: 'SE',
      roleBadgeColor: 'bg-[#ffdad6] text-[#ba1a1a]',
      track: 'Generalist L4',
      scope: 'System Design & Algorithms',
      completed: 'Sep 25, 11:00 AM',
      score: 71,
      status: 'Needs Review',
      statusClass: 'bg-[#ffe2b3] text-[#7a4c00]',
      scoreClass: 'text-[#b37800]',
      duration: '50 min'
    }
  ];

  const displayList = recentInterviews.length > 0 ? recentInterviews : referenceRecentInterviews;
  const totalCount = displayList.length;

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Top Greeting & Header Bar (Matching Reference Image) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-surface-variant/40">
        <div className="flex flex-col gap-1.5">
          {/* Greeting Title Row - BIGGER as requested */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-on-surface tracking-tight leading-none">
              Good morning, {candidateFirstName}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-outline font-label-micro text-label-micro uppercase tracking-wider font-semibold">
              ACTIVE CYCLE
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-fixed/40 text-primary font-label-micro text-label-micro font-bold">
              Tier B+
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-container/30 text-secondary text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              NVIDIA Calibrated
            </span>
          </div>

          {/* Subtitle with Target Roles & Interview Date */}
          <div className="flex items-center gap-2 flex-wrap text-body-md text-on-surface-variant">
            <span>Your next opportunity starts with better practice. Target roles:</span>
            <span className="font-semibold text-on-surface">{targetRolesLabel}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-outline text-xs">
              <span className="material-symbols-outlined text-[13px]">event</span>
              Target: {userProfile?.targetInterviewDate || 'November 23, 2026'}
            </span>
            <button
              type="button"
              onClick={() => setShowAddRoleModal(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container hover:bg-surface-container-high text-primary hover:text-primary/80 font-medium text-xs transition-colors cursor-pointer"
              title="Add another target role to practice"
            >
              <span className="material-symbols-outlined text-[13px]">add</span>
              <span>Add Role</span>
            </button>
          </div>
        </div>

        {/* Right Action Elements */}
        <div className="flex items-center gap-space-md shrink-0 flex-wrap justify-between lg:justify-end">
          {onOpenResumeModal && (
            <button
              type="button"
              onClick={onOpenResumeModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-variant bg-surface-container-low hover:bg-surface-container text-xs font-medium text-on-surface transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-primary">assignment_ind</span>
              <span>Update Resume</span>
            </button>
          )}

          <div className="hidden sm:flex flex-col items-end text-right">
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
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors shadow-sm font-label-md text-label-md font-medium cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            <span>Start an interview</span>
          </button>
        </div>
      </div>

      {/* 4 Compact Telemetry KPI Tiles (Exact Reference Image Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {/* Tile 1: INTERVIEWS COMPLETED */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-surface-variant/40 flex flex-col justify-between gap-space-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-micro text-label-micro uppercase text-outline tracking-wider font-semibold">
              INTERVIEWS COMPLETED
            </span>
            <span className="material-symbols-outlined text-outline text-[16px]">videocam</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl lg:text-[28px] font-bold text-on-surface leading-none">
              {totalCount}
            </span>
            <div className="flex items-end gap-1 h-5 w-16">
              <span className="w-2.5 h-2 bg-surface-container rounded-sm"></span>
              <span className="w-2.5 h-3 bg-surface-container rounded-sm"></span>
              <span className="w-2.5 h-4 bg-primary-fixed rounded-sm"></span>
              <span className="w-2.5 h-5 bg-primary rounded-sm"></span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-outline">
            <span className="text-on-surface-variant font-normal">Across active tracks</span>
            <span className="font-medium text-outline">Real-time sync</span>
          </div>
        </div>

        {/* Tile 2: AVERAGE SCORE */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-surface-variant/40 flex flex-col justify-between gap-space-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-micro text-label-micro uppercase text-outline tracking-wider font-semibold">
              AVERAGE SCORE
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/40 text-secondary font-label-micro text-label-micro font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Strong Pace
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl lg:text-[28px] font-bold text-on-surface leading-none">79</span>
            <span className="text-xs text-outline font-normal">/ 100</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-secondary font-medium">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            <span>+4 pts from last week</span>
          </div>
        </div>

        {/* Tile 3: PRACTICE STREAK */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-surface-variant/40 flex flex-col justify-between gap-space-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-micro text-label-micro uppercase text-outline tracking-wider font-semibold">
              PRACTICE STREAK
            </span>
            <span className="material-symbols-outlined text-amber-500 text-[18px]">local_fire_department</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-[28px] font-bold text-on-surface leading-none">5</span>
            <span className="text-sm font-semibold text-on-surface">days</span>
          </div>
          <div className="flex items-center justify-between text-xs text-outline">
            <span className="text-on-surface-variant font-normal">Personal best: 8 days</span>
            <span className="font-medium text-outline">Oct 1 - Oct 5</span>
          </div>
        </div>

        {/* Tile 4: READINESS STATUS */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-surface-variant/40 flex flex-col justify-between gap-space-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-micro text-label-micro uppercase text-outline tracking-wider font-semibold">
              READINESS STATUS
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-primary-fixed/40 text-primary font-label-micro text-label-micro font-bold">
              Tier B+
            </span>
          </div>
          <div className="flex items-baseline">
            <span className="text-base lg:text-[17px] font-bold text-on-surface leading-tight">
              Building confidence
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-outline">
            <span className="text-on-surface-variant font-normal">Target benchmark: 85+</span>
            <button
              type="button"
              onClick={() => onNavigate('my-progress')}
              className="text-primary font-medium hover:underline cursor-pointer"
            >
              Adjust
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Columns: 8 Col Left Feed + 4 Col Right Radar (Exact Reference Image) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column (8 cols ~ 67%): ASSESSMENT FEED • Recent Interviews Table */}
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-variant/40 overflow-hidden flex flex-col">
            {/* Header bar with + button */}
            <div className="px-space-lg py-3 flex items-center justify-between bg-surface-container-lowest border-b border-surface-variant/40">
              <div className="flex items-center gap-2">
                <span className="font-label-micro text-label-micro uppercase text-outline tracking-wider font-semibold">
                  ASSESSMENT FEED
                </span>
                <span className="text-outline text-xs">•</span>
                <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Recent Interviews
                </span>
                {/* The red + button marked by user */}
                <button
                  type="button"
                  onClick={() => setShowAddRoleModal(true)}
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-fixed/40 hover:bg-primary hover:text-on-primary text-primary transition-all cursor-pointer shadow-2xs ml-1"
                  title="Add target practice track"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('my-progress')}
                className="font-label-md text-label-md text-primary font-medium hover:text-on-primary-fixed-variant transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                View all ({totalCount})
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-lowest text-outline font-label-micro text-label-micro uppercase tracking-wider border-b border-surface-variant/30">
                    <th className="py-2.5 px-space-lg font-semibold">TARGET ROLE</th>
                    <th className="py-2.5 px-space-md font-semibold">ASSESSMENT SCOPE</th>
                    <th className="py-2.5 px-space-md font-semibold">COMPLETED</th>
                    <th className="py-2.5 px-space-md font-semibold">SCORE</th>
                    <th className="py-2.5 px-space-md font-semibold">STATUS</th>
                    <th className="py-2.5 px-space-lg text-right font-semibold">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/20 text-body-sm font-body-sm">
                  {displayList.map((item) => {
                    const isGreen = item.score >= 80;
                    return (
                      <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors group">
                        {/* Target Role & Track Subtitle */}
                        <td className="py-3 px-space-lg font-medium text-on-surface">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${item.roleBadgeColor || 'bg-[#dee0ff] text-[#374dbe]'}`}>
                              {item.roleShort || item.role.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-xs leading-snug text-on-surface">
                                {item.role}
                              </span>
                              <span className="text-[11px] text-outline leading-tight">
                                {item.track}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Assessment Scope */}
                        <td className="py-3 px-space-md text-on-surface-variant text-xs font-normal">
                          {item.scope}
                        </td>

                        {/* Completed */}
                        <td className="py-3 px-space-md text-outline text-xs whitespace-nowrap">
                          {item.completed}
                        </td>

                        {/* Score */}
                        <td className="py-3 px-space-md">
                          <span className={`inline-flex items-center gap-1 font-semibold text-xs ${isGreen ? 'text-secondary' : 'text-[#b37800]'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isGreen ? 'bg-secondary' : 'bg-amber-500'}`}></span>
                            {item.score}
                            <span className="text-outline font-normal text-[10px]">/100</span>
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-space-md">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-micro text-label-micro font-semibold ${item.statusClass || (isGreen ? 'bg-secondary-container/40 text-secondary' : 'bg-[#ffe2b3] text-[#7a4c00]')}`}>
                            {item.status}
                          </span>
                        </td>

                        {/* Action Link */}
                        <td className="py-3 px-space-lg text-right">
                          <button
                            type="button"
                            onClick={() => onNavigate('evaluation-report')}
                            className="font-label-md text-label-md text-primary font-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
                          >
                            Review report
                            <span className="material-symbols-outlined text-[13px]">chevron_right</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Assessment Feed Footer */}
            <div className="py-2.5 px-space-lg bg-surface-container-lowest border-t border-surface-variant/30 flex items-center justify-between font-label-micro text-label-micro text-outline">
              <span>AI Feedback version 3.4.1 active</span>
              <span>Latency: 280ms average speech turn</span>
            </div>
          </div>

          {/* Weekly Practice Volume & Score Trend Card */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-surface-variant/40 flex flex-col gap-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
              <div>
                <div className="font-label-micro text-label-micro uppercase text-outline tracking-wider font-semibold">
                  WEEKLY VOLUME
                </div>
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Practice Volume &amp; Score Trend
                </h2>
              </div>
              <div className="flex items-center gap-space-md font-label-micro text-label-micro">
                <span className="flex items-center gap-1.5 text-on-surface font-medium">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#2b44bd]"></span> Completed
                </span>
                <span className="flex items-center gap-1.5 text-outline">
                  <span className="w-3 h-0.5 bg-outline"></span> Baseline (40m)
                </span>
              </div>
            </div>

            {/* Custom SVG Chart Visualization */}
            <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-sm">
              <div className="relative w-full h-44">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 160">
                  <defs>
                    <linearGradient id="barGradActive" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#2b44bd" />
                      <stop offset="100%" stopColor="#435cd6" />
                    </linearGradient>
                    <linearGradient id="barGradMuted" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#c8d2ff" />
                      <stop offset="100%" stopColor="#dee4ff" />
                    </linearGradient>
                  </defs>

                  {/* Target Baseline Line */}
                  <line stroke="#b8bac8" strokeDasharray="3 3" strokeWidth="1.2" x1="20" x2="680" y1="65" y2="65" />
                  <text fill="#757685" fontFamily="Geist" fontSize="10" textAnchor="start" x="684" y="68">
                    40m
                  </text>

                  {/* Day 1: Mon (45m) */}
                  <rect fill="url(#barGradActive)" height="85" rx="4" width="44" x="50" y="60" />
                  <text fill="#1c1b1b" fontFamily="Geist" fontSize="11" fontWeight="600" textAnchor="middle" x="72" y="52">
                    45m
                  </text>
                  <circle cx="72" cy="60" fill="#2b44bd" r="3" />

                  {/* Day 2: Tue (30m) */}
                  <rect fill="url(#barGradMuted)" height="55" rx="4" width="44" x="145" y="90" />
                  <text fill="#757685" fontFamily="Geist" fontSize="11" textAnchor="middle" x="167" y="82">
                    30m
                  </text>

                  {/* Day 3: Wed (60m Peak) */}
                  <rect fill="url(#barGradActive)" height="115" rx="4" width="44" x="240" y="30" />
                  <text fill="#2b44bd" fontFamily="Geist" fontSize="11" fontWeight="700" textAnchor="middle" x="262" y="22">
                    60m
                  </text>
                  <circle cx="262" cy="30" fill="#2b44bd" r="3.5" />

                  {/* Day 4: Thu (20m) */}
                  <rect fill="url(#barGradMuted)" height="38" rx="4" width="44" x="335" y="107" />
                  <text fill="#757685" fontFamily="Geist" fontSize="11" textAnchor="middle" x="357" y="99">
                    20m
                  </text>

                  {/* Day 5: Fri (50m) */}
                  <rect fill="url(#barGradActive)" height="95" rx="4" width="44" x="430" y="50" />
                  <text fill="#1c1b1b" fontFamily="Geist" fontSize="11" fontWeight="600" textAnchor="middle" x="452" y="42">
                    50m
                  </text>
                  <circle cx="452" cy="50" fill="#2b44bd" r="3" />

                  {/* Day 6: Sat (Rest) */}
                  <rect fill="#c5c5d5" height="4" rx="2" width="44" x="525" y="141" />
                  <text fill="#757685" fontFamily="Geist" fontSize="10" textAnchor="middle" x="547" y="134">
                    Rest
                  </text>

                  {/* Day 7: Sun (35m) */}
                  <rect fill="url(#barGradMuted)" height="65" rx="4" width="44" x="620" y="80" />
                  <text fill="#757685" fontFamily="Geist" fontSize="11" textAnchor="middle" x="642" y="72">
                    35m
                  </text>
                </svg>
              </div>

              {/* Axis Labels */}
              <div className="grid grid-cols-7 text-center font-label-micro text-label-micro uppercase text-outline tracking-wider pt-1">
                <span>M</span>
                <span>T</span>
                <span className="text-primary font-bold">W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
                <span>S</span>
              </div>
            </div>

            {/* Weekly Summary Footer Note */}
            <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
                <span>4.1 hrs practiced this week • Goal: 3.5 hrs (Exceeded)</span>
              </div>
              <span className="font-label-micro text-label-micro text-primary font-bold uppercase tracking-wider">
                TARGET: L5
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols ~ 33%): DIAGNOSTIC RADAR (Exact Reference Image Layout) */}
        <div className="lg:col-span-4 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-surface-variant/40 flex flex-col gap-space-md">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="font-label-micro text-label-micro uppercase text-outline tracking-wider font-semibold">
                DIAGNOSTIC RADAR
              </span>
              <span className="material-symbols-outlined text-outline text-[17px]">timeline</span>
            </div>

            {/* Circular Gauge Graphic (Exact Donut Arc) */}
            <div className="flex flex-col items-center justify-center pt-1 pb-1">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background track */}
                  <circle cx="50" cy="50" fill="none" r="38" stroke="#f0eded" strokeWidth="8" />
                  {/* Donut progress: 72% */}
                  <circle
                    cx="50"
                    cy="50"
                    fill="none"
                    r="38"
                    stroke="#2b44bd"
                    strokeDasharray="238.7"
                    strokeDashoffset="66.8"
                    strokeLinecap="round"
                    strokeWidth="8"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-bold text-on-surface leading-none">
                    72%
                  </span>
                  <span className="text-[9px] font-bold text-outline uppercase tracking-wider mt-0.5">
                    READINESS
                  </span>
                </div>
              </div>

              <span className="font-semibold text-sm text-on-surface mt-2 text-center">
                Current Readiness Index
              </span>
              <span className="text-xs text-outline text-center mt-0.5 max-w-xs leading-normal">
                Based on 12 rubric checkpoints across pacing, syntax, and clarity.
              </span>
            </div>

            {/* Checkpoint Bars */}
            <div className="flex flex-col gap-2 pt-1 border-t border-surface-variant/20">
              {/* Technical Knowledge */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 font-medium text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[15px]">check_circle</span>
                    Technical knowledge
                  </span>
                  <span className="font-bold text-secondary">88%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>

              {/* Answer Structure */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 font-medium text-on-surface">
                    <span className="material-symbols-outlined text-amber-500 text-[15px]">warning</span>
                    Answer structure
                  </span>
                  <span className="font-bold text-amber-600">64%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '64%' }}></div>
                </div>
              </div>
            </div>

            {/* Suggested Focus Card */}
            <div className="p-space-sm rounded-lg bg-surface-container-low border border-surface-variant/30 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-label-micro text-label-micro uppercase text-outline tracking-wider font-semibold">
                  SUGGESTED FOCUS
                </span>
                <span className="inline-flex px-1.5 py-0.2 rounded bg-primary-fixed/40 text-primary font-label-micro text-label-micro font-bold">
                  Priority
                </span>
              </div>
              <h4 className="font-semibold text-xs text-on-surface">
                Behavioral Interview (STAR Method)
              </h4>
              <p className="text-[11px] text-on-surface-variant leading-snug">
                Sharpen conciseness during the action &amp; result phases.
              </p>
            </div>

            {/* Quick 10-min Session Action Button */}
            <button
              type="button"
              onClick={onStartInterview}
              className="w-full py-2.5 px-space-md rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">timer</span>
              <span>Quick 10-min Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Custom/Target Role Modal */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl max-w-md w-full p-6 border border-outline-variant flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">add_task</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Configure Practice Roles
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddRoleModal(false);
                  setNewRoleInput('');
                }}
                className="text-outline hover:text-on-surface p-1 rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Target roles calibrate question recommendations, AI mock interview prompts, and readiness rubrics. Select a track or add a custom role below.
            </p>

            {/* Quick Pick Chips */}
            <div className="flex flex-col gap-1.5">
              <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">
                Available Engineering Tracks
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Frontend Developer',
                  'Backend Developer',
                  'Full Stack Developer',
                  'Java Developer',
                  'Data Analyst',
                  'Software Engineer',
                  'DevOps Engineer',
                  'Machine Learning Engineer'
                ].map(r => {
                  const alreadyAdded = userProfile?.targetRoles?.some(tr => tr.title.toLowerCase() === r.toLowerCase());
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        if (onAddRole) onAddRole(r);
                        setShowAddRoleModal(false);
                        setNewRoleInput('');
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs transition-colors cursor-pointer ${
                        alreadyAdded
                          ? 'bg-surface-container text-outline opacity-60 cursor-default'
                          : 'bg-surface-container-low hover:bg-primary-fixed hover:text-primary text-on-surface'
                      }`}
                      disabled={alreadyAdded}
                    >
                      {alreadyAdded ? '✓ ' : '+ '} {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newRoleInput.trim()) {
                  const title = newRoleInput.trim();
                  if (onAddRole) onAddRole(title);
                  setShowAddRoleModal(false);
                  setNewRoleInput('');
                }
              }}
              className="flex flex-col gap-3 pt-2 border-t border-outline-variant"
            >
              <label className="font-label-sm text-label-sm text-on-surface font-medium">
                Or Enter Custom Role Title:
              </label>
              <input
                type="text"
                value={newRoleInput}
                onChange={(e) => setNewRoleInput(e.target.value)}
                placeholder="e.g. Full Stack Developer"
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface font-body-sm focus:outline-none focus:border-primary"
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRoleModal(false);
                    setNewRoleInput('');
                  }}
                  className="px-3 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-medium hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newRoleInput.trim()}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-on-primary-fixed-variant transition-colors disabled:opacity-40 cursor-pointer"
                >
                  Add Track
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
