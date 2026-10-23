import React, { useState } from 'react';
import { ViewMode } from '../types';

interface MyProgressViewProps {
  onNavigate: (view: ViewMode) => void;
}

export const MyProgressView: React.FC<MyProgressViewProps> = ({ onNavigate }) => {
  const [timeRange, setTimeRange] = useState<'30days' | 'quarter' | 'all'>('30days');

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Page Context Sub-Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 font-label-micro text-label-micro text-outline uppercase tracking-wider mb-1.5">
            <span className="hover:text-on-surface cursor-pointer" onClick={() => onNavigate('overview')}>Workspace</span>
            <span>/</span>
            <span className="text-outline">Improvement</span>
            <span>/</span>
            <span className="text-primary font-semibold">My Progress</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-on-surface tracking-tight leading-tight">
              My Progress
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/30 text-secondary font-label-sm text-label-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              Trajectory On Track
            </span>
          </div>
          <p className="text-sm sm:text-base text-on-surface-variant mt-1.5 font-normal max-w-3xl">
            Track your interview readiness trajectory, competence progression, and practice consistency across roles.
          </p>
        </div>

        {/* Time Range Selector & Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <div className="inline-flex p-0.5 bg-surface-container rounded-lg">
            <button
              type="button"
              onClick={() => setTimeRange('30days')}
              className={`px-2.5 py-1 font-label-md text-label-md rounded transition-all cursor-pointer ${
                timeRange === '30days'
                  ? 'text-on-surface bg-surface-container-lowest shadow-sm font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('quarter')}
              className={`px-2.5 py-1 font-label-md text-label-md rounded transition-all cursor-pointer ${
                timeRange === 'quarter'
                  ? 'text-on-surface bg-surface-container-lowest shadow-sm font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Last Quarter
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('all')}
              className={`px-2.5 py-1 font-label-md text-label-md rounded transition-all cursor-pointer ${
                timeRange === 'all'
                  ? 'text-on-surface bg-surface-container-lowest shadow-sm font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All Time
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 h-[34px] px-3 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-label-md text-label-md shadow-sm transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">file_download</span>
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Top Metric Row: 4 Compact Cards (2-col mobile, 4-col desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* Metric 1: Readiness Index */}
        <div className="bg-surface-container-lowest rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-micro text-label-micro text-on-surface-variant uppercase tracking-wider font-semibold">
              Readiness Index
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-secondary-container/25 text-secondary font-label-micro text-label-micro font-medium">
              <span className="w-1 h-1 rounded-full bg-secondary"></span>
              On Track
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-headline-xl text-headline-xl text-on-surface font-semibold tracking-tight">
              76%
            </span>
            <span className="flex items-center text-secondary font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              +8% vs last mo
            </span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: '76%' }}></div>
          </div>
          <span className="font-label-micro text-label-micro text-on-surface-variant mt-2 font-medium">
            Target benchmark: 80% for L5
          </span>
        </div>

        {/* Metric 2: Average Score */}
        <div className="bg-surface-container-lowest rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-micro text-label-micro text-on-surface-variant uppercase tracking-wider font-semibold">
              Average Score
            </span>
            <span className="font-label-micro text-label-micro text-on-surface-variant font-medium">
              18 sessions
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-headline-xl text-headline-xl text-on-surface font-semibold tracking-tight">
              81
            </span>
            <span className="font-headline-sm text-headline-sm text-on-surface-variant">/ 100</span>
          </div>
          <div className="flex items-center gap-1 mt-3">
            <span className="inline-flex h-1.5 flex-1 rounded-full bg-secondary"></span>
            <span className="inline-flex h-1.5 flex-1 rounded-full bg-secondary"></span>
            <span className="inline-flex h-1.5 flex-1 rounded-full bg-secondary"></span>
            <span className="inline-flex h-1.5 flex-1 rounded-full bg-primary-container"></span>
            <span className="inline-flex h-1.5 flex-1 rounded-full bg-surface-container-high"></span>
          </div>
          <span className="font-label-micro text-label-micro text-on-surface-variant mt-2 font-medium">
            Top decile: 88th percentile
          </span>
        </div>

        {/* Metric 3: Practice Frequency */}
        <div className="bg-surface-container-lowest rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-micro text-label-micro text-on-surface-variant uppercase tracking-wider font-semibold">
              Practice Frequency
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-micro text-label-micro font-medium">
              Goal: 3.0/wk
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="font-headline-xl text-headline-xl text-on-surface font-semibold tracking-tight">
              3.4
            </span>
            <span className="font-label-md text-label-md text-on-surface-variant">sessions / wk</span>
          </div>
          <div className="flex items-center justify-between mt-3 text-secondary font-label-micro text-label-micro font-medium">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">check_circle</span>
              Above Target (+0.4)
            </span>
            <span className="text-on-surface-variant font-normal">14 days evaluated</span>
          </div>
          <span className="font-label-micro text-label-micro text-on-surface-variant mt-2">
            Consistent rhythm sustained
          </span>
        </div>

        {/* Metric 4: Total Practice Time */}
        <div className="bg-surface-container-lowest rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-micro text-label-micro text-on-surface-variant uppercase tracking-wider font-semibold">
              Practice Time
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-tertiary-container/15 text-tertiary font-label-micro text-label-micro font-medium">
              <span className="material-symbols-outlined text-[12px]">local_fire_department</span>
              5-Day Streak
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-headline-xl text-headline-xl text-on-surface font-semibold tracking-tight">
              14h 25m
            </span>
          </div>
          <div className="flex items-center justify-between mt-3 font-label-micro text-label-micro text-on-surface-variant">
            <span>Speaking: 9h 10m</span>
            <span>Review: 5h 15m</span>
          </div>
          <span className="font-label-micro text-label-micro text-on-surface-variant mt-2">
            Next milestone at 15h badge
          </span>
        </div>
      </div>

      {/* Primary Layout: 12-Column Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left / Primary Column (8 cols on xl) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          {/* Section: Score Trajectory & Benchmark */}
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-label-micro text-label-micro uppercase tracking-wider text-on-surface-variant font-semibold">
                    Score Trajectory
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  <span className="font-label-sm text-label-sm text-primary font-medium">
                    L5 Benchmark Trajectory
                  </span>
                </div>
                <div className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">
                  Composite Readiness Progression
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-on-surface-variant font-label-micro text-label-micro">
                  <span className="w-2.5 h-0.5 bg-primary rounded-full"></span>
                  <span>Candidate Actual</span>
                </div>
                <div className="flex items-center gap-1.5 text-on-surface-variant font-label-micro text-label-micro">
                  <span className="w-2.5 h-0.5 bg-outline rounded-full"></span>
                  <span>Target Standard (85)</span>
                </div>
              </div>
            </div>

            {/* SVG Line Chart */}
            <div className="w-full relative mt-1 bg-surface-container-low rounded-lg p-3">
              <svg className="w-full h-44 text-on-surface" fill="none" preserveAspectRatio="none" viewBox="0 0 600 170">
                <line stroke="currentColor" strokeDasharray="3 3" strokeOpacity="0.08" x1="40" x2="580" y1="20" y2="20" />
                <text fill="currentColor" fillOpacity="0.4" fontFamily="Geist" fontSize="10" textAnchor="end" x="32" y="24">90</text>
                
                <line stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.12" strokeWidth="1.2" x1="40" x2="580" y1="55" y2="55" />
                <text fill="#374dbe" fontFamily="Geist" fontSize="10" fontWeight="600" textAnchor="end" x="32" y="59">85</text>
                <text fill="#374dbe" fontFamily="Geist" fontSize="9" textAnchor="end" x="575" y="50">Senior Threshold</text>
                
                <line stroke="currentColor" strokeDasharray="3 3" strokeOpacity="0.08" x1="40" x2="580" y1="90" y2="90" />
                <text fill="currentColor" fillOpacity="0.4" fontFamily="Geist" fontSize="10" textAnchor="end" x="32" y="94">75</text>
                
                <line stroke="currentColor" strokeDasharray="3 3" strokeOpacity="0.08" x1="40" x2="580" y1="125" y2="125" />
                <text fill="currentColor" fillOpacity="0.4" fontFamily="Geist" fontSize="10" textAnchor="end" x="32" y="129">65</text>

                <defs>
                  <linearGradient id="scoreTrajectoryGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#374dbe" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#374dbe" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <path d="M 60 120 L 190 102 L 320 88 L 450 67 L 550 48 L 550 150 L 60 150 Z" fill="url(#scoreTrajectoryGrad)" />
                <path d="M 450 67 L 550 48" stroke="#374dbe" strokeDasharray="4 3" strokeLinecap="round" strokeWidth="2" />
                <path d="M 60 120 L 190 102 L 320 88 L 450 67" stroke="#374dbe" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />

                {/* Point 1: 68 */}
                <circle cx="60" cy="120" fill="#ffffff" r="4.5" stroke="#374dbe" strokeWidth="2.5" />
                <rect fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.06))" height="15" rx="3" width="32" x="44" y="102" />
                <text fill="#1c1b1b" fontFamily="Geist" fontSize="9.5" fontWeight="600" textAnchor="middle" x="60" y="113">68</text>
                <text fill="currentColor" fillOpacity="0.5" fontFamily="Geist" fontSize="9" textAnchor="middle" x="60" y="162">Week 1</text>

                {/* Point 2: 72 */}
                <circle cx="190" cy="102" fill="#ffffff" r="4.5" stroke="#374dbe" strokeWidth="2.5" />
                <rect fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.06))" height="15" rx="3" width="32" x="174" y="84" />
                <text fill="#1c1b1b" fontFamily="Geist" fontSize="9.5" fontWeight="600" textAnchor="middle" x="190" y="95">72</text>
                <text fill="currentColor" fillOpacity="0.5" fontFamily="Geist" fontSize="9" textAnchor="middle" x="190" y="162">Week 2</text>

                {/* Point 3: 75 */}
                <circle cx="320" cy="88" fill="#ffffff" r="4.5" stroke="#374dbe" strokeWidth="2.5" />
                <rect fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.06))" height="15" rx="3" width="32" x="304" y="70" />
                <text fill="#1c1b1b" fontFamily="Geist" fontSize="9.5" fontWeight="600" textAnchor="middle" x="320" y="81">75</text>
                <text fill="currentColor" fillOpacity="0.5" fontFamily="Geist" fontSize="9" textAnchor="middle" x="320" y="162">Week 3</text>

                {/* Point 4: 81 (Current) */}
                <circle cx="450" cy="67" fill="#374dbe" r="5" stroke="#ffffff" strokeWidth="2" />
                <rect fill="#374dbe" height="16" rx="3" width="32" x="434" y="47" />
                <text fill="#ffffff" fontFamily="Geist" fontSize="10" fontWeight="600" textAnchor="middle" x="450" y="59">81</text>
                <text fill="#374dbe" fontFamily="Geist" fontSize="9.5" fontWeight="600" textAnchor="middle" x="450" y="162">Week 4 (Now)</text>

                {/* Point 5: 85 (Target) */}
                <circle cx="550" cy="48" fill="#ffffff" r="4.5" stroke="#374dbe" strokeDasharray="2 2" strokeWidth="2" />
                <rect fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.06))" height="15" rx="3" width="36" x="532" y="28" />
                <text fill="#006c45" fontFamily="Geist" fontSize="9.5" fontWeight="600" textAnchor="middle" x="550" y="39">85 Target</text>
                <text fill="currentColor" fillOpacity="0.5" fontFamily="Geist" fontSize="9" textAnchor="middle" x="550" y="162">Target L5</text>
              </svg>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 text-center">
              <div className="p-2 rounded bg-surface-container-low">
                <span className="font-label-micro text-label-micro uppercase text-on-surface-variant block font-semibold">
                  Baseline Gain
                </span>
                <span className="font-headline-sm text-headline-sm text-secondary font-semibold mt-0.5 inline-block">
                  +13 pts
                </span>
                <span className="font-label-micro text-label-micro text-on-surface-variant block">over 28 days</span>
              </div>
              <div className="p-2 rounded bg-surface-container-low">
                <span className="font-label-micro text-label-micro uppercase text-on-surface-variant block font-semibold">
                  Current Pacing
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5 inline-block">
                  1.25x speed
                </span>
                <span className="font-label-micro text-label-micro text-secondary block font-medium">Ahead of timeline</span>
              </div>
              <div className="p-2 rounded bg-surface-container-low">
                <span className="font-label-micro text-label-micro uppercase text-on-surface-variant block font-semibold">
                  Projected Ready
                </span>
                <span className="font-headline-sm text-headline-sm text-primary font-semibold mt-0.5 inline-block">
                  In 11 Days
                </span>
                <span className="font-label-micro text-label-micro text-on-surface-variant block">Before Google screen</span>
              </div>
            </div>
          </div>

          {/* Section: Practice Frequency & Activity Matrix */}
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-label-micro text-label-micro uppercase tracking-wider text-on-surface-variant font-semibold">
                    Consistency Rhythm
                  </span>
                  <span className="font-label-micro text-label-micro text-secondary font-medium">
                    18 of 18 planned sessions complete
                  </span>
                </div>
                <div className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">
                  Past 8 Weeks Practice Matrix
                </div>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant font-label-micro text-label-micro">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-sm bg-surface-container-high inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-sm bg-primary-fixed inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-sm bg-primary-container inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block"></span>
                <span>More</span>
              </div>
            </div>

            <div className="p-3 bg-surface-container-low rounded-lg overflow-x-auto">
              <div className="min-w-[480px]">
                <div className="flex text-on-surface-variant font-label-micro text-label-micro mb-1 pl-7 justify-between pr-2">
                  <span>Week 1</span>
                  <span>Week 2</span>
                  <span>Week 3</span>
                  <span>Week 4</span>
                  <span>Week 5</span>
                  <span>Week 6</span>
                  <span>Week 7</span>
                  <span className="font-semibold text-primary">Week 8 (Current)</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {/* Mon */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 font-label-micro text-label-micro text-on-surface-variant">Mon</span>
                    <div className="grid grid-cols-8 gap-1.5 flex-1">
                      <div className="h-5 rounded-sm bg-surface-container-high"></div>
                      <div className="h-5 rounded-sm bg-primary-fixed"></div>
                      <div className="h-5 rounded-sm bg-surface-container-high"></div>
                      <div className="h-5 rounded-sm bg-primary-container"></div>
                      <div className="h-5 rounded-sm bg-primary-fixed"></div>
                      <div className="h-5 rounded-sm bg-primary-container"></div>
                      <div className="h-5 rounded-sm bg-primary"></div>
                      <div className="h-5 rounded-sm bg-primary"></div>
                    </div>
                  </div>
                  {/* Tue */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 font-label-micro text-label-micro text-on-surface-variant">Tue</span>
                    <div className="grid grid-cols-8 gap-1.5 flex-1">
                      <div className="h-5 rounded-sm bg-primary-fixed"></div>
                      <div className="h-5 rounded-sm bg-surface-container-high"></div>
                      <div className="h-5 rounded-sm bg-primary-fixed"></div>
                      <div className="h-5 rounded-sm bg-primary-container"></div>
                      <div className="h-5 rounded-sm bg-surface-container-high"></div>
                      <div className="h-5 rounded-sm bg-primary-fixed"></div>
                      <div className="h-5 rounded-sm bg-primary-container"></div>
                      <div className="h-5 rounded-sm bg-primary"></div>
                    </div>
                  </div>
                  {/* Wed */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 font-label-micro text-label-micro text-on-surface-variant">Wed</span>
                    <div className="grid grid-cols-8 gap-1.5 flex-1">
                      <div className="h-5 rounded-sm bg-surface-container-high"></div>
                      <div className="h-5 rounded-sm bg-primary-fixed"></div>
                      <div className="h-5 rounded-sm bg-surface-container-high"></div>
                      <div className="h-5 rounded-sm bg-surface-container-high"></div>
                      <div className="h-5 rounded-sm bg-primary-fixed"></div>
                      <div className="h-5 rounded-sm bg-primary-container"></div>
                      <div className="h-5 rounded-sm bg-primary"></div>
                      <div className="h-5 rounded-sm bg-primary-container"></div>
                    </div>
                  </div>
                  {/* Thu */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 font-label-micro text-label-micro text-on-surface-variant">Thu</span>
                    <div className="grid grid-cols-8 gap-1.5 flex-1">
                      <div className="h-5 rounded-sm bg-surface-container-high"></div>
                      <div className="h-5 rounded-sm bg-surface-container-high"></div>
                      <div className="h-5 rounded-sm bg-primary-container"></div>
                      <div className="h-5 rounded-sm bg-primary-fixed"></div>
                      <div className="h-5 rounded-sm bg-primary-container"></div>
                      <div className="h-5 rounded-sm bg-surface-container-high"></div>
                      <div className="h-5 rounded-sm bg-primary-container"></div>
                      <div className="h-5 rounded-sm bg-primary"></div>
                    </div>
                  </div>
                  {/* Fri */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 font-label-micro text-label-micro text-on-surface-variant">Fri</span>
                    <div className="grid grid-cols-8 gap-1.5 flex-1">
                      <div className="h-5 rounded-sm bg-primary-fixed"></div>
                      <div className="h-5 rounded-sm bg-primary-fixed"></div>
                      <div className="h-5 rounded-sm bg-surface-container-high"></div>
                      <div className="h-5 rounded-sm bg-surface-container-high"></div>
                      <div className="h-5 rounded-sm bg-primary-container"></div>
                      <div className="h-5 rounded-sm bg-primary-fixed"></div>
                      <div className="h-5 rounded-sm bg-primary-container"></div>
                      <div className="h-5 rounded-sm bg-primary"></div>
                    </div>
                  </div>
                  {/* Weekend */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 font-label-micro text-label-micro text-on-surface-variant">Wknd</span>
                    <div className="grid grid-cols-8 gap-1.5 flex-1">
                      <div className="h-5 rounded-sm bg-surface-container-high"></div>
                      <div className="h-5 rounded-sm bg-surface-container-high"></div>
                      <div className="h-5 rounded-sm bg-surface-container-high"></div>
                      <div className="h-5 rounded-sm bg-primary-fixed"></div>
                      <div className="h-5 rounded-sm bg-surface-container-high"></div>
                      <div className="h-5 rounded-sm bg-primary-container"></div>
                      <div className="h-5 rounded-sm bg-surface-container-high"></div>
                      <div className="h-5 rounded-sm bg-surface-container-high"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 font-label-micro text-label-micro text-on-surface-variant">
              <span>Zero missed scheduled days in the past 14 days</span>
              <span className="text-primary font-medium cursor-pointer hover:underline" onClick={() => onNavigate('practice-plan')}>
                View full history breakdown →
              </span>
            </div>
          </div>

          {/* Section: Recent Evaluated Sessions */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-surface-variant">
              <div>
                <span className="font-label-micro text-label-micro uppercase tracking-wider text-on-surface-variant font-semibold">
                  Evaluated Sessions
                </span>
                <div className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">
                  Recent Mock Assessments
                </div>
              </div>
              <span className="font-label-micro text-label-micro text-on-surface-variant font-medium">
                Showing latest 4 of 18
              </span>
            </div>

            <div className="flex flex-col divide-y divide-surface-variant/40">
              {/* Session 1 */}
              <div className="px-4 py-2.5 flex items-center justify-between hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-primary">code</span>
                  </div>
                  <div className="flex flex-col truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                        Frontend L5 Technical Round
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-secondary-container/25 text-secondary font-label-micro text-label-micro font-medium">
                        <span className="w-1 h-1 rounded-full bg-secondary"></span>
                        Passed
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Yesterday · 45 mins · Staff Interviewer AI
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                      84 <span className="font-label-micro text-label-micro text-on-surface-variant font-normal">/ 100</span>
                    </span>
                    <span className="font-label-micro text-label-micro text-secondary font-medium">+6 pts vs avg</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => onNavigate('evaluation-report')}
                    className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
                  >
                    View Feedback
                  </button>
                </div>
              </div>

              {/* Session 2 */}
              <div className="px-4 py-2.5 flex items-center justify-between hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">hub</span>
                  </div>
                  <div className="flex flex-col truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                        Distributed Client Cache &amp; CDN
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-micro text-label-micro font-medium">
                        Solid
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Oct 3 · 60 mins · Distributed Systems Persona
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                      76 <span className="font-label-micro text-label-micro text-on-surface-variant font-normal">/ 100</span>
                    </span>
                    <span className="font-label-micro text-label-micro text-on-surface-variant font-medium">On benchmark</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => onNavigate('evaluation-report')}
                    className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
                  >
                    View Feedback
                  </button>
                </div>
              </div>

              {/* Session 3 */}
              <div className="px-4 py-2.5 flex items-center justify-between hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-tertiary">record_voice_over</span>
                  </div>
                  <div className="flex flex-col truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                        Cross-functional Conflict &amp; Ownership
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-tertiary-container/15 text-tertiary font-label-micro text-label-micro font-medium">
                        <span className="w-1 h-1 rounded-full bg-tertiary"></span>
                        Review Needed
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Sep 30 · 30 mins · Leadership Evaluator
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="font-headline-sm text-headline-sm font-semibold text-tertiary">
                      68 <span className="font-label-micro text-label-micro text-on-surface-variant font-normal">/ 100</span>
                    </span>
                    <span className="font-label-micro text-label-micro text-tertiary font-medium">Weak metrics cited</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => onNavigate('evaluation-report')}
                    className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
                  >
                    View Feedback
                  </button>
                </div>
              </div>

              {/* Session 4 */}
              <div className="px-4 py-2.5 flex items-center justify-between hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-secondary">api</span>
                  </div>
                  <div className="flex flex-col truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                        Realtime Collaborative State Machine
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-secondary-container/25 text-secondary font-label-micro text-label-micro font-medium">
                        <span className="w-1 h-1 rounded-full bg-secondary"></span>
                        Passed
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Sep 28 · 50 mins · Architecture Board
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                      88 <span className="font-label-micro text-label-micro text-on-surface-variant font-normal">/ 100</span>
                    </span>
                    <span className="font-label-micro text-label-micro text-secondary font-medium">Top 5% score</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => onNavigate('evaluation-report')}
                    className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
                  >
                    View Feedback
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-surface-container-low text-center">
              <button 
                type="button"
                onClick={() => onNavigate('evaluation-report')}
                className="font-label-md text-label-md text-primary font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                Browse All 18 Mock Recordings &amp; AI Transcripts
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right / Secondary Column (4 cols on xl) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
          {/* Module 1: Skill-by-Skill Performance Breakdown */}
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3">
              <div>
                <span className="font-label-micro text-label-micro uppercase tracking-wider text-on-surface-variant font-semibold">
                  Competency Matrix
                </span>
                <div className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">
                  Skill-by-Skill Precision
                </div>
              </div>
              <span className="font-label-micro text-label-micro px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">
                5 Dimensions
              </span>
            </div>

            <div className="flex flex-col gap-3 mt-1">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface font-medium">System Architecture &amp; Patterns</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface">86%</span>
                    <span className="font-label-micro text-label-micro px-1 py-0.2 rounded bg-secondary-container/20 text-secondary font-medium">Mastered</span>
                  </div>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '86%' }}></div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface font-medium">Coding &amp; Syntax Efficiency</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface">88%</span>
                    <span className="font-label-micro text-label-micro px-1 py-0.2 rounded bg-secondary-container/20 text-secondary font-medium">Mastered</span>
                  </div>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface font-medium">Algorithmic Trade-offs</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface">79%</span>
                    <span className="font-label-micro text-label-micro px-1 py-0.2 rounded bg-surface-container text-on-surface-variant font-medium">Proficient</span>
                  </div>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary-container h-full rounded-full" style={{ width: '79%' }}></div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface font-medium">Communication Cadence &amp; Clarity</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface">82%</span>
                    <span className="font-label-micro text-label-micro px-1 py-0.2 rounded bg-surface-container text-on-surface-variant font-medium">Proficient</span>
                  </div>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary-container h-full rounded-full" style={{ width: '82%' }}></div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface font-medium">STAR Behavioral Storytelling</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-sm text-label-sm font-semibold text-tertiary">64%</span>
                    <span className="font-label-micro text-label-micro px-1 py-0.2 rounded bg-tertiary-container/15 text-tertiary font-medium">Needs Practice</span>
                  </div>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                  <div className="bg-tertiary-fixed-dim h-full rounded-full" style={{ width: '64%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Module 2: Strongest vs Focus Areas */}
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
            <span className="font-label-micro text-label-micro uppercase tracking-wider text-on-surface-variant font-semibold">
              Diagnostics
            </span>
            <div className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5 mb-3">
              Strongest &amp; Focus Areas
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-secondary font-label-micro text-label-micro uppercase tracking-wider font-semibold">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  Top Strength Assets
                </div>
                <div className="flex flex-col gap-1 text-on-surface font-body-sm text-body-sm">
                  <div className="flex items-start gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-secondary mt-0.5">check</span>
                    <span><strong className="font-medium">Technical Trade-off Justification:</strong> Exceptional clarity explaining latency vs compute costs.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-secondary mt-0.5">check</span>
                    <span><strong className="font-medium">Modern React Lifecycle Hooks:</strong> Flawless code execution and zero edge-case re-render loops.</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-tertiary-container/10 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-tertiary font-label-micro text-label-micro uppercase tracking-wider font-semibold">
                  <span className="material-symbols-outlined text-[14px]">priority_high</span>
                  Target Focus Adjustments
                </div>
                <div className="flex flex-col gap-1 text-on-surface font-body-sm text-body-sm">
                  <div className="flex items-start gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-tertiary mt-0.5">arrow_right</span>
                    <span><strong className="font-medium">Quantifying Business Impact:</strong> Over-focus on mechanics; missing revenue or SLA percentages in STAR results.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-tertiary mt-0.5">arrow_right</span>
                    <span><strong className="font-medium">Edge-Case Brainstorming:</strong> Hesitation when interviewers simulate unexpected payload spikes.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Module 3: Target Role Readiness Comparison */}
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between pb-2">
              <span className="font-label-micro text-label-micro uppercase tracking-wider text-on-surface-variant font-semibold">
                Benchmark Differential
              </span>
              <span className="font-label-micro text-label-micro text-on-surface-variant font-medium">
                L5 Senior Frontend
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low mb-3">
              <div className="flex flex-col">
                <span className="font-label-micro text-label-micro text-on-surface-variant">Your Level</span>
                <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">76%</span>
              </div>
              <div className="flex flex-col items-center px-2">
                <span className="font-label-micro text-label-micro text-error font-medium px-1.5 py-0.5 rounded bg-error-container/40">
                  Gap: -4 pts
                </span>
                <span className="material-symbols-outlined text-[16px] text-outline mt-0.5">trending_flat</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-label-micro text-label-micro text-on-surface-variant">L5 Passing Median</span>
                <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">80%</span>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Closing the 4-point gap requires tightening STAR outcome metrics and 2 more clean System Design drills.
            </p>
          </div>

          {/* Module 4: Curated Recommended Drill */}
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="inline-flex p-1.5 rounded-lg bg-primary-fixed text-primary">
                <span className="material-symbols-outlined text-[18px]">bolt</span>
              </span>
              <div className="flex flex-col">
                <span className="font-label-micro text-label-micro uppercase tracking-wider text-primary font-semibold">
                  Recommended AI Drill
                </span>
                <span className="font-label-md text-label-md text-on-surface font-semibold">
                  15-min STAR Drill: Quantifiable Outcomes
                </span>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 mb-3">
              Specially tuned by AI Coach to push you on specifying monetary metrics, customer telemetry, and resolution timeliness.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('mock-interview-workspace')}
              className="w-full flex items-center justify-center gap-2 h-[34px] px-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md transition-colors shadow-sm cursor-pointer active:scale-[0.99]"
            >
              <span>Start Targeted Drill</span>
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
