import React, { useState } from 'react';
import { LearningPath, LearningPathStep, UserLearningProgress } from '../../types/learning';
import { LEARNING_RESOURCES_CATALOG } from '../../data/learningResourcesCatalog';

interface LearningPathsSectionProps {
  paths: LearningPath[];
  userProgress?: UserLearningProgress | null;
  onToggleStepComplete: (pathId: string, stepNumber: number) => void;
  onOpenResourceById: (resourceId: string) => void;
  onPracticeQuestion?: (questionId: string) => void;
}

export const LearningPathsSection: React.FC<LearningPathsSectionProps> = ({
  paths,
  userProgress,
  onToggleStepComplete,
  onOpenResourceById,
  onPracticeQuestion
}) => {
  const [selectedPathId, setSelectedPathId] = useState<string>(() => paths[0]?.id || '');
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

  const activePath = paths.find(p => p.id === selectedPathId) || paths[0];
  if (!activePath) return null;

  const completedSteps = userProgress?.completedPathStepIds[activePath.id] || [];
  const progressPercent = Math.round((completedSteps.length / activePath.steps.length) * 100);

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-md sm:p-space-lg shadow-sm border border-surface-variant flex flex-col gap-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-variant">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">
            <span className="material-symbols-outlined text-[15px] text-primary">route</span>
            <span>Structured Roadmaps &amp; Curricula</span>
          </div>
          <h3 className="font-headline-sm text-lg font-bold text-on-surface mt-0.5">
            Role-Based Learning Paths
          </h3>
          <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant">
            Sequential step-by-step masteries progressing from foundational prerequisites to production architectural patterns.
          </p>
        </div>

        {/* Path Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {paths.map(path => {
            const isSelected = path.id === activePath.id;
            return (
              <button
                key={path.id}
                type="button"
                onClick={() => {
                  setSelectedPathId(path.id);
                  setExpandedStep(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                {path.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Path Header Card */}
      <div className="p-4 rounded-xl bg-surface-container-low border border-surface-variant/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-headline-sm text-base font-bold text-on-surface">
              {activePath.title}
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-micro text-label-micro font-medium">
              {activePath.difficulty}
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-container text-outline font-label-micro text-label-micro flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">schedule</span>
              {activePath.estimatedHours}
            </span>
          </div>
          <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant">
            {activePath.description}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-outline mt-1">
            <strong className="text-on-surface font-medium">Goal:</strong> {activePath.targetOutcome}
          </div>
        </div>

        {/* Progress Bar & Counter */}
        <div className="flex flex-col items-end shrink-0 min-w-[140px]">
          <div className="flex items-baseline gap-1">
            <span className="font-headline-lg text-xl font-bold text-on-surface">{progressPercent}%</span>
            <span className="text-outline font-label-micro text-label-micro">completed</span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div
              className="bg-secondary h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <span className="font-label-micro text-label-micro text-outline mt-1">
            {completedSteps.length} of {activePath.steps.length} milestones complete
          </span>
        </div>
      </div>

      {/* Step by Step Timeline */}
      <div className="flex flex-col gap-3">
        {activePath.steps.map((step: LearningPathStep) => {
          const isDone = completedSteps.includes(step.stepNumber);
          const isStepOpen = expandedStep === step.stepNumber;

          return (
            <div
              key={step.stepNumber}
              className={`rounded-xl border transition-all overflow-hidden ${
                isDone
                  ? 'bg-surface-container-lowest border-secondary/30'
                  : 'bg-surface-container-lowest border-surface-variant'
              }`}
            >
              {/* Step Header */}
              <div
                className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-container-low transition-colors"
                onClick={() => setExpandedStep(isStepOpen ? null : step.stepNumber)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Step Number Badge / Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStepComplete(activePath.id, step.stepNumber);
                    }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors shrink-0 cursor-pointer ${
                      isDone
                        ? 'bg-secondary text-white'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant'
                    }`}
                    title={isDone ? 'Mark step as incomplete' : 'Mark step as completed'}
                  >
                    {isDone ? (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    ) : (
                      <span>{step.stepNumber}</span>
                    )}
                  </button>

                  <div className="flex flex-col truncate">
                    <span className="font-label-md text-sm font-semibold text-on-surface truncate">
                      {step.title}
                    </span>
                    <span className="font-body-sm text-xs text-outline truncate">
                      {step.topic} • {step.estimatedHours}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {step.prerequisites && step.prerequisites.length > 0 && (
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded bg-surface-container text-outline font-label-micro text-label-micro">
                      Requires: {step.prerequisites[0]}
                    </span>
                  )}
                  <span className="material-symbols-outlined text-[18px] text-outline">
                    {isStepOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </div>
              </div>

              {/* Step Details Body */}
              {isStepOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-surface-variant/60 flex flex-col gap-3 bg-surface-container-lowest animate-in fade-in">
                  <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant">
                    {step.description}
                  </p>

                  {/* Hands-on Exercise */}
                  {step.handsOnExercise && (
                    <div className="p-3 rounded-lg bg-surface-container-low border border-surface-variant flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-secondary font-label-micro text-label-micro uppercase tracking-wider font-semibold">
                        <span className="material-symbols-outlined text-[14px]">terminal</span>
                        <span>Milestone Hands-On Exercise</span>
                      </div>
                      <p className="text-xs sm:text-sm text-on-surface font-medium">
                        {step.handsOnExercise}
                      </p>
                    </div>
                  )}

                  {/* Resources & Question Actions Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-label-micro text-label-micro uppercase text-outline font-semibold">
                        Step Resources:
                      </span>
                      {step.resourceIds.map(resId => {
                        const res = LEARNING_RESOURCES_CATALOG.find(r => r.id === resId);
                        return (
                          <button
                            key={resId}
                            type="button"
                            onClick={() => onOpenResourceById(resId)}
                            className="px-2.5 py-1 rounded-md bg-surface-container hover:bg-surface-variant text-xs text-on-surface font-medium transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[13px] text-primary">description</span>
                            <span className="truncate max-w-[180px]">{res?.title || 'Resource'}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {step.questionIds && step.questionIds.length > 0 && onPracticeQuestion && (
                        <button
                          type="button"
                          onClick={() => onPracticeQuestion(step.questionIds[0])}
                          className="px-3 py-1.5 rounded-lg bg-secondary-container/40 text-secondary hover:bg-secondary-container/70 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>Drill Question</span>
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onToggleStepComplete(activePath.id, step.stepNumber)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                          isDone
                            ? 'bg-secondary text-white'
                            : 'bg-primary text-on-primary hover:bg-primary-container'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {isDone ? 'check' : 'done'}
                        </span>
                        <span>{isDone ? 'Step Completed' : 'Mark Step Complete'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
