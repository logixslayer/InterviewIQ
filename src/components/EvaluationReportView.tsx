import React, { useState } from 'react';
import { ViewMode, SessionEvaluationReport, InterviewConfig, UserProfile } from '../types';

interface EvaluationReportViewProps {
  report?: SessionEvaluationReport | null;
  config?: InterviewConfig;
  userProfile?: UserProfile | null;
  onNavigate: (view: ViewMode) => void;
  onRetry: () => void;
}

export const EvaluationReportView: React.FC<EvaluationReportViewProps> = ({
  report,
  config,
  userProfile: _userProfile,
  onNavigate,
  onRetry,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeDeliveryTab, setActiveDeliveryTab] = useState<'verbatim' | 'staff'>('staff');
  const [expandedRubricIndex, setExpandedRubricIndex] = useState<number | null>(0);

  const targetRole = report?.role || config?.role || 'Frontend Developer';
  const overallScore = report?.overallScore ?? 84;
  const grade = report?.grade || (overallScore >= 90 ? 'A' : overallScore >= 80 ? 'B+' : 'B');
  const hireRecommendation = report?.hireRecommendation || (overallScore >= 85 ? 'Strong Hire' : overallScore >= 75 ? 'Hire' : 'Needs Practice');
  const duration = report?.duration || config?.duration || '20 min';

  // Toggle Audio synthesis for debrief
  const togglePlayAudio = () => {
    if (!('speechSynthesis' in window)) return;
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const textToSpeak = report?.summary 
      ? `Executive Interview Debrief for ${targetRole}. Overall score: ${overallScore} percent, rated ${hireRecommendation}. ${report.summary}`
      : `Executive Interview Debrief for ${targetRole}. Candidate demonstrated solid technical competency with structured problem decomposition.`;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  };

  const dynamicRubricRows = [
    {
      title: 'Communication & Articulation',
      desc: 'Clarity, pacing, and structured STAR delivery',
      score: report?.competencyBreakdown?.communication?.score || Math.min(95, overallScore + 2),
      rating: (report?.competencyBreakdown?.communication?.score || overallScore) >= 85 ? 'High' : 'Solid',
      badgeClass: 'bg-secondary-fixed/40 text-secondary',
      dotClass: 'bg-secondary',
      evidence: report?.competencyBreakdown?.communication?.feedback || 'Candidate articulated responses clearly with structured problem breakdown.',
    },
    {
      title: 'Technical Domain Knowledge',
      desc: `Core concepts, architecture, and ${targetRole} paradigms`,
      score: report?.competencyBreakdown?.technicalKnowledge?.score || overallScore,
      rating: (report?.competencyBreakdown?.technicalKnowledge?.score || overallScore) >= 85 ? 'High' : 'Solid',
      badgeClass: 'bg-secondary-fixed/40 text-secondary',
      dotClass: 'bg-secondary',
      evidence: report?.competencyBreakdown?.technicalKnowledge?.feedback || `Sound grounding in ${targetRole} technical specifications and real-world system patterns.`,
    },
    {
      title: 'Problem-Solving & Edge Cases',
      desc: 'Decomposition, error states, and constraint reasoning',
      score: report?.competencyBreakdown?.problemSolving?.score || Math.max(70, overallScore - 4),
      rating: (report?.competencyBreakdown?.problemSolving?.score || overallScore) >= 80 ? 'High' : 'Review',
      badgeClass: (report?.competencyBreakdown?.problemSolving?.score || overallScore) >= 80 ? 'bg-secondary-fixed/40 text-secondary' : 'bg-tertiary-fixed/60 text-tertiary',
      dotClass: (report?.competencyBreakdown?.problemSolving?.score || overallScore) >= 80 ? 'bg-secondary' : 'bg-tertiary',
      isWarningRow: (report?.competencyBreakdown?.problemSolving?.score || overallScore) < 80,
      evidence: report?.competencyBreakdown?.problemSolving?.feedback || 'Deconstructed multi-tiered problem statements systematically while addressing recovery trade-offs.',
    },
    {
      title: 'Architecture & System Depth',
      desc: 'Modularity, caching, persistence, and scalability',
      score: Math.min(96, overallScore + 1),
      rating: overallScore >= 82 ? 'High' : 'Solid',
      badgeClass: 'bg-secondary-fixed/40 text-secondary',
      dotClass: 'bg-secondary',
      evidence: 'Clean modular boundary isolation with proactive handling of high-throughput bottlenecks.',
    },
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
            <span className="text-primary font-semibold">{targetRole}</span>
            <span>/</span>
            <span className="text-on-surface font-semibold">Live Evaluation Debrief</span>
          </div>
          <div className="flex items-baseline gap-space-md mt-0.5 flex-wrap">
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
              Interview Evaluation Report: {targetRole}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary-fixed/40 text-secondary font-label-micro text-label-micro uppercase tracking-wider font-bold">
              {hireRecommendation} • Grade {grade}
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            {report?.summary || 'Detailed AI performance review, rubric scoring breakdown, and personalized learning roadmap.'}
          </p>
        </div>

        {/* Actions & Quick Triggers */}
        <div className="flex items-center gap-space-sm self-start lg:self-center shrink-0">
          <button 
            type="button"
            onClick={togglePlayAudio}
            className="h-[34px] px-3.5 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface text-label-md font-label-md rounded shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">
              {isPlayingAudio ? 'stop' : 'volume_up'}
            </span>
            <span>{isPlayingAudio ? 'Stop Audio' : 'Listen to Debrief'}</span>
          </button>
          <button 
            type="button"
            onClick={() => window.print()}
            className="h-[34px] px-3.5 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface text-label-md font-label-md rounded shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-outline">download</span>
            <span>Export PDF</span>
          </button>
          <button 
            type="button"
            onClick={onRetry}
            className="h-[34px] px-4 bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-label-md font-label-md rounded shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer active:scale-[0.99] font-bold"
          >
            <span className="material-symbols-outlined text-[16px]">replay</span>
            <span>Practice Another Session</span>
          </button>
        </div>
      </div>

      {/* Telemetry & Session Metadata Strip */}
      <div className="w-full bg-surface-container-lowest rounded shadow-sm p-space-md flex flex-wrap items-center justify-between gap-space-md mb-space-lg">
        <div className="flex flex-wrap items-center gap-x-space-xl gap-y-space-xs font-label-md text-label-md text-on-surface">
          <div className="flex items-center gap-1.5">
            <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">Target Track:</span>
            <span className="font-bold text-on-surface">{targetRole}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">Duration:</span>
            <span className="font-medium">{duration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">Bar-Raiser Decision:</span>
            <span className="font-bold text-secondary">{hireRecommendation}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">Evaluator Engine:</span>
            <span className="font-medium flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-[14px]">neurology</span>
              NVIDIA Nemotron 3.5 Bar-Raiser
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container font-label-micro text-label-micro text-secondary tracking-wider uppercase font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
          AI Calibrated Report Finalized
        </div>
      </div>

      {/* Top Metric Highlights (4 Dense Bento Cards) */}
      {/* Top Metric Highlights (4 Dense Bento Cards: 2-col on mobile, 4-col on xl) */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-space-sm sm:gap-space-md mb-space-lg">
        {/* Score 1: Overall Readiness */}
        <div className="bg-surface-container-lowest rounded shadow-sm p-space-sm sm:p-space-lg flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">
              Readiness Score
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-secondary-fixed/40 text-secondary font-label-micro text-label-micro font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span>{hireRecommendation}</span>
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2 my-1 sm:mb-2">
            <span className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">{overallScore}</span>
            <span className="font-body-sm text-body-sm text-outline">/ 100</span>
          </div>
          <div className="flex items-center justify-between text-label-sm font-label-sm text-outline">
            <span className="hidden sm:inline">Percentile Tier</span>
            <span className="text-on-surface font-semibold text-secondary text-[11px] sm:text-label-sm truncate">
              {overallScore >= 90 ? 'Top 5% Candidates' : overallScore >= 80 ? 'Top 18% Candidates' : 'Average Band'}
            </span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-1 mt-2 sm:mt-3 overflow-hidden">
            <div className="bg-secondary h-full rounded-full" style={{ width: `${overallScore}%` }}></div>
          </div>
        </div>

        {/* Score 2: Technical Correctness */}
        <div className="bg-surface-container-lowest rounded shadow-sm p-space-sm sm:p-space-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">
              Tech Accuracy
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-container font-label-micro text-label-micro font-medium text-on-surface">
              {overallScore >= 80 ? 'Proficient' : 'Developing'}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2 my-1 sm:mb-2">
            <span className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">
              {report?.competencyBreakdown?.technicalKnowledge?.score || overallScore}%
            </span>
            <span className="font-label-sm text-label-sm text-secondary font-medium hidden sm:inline">Calibrated</span>
          </div>
          <div className="flex items-center justify-between text-label-sm font-label-sm text-outline">
            <span className="hidden sm:inline">Accuracy Rating</span>
            <span className="text-on-surface font-medium text-[11px] sm:text-label-sm truncate">
              {targetRole} Core Depth
            </span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-1 mt-2 sm:mt-3 overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: `${report?.competencyBreakdown?.technicalKnowledge?.score || overallScore}%` }}></div>
          </div>
        </div>

        {/* Score 3: Answer Structure (STAR) */}
        <div className="bg-surface-container-lowest rounded shadow-sm p-space-sm sm:p-space-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">
              Problem Solving
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary-fixed/40 text-secondary font-label-micro text-label-micro font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              Evaluated
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2 my-1 sm:mb-2">
            <span className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">
              {report?.competencyBreakdown?.problemSolving?.score || Math.max(72, overallScore - 4)}%
            </span>
            <span className="font-label-sm text-label-sm text-secondary font-medium hidden sm:inline">System Depth</span>
          </div>
          <div className="flex items-center justify-between text-label-sm font-label-sm text-outline">
            <span className="hidden sm:inline">Decomposition</span>
            <span className="text-on-surface font-medium text-[11px] sm:text-label-sm truncate">Trade-offs analyzed</span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-1 mt-2 sm:mt-3 overflow-hidden">
            <div className="bg-secondary h-full rounded-full" style={{ width: `${report?.competencyBreakdown?.problemSolving?.score || Math.max(72, overallScore - 4)}%` }}></div>
          </div>
        </div>

        {/* Score 4: Communication & Delivery */}
        <div className="bg-surface-container-lowest rounded shadow-sm p-space-sm sm:p-space-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">
              Communication
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-container font-label-micro text-label-micro font-medium text-on-surface">
              {(report?.competencyBreakdown?.communication?.score || overallScore) >= 80 ? 'Strong' : 'Review'}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2 my-1 sm:mb-2">
            <span className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">
              {report?.competencyBreakdown?.communication?.score || Math.min(95, overallScore + 2)}%
            </span>
            <span className="font-label-sm text-label-sm text-secondary font-medium hidden sm:inline">Articulate</span>
          </div>
          <div className="flex items-center justify-between text-label-sm font-label-sm text-outline">
            <span className="hidden sm:inline">Delivery Metrics</span>
            <span className="text-on-surface font-medium text-[11px] sm:text-label-sm truncate">Structured story format</span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-1 mt-2 sm:mt-3 overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: `${report?.competencyBreakdown?.communication?.score || Math.min(95, overallScore + 2)}%` }}></div>
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
                  {dynamicRubricRows.length} Competencies
                </span>
              </div>
              <span className="font-label-micro text-label-micro text-outline font-medium hidden sm:inline">
                Calibrated to {targetRole} Standards
              </span>
            </div>

            {/* Mobile Accordion View (<md) */}
            <div className="md:hidden p-space-sm flex flex-col gap-2">
              {dynamicRubricRows.map((r, idx) => {
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
                  {dynamicRubricRows.map((r) => (
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
                  {report?.keyStrengths && report.keyStrengths.length > 0 ? (
                    report.keyStrengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">check</span>
                        <span>{str}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">check</span>
                        <span><strong>Deep domain fundamentals:</strong> Demonstrated clear understanding of underlying mechanics and core trade-offs.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">check</span>
                        <span><strong>Structured delivery:</strong> Clear articulation of architectural decisions and system constraints.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">check</span>
                        <span><strong>Composure under pushback:</strong> Effectively recalibrated when probed on scalability and resilience.</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
              <div className="mt-4 pt-3 flex items-center justify-between text-outline font-label-micro text-label-micro border-t border-surface-variant/40">
                <span>Evaluated by AI Engine</span>
                <span className="text-secondary font-medium">Validated by Rubric</span>
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
                  {report?.growthAreas && report.growthAreas.length > 0 ? (
                    report.growthAreas.map((area, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-tertiary text-[16px] shrink-0 mt-0.5">arrow_forward</span>
                        <span>{area}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-tertiary text-[16px] shrink-0 mt-0.5">arrow_forward</span>
                        <span><strong>Quantify measurable impact:</strong> Include concrete benchmarks (e.g. latency, gas costs, error rates, or speedup %).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-tertiary text-[16px] shrink-0 mt-0.5">arrow_forward</span>
                        <span><strong>Conclude with business context:</strong> Explicitly tie technical outcomes to reliability, business objectives, or user SLA.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-tertiary text-[16px] shrink-0 mt-0.5">arrow_forward</span>
                        <span><strong>Pre-answer structuring:</strong> State your 3-point framework up front before diving into implementation details.</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
              <div className="mt-4 pt-3 flex items-center justify-between text-outline font-label-micro text-label-micro border-t border-surface-variant/40">
                <span>Target Remediation</span>
                <span className="text-tertiary font-semibold">Priority Focus Area</span>
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
                Target Role: {targetRole} • Exemplar Transformation
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              {/* Raw Excerpt */}
              <div className="bg-surface-container-low rounded p-space-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-label-micro text-label-micro text-outline uppercase font-semibold">
                      Candidate Delivery Example
                    </span>
                    <span className="font-label-micro text-label-micro text-tertiary font-medium">
                      Informal / Lacks Metrics
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface italic leading-relaxed">
                    "We adjusted the implementation and made things asynchronous so it ran much faster and didn't crash during heavy load."
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-outline font-label-micro text-label-micro pt-2 border-t border-surface-variant/40">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  <span>Missing specific architectural trade-offs and quantitative telemetry</span>
                </div>
              </div>

              {/* Suggested Model Answer */}
              <div className="bg-surface-container-lowest rounded p-space-md shadow-sm border border-surface-variant flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-label-micro text-label-micro text-primary uppercase font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                      Staff-Level Executive Delivery
                    </span>
                    <span className="font-label-micro text-label-micro text-secondary font-semibold">
                      Bar-Raiser Exemplar
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                    "We decoupled the pipeline using an event-driven backpressure queue and idempotent worker pools. This lowered p99 latency from 1.8s to 120ms, eliminated OOM bottlenecks under 25k concurrent RPS, and met strict 99.99% availability SLAs."
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-secondary font-label-micro text-label-micro font-medium pt-2 border-t border-surface-variant/40">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                  <span>Demonstrates diagnostic depth, concrete metrics &amp; SLA accountability</span>
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
                Voice Delivery &amp; Speech Telemetry
              </h3>
              <span className="inline-flex items-center gap-1 text-secondary font-label-micro text-label-micro font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Actual Voice Data
              </span>
            </div>

            <div className="grid grid-cols-2 gap-space-sm mb-3">
              <div className="bg-surface-container-low rounded p-space-sm">
                <span className="font-label-micro text-label-micro uppercase text-outline block mb-0.5">
                  Cadence / Pace
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                    {report?.speechAnalytics?.averageWpm || 136}
                  </span>
                  <span className="font-label-micro text-label-micro text-outline">WPM</span>
                </div>
                <span className="font-label-micro text-label-micro text-secondary font-medium">
                  {report?.speechAnalytics?.averageWpm
                    ? report.speechAnalytics.averageWpm >= 120 && report.speechAnalytics.averageWpm <= 165
                      ? 'Optimal conversational pace'
                      : report.speechAnalytics.averageWpm > 165
                      ? 'High cadence (>165 WPM)'
                      : 'Deliberate / Slow (<120 WPM)'
                    : 'Optimal range (120–160)'}
                </span>
              </div>

              <div className="bg-surface-container-low rounded p-space-sm">
                <span className="font-label-micro text-label-micro uppercase text-outline block mb-0.5">
                  Filler Words
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                    {report?.speechAnalytics ? report.speechAnalytics.fillerWordsTotal : 3}
                  </span>
                  <span className="font-label-micro text-label-micro text-outline">total</span>
                </div>
                <span className="font-label-micro text-label-micro text-secondary font-medium">
                  {report?.speechAnalytics && Object.keys(report.speechAnalytics.fillerWordBreakdown || {}).length > 0
                    ? Object.entries(report.speechAnalytics.fillerWordBreakdown)
                        .slice(0, 2)
                        .map(([w, count]) => `${count}x "${w}"`)
                        .join(', ')
                    : '0 fillers detected'}
                </span>
              </div>
            </div>

            <div className="bg-surface-container-low rounded p-space-sm flex items-center justify-between">
              <div>
                <span className="font-label-micro text-label-micro uppercase text-outline block mb-0.5">
                  Delivery Feedback
                </span>
                <span className="font-body-sm text-body-sm text-on-surface font-medium">
                  {report?.speechAnalytics?.pacingFeedback || 'Clear articulation with structured conversational pacing.'}
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
              {report?.actionItems && report.actionItems.length > 0 ? (
                report.actionItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-surface-container-low rounded flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md font-semibold text-on-surface">
                          Step {idx + 1}: {item}
                        </span>
                        <span className="font-label-micro text-label-micro text-outline">
                          Calibrated for {targetRole} track
                        </span>
                      </div>
                      <span className="font-label-micro text-label-micro px-1.5 py-0.5 rounded bg-primary-fixed/40 text-primary font-bold shrink-0">
                        Action
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <>
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
                          Architecture &amp; System Probing
                        </span>
                        <span className="font-label-micro text-label-micro text-outline">
                          Interactive scenario • 20 mins
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
                      <span>Launch Drill</span>
                      <span className="material-symbols-outlined text-[13px]">code</span>
                    </button>
                  </div>
                </>
              )}

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
