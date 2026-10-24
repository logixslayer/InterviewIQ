import React, { useState } from 'react';
import { QuestionItem, QuestionDifficulty, QuestionType } from '../types';
import { saveUserCustomQuestion } from '../services/questionService';
import { TOPIC_CATEGORIES } from '../data/taxonomy';

interface AddCustomQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  defaultRole: string;
  onQuestionAdded: (newQuestion: QuestionItem) => void;
}

export const AddCustomQuestionModal: React.FC<AddCustomQuestionModalProps> = ({
  isOpen,
  onClose,
  userId,
  defaultRole,
  onQuestionAdded,
}) => {
  const [title, setTitle] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [roleTarget, setRoleTarget] = useState(defaultRole);
  const [categoryId, setCategoryId] = useState('frontend-core');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('Medium');
  const [questionType, setQuestionType] = useState<QuestionType>('Conceptual');
  const [shortAnswer, setShortAnswer] = useState('');
  const [detailedAnswer, setDetailedAnswer] = useState('');
  const [code, setCode] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a descriptive question title.');
      return;
    }
    if (!shortAnswer.trim() && !detailedAnswer.trim()) {
      setError('Please provide at least a short answer or detailed explanation.');
      return;
    }

    const selectedCategoryObj = TOPIC_CATEGORIES.find(c => c.id === categoryId);
    const categoryName = selectedCategoryObj?.name || 'General Engineering';

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const newQuestion = saveUserCustomQuestion(userId, {
      title: title.trim(),
      questionText: questionText.trim() || title.trim(),
      category: categoryName,
      categoryId,
      difficulty,
      questionType,
      roleTarget: roleTarget.trim() || 'Software Engineer',
      roleIds: [roleTarget.toLowerCase().replace(/\s+/g, '-')],
      estimatedTime: '3-4 mins',
      estimatedMinutes: 4,
      description: shortAnswer.trim() || title.trim(),
      shortAnswer: shortAnswer.trim(),
      detailedAnswer: detailedAnswer.trim(),
      codeExample: code.trim() ? { language: 'typescript', code: code.trim() } : undefined,
      tags: tags.length > 0 ? tags : ['Custom', 'User-Created'],
      keywords: tags,
      isCustom: true,
      isBookmarked: false,
    });

    onQuestionAdded(newQuestion);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-scaleUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Personal Practice Bank
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Add Custom Interview Question
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 custom-scrollbar text-sm">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Question Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. How do you implement debouncing with custom React hooks?"
              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl text-slate-800 placeholder:text-slate-400 outline-none transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Role
              </label>
              <input
                type="text"
                value={roleTarget}
                onChange={e => setRoleTarget(e.target.value)}
                placeholder="e.g. Frontend Developer"
                className="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-primary rounded-xl text-slate-800 placeholder:text-slate-400 outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as QuestionDifficulty)}
                className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-primary rounded-xl text-slate-800 outline-none text-xs cursor-pointer shadow-2xs"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Question Type
              </label>
              <select
                value={questionType}
                onChange={e => setQuestionType(e.target.value as QuestionType)}
                className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-primary rounded-xl text-slate-800 outline-none text-xs cursor-pointer shadow-2xs"
              >
                <option value="Conceptual">Conceptual</option>
                <option value="Coding">Coding</option>
                <option value="System Design">System Design</option>
                <option value="Behavioral">Behavioral</option>
                <option value="Debugging">Debugging</option>
                <option value="Practical Trade-off">Practical Trade-off</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-primary rounded-xl text-slate-800 outline-none text-xs cursor-pointer shadow-2xs"
            >
              {TOPIC_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Executive Short Answer *
            </label>
            <textarea
              value={shortAnswer}
              onChange={e => {
                setShortAnswer(e.target.value);
                if (error) setError(null);
              }}
              rows={2}
              placeholder="30-second summary answer for quick review..."
              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl text-slate-800 placeholder:text-slate-400 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Detailed Explanation / Architecture
            </label>
            <textarea
              value={detailedAnswer}
              onChange={e => setDetailedAnswer(e.target.value)}
              rows={4}
              placeholder="Deep mechanics, trade-offs, and breakdown..."
              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl text-slate-800 placeholder:text-slate-400 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Code Snippet (Optional)
            </label>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              rows={3}
              placeholder="// Paste example code or solution..."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-500 font-mono text-xs rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tags (Comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="React, Hooks, Performance, JavaScript"
              className="w-full px-3.5 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-primary rounded-xl text-slate-800 placeholder:text-slate-400 outline-none text-xs"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary/90 shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              Save Custom Question
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
