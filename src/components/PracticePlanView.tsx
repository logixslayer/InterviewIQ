import React, { useState } from 'react';
import { ViewMode } from '../types';

interface PracticePlanViewProps {
  onNavigate: (view: ViewMode) => void;
  onStartDrill: () => void;
}

export const PracticePlanView: React.FC<PracticePlanViewProps> = ({
  onNavigate,
  onStartDrill,
}) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenSuccess, setRegenSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'schedule' | 'matrix'>('schedule');

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setIsRegenerating(false);
      setRegenSuccess(true);
      setTimeout(() => setRegenSuccess(false), 2400);
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full gap-space-lg pb-16">
      {/* Top Context Header */}
      <div className="flex flex-col gap-space-sm bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-space-md">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-space-xs text-outline font-label-micro uppercase tracking-wider font-semibold">
              <span className="hover:text-on-surface cursor-pointer" onClick={() => onNavigate('overview')}>Workspace</span>
              <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              <span className="hover:text-on-surface cursor-pointer" onClick={() => onNavigate('my-progress')}>Improvement</span>
              <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              <span className="text-on-surface font-semibold">Practice Plan</span>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm pt-0.5">
              <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
                Practice Plan
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-surface-container rounded-full text-on-surface-variant font-label-sm text-label-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                Targeting: Meta / Google L5 Frontend Loop (Oct 28)
              </div>
              <span className="px-2 py-0.5 bg-secondary/10 text-secondary font-label-micro text-label-micro uppercase tracking-wider rounded-md font-semibold">
                Week 3 of 4
              </span>
            </div>
            <p className="font-body-md text-body-md text-outline">
              Structured weekly preparation curriculum tailored to your upcoming interviews and diagnostic gaps.
            </p>
          </div>

          <div className="flex items-center gap-space-xs">
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="h-[34px] px-3.5 bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-outline">tune</span>
              Custom Plan Setup
            </button>

            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className={`h-[34px] px-4 rounded font-label-md text-label-md flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                regenSuccess 
                  ? 'bg-secondary text-on-secondary' 
                  : 'bg-on-surface hover:bg-neutral-800 text-on-primary'
              }`}
            >
              <span className={`material-symbols-outlined text-[16px] ${isRegenerating ? 'animate-spin' : 'text-tertiary-fixed-dim'}`}>
                {isRegenerating ? 'sync' : regenSuccess ? 'check' : 'auto_awesome'}
              </span>
              <span>
                {isRegenerating ? 'Re-optimizing Plan...' : regenSuccess ? 'Schedule Rebalanced!' : 'Regenerate AI Schedule'}
              </span>
            </button>
          </div>
        </div>

        {/* 4 Micro-Metric Strip (2-col mobile, 4-col desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-sm pt-space-xs">
          <div className="bg-surface-container-low p-3 rounded-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline font-label-micro uppercase tracking-wider font-semibold">
              <span>Weekly Target</span>
              <span className="material-symbols-outlined text-[15px] text-secondary">trending_up</span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-headline-lg text-headline-lg text-on-surface font-semibold">
                3.8 <span className="text-body-sm font-body-sm text-outline font-normal">/ 5.0 hrs</span>
              </span>
              <span className="font-label-sm text-label-sm text-secondary font-medium">76% achieved</span>
            </div>
            <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden mt-2">
              <div className="bg-secondary h-full rounded-full" style={{ width: '76%' }}></div>
            </div>
          </div>

          <div className="bg-surface-container-low p-3 rounded-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline font-label-micro uppercase tracking-wider font-semibold">
              <span>Scheduled Tasks</span>
              <span className="material-symbols-outlined text-[15px]">task_alt</span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-headline-lg text-headline-lg text-on-surface font-semibold">
                14 <span className="text-body-sm font-body-sm text-outline font-normal">total tasks</span>
              </span>
              <span className="font-label-sm text-label-sm text-primary font-medium">9 done · 5 pending</span>
            </div>
            <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden mt-2">
              <div className="bg-primary-container h-full rounded-full" style={{ width: '64%' }}></div>
            </div>
          </div>

          <div className="bg-surface-container-low p-3 rounded-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline font-label-micro uppercase tracking-wider font-semibold">
              <span>High Priority Focus</span>
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
            </div>
            <div className="mt-1.5 truncate">
              <div className="font-label-md text-label-md text-on-surface font-semibold truncate">STAR Impact Metrics</div>
              <div className="font-body-sm text-body-sm text-outline truncate">&amp; React Concurrent Hooks</div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-label-micro font-label-micro text-tertiary font-medium">
              <span className="material-symbols-outlined text-[13px]">flag</span>
              2 critical remediation drills
            </div>
          </div>

          <div className="bg-surface-container-low p-3 rounded-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline font-label-micro uppercase tracking-wider font-semibold">
              <span>Next Scheduled Mock</span>
              <span className="material-symbols-outlined text-[15px] text-primary">event_available</span>
            </div>
            <div className="mt-1">
              <div className="font-label-md text-label-md text-on-surface font-semibold">Thu, Oct 8 · 4:00 PM</div>
              <div className="font-body-sm text-body-sm text-outline truncate">L5 Architecture Simulation (45m)</div>
            </div>
            <div className="flex items-center gap-1 mt-1.5 text-label-micro font-label-micro text-secondary font-medium">
              <span className="material-symbols-outlined text-[12px]">check_circle</span>
              Calendar CalDAV Synced
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Curriculum & Right Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* LEFT COLUMN (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-space-md">
          {/* Day-by-Day Accordion / Curriculum Flow */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-outline text-[18px]">calendar_view_week</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Weekly Execution Schedule</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-label-micro text-label-micro text-outline uppercase tracking-wider font-semibold">
                  Week 3 / Oct 5 – Oct 11
                </span>
                <div className="flex items-center bg-surface-container-low rounded p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('schedule')}
                    className={`px-2 py-0.5 text-label-micro font-label-micro rounded transition-colors cursor-pointer ${
                      viewMode === 'schedule'
                        ? 'bg-surface-container-lowest shadow-xs text-on-surface font-semibold'
                        : 'text-outline hover:text-on-surface'
                    }`}
                  >
                    Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('matrix')}
                    className={`px-2 py-0.5 text-label-micro font-label-micro rounded transition-colors cursor-pointer ${
                      viewMode === 'matrix'
                        ? 'bg-surface-container-lowest shadow-xs text-on-surface font-semibold'
                        : 'text-outline hover:text-on-surface'
                    }`}
                  >
                    Matrix
                  </button>
                </div>
              </div>
            </div>

            {/* Days Stack */}
            <div className="flex flex-col gap-space-sm">
              {/* MONDAY: Completed */}
              <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-2 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-label-micro font-bold text-[10px]">
                      <span className="material-symbols-outlined text-[13px]">check</span>
                    </span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Monday, Oct 5</span>
                    <span className="text-outline font-label-micro text-label-micro">1 Session · 45m</span>
                  </div>
                  <span className="px-2 py-0.5 bg-secondary/10 text-secondary rounded font-label-micro text-label-micro font-semibold uppercase">
                    Completed
                  </span>
                </div>

                <div className="bg-surface-container-lowest p-3 rounded-md flex flex-wrap items-center justify-between gap-space-sm">
                  <div className="flex items-start gap-space-sm min-w-0">
                    <div className="w-8 h-8 rounded bg-primary-fixed/30 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[16px]">memory</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                          Deep Dive: Virtual DOM Re-rendering &amp; Memory Profiling
                        </span>
                        <span className="px-1.5 py-0.2 bg-surface-container text-on-surface-variant font-label-micro text-label-micro rounded">
                          Technical Architecture
                        </span>
                      </div>
                      <div className="font-body-sm text-body-sm text-outline flex items-center gap-2 mt-0.5 flex-wrap">
                        <span>Duration: 45 min</span>
                        <span>•</span>
                        <span className="text-secondary font-medium">Diagnostic Score: 84 / 100</span>
                        <span>•</span>
                        <span>Evaluation: Strong flamechart analysis</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onNavigate('evaluation-report')}
                      className="h-7 px-2.5 bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm rounded flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px] text-outline">description</span>
                      Review Notes
                    </button>
                  </div>
                </div>
              </div>

              {/* TUESDAY: Completed with Retry Warning */}
              <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-2 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-label-micro font-bold text-[10px]">
                      <span className="material-symbols-outlined text-[13px]">check</span>
                    </span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Tuesday, Oct 6</span>
                    <span className="text-outline font-label-micro text-label-micro">1 Session · 30m</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-tertiary/15 text-tertiary rounded font-label-micro text-label-micro font-semibold uppercase">
                      Retry Recommended
                    </span>
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-3 rounded-md flex flex-wrap items-center justify-between gap-space-sm">
                  <div className="flex items-start gap-space-sm min-w-0">
                    <div className="w-8 h-8 rounded bg-tertiary-fixed/40 text-tertiary flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[16px]">record_voice_over</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                          STAR Storytelling: Conflict with Staff Product Manager
                        </span>
                        <span className="px-1.5 py-0.2 bg-surface-container text-on-surface-variant font-label-micro text-label-micro rounded">
                          Behavioral L5
                        </span>
                        <span className="px-1.5 py-0.2 bg-tertiary/10 text-tertiary font-label-micro text-label-micro rounded font-medium">
                          Gap: Quantification
                        </span>
                      </div>
                      <div className="font-body-sm text-body-sm text-outline flex items-center gap-2 mt-0.5 flex-wrap">
                        <span>Duration: 30 min</span>
                        <span>•</span>
                        <span className="text-tertiary font-medium">Diagnostic Score: 68 / 100</span>
                        <span>•</span>
                        <span className="text-error">Lacking business impact / latency $ savings metrics</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={onStartDrill}
                      className="h-7 px-2.5 bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm rounded flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">replay</span>
                      Retake Drill
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('evaluation-report')}
                      className="h-7 px-2.5 bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm rounded flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px] text-outline">analytics</span>
                      Feedback
                    </button>
                  </div>
                </div>
              </div>

              {/* WEDNESDAY: TODAY (Active High-Contrast Highlight) */}
              <div className="bg-surface-container-lowest rounded-lg p-3.5 flex flex-col gap-3 shadow-md ring-2 ring-primary-container">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-container"></span>
                    </span>
                    <span className="font-label-md text-label-md text-on-surface font-bold">
                      Wednesday, Oct 7 (Today)
                    </span>
                    <span className="text-primary-container font-label-micro text-label-micro uppercase font-bold tracking-wider">
                      Current Target · 45m Total
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-primary-container/10 text-primary-container font-label-micro text-label-micro rounded-full font-semibold">
                    1 In Progress · 1 Queued
                  </span>
                </div>

                {/* Active Task 1 */}
                <div className="bg-surface-container-low p-3.5 rounded-lg flex flex-wrap items-center justify-between gap-space-sm">
                  <div className="flex items-start gap-space-sm min-w-0">
                    <div className="w-9 h-9 rounded bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">speed</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">
                          Core Web Vitals &amp; Hydration Trade-offs Drill
                        </span>
                        <span className="px-2 py-0.5 bg-error-container text-on-error-container font-label-micro text-label-micro rounded uppercase font-semibold">
                          High Priority
                        </span>
                        <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant font-label-micro text-label-micro rounded">
                          Technical Quiz + Audio Prompt
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        Explain INP (Interaction to Next Paint) optimizations when streaming SSR with React 18 Suspense boundaries under thread contention.
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-label-sm font-label-sm text-outline flex-wrap">
                        <span className="flex items-center gap-1 text-on-surface font-medium">
                          <span className="material-symbols-outlined text-[14px] text-primary">timer</span>
                          20 min
                        </span>
                        <span>•</span>
                        <span className="text-primary-container font-medium">Session Paused at 07:42</span>
                        <span>•</span>
                        <span>Linked to: Meta L5 Architecture Rubric</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={onStartDrill}
                      className="h-8 px-3.5 bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md rounded flex items-center gap-1.5 shadow-sm transition-all cursor-pointer font-semibold"
                    >
                      <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                      Resume Drill
                    </button>
                  </div>
                </div>

                {/* Active Task 2 */}
                <div className="bg-surface-container-low/70 p-3.5 rounded-lg flex flex-wrap items-center justify-between gap-space-sm">
                  <div className="flex items-start gap-space-sm min-w-0">
                    <div className="w-9 h-9 rounded bg-surface-container text-on-surface flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">emergency</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                          STAR Framing: Scaling an Infrastructure Incident
                        </span>
                        <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant font-label-micro text-label-micro rounded">
                          Behavioral Leadership
                        </span>
                        <span className="px-1.5 py-0.2 bg-secondary/10 text-secondary font-label-micro text-label-micro rounded font-medium">
                          Remediation Task
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-outline mt-1">
                        Structure a 3.5-minute response on P0 client-side memory exhaustion rollout rollback using strict STAR methodology with metric assertions.
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-label-sm font-label-sm text-outline flex-wrap">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          25 min
                        </span>
                        <span>•</span>
                        <span>Ready for AI Voice Coach evaluation</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={onStartDrill}
                      className="h-8 px-3.5 bg-on-surface hover:bg-neutral-800 text-on-primary font-label-md text-label-md rounded flex items-center gap-1.5 transition-colors cursor-pointer font-semibold"
                    >
                      <span className="material-symbols-outlined text-[16px]">mic</span>
                      Start Drill
                    </button>
                  </div>
                </div>
              </div>

              {/* THURSDAY: Live Simulation Mock */}
              <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-surface-container text-outline flex items-center justify-center font-label-micro font-bold text-[10px]">
                      4
                    </span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Thursday, Oct 8</span>
                    <span className="text-outline font-label-micro text-label-micro">Comprehensive Mock Session</span>
                  </div>
                  <span className="px-2 py-0.5 bg-surface-container text-outline font-label-micro text-label-micro uppercase font-medium">
                    Scheduled 4:00 PM
                  </span>
                </div>

                <div className="bg-surface-container-lowest p-3 rounded-md flex flex-wrap items-center justify-between gap-space-sm">
                  <div className="flex items-start gap-space-sm min-w-0">
                    <div className="w-8 h-8 rounded bg-primary-fixed text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                          Live Simulation Mock: System Architecture &amp; State Machine
                        </span>
                        <span className="px-1.5 py-0.2 bg-primary/10 text-primary font-label-micro text-label-micro rounded font-semibold uppercase">
                          Full 45-Min AI Mock
                        </span>
                      </div>
                      <div className="font-body-sm text-body-sm text-outline flex items-center gap-2 mt-0.5 flex-wrap">
                        <span>Google L5 Interviewer Avatar: "Marcus H. (Tech Lead)"</span>
                        <span>•</span>
                        <span>Live Whiteboard + Audio Interruption Engine</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onNavigate('mock-interview-workspace')}
                      className="h-7 px-2.5 bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm rounded flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px] text-outline">settings_system_daydream</span>
                      Test Environment
                    </button>
                    <button
                      type="button"
                      className="h-7 px-2.5 bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm rounded flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px] text-outline">calendar_month</span>
                      Reschedule
                    </button>
                  </div>
                </div>
              </div>

              {/* FRIDAY & WEEKEND: Upcoming Scheduled Drills */}
              <div className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-surface-container text-outline flex items-center justify-center font-label-micro font-bold text-[10px]">
                      5-7
                    </span>
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Friday – Sunday (Oct 9 – 11)</span>
                    <span className="text-outline font-label-micro text-label-micro">2 Sessions · 75m Total</span>
                  </div>
                  <span className="px-2 py-0.5 bg-surface-container text-outline font-label-micro text-label-micro uppercase font-medium">
                    Upcoming
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="bg-surface-container-lowest p-3 rounded-md flex flex-wrap items-center justify-between gap-space-sm">
                    <div className="flex items-start gap-space-sm min-w-0">
                      <div className="w-8 h-8 rounded bg-surface-container text-outline flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[16px]">edit_note</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                            Mock Feedback Remediation: Refining STAR Results
                          </span>
                          <span className="px-1.5 py-0.2 bg-surface-container text-on-surface-variant font-label-micro text-label-micro rounded">
                            Remediation · 30m
                          </span>
                        </div>
                        <div className="font-body-sm text-body-sm text-outline mt-0.5">
                          Targeted rewrite of 4 story scripts targeting Google "Leadership &amp; Navigation" rubrics.
                        </div>
                      </div>
                    </div>
                    <button disabled className="h-7 px-2.5 bg-surface-container-low text-outline font-label-sm text-label-sm rounded flex items-center gap-1 cursor-not-allowed">
                      <span className="material-symbols-outlined text-[14px]">lock</span>
                      Locked
                    </button>
                  </div>

                  <div className="bg-surface-container-lowest p-3 rounded-md flex flex-wrap items-center justify-between gap-space-sm">
                    <div className="flex items-start gap-space-sm min-w-0">
                      <div className="w-8 h-8 rounded bg-surface-container text-outline flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[16px]">code</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                            Timed Coding: DOM Virtualization Implementation
                          </span>
                          <span className="px-1.5 py-0.2 bg-surface-container text-on-surface-variant font-label-micro text-label-micro rounded">
                            Live Coding · 45m
                          </span>
                        </div>
                        <div className="font-body-sm text-body-sm text-outline mt-0.5">
                          Infinite windowing algorithm with variable row heights and binary search indexing.
                        </div>
                      </div>
                    </div>
                    <button disabled className="h-7 px-2.5 bg-surface-container-low text-outline font-label-sm text-label-sm rounded flex items-center gap-1 cursor-not-allowed">
                      <span className="material-symbols-outlined text-[14px]">lock</span>
                      Locked
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Matrix & Response Fluency Heatmap */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-outline text-[18px]">grid_view</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Weekly Fluency &amp; Response Distribution</h3>
              </div>
              <div className="flex items-center gap-3 text-label-micro font-label-micro text-outline">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-secondary"></span> Strong Pass (&gt;80)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-tertiary"></span> Needs Revision (60-79)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-outline-variant"></span> Scheduled</span>
              </div>
            </div>

            <div className="bg-surface-container-low p-3.5 rounded-lg flex flex-col gap-2">
              <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
                <span>Aggregated Diagnostic Matrix</span>
                <span className="font-mono text-outline font-medium">48 total prompt evaluations this month</span>
              </div>

              <div className="grid grid-cols-12 gap-1.5 pt-1">
                <div className="h-6 rounded-xs bg-secondary flex items-center justify-center text-[10px] text-on-primary font-mono font-bold" title="Score: 88">88</div>
                <div className="h-6 rounded-xs bg-secondary flex items-center justify-center text-[10px] text-on-primary font-mono font-bold" title="Score: 92">92</div>
                <div className="h-6 rounded-xs bg-secondary flex items-center justify-center text-[10px] text-on-primary font-mono font-bold" title="Score: 84">84</div>
                <div className="h-6 rounded-xs bg-tertiary flex items-center justify-center text-[10px] text-on-tertiary font-mono font-bold" title="Score: 68">68</div>
                <div className="h-6 rounded-xs bg-secondary flex items-center justify-center text-[10px] text-on-primary font-mono font-bold" title="Score: 86">86</div>
                <div className="h-6 rounded-xs bg-tertiary flex items-center justify-center text-[10px] text-on-tertiary font-mono font-bold" title="Score: 71">71</div>
                <div className="h-6 rounded-xs bg-secondary flex items-center justify-center text-[10px] text-on-primary font-mono font-bold" title="Score: 90">90</div>
                <div className="h-6 rounded-xs bg-outline-variant/40 flex items-center justify-center text-[10px] text-outline font-mono">-</div>
                <div className="h-6 rounded-xs bg-outline-variant/40 flex items-center justify-center text-[10px] text-outline font-mono">-</div>
                <div className="h-6 rounded-xs bg-outline-variant/40 flex items-center justify-center text-[10px] text-outline font-mono">-</div>
                <div className="h-6 rounded-xs bg-outline-variant/40 flex items-center justify-center text-[10px] text-outline font-mono">-</div>
                <div className="h-6 rounded-xs bg-outline-variant/40 flex items-center justify-center text-[10px] text-outline font-mono">-</div>
              </div>

              <div className="flex justify-between text-label-micro font-label-micro text-outline pt-1">
                <span>Session 1 (Architecture)</span>
                <span>Current: Week 3 Session 7</span>
                <span>Session 12 (Loop Final)</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-space-md">
          {/* Card 1: Interview Countdown & Loop Target */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1">
              <span className="font-label-micro text-label-micro text-outline uppercase tracking-wider font-semibold">
                Loop Target Countdown
              </span>
              <span className="px-2 py-0.5 bg-secondary/15 text-secondary rounded font-label-micro text-label-micro font-bold">
                ON TRACK
              </span>
            </div>

            <div className="flex items-center gap-space-md bg-surface-container-low p-3.5 rounded-lg">
              <div className="flex flex-col items-center justify-center bg-surface-container-lowest px-3 py-2 rounded shadow-xs border-l-2 border-primary-container">
                <span className="font-headline-xl text-headline-xl text-on-surface font-bold leading-none">
                  20
                </span>
                <span className="font-label-micro text-label-micro text-outline uppercase tracking-wider mt-1 font-semibold">
                  Days Left
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                  Meta / Google L5 Front-End
                </span>
                <span className="font-body-sm text-body-sm text-outline">Target Date: Wednesday, Oct 28</span>
                <div className="flex items-center gap-1.5 mt-1 font-label-micro text-label-micro text-secondary font-medium">
                  <span className="material-symbols-outlined text-[13px]">verified</span>
                  78% Overall Readiness Index
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Curriculum Milestones Progress */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-outline text-[18px]">flag</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Curriculum Milestones</h3>
              </div>
              <span className="font-label-micro text-label-micro text-primary-container font-semibold">
                4 PHASES
              </span>
            </div>

            <div className="flex flex-col gap-3 pt-1">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-body-sm font-body-sm">
                  <span className="font-medium text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-secondary">check_circle</span>
                    1. Foundation &amp; React Runtime
                  </span>
                  <span className="font-label-sm text-label-sm font-semibold text-secondary">100%</span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-body-sm font-body-sm">
                  <span className="font-medium text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-primary">radio_button_checked</span>
                    2. Deep Dives, Hydration &amp; Latency
                  </span>
                  <span className="font-label-sm text-label-sm font-semibold text-primary">85%</span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary-container h-full rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>

              <div className="flex flex-col gap-1 bg-surface-container-low p-2.5 rounded-lg">
                <div className="flex items-center justify-between text-body-sm font-body-sm">
                  <span className="font-semibold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-tertiary">pending</span>
                    3. Comprehensive L5 Simulations
                  </span>
                  <span className="font-label-sm text-label-sm font-bold text-tertiary">40%</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-tertiary-container h-full rounded-full" style={{ width: '40%' }}></div>
                </div>
                <span className="text-label-micro font-label-micro text-outline mt-0.5">
                  Current focus: 2 full mock loops remaining this week
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-body-sm font-body-sm">
                  <span className="font-medium text-outline flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-outline">lock</span>
                    4. Final Loop Readiness Certification
                  </span>
                  <span className="font-label-sm text-label-sm text-outline">0%</span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-outline-variant h-full rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: AI Coach Diagnostic Remediation */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-outline text-[18px]">psychology</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">AI Coach Diagnostics</h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
            </div>
            <p className="font-body-sm text-body-sm text-outline">
              Remediation items automatically injected based on speech analysis &amp; rubrics from your last 3 drills.
            </p>

            <div className="flex flex-col gap-2">
              <div className="bg-surface-container-low p-3 rounded-lg flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">STAR "Result" Metrics Gap</span>
                  <span className="px-1.5 py-0.5 bg-error-container text-on-error-container rounded text-label-micro font-label-micro font-bold">
                    Critical
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  In Tuesday's behavioral drill, you described resolving conflict without stating quantified impact (e.g., "reduced deploy reverts by 34%").
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-label-micro font-label-micro text-outline">2 targeted drills assigned</span>
                  <button 
                    type="button"
                    onClick={onStartDrill}
                    className="h-6 px-2 bg-on-surface hover:bg-neutral-800 text-on-primary text-label-micro font-label-micro rounded transition-colors cursor-pointer"
                  >
                    Practice Metric Formulas
                  </button>
                </div>
              </div>

              <div className="bg-surface-container-low p-3 rounded-lg flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">Memory Leak Profiling Depth</span>
                  <span className="px-1.5 py-0.5 bg-tertiary/15 text-tertiary rounded text-label-micro font-label-micro font-bold">
                    Needs Review
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  System design interviewers will expect precise explanations of detached DOM tree retainers and weak ref garbage collection.
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-label-micro font-label-micro text-outline">1 specialized drill queued</span>
                  <button 
                    type="button"
                    onClick={() => onNavigate('mock-interview-workspace')}
                    className="h-6 px-2 bg-surface-container-lowest hover:bg-surface-container text-on-surface text-label-micro font-label-micro rounded transition-colors shadow-xs cursor-pointer"
                  >
                    View Concept Sheet
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Quick Telemetry */}
          <div 
            onClick={() => onNavigate('my-progress')}
            className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between gap-space-sm cursor-pointer hover:bg-surface-container-low transition-colors"
          >
            <div className="flex items-center gap-space-sm">
              <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">insights</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface font-semibold">Pacing Telemetry: 138 WPM</span>
                <span className="font-body-sm text-body-sm text-outline">Optimal range for executive clarity (130-150 WPM)</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline text-[16px]">chevron_right</span>
          </div>
        </div>
      </div>
    </div>
  );
};
