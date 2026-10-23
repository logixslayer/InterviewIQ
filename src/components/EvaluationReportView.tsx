import React, { useState } from 'react';
import { ViewMode } from '../types';

interface EvaluationReportViewProps {
  onNavigate: (view: ViewMode) => void;
  onRetry: () => void;
}

export const EvaluationReportView: React.FC<EvaluationReportViewProps> = ({
  onNavigate,
  onRetry,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeDeliveryTab, setActiveDeliveryTab] = useState<'verbatim' | 'staff'>('staff');
  const [expandedRubricIndex, setExpandedRubricIndex] = useState<number | null>(0);

  const rubricRows = [
    {
      title: 'Architecture & Modular Design',
      desc: 'Component decoupling, composability',
      score: 88,
      rating: 'High',
      badgeClass: 'bg-secondary-fixed/40 text-secondary',
      dotClass: 'bg-secondary',
      evidence: 'Clear modular separation of concerns. Isolated state container logic cleanly from UI presentational layers.'
    },
    {
      title: 'Rendering & Virtualization',
      desc: 'DOM recycling, memory safety',
      score: 84,
      rating: 'High',
      badgeClass: 'bg-secondary-fixed/40 text-secondary',
      dotClass: 'bg-secondary',
      evidence: 'Sound strategy using windowing and decoupled hooks. Accurately handled high-frequency scroll reconciliation.'
    },
    {
      title: 'STAR Framework Adherence',
      desc: 'Behavioral storytelling structure',
      score: 62,
      rating: 'Review',
      badgeClass: 'bg-tertiary-fixed/60 text-tertiary',
      dotClass: 'bg-tertiary',
      isWarningRow: true,
      evidence: 'Situation and Task were detailed, but Resolution lacked quantitative business and product metrics.'
    },
    {
      title: 'State Management Trade-offs',
      desc: 'Context vs atomic state stores',
      score: 76,
      rating: 'Solid',
      badgeClass: 'bg-surface-container text-on-surface',
      dotClass: 'bg-on-surface-variant',
      evidence: 'Contrasted Context API versus atomic stores well. Mentioned prop drilling prevention but missed selector memoization nuances.'
    },
    {
      title: 'Code Clarity & Nomenclature',
      desc: 'Technical diction, standards',
      score: 82,
      rating: 'High',
      badgeClass: 'bg-secondary-fixed/40 text-secondary',
      dotClass: 'bg-secondary',
      evidence: 'Precise frontend terminology throughout (e.g. layout thrashing, task queue, synthetic event pooling).'
    }
  ];

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Utility Context Bar / Breadcrumb Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-space-md gap-space-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-space-xs font-label-micro text-label-micro text-outline uppercase tracking-wider">
            <span className="hover:text-on-surface cursor-pointer" onClick={() => onNavigate('overview')}>Workspace</span>
            <span>/</span>
            <span className="hover:text-on-surface cursor-pointer" onClick={() => onNavigate('mock-interviews')}>Mock Interviews</span>
            <span>/</span>
            <span>Technical (Frontend)</span>
            <span>/</span>
            <span className="text-on-surface font-semibold">Evaluation #IV-8492</span>
          </div>
          <div className="flex items-baseline gap-space-md mt-0.5 flex-wrap">
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
              Interview Evaluation Report
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-fixed/30 text-secondary font-label-micro text-label-micro uppercase tracking-wider font-semibold">
              Finalized
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Detailed AI performance review, rubric scoring breakdown, and structured remediation paths.
          </p>
        </div>

        {/* Actions & Quick Triggers */}
        <div className="flex items-center gap-space-sm self-start lg:self-center shrink-0">
          <button 
            type="button"
            onClick={() => window.print()}
            className="h-[34px] px-3.5 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface text-label-md font-label-md rounded shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-outline">download</span>
            <span>Download PDF</span>
          </button>
          <button 
            type="button"
            onClick={onRetry}
            className="h-[34px] px-4 bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-label-md font-label-md rounded shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-[16px]">replay</span>
            <span>Practice Again / Retry</span>
          </button>
        </div>
      </div>

      {/* Telemetry & Session Metadata Strip */}
      <div className="w-full bg-surface-container-lowest rounded shadow-sm p-space-md flex flex-wrap items-center justify-between gap-space-md mb-space-lg">
        <div className="flex flex-wrap items-center gap-x-space-xl gap-y-space-xs font-label-md text-label-md text-on-surface">
          <div className="flex items-center gap-1.5">
            <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">Role Target:</span>
            <span className="font-semibold text-on-surface">Frontend Developer (L5)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">Duration:</span>
            <span className="font-medium">24 mins 12 secs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">Completed:</span>
            <span className="font-medium">Oct 5, 2026 • 9:30 AM</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">Evaluator:</span>
            <span className="font-medium flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-[14px]">neurology</span>
              AI Coach Engine v3.4
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container font-label-micro text-label-micro text-outline tracking-wider uppercase font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
          Sample Benchmarking Session
        </div>
      </div>

      {/* Top Metric Highlights (4 Dense Bento Cards) */}
      {/* Top Metric Highlights (4 Dense Bento Cards: 2-col on mobile, 4-col on xl) */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-space-sm sm:gap-space-md mb-space-lg">
        {/* Score 1: Overall Readiness */}
        <div className="bg-surface-container-lowest rounded shadow-sm p-space-sm sm:p-space-lg flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">
              Readiness
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-secondary-fixed/40 text-secondary font-label-micro text-label-micro font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span className="hidden sm:inline">Passed Benchmark</span>
              <span className="sm:hidden">Passed</span>
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2 my-1 sm:mb-2">
            <span className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">78</span>
            <span className="font-body-sm text-body-sm text-outline">/ 100</span>
          </div>
          <div className="flex items-center justify-between text-label-sm font-label-sm text-outline">
            <span className="hidden sm:inline">Percentile Tier</span>
            <span className="text-on-surface font-semibold text-secondary text-[11px] sm:text-label-sm truncate">Top 22% Candidates</span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-1 mt-2 sm:mt-3 overflow-hidden">
            <div className="bg-secondary h-full rounded-full" style={{ width: '78%' }}></div>
          </div>
        </div>

        {/* Score 2: Technical Correctness */}
        <div className="bg-surface-container-lowest rounded shadow-sm p-space-sm sm:p-space-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">
              Tech Accuracy
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-container font-label-micro text-label-micro font-medium text-on-surface">
              Proficient
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2 my-1 sm:mb-2">
            <span className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">85%</span>
            <span className="font-label-sm text-label-sm text-secondary font-medium hidden sm:inline">+6% vs median</span>
          </div>
          <div className="flex items-center justify-between text-label-sm font-label-sm text-outline">
            <span className="hidden sm:inline">Accuracy Rating</span>
            <span className="text-on-surface font-medium text-[11px] sm:text-label-sm truncate">9/10 checks clear</span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-1 mt-2 sm:mt-3 overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: '85%' }}></div>
          </div>
        </div>

        {/* Score 3: Answer Structure (STAR) */}
        <div className="bg-surface-container-lowest rounded shadow-sm p-space-sm sm:p-space-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">
              STAR Form
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-tertiary-fixed/60 text-tertiary font-label-micro text-label-micro font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
              Needs Focus
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2 my-1 sm:mb-2">
            <span className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">68%</span>
            <span className="font-label-sm text-label-sm text-tertiary font-medium hidden sm:inline">Resolution thin</span>
          </div>
          <div className="flex items-center justify-between text-label-sm font-label-sm text-outline">
            <span className="hidden sm:inline">Framework Form</span>
            <span className="text-on-surface font-medium text-[11px] sm:text-label-sm truncate">R: Needs work</span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-1 mt-2 sm:mt-3 overflow-hidden">
            <div className="bg-tertiary-fixed-dim h-full rounded-full" style={{ width: '68%' }}></div>
          </div>
        </div>

        {/* Score 4: Communication & Delivery */}
        <div className="bg-surface-container-lowest rounded shadow-sm p-space-sm sm:p-space-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">
              Delivery &amp; Pace
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-container font-label-micro text-label-micro font-medium text-on-surface">
              Strong
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2 my-1 sm:mb-2">
            <span className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">82%</span>
            <span className="font-label-sm text-label-sm text-secondary font-medium hidden sm:inline">138 WPM</span>
          </div>
          <div className="flex items-center justify-between text-label-sm font-label-sm text-outline">
            <span className="hidden sm:inline">Delivery Metrics</span>
            <span className="text-on-surface font-medium text-[11px] sm:text-label-sm truncate">138 WPM • 4 Fillers</span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-1 mt-2 sm:mt-3 overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: '82%' }}></div>
          </div>
        </div>
      </div>

      {/* Main Content Grid (62% / 38% split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column (8 cols on xl) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-space-lg">
          {/* Module 1: Comprehensive Rubric Evaluation */}
          <div className="bg-surface-container-lowest rounded shadow-sm overflow-hidden">
            <div className="h-11 px-space-md sm:px-space-lg flex items-center justify-between bg-surface-container-lowest border-b border-surface-variant">
              <div className="flex items-center gap-2">
                <span className="font-label-micro text-label-micro font-semibold uppercase tracking-wider text-outline">
                  Rubric Matrix Breakdown
                </span>
                <span className="text-label-micro font-label-micro px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">
                  5 Competencies
                </span>
              </div>
              <span className="font-label-micro text-label-micro text-outline font-medium hidden sm:inline">
                Calibrated to Staff L5 Standards
              </span>
            </div>

            {/* Mobile Accordion View (<md) */}
            <div className="md:hidden p-space-sm flex flex-col gap-2">
              {rubricRows.map((r, idx) => {
                const isOpen = expandedRubricIndex === idx;
                return (
                  <div key={r.title} className="rounded-lg bg-surface-container-low overflow-hidden transition-all duration-200">
                    <button
                      type="button"
                      onClick={() => setExpandedRubricIndex(isOpen ? null : idx)}
                      className="w-full px-3 py-2.5 flex items-center justify-between text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${r.dotClass}`}></span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-body-md text-body-md text-on-surface font-medium truncate">{r.title}</span>
                          <span className="font-label-micro text-label-micro text-outline">{r.desc}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className={`font-label-sm text-label-sm font-semibold ${r.isWarningRow ? 'text-tertiary' : 'text-secondary'}`}>
                          {r.score}/100
                        </span>
                        <span className={`material-symbols-outlined text-[18px] text-on-surface-variant transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                          expand_more
                        </span>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 pt-1 space-y-2 border-t border-surface-variant/40">
                        <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                          {r.evidence}
                        </p>
                        <div className="flex items-center justify-between text-label-micro font-label-micro text-on-surface-variant pt-1">
                          <span>Benchmark Level: Staff L5</span>
                          <span className={`font-semibold ${r.isWarningRow ? 'text-tertiary' : 'text-secondary'}`}>
                            {r.rating}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop / Tablet Table View (>=md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left font-body-md text-body-md border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-outline font-label-micro text-label-micro uppercase tracking-wider">
                    <th className="py-2.5 px-space-lg font-semibold">Competency / Dimension</th>
                    <th className="py-2.5 px-space-md font-semibold text-center w-24">Score</th>
                    <th className="py-2.5 px-space-md font-semibold w-28">Rating</th>
                    <th className="py-2.5 px-space-lg font-semibold">Observation &amp; Direct Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y-0 text-on-surface">
                  {rubricRows.map((r) => (
                    <tr 
                      key={r.title} 
                      className={`hover:bg-surface-container-low/60 transition-colors ${r.isWarningRow ? 'bg-tertiary-fixed/10' : ''}`}
                    >
                      <td className="py-3 px-space-lg font-medium text-on-surface">
                        <div className="flex flex-col">
                          <span className="font-semibold">{r.title}</span>
                          <span className="font-label-micro text-label-micro text-outline">{r.desc}</span>
                        </div>
                      </td>
                      <td className="py-3 px-space-md text-center">
                        <span className={`font-headline-sm text-headline-sm font-semibold ${r.isWarningRow ? 'text-tertiary' : ''}`}>
                          {r.score}
                        </span>
                        <span className="text-outline text-label-micro font-label-micro">/100</span>
                      </td>
                      <td className="py-3 px-space-md">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-micro font-label-micro font-semibold ${r.badgeClass}`}>
                          <span className={`w-1 h-1 rounded-full ${r.dotClass}`}></span>
                          {r.rating}
                        </span>
                      </td>
                      <td className="py-3 px-space-lg text-on-surface-variant text-body-sm font-body-sm leading-relaxed">
                        {r.evidence}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Module 2: Deep Dive Observations (Side-by-Side Bento Tiles) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            {/* What Went Well */}
            <div className="bg-surface-container-lowest rounded shadow-sm p-space-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-secondary-fixed/50 text-secondary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[15px]">check_circle</span>
                  </span>
                  <h3 className="font-label-micro text-label-micro font-bold uppercase tracking-wider text-secondary">
                    Validated Strengths
                  </h3>
                </div>
                <ul className="flex flex-col gap-2.5 font-body-sm text-body-sm text-on-surface-variant">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">check</span>
                    <span><strong>Deep browser lifecycle insight:</strong> Demonstrated clear mechanics of layout thrashing and forced reflow mitigation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">check</span>
                    <span><strong>Modern React patterns:</strong> Fluent explanation of memoization boundary limits and non-blocking Concurrent Mode hooks.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">check</span>
                    <span><strong>Composure under pushback:</strong> Effectively recalibrated when interviewer probed edge cases regarding unmounted subscribers.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-4 pt-3 flex items-center justify-between text-outline font-label-micro text-label-micro border-t border-surface-variant/40">
                <span>Evaluated by AI Engine</span>
                <span className="text-secondary font-medium">+14 pts over target</span>
              </div>
            </div>

            {/* Key Improvement Areas */}
            <div className="bg-surface-container-lowest rounded shadow-sm p-space-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-tertiary-fixed/60 text-tertiary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[15px]">priority_high</span>
                  </span>
                  <h3 className="font-label-micro text-label-micro font-bold uppercase tracking-wider text-tertiary">
                    High-Leverage Adjustments
                  </h3>
                </div>
                <ul className="flex flex-col gap-2.5 font-body-sm text-body-sm text-on-surface-variant">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-tertiary text-[16px] shrink-0 mt-0.5">arrow_forward</span>
                    <span><strong>Lack of quantifiable impact:</strong> State measurable metrics (e.g., <em>"reduced bundle by 34%"</em> or <em>"sustained 60fps"</em>).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-tertiary text-[16px] shrink-0 mt-0.5">arrow_forward</span>
                    <span><strong>Truncated STAR ending:</strong> You often concluded abruptly once the technical fix was explained without tying it back to user satisfaction.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-tertiary text-[16px] shrink-0 mt-0.5">arrow_forward</span>
                    <span><strong>Pacing in opening statement:</strong> Take 3 seconds to organize thoughts before answering multi-part architecture prompts.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-4 pt-3 flex items-center justify-between text-outline font-label-micro text-label-micro border-t border-surface-variant/40">
                <span>Target Remediation</span>
                <span className="text-tertiary font-semibold">Priority 1 for next run</span>
              </div>
            </div>
          </div>

          {/* Module 3: Transcript Transformation (Candidate vs AI Model Answer) */}
          <div className="bg-surface-container-lowest rounded shadow-sm p-space-lg">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">compare_arrows</span>
                <h3 className="font-label-micro text-label-micro font-bold uppercase tracking-wider text-outline">
                  Answer Refinement Comparison
                </h3>
              </div>
              <span className="font-label-micro text-label-micro px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">
                Question 3 • Performance Bottleneck
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              {/* Raw Excerpt */}
              <div className="bg-surface-container-low rounded p-space-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-label-micro text-label-micro text-outline uppercase font-semibold">
                      Your Verbatim Response
                    </span>
                    <span className="font-label-micro text-label-micro text-tertiary font-medium">
                      Informal / Non-metric
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface italic leading-relaxed">
                    "We just put virtual-window on the table and it was way faster so users stopped complaining about the memory lags on long feeds."
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-outline font-label-micro text-label-micro pt-2 border-t border-surface-variant/40">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  <span>Missing diagnostic process and data evidence</span>
                </div>
              </div>

              {/* Suggested Model Answer */}
              <div className="bg-surface-container-lowest rounded p-space-md shadow-sm border border-surface-variant flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-label-micro text-label-micro text-primary uppercase font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                      Recommended Executive Delivery
                    </span>
                    <span className="font-label-micro text-label-micro text-secondary font-semibold">
                      Staff Benchmark
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                    "Profiling with Chrome DevTools exposed 1,200 idle DOM nodes causing layout thrashing. Integrating <code className="px-1 py-0.5 bg-surface-container rounded text-body-sm font-mono text-primary font-medium">@tanstack/virtual</code> bounded active rendering to 30 elements, reducing TTFB by 42% and guaranteeing 60fps scroll stability under 10k items."
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-secondary font-label-micro text-label-micro font-medium pt-2 border-t border-surface-variant/40">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                  <span>Demonstrates diagnostic depth, concrete metric &amp; business impact</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols on xl) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-space-lg">
          {/* Right Card 1: Skill Distribution Breakdown */}
          <div className="bg-surface-container-lowest rounded shadow-sm p-space-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-label-micro text-label-micro font-bold uppercase tracking-wider text-outline">
                Skill Radar Spectrum
              </h3>
              <span className="font-label-micro text-label-micro text-outline font-medium">
                L5 Evaluator Scale
              </span>
            </div>

            <div className="flex flex-col gap-3.5">
              <div>
                <div className="flex justify-between font-label-md text-label-md mb-1">
                  <span className="text-on-surface font-medium">Architecture Systematics</span>
                  <span className="text-on-surface font-semibold">88%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-label-md text-label-md mb-1">
                  <span className="text-on-surface font-medium">Browser Internals &amp; DOM</span>
                  <span className="text-on-surface font-semibold">84%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '84%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-label-md text-label-md mb-1">
                  <span className="text-on-surface font-medium">State Design Trade-offs</span>
                  <span className="text-on-surface font-semibold">76%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary-container h-full rounded-full" style={{ width: '76%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-label-md text-label-md mb-1">
                  <span className="text-on-surface font-medium">Behavioral STAR Framing</span>
                  <span className="text-tertiary font-semibold">62%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div className="bg-tertiary-fixed-dim h-full rounded-full" style={{ width: '62%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-label-md text-label-md mb-1">
                  <span className="text-on-surface font-medium">Verbal Conciseness &amp; Flow</span>
                  <span className="text-on-surface font-semibold">82%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '82%' }}></div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 bg-surface-container-low rounded p-2.5 flex items-center justify-between text-outline font-label-micro text-label-micro">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-primary">model_training</span>
                <span>Target gap to L6 Principal:</span>
              </div>
              <span className="text-on-surface font-semibold">+9 pts overall</span>
            </div>
          </div>

          {/* Right Card 2: Audio & Delivery Diagnostics */}
          <div className="bg-surface-container-lowest rounded shadow-sm p-space-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-label-micro text-label-micro font-bold uppercase tracking-wider text-outline">
                Audio &amp; Delivery Telemetry
              </h3>
              <span className="inline-flex items-center gap-1 text-secondary font-label-micro text-label-micro font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Live Analyzed
              </span>
            </div>

            <div className="grid grid-cols-2 gap-space-sm mb-3">
              <div className="bg-surface-container-low rounded p-space-sm">
                <span className="font-label-micro text-label-micro uppercase text-outline block mb-0.5">
                  Cadence / Pace
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">138</span>
                  <span className="font-label-micro text-label-micro text-outline">WPM</span>
                </div>
                <span className="font-label-micro text-label-micro text-secondary font-medium">
                  Optimal range (130-150)
                </span>
              </div>

              <div className="bg-surface-container-low rounded p-space-sm">
                <span className="font-label-micro text-label-micro uppercase text-outline block mb-0.5">
                  Filler Count
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">4</span>
                  <span className="font-label-micro text-label-micro text-outline">total</span>
                </div>
                <span className="font-label-micro text-label-micro text-secondary font-medium">
                  2x "um", 2x "like"
                </span>
              </div>
            </div>

            <div className="bg-surface-container-low rounded p-space-sm flex items-center justify-between">
              <div>
                <span className="font-label-micro text-label-micro uppercase text-outline block mb-0.5">
                  Tone &amp; Confidence
                </span>
                <span className="font-body-sm text-body-sm text-on-surface font-medium">
                  86% Assertive and Structured
                </span>
              </div>
              <span className="material-symbols-outlined text-secondary text-[22px]">graphic_eq</span>
            </div>
          </div>

          {/* Right Card 3: Actionable Remediation / Practice Plan */}
          <div className="bg-surface-container-lowest rounded shadow-sm p-space-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-label-micro text-label-micro font-bold uppercase tracking-wider text-outline">
                Curated Next Steps
              </h3>
              <span className="font-label-micro text-label-micro text-primary font-semibold">Priority Track</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {/* Drill 1 */}
              <div className="p-3 bg-surface-container-low rounded flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">
                      Mastering the 'Result' in STAR
                    </span>
                    <span className="font-label-micro text-label-micro text-outline">
                      Targeted behavioral practice • 15 mins
                    </span>
                  </div>
                  <span className="font-label-micro text-label-micro px-1.5 py-0.5 rounded bg-tertiary-fixed/60 text-tertiary font-bold shrink-0">
                    High ROI
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={() => onNavigate('mock-interview-workspace')}
                  className="w-full h-7 bg-surface-container-lowest hover:bg-surface-container text-on-surface text-label-sm font-label-sm rounded flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm"
                >
                  <span>Start Interactive Drill</span>
                  <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                </button>
              </div>

              {/* Drill 2 */}
              <div className="p-3 bg-surface-container-low rounded flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">
                      React Profiling &amp; Leaks
                    </span>
                    <span className="font-label-micro text-label-micro text-outline">
                      Interactive debugging scenario • 20 mins
                    </span>
                  </div>
                  <span className="font-label-micro text-label-micro px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium shrink-0">
                    Technical
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={() => onNavigate('mock-interview-workspace')}
                  className="w-full h-7 bg-surface-container-lowest hover:bg-surface-container text-on-surface text-label-sm font-label-sm rounded flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm"
                >
                  <span>Launch Sandbox</span>
                  <span className="material-symbols-outlined text-[13px]">code</span>
                </button>
              </div>

              {/* Suggested Question */}
              <div className="p-3 bg-surface-container-low rounded flex flex-col gap-1.5">
                <span className="font-label-micro text-label-micro uppercase font-bold text-outline">
                  Recommended Question for Next Run:
                </span>
                <p className="font-body-sm text-body-sm text-on-surface font-medium leading-snug">
                  "Describe a production incident where memory leak degraded client performance and how you root-caused it."
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-label-micro text-label-micro text-outline">Staff L5 Rubric</span>
                  <button 
                    type="button"
                    onClick={() => onNavigate('question-library')}
                    className="text-primary font-label-micro text-label-micro font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    Queue Question
                    <span className="material-symbols-outlined text-[12px]">add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
