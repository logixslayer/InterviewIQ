import React from 'react';
import { RankedRecommendation } from '../../types/learning';

interface ResourceCardProps {
  item: RankedRecommendation;
  isBookmarked: boolean;
  isCompleted: boolean;
  isInProgress: boolean;
  onToggleBookmark: (resourceId: string, e: React.MouseEvent) => void;
  onToggleComplete: (resourceId: string, e: React.MouseEvent) => void;
  onOpenDetails: (item: RankedRecommendation) => void;
  onPracticeQuestion?: (questionId: string) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  item,
  isBookmarked,
  isCompleted,
  isInProgress,
  onToggleBookmark,
  onToggleComplete,
  onOpenDetails,
  onPracticeQuestion
}) => {
  const { resource, explanation } = item;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return 'play_circle';
      case 'documentation': return 'description';
      case 'course': return 'school';
      case 'article': return 'article';
      case 'exercise': return 'terminal';
      case 'path': return 'route';
      case 'project': return 'folder_open';
      default: return 'menu_book';
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Beginner':
        return 'bg-secondary-container/40 text-secondary';
      case 'Intermediate':
        return 'bg-tertiary-fixed/40 text-tertiary';
      case 'Advanced':
        return 'bg-error-container/40 text-error';
      default:
        return 'bg-surface-container text-on-surface-variant';
    }
  };

  const getBadgeStyle = (badgeType: 'urgent' | 'warning' | 'info' | 'success') => {
    switch (badgeType) {
      case 'urgent':
        return 'bg-error-container/40 text-error border border-error/20';
      case 'warning':
        return 'bg-tertiary-fixed/50 text-tertiary border border-tertiary/20';
      case 'success':
        return 'bg-secondary-container/40 text-secondary border border-secondary/20';
      case 'info':
      default:
        return 'bg-primary-fixed/50 text-on-primary-fixed-variant border border-primary/20';
    }
  };

  return (
    <div
      className={`group bg-surface-container-lowest rounded-lg p-space-md shadow-sm hover:shadow-md transition-all flex flex-col justify-between border ${
        isCompleted
          ? 'border-secondary/30 bg-surface-container-lowest/80'
          : isInProgress
          ? 'border-primary/40'
          : 'border-transparent'
      }`}
    >
      <div className="flex flex-col gap-2">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Why Recommended Badge */}
            <span
              className={`px-2 py-0.5 rounded-full font-label-micro text-label-micro font-semibold uppercase tracking-wider flex items-center gap-1 ${getBadgeStyle(
                explanation.badgeType
              )}`}
              title={explanation.detail}
            >
              {explanation.badgeType === 'urgent' && (
                <span className="material-symbols-outlined text-[12px]">priority_high</span>
              )}
              {explanation.badgeType === 'success' && (
                <span className="material-symbols-outlined text-[12px]">check_circle</span>
              )}
              {explanation.badgeType === 'info' && (
                <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
              )}
              <span>{explanation.badgeLabel}</span>
            </span>

            {/* Type Badge */}
            <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-micro text-label-micro font-semibold capitalize flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-primary">
                {getTypeIcon(resource.type)}
              </span>
              <span>{resource.type}</span>
            </span>

            {/* Difficulty Badge */}
            <span className={`px-1.5 py-0.5 rounded font-label-micro text-label-micro font-medium ${getDifficultyBadge(resource.difficulty)}`}>
              {resource.difficulty}
            </span>

            {/* Official Badge */}
            {resource.isOfficial && (
              <span className="px-1.5 py-0.5 rounded bg-secondary-container/30 text-secondary font-label-micro text-label-micro font-semibold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]">verified</span>
                <span>Official</span>
              </span>
            )}

            {/* Price Badge */}
            <span className={`px-1.5 py-0.5 rounded font-label-micro text-label-micro font-medium ${
              resource.pricing === 'free'
                ? 'bg-secondary-container/20 text-secondary'
                : 'bg-surface-container text-on-surface-variant'
            }`}>
              {resource.pricing === 'free' ? 'Free' : resource.pricing === 'freemium' ? 'Free Portion' : 'Paid'}
            </span>
          </div>

          {/* Bookmark & Completion Quick Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => onToggleComplete(resource.id, e)}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                isCompleted
                  ? 'text-secondary hover:bg-secondary-container/30'
                  : 'text-outline hover:text-on-surface hover:bg-surface-container-low'
              }`}
              title={isCompleted ? 'Mark as Not Completed' : 'Mark as Completed'}
              aria-label={isCompleted ? 'Mark as Not Completed' : 'Mark as Completed'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isCompleted ? 'check_box' : 'check_box_outline_blank'}
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => onToggleBookmark(resource.id, e)}
              className={`p-1.5 rounded hover:bg-surface-container-low transition-colors cursor-pointer ${
                isBookmarked ? 'text-tertiary' : 'text-outline hover:text-on-surface'
              }`}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Resource'}
              aria-label={isBookmarked ? 'Remove Bookmark' : 'Bookmark Resource'}
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={isBookmarked ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                star
              </span>
            </button>
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onOpenDetails(item)}
          className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors cursor-pointer mt-0.5 line-clamp-2"
        >
          {resource.title}
        </h3>

        {/* Provider & Duration Info */}
        <div className="flex items-center gap-2 text-outline font-label-micro text-label-micro flex-wrap">
          <span className="font-semibold text-on-surface-variant">{resource.provider}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">schedule</span>
            {resource.estimatedDuration}
          </span>
          <span>•</span>
          <span>{resource.topic}</span>
          {resource.verificationStatus === 'search_link' && (
            <>
              <span>•</span>
              <span className="text-tertiary flex items-center gap-0.5" title="Curated YouTube search query">
                <span className="material-symbols-outlined text-[12px]">search</span>
                Curated Search
              </span>
            </>
          )}
        </div>

        {/* Description */}
        <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-0.5">
          {resource.description}
        </p>

        {/* Transparent "Why Recommended" Explanation Callout */}
        <div className="mt-1 p-2 rounded-md bg-surface-container-low/70 border border-surface-variant/60 flex items-start gap-1.5 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-[15px] text-primary shrink-0 mt-0.5">
            psychology
          </span>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-on-surface text-[11px] leading-tight">
              {explanation.headline}:
            </span>
            <span className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5">
              {explanation.detail}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer: Next Step & Actions */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-surface-variant/60 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-xs text-outline min-w-0 flex-1">
          <span className="material-symbols-outlined text-[14px] text-secondary shrink-0">
            arrow_circle_right
          </span>
          <span className="font-label-micro text-label-micro text-on-surface-variant truncate" title={resource.nextStep}>
            <strong className="text-on-surface font-medium">Next:</strong> {resource.nextStep}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onOpenDetails(item)}
            className="h-[30px] px-2.5 rounded bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
          >
            Details
          </button>

          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="h-[30px] px-3 rounded bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
          >
            <span>{resource.verificationStatus === 'search_link' ? 'Search Videos' : 'Open'}</span>
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </a>

          {resource.relatedQuestionIds && resource.relatedQuestionIds.length > 0 && onPracticeQuestion && (
            <button
              type="button"
              onClick={() => onPracticeQuestion(resource.relatedQuestionIds![0])}
              className="h-[30px] px-2.5 rounded bg-secondary-container/40 text-secondary hover:bg-secondary-container/70 font-label-md text-label-md transition-colors flex items-center gap-1 cursor-pointer"
              title="Practice related InterviewIQ question"
            >
              <span>Drill</span>
              <span className="material-symbols-outlined text-[13px]">play_arrow</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
