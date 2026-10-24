import React, { useState, useEffect } from 'react';
import { QuestionItem } from '../types';
import {
  getRelatedQuestions,
  getContinueLearningQuestions,
  getStrengthenFundamentals,
  isQuestionBookmarked,
  toggleUserBookmark,
  recordRecentQuestionView,
} from '../services/questionService';

interface QuestionDetailModalProps {
  question: QuestionItem | null;
  allQuestions: QuestionItem[];
  activeRole: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectQuestion: (question: QuestionItem) => void;
  onPracticeQuestion: (question: QuestionItem) => void;
  onBookmarkChanged?: (questionId: string, isBookmarked: boolean) => void;
}

export const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({
  question,
  allQuestions,
  activeRole,
  userId,
  isOpen,
  onClose,
  onSelectQuestion,
  onPracticeQuestion,
  onBookmarkChanged,
}) => {
  const [bookmarked, setBookmarked] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'answer' | 'deep-dive' | 'recommendations'>('answer');

  useEffect(() => {
    if (question && isOpen) {
      setBookmarked(isQuestionBookmarked(userId, question.id));
      recordRecentQuestionView(userId, question.id);
      setActiveTab('answer');
    }
  }, [question, isOpen, userId]);

  if (!isOpen || !question) return null;

  const handleToggleBookmark = () => {
    const res = toggleUserBookmark(userId, question.id);
    setBookmarked(res.isBookmarked);
    if (onBookmarkChanged) {
      onBookmarkChanged(question.id, res.isBookmarked);
    }
  };

  const handleCopyCode = () => {
    if (question.codeExample?.code) {
      navigator.clipboard.writeText(question.codeExample.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const relatedQuestions = getRelatedQuestions(question, allQuestions, { activeRole, limit: 3 });
  const continueLearning = getContinueLearningQuestions(question, allQuestions, { activeRole, limit: 3 });
  const fundamentals = getStrengthenFundamentals(question, allQuestions, 2);

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Hard':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-scaleUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-200/90 bg-white sticky top-0 z-10">
          <div className="flex-1 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getDifficultyBadge(question.difficulty)}`}>
                {question.difficulty}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-full">
                {question.category}
              </span>
              {question.questionType && (
                <span className="px-2.5 py-0.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full">
                  {question.questionType}
                </span>
              )}
              <span className="text-xs text-slate-500 flex items-center gap-1 ml-auto sm:ml-0 font-medium">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {question.estimatedTime || '3-4 mins'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
              {question.title}
            </h2>
            {question.roleTarget && (
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary"></span>
                Target Role: <strong className="text-slate-800">{question.roleTarget}</strong>
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 cursor-pointer"
            title="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Navigation Bar */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-200 bg-slate-50/70 text-xs sm:text-sm">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('answer')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeTab === 'answer'
                  ? 'bg-white text-primary border border-slate-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Executive Answer
            </button>
            <button
              onClick={() => setActiveTab('deep-dive')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeTab === 'deep-dive'
                  ? 'bg-white text-primary border border-slate-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In-Depth Mechanics & Code
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeTab === 'recommendations'
                  ? 'bg-white text-primary border border-slate-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Related Topics ({relatedQuestions.length + continueLearning.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleBookmark}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                bookmarked
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs'
              }`}
            >
              <svg className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {bookmarked ? 'Saved' : 'Save'}
            </button>

            <button
              onClick={() => {
                onClose();
                onPracticeQuestion(question);
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Practice in Mock Room
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-700 custom-scrollbar">
          {/* TAB 1: EXECUTIVE ANSWER */}
          {activeTab === 'answer' && (
            <div className="space-y-6">
              {/* Question Text */}
              {question.questionText && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Interview Question
                  </h4>
                  <p className="text-base text-slate-900 font-medium leading-relaxed">
                    {question.questionText}
                  </p>
                </div>
              )}

              {/* Short Answer Callout */}
              <div className="p-5 rounded-xl bg-indigo-50/60 border border-indigo-100 shadow-2xs">
                <div className="flex items-center gap-2 mb-2 text-primary font-bold">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    Executive Answer (30-Second Summary)
                  </h3>
                </div>
                <p className="text-slate-800 text-sm sm:text-base leading-relaxed font-normal">
                  {question.shortAnswer || question.description}
                </p>
              </div>

              {/* Common Pitfalls / Mistakes */}
              {question.commonMistakes && question.commonMistakes.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200">
                  <div className="flex items-center gap-2 mb-2.5 text-rose-700 font-bold">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      Common Candidate Pitfalls in Interviews
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {question.commonMistakes.map((mistake, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                        <span className="text-rose-600 font-bold">•</span>
                        <span>{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Real-World Use Cases & Trade-offs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {question.realWorldUseCases && question.realWorldUseCases.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Real-World Production Scenarios
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {question.realWorldUseCases.map((useCase, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{useCase}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {question.tradeOffs && question.tradeOffs.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                      Architectural Trade-offs
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {question.tradeOffs.map((to, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{to}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Follow-up Questions */}
              {question.followUpQuestions && question.followUpQuestions.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                    Expect These Interviewer Follow-Ups:
                  </h4>
                  <div className="space-y-2">
                    {question.followUpQuestions.map((fu, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 flex items-center gap-2 shadow-2xs">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                          {idx + 1}
                        </span>
                        <span>{fu}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: IN-DEPTH MECHANICS & CODE */}
          {activeTab === 'deep-dive' && (
            <div className="space-y-6">
              {/* Detailed Breakdown */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Technical Architecture & Deep Mechanics
                </h3>
                <div className="text-sm sm:text-base leading-relaxed text-slate-800 whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {question.detailedAnswer || question.explanation || question.description}
                </div>
              </div>

              {/* Code Example Block */}
              {question.codeExample && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-lg">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
                    <span className="text-xs font-mono font-semibold uppercase text-indigo-400">
                      {question.codeExample.language || 'typescript'}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {copiedCode ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                  <pre className="p-4 text-xs sm:text-sm font-mono overflow-x-auto text-slate-200 leading-relaxed custom-scrollbar">
                    <code>{question.codeExample.code}</code>
                  </pre>
                  {(question.codeExample.exampleInput || question.codeExample.exampleOutput) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-900/90 border-t border-slate-800 text-xs font-mono">
                      {question.codeExample.exampleInput && (
                        <div>
                          <span className="text-slate-400 uppercase">Input:</span>{' '}
                          <span className="text-slate-200">{question.codeExample.exampleInput}</span>
                        </div>
                      )}
                      {question.codeExample.exampleOutput && (
                        <div>
                          <span className="text-emerald-400 uppercase">Output:</span>{' '}
                          <span className="text-emerald-300">{question.codeExample.exampleOutput}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RECOMMENDATIONS & LEARNING PATH */}
          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              {/* Related Questions */}
              {relatedQuestions.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    Directly Related Questions ({relatedQuestions.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {relatedQuestions.map(rel => (
                      <div
                        key={rel.id}
                        onClick={() => onSelectQuestion(rel)}
                        className="p-3.5 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-primary/40 cursor-pointer transition-all group shadow-2xs"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getDifficultyBadge(rel.difficulty)}`}>
                            {rel.difficulty}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">{rel.category}</span>
                        </div>
                        <h5 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">
                          {rel.title}
                        </h5>
                        <p className="text-xs text-slate-600 line-clamp-1 mt-1">
                          {rel.shortAnswer || rel.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Continue Learning */}
              {continueLearning.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Next Concepts to Master in this Path
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {continueLearning.map(cont => (
                      <div
                        key={cont.id}
                        onClick={() => onSelectQuestion(cont)}
                        className="p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-500/40 cursor-pointer transition-all group shadow-2xs"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getDifficultyBadge(cont.difficulty)}`}>
                            {cont.difficulty}
                          </span>
                          <span className="text-xs text-emerald-700 font-semibold">Continue Learning</span>
                        </div>
                        <h5 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {cont.title}
                        </h5>
                        <p className="text-xs text-slate-600 line-clamp-1 mt-1">
                          {cont.shortAnswer || cont.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengthen Fundamentals */}
              {fundamentals.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Strengthen Foundational Prerequisites
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {fundamentals.map(fund => (
                      <div
                        key={fund.id}
                        onClick={() => onSelectQuestion(fund)}
                        className="p-3.5 rounded-xl bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-500/40 cursor-pointer transition-all group shadow-2xs"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getDifficultyBadge(fund.difficulty)}`}>
                            {fund.difficulty}
                          </span>
                          <span className="text-xs text-amber-700 font-semibold">Foundations</span>
                        </div>
                        <h5 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                          {fund.title}
                        </h5>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tags & Keywords */}
          {question.tags && question.tags.length > 0 && (
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Tags:</span>
              {question.tags.map((tag, idx) => (
                <span key={idx} className="px-2 py-0.5 text-xs text-slate-600 bg-slate-100 rounded-md border border-slate-200">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
