import React from 'react';
import { RankedRecommendation } from '../../types/learning';

interface ResourceDetailModalProps {
  item: RankedRecommendation | null;
  isOpen: boolean;
  onClose: () => void;
  isBookmarked: boolean;
  isCompleted: boolean;
  isInProgress: boolean;
  onToggleBookmark: (resourceId: string, e: React.MouseEvent) => void;
  onToggleComplete: (resourceId: string, e: React.MouseEvent) => void;
  onMarkInProgress: (resourceId: string) => void;
  onPracticeQuestion?: (questionId: string) => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  isBookmarked,
  isCompleted,
  isInProgress,
  onToggleBookmark,
  onToggleComplete,
  onMarkInProgress,
  onPracticeQuestion
}) => {
  if (!isOpen || !item) return null;

  const { resource, explanation } = item;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-2xl border border-surface-variant flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-space-lg border-b border-surface-variant flex items-start justify-between gap-4 bg-surface-container-low/50">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-primary-fixed/50 text-on-primary-fixed-variant font-label-micro text-label-micro font-semibold uppercase tracking-wider">
                {resource.category}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-label-micro text-label-micro font-medium capitalize">
                {resource.type}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-secondary-container/30 text-secondary font-label-micro text-label-micro font-medium">
                {resource.difficulty}
              </span>
              {resource.isOfficial && (
                <span className="px-1.5 py-0.5 rounded bg-secondary-container/40 text-secondary font-label-micro text-label-micro font-semibold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  Official
                </span>
              )}
              <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-micro text-label-micro">
                {resource.pricing === 'free' ? '100% Free' : resource.pricing === 'freemium' ? 'Free Portion' : 'Paid'}
              </span>
            </div>

            <h2 className="font-headline-sm text-lg font-bold text-on-surface leading-snug">
              {resource.title}
            </h2>

            <div className="flex items-center gap-2 text-outline font-label-micro text-label-micro">
              <span className="font-semibold text-on-surface-variant">{resource.provider}</span>
              <span>•</span>
              <span>{resource.estimatedDuration}</span>
              <span>•</span>
              <span>Verified: {resource.verificationDate}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-variant text-outline hover:text-on-surface transition-colors cursor-pointer shrink-0"
            title="Close dialog"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-space-lg overflow-y-auto flex flex-col gap-5 text-on-surface">
          {/* Transparent Recommendation Rationale */}
          <div className="p-3.5 rounded-lg bg-surface-container-low border border-surface-variant flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-primary font-label-micro text-label-micro uppercase tracking-wider font-semibold">
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              <span>Why Recommended For Your Profile</span>
            </div>
            <p className="font-body-md text-sm text-on-surface font-medium">
              {explanation.headline}
            </p>
            <p className="font-body-sm text-xs text-on-surface-variant">
              {explanation.detail}
            </p>
          </div>

          {/* Summary / Description */}
          <div className="flex flex-col gap-1.5">
            <h4 className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">
              Overview &amp; Scope
            </h4>
            <p className="font-body-sm text-sm text-on-surface-variant leading-relaxed">
              {resource.description}
            </p>
          </div>

          {/* Learning Objectives */}
          {resource.learningOutcomes && resource.learningOutcomes.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">
                What You Will Learn
              </h4>
              <ul className="flex flex-col gap-1.5 pl-1">
                {resource.learningOutcomes.map((outcome, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-secondary shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prerequisites */}
          {resource.prerequisites && resource.prerequisites.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <h4 className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">
                Prerequisites &amp; Prior Knowledge
              </h4>
              <div className="flex items-center gap-1.5 flex-wrap">
                {resource.prerequisites.map((pre, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-surface-container text-on-surface-variant text-xs font-medium"
                  >
                    {pre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Hands-on Exercise */}
          {resource.handsOnExercise && (
            <div className="p-3 rounded-lg bg-surface-container border border-surface-variant flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-secondary font-label-micro text-label-micro uppercase tracking-wider font-semibold">
                <span className="material-symbols-outlined text-[15px]">code</span>
                <span>Suggested Hands-On Exercise</span>
              </div>
              <p className="font-body-sm text-xs sm:text-sm text-on-surface">
                {resource.handsOnExercise}
              </p>
            </div>
          )}

          {/* Related Interview Questions */}
          {resource.relatedQuestionIds && resource.relatedQuestionIds.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">
                  Related InterviewIQ Questions
                </h4>
                <span className="font-label-micro text-label-micro text-outline">
                  Test your comprehension
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {resource.relatedQuestionIds.map((qid) => (
                  <div
                    key={qid}
                    className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between gap-3 hover:bg-surface-container transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded bg-primary-fixed/50 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        Q
                      </span>
                      <span className="font-body-sm text-xs font-medium text-on-surface truncate">
                        Question Ref #{qid.toUpperCase()}
                      </span>
                    </div>

                    {onPracticeQuestion && (
                      <button
                        type="button"
                        onClick={() => {
                          onPracticeQuestion(qid);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors cursor-pointer shrink-0"
                      >
                        Practice Now
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safe External Exit Disclosure */}
          <div className="p-2.5 rounded-md bg-surface-container-low text-[11px] text-outline flex items-center gap-2">
            <span className="material-symbols-outlined text-[15px] shrink-0">info</span>
            <span>
              You are leaving InterviewIQ to visit an external educational resource from{' '}
              <strong className="text-on-surface font-medium">{resource.provider}</strong>. Content and policies are managed by the host.
            </span>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-space-md border-t border-surface-variant flex items-center justify-between gap-2 bg-surface-container-low flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => onToggleBookmark(resource.id, e)}
              className={`h-[34px] px-3 rounded flex items-center gap-1.5 font-label-md text-label-md transition-colors cursor-pointer ${
                isBookmarked
                  ? 'bg-tertiary-container/30 text-tertiary font-semibold'
                  : 'bg-surface-container text-on-surface hover:bg-surface-variant'
              }`}
            >
              <span
                className="material-symbols-outlined text-[16px]"
                style={isBookmarked ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                star
              </span>
              <span>{isBookmarked ? 'Saved' : 'Save for Later'}</span>
            </button>

            <button
              type="button"
              onClick={(e) => onToggleComplete(resource.id, e)}
              className={`h-[34px] px-3 rounded flex items-center gap-1.5 font-label-md text-label-md transition-colors cursor-pointer ${
                isCompleted
                  ? 'bg-secondary-container/40 text-secondary font-semibold'
                  : 'bg-surface-container text-on-surface hover:bg-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isCompleted ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span>{isCompleted ? 'Completed' : 'Mark Complete'}</span>
            </button>

            {!isCompleted && !isInProgress && (
              <button
                type="button"
                onClick={() => onMarkInProgress(resource.id)}
                className="h-[34px] px-3 rounded bg-surface-container text-on-surface hover:bg-surface-variant flex items-center gap-1.5 font-label-md text-label-md transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">bookmark_border</span>
                <span>Start Learning</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-[34px] px-3.5 rounded bg-surface-container hover:bg-surface-variant text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
            >
              Close
            </button>

            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-[34px] px-4 rounded bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer font-semibold"
            >
              <span>{resource.verificationStatus === 'search_link' ? 'Search Videos' : 'Open Resource'}</span>
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
