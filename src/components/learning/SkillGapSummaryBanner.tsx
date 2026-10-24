import React, { useState } from 'react';
import { SkillGapAnalysisResult } from '../../services/skillGapService';
import { SkillGapItem } from '../../types/learning';

interface SkillGapSummaryBannerProps {
  analysis: SkillGapAnalysisResult;
  selectedRoleTitle: string;
  onFilterByTopic: (topicName: string) => void;
  onNavigateToMock: () => void;
}

export const SkillGapSummaryBanner: React.FC<SkillGapSummaryBannerProps> = ({
  analysis,
  selectedRoleTitle,
  onFilterByTopic,
  onNavigateToMock
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'improvement' | 'developing' | 'role_standard'>('improvement');

  const needsImprovementItems = analysis.items.filter(i => i.state === 'needs_improvement');
  const developingItems = analysis.items.filter(i => i.state === 'developing');
  const roleStandardItems = analysis.items.filter(i => i.state === 'recommended_role');
  const onTrackItems = analysis.items.filter(i => i.state === 'on_track');

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-md sm:p-space-lg shadow-sm border border-surface-variant flex flex-col gap-3">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">
              Evidence-Based Skill Diagnostics
            </span>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-label-micro text-label-micro font-medium">
              Target Track: {selectedRoleTitle}
            </span>
          </div>

          <h3 className="font-headline-sm text-base sm:text-lg font-bold text-on-surface">
            {analysis.hasAssessmentEvidence
              ? `Diagnostic Report: ${needsImprovementItems.length} Growth Area(s) Detected`
              : `Foundational Curriculum for ${selectedRoleTitle}`}
          </h3>

          <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant max-w-2xl">
            {analysis.evidenceSummary}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-[34px] px-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isExpanded ? 'expand_less' : 'expand_more'}
            </span>
            <span>{isExpanded ? 'Hide Details' : 'View Full Evidence'}</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToMock}
            className="h-[34px] px-3.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer font-semibold"
          >
            <span className="material-symbols-outlined text-[16px]">record_voice_over</span>
            <span>Take Mock Interview</span>
          </button>
        </div>
      </div>

      {/* Metric Pills Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <div
          onClick={() => { setActiveTab('improvement'); setIsExpanded(true); }}
          className={`p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'improvement' && isExpanded
              ? 'bg-error-container/20 border-error/40 shadow-xs'
              : 'bg-surface-container-low border-transparent hover:border-surface-variant'
          }`}
        >
          <div className="flex items-center justify-between text-error font-label-micro text-label-micro uppercase tracking-wider font-semibold">
            <span>Needs Focus</span>
            <span className="material-symbols-outlined text-[14px]">priority_high</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-headline-lg text-xl font-bold text-on-surface">
              {needsImprovementItems.length}
            </span>
            <span className="text-outline font-label-micro text-label-micro">topics</span>
          </div>
        </div>

        <div
          onClick={() => { setActiveTab('developing'); setIsExpanded(true); }}
          className={`p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'developing' && isExpanded
              ? 'bg-tertiary-fixed/30 border-tertiary/40 shadow-xs'
              : 'bg-surface-container-low border-transparent hover:border-surface-variant'
          }`}
        >
          <div className="flex items-center justify-between text-tertiary font-label-micro text-label-micro uppercase tracking-wider font-semibold">
            <span>Developing</span>
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-headline-lg text-xl font-bold text-on-surface">
              {developingItems.length}
            </span>
            <span className="text-outline font-label-micro text-label-micro">topics</span>
          </div>
        </div>

        <div
          onClick={() => { setActiveTab('role_standard'); setIsExpanded(true); }}
          className={`p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'role_standard' && isExpanded
              ? 'bg-primary-fixed/30 border-primary/40 shadow-xs'
              : 'bg-surface-container-low border-transparent hover:border-surface-variant'
          }`}
        >
          <div className="flex items-center justify-between text-primary font-label-micro text-label-micro uppercase tracking-wider font-semibold">
            <span>Curriculum</span>
            <span className="material-symbols-outlined text-[14px]">menu_book</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-headline-lg text-xl font-bold text-on-surface">
              {roleStandardItems.length}
            </span>
            <span className="text-outline font-label-micro text-label-micro">unassessed</span>
          </div>
        </div>

        <div
          className="p-2.5 rounded-lg bg-surface-container-low border border-transparent flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-secondary font-label-micro text-label-micro uppercase tracking-wider font-semibold">
            <span>On Track</span>
            <span className="material-symbols-outlined text-[14px]">verified</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-headline-lg text-xl font-bold text-on-surface">
              {onTrackItems.length}
            </span>
            <span className="text-outline font-label-micro text-label-micro">topics</span>
          </div>
        </div>
      </div>

      {/* Expanded Evidence Breakdown */}
      {isExpanded && (
        <div className="mt-2 pt-3 border-t border-surface-variant flex flex-col gap-3 animate-in fade-in">
          {/* Transparency Disclaimer */}
          <div className="p-2.5 rounded-md bg-surface-container-low text-xs text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary shrink-0">info</span>
            <span>
              <strong>Methodology:</strong> Unassessed topics are marked as role curriculum, never assumed weak.
              Identified growth areas are derived exclusively from actual assessment transcripts and review-flagged questions.
            </span>
          </div>

          {/* Active Tab View */}
          <div className="flex flex-col gap-2">
            {activeTab === 'improvement' && (
              <div className="flex flex-col gap-2">
                <span className="font-label-micro text-label-micro uppercase tracking-wider text-error font-semibold">
                  Topics Requiring Attention Based On Evaluation Evidence
                </span>
                {needsImprovementItems.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic py-2">
                    No active weaknesses flagged in your recent interview feedback! Keep up the solid performance.
                  </p>
                ) : (
                  needsImprovementItems.map((item: SkillGapItem) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-surface-container-low border border-surface-variant flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-surface-container transition-colors"
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-label-md text-sm font-bold text-on-surface">
                            {item.topic}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-error-container/40 text-error font-label-micro text-label-micro font-semibold uppercase">
                            Growth Area
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant">
                          <strong className="text-on-surface font-medium">Evidence:</strong> {item.evidenceDetails}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onFilterByTopic(item.topic)}
                        className="px-3 py-1.5 rounded-md bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
                      >
                        View Resources
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'developing' && (
              <div className="flex flex-col gap-2">
                <span className="font-label-micro text-label-micro uppercase tracking-wider text-tertiary font-semibold">
                  Developing Competencies
                </span>
                {developingItems.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic py-2">
                    No partially assessed topics in progress.
                  </p>
                ) : (
                  developingItems.map((item: SkillGapItem) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-surface-container-low border border-surface-variant flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-surface-container transition-colors"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-label-md text-sm font-bold text-on-surface">
                          {item.topic}
                        </span>
                        <p className="text-xs text-on-surface-variant">
                          {item.evidenceDetails}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onFilterByTopic(item.topic)}
                        className="px-3 py-1.5 rounded-md bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-semibold transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
                      >
                        Explore Topic
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'role_standard' && (
              <div className="flex flex-col gap-2">
                <span className="font-label-micro text-label-micro uppercase tracking-wider text-primary font-semibold">
                  Standard Curriculum for {selectedRoleTitle} (Unassessed)
                </span>
                {roleStandardItems.map((item: SkillGapItem) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      <span className="text-xs sm:text-sm font-medium text-on-surface">
                        {item.topic}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onFilterByTopic(item.topic)}
                      className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-variant text-xs text-on-surface transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
                    >
                      Browse Learning Material
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
