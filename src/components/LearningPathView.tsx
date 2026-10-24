import React from 'react';
import { RoleLearningPath, QuestionItem } from '../types';
import { QUESTIONS_BY_ID } from '../data/questionBank';

interface LearningPathViewProps {
  learningPath: RoleLearningPath;
  onSelectQuestion: (question: QuestionItem) => void;
  onPracticeQuestion: (question: QuestionItem) => void;
  onBrowseAllQuestions: () => void;
}

export const LearningPathView: React.FC<LearningPathViewProps> = ({
  learningPath,
  onSelectQuestion,
  onBrowseAllQuestions,
}) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Learning Path Hero Banner */}
      <div className="p-6 sm:p-8 rounded-xl bg-white border border-slate-200/90 shadow-xs relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-primary border border-indigo-200/70">
              Curated Curriculum
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {learningPath.stages.reduce((acc, s) => acc + s.topics.length, 0)} Total Modules
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {learningPath.roleTitle} Learning Roadmap
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
            {learningPath.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={onBrowseAllQuestions}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
            >
              Browse All Role Questions
            </button>
            <span className="text-xs text-slate-500">
              Step through stages from Foundations to Distributed Architecture.
            </span>
          </div>
        </div>
      </div>

      {/* Stages Progression */}
      <div className="space-y-8">
        {learningPath.stages.map((stage) => (
          <div key={stage.stage} className="space-y-4">
            {/* Stage Header */}
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-primary font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                0{stage.stage}
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  {stage.title}
                </h3>
                <p className="text-xs text-slate-500">{stage.description}</p>
              </div>
            </div>

            {/* Topics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stage.topics.map((topic) => {
                // Find loaded questions for this topic
                const matchedQuestions = topic.questionIds
                  .map(id => QUESTIONS_BY_ID.get(id))
                  .filter((q): q is QuestionItem => Boolean(q));

                return (
                  <div
                    key={topic.id}
                    className="p-5 rounded-xl bg-white border border-slate-200/90 hover:border-primary/40 transition-all flex flex-col justify-between group shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-primary">
                          {topic.category}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          ~{topic.estimatedHours} hrs
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
                        {topic.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {topic.description}
                      </p>

                      {/* Prerequisites */}
                      {topic.prerequisites.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Prereq:</span>
                          {topic.prerequisites.map((prereq, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 font-medium">
                              {prereq}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Associated Questions in Bank */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">Practice Bank:</span>
                        <span>{matchedQuestions.length} Questions</span>
                      </div>

                      <div className="space-y-1.5">
                        {matchedQuestions.map(q => (
                          <div
                            key={q.id}
                            onClick={() => onSelectQuestion(q)}
                            className="p-2.5 rounded-lg bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 hover:border-primary/30 text-xs text-slate-800 cursor-pointer transition-all flex items-center justify-between group/item shadow-2xs"
                          >
                            <span className="truncate pr-2 group-hover/item:text-primary font-medium">
                              {q.title}
                            </span>
                            <span className="text-[10px] text-slate-500 shrink-0 font-semibold">
                              {q.difficulty}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
