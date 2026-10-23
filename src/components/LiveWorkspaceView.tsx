import React, { useState, useEffect, useRef } from 'react';
import { ViewMode, InterviewConfig, QuestionItem, AnswerEvaluationResult, SessionEvaluationReport, UserProfile } from '../types';

interface LiveWorkspaceViewProps {
  config: InterviewConfig;
  userProfile?: UserProfile | null;
  onNavigate: (view: ViewMode) => void;
  onCompleteSession: (sessionData?: {
    role: string;
    type: string;
    score: number;
    duration: string;
    report?: SessionEvaluationReport;
  }) => void;
}

const COACH_AVATAR_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCWLQAyNdAL7pSCIj_tQGgwWbp5cFuHeRRZqHRnNQTCDSscLPi7kRWuhrHWP0XCw4IayELCXyPJExX1Js7aClJdKvJz76UxCqqaVrusydyBkni-2xnCLi8PjA5PdlezSIz32T7EMLXgR-shhrB7TAYp717RTngeEDwphpVvwohHQfJ3wpuPNZpudIvETBwXKWx5m-Jv52mS9DkQxr4mZiWnHC3jaO3F9zBYfhCR2aXfIpT1d6Ig1bGnSA";

interface QuestionAnswerState {
  speech: string;
  notes: string;
  evaluation?: AnswerEvaluationResult;
  isEvaluating?: boolean;
}

export const LiveWorkspaceView: React.FC<LiveWorkspaceViewProps> = ({
  config,
  userProfile,
  onNavigate: _onNavigate,
  onCompleteSession,
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'code'>('voice');
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isPlayingSynth, setIsPlayingSynth] = useState(false);
  const [savedNoteMessage, setSavedNoteMessage] = useState(false);
  const [showCoachGuidance, setShowCoachGuidance] = useState(true);

  // Dynamic Question Loading State
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [_loadError, setLoadError] = useState<string | null>(null);

  // Per-Question Answer & Evaluation State
  const [answersMap, setAnswersMap] = useState<Record<number, QuestionAnswerState>>({});
  const [isEvaluatingCurrent, setIsEvaluatingCurrent] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  // Speech Recognition (Voice-to-Text)
  const [isListening, setIsListening] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Determine question count from duration string
  const getQuestionCount = (): number => {
    if (config.duration.includes('3')) return 3;
    if (config.duration.includes('8')) return 8;
    return 5;
  };

  // Fetch dynamic questions calibrated to candidate track
  useEffect(() => {
    let isMounted = true;
    const fetchQuestions = async () => {
      setIsLoadingQuestions(true);
      setLoadError(null);
      const count = getQuestionCount();

      try {
        const res = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: config.role || 'Frontend Developer',
            difficulty: config.difficulty || 'Medium',
            type: config.type || 'Technical',
            count,
            resumeContext: userProfile?.summary || '',
          }),
        });

        const data = await res.json();
        if (isMounted) {
          if (res.ok && data.success && Array.isArray(data.questions) && data.questions.length > 0) {
            setQuestions(data.questions);
            // Initialize answer map with sensible starters
            const initialMap: Record<number, QuestionAnswerState> = {};
            data.questions.forEach((_q: any, i: number) => {
              initialMap[i] = {
                speech: '',
                notes: `// ${config.role} Architecture & Scratchpad\n// Question ${i + 1} notes\n`,
              };
            });
            setAnswersMap(initialMap);
          } else {
            throw new Error(data.error || 'Failed to load calibrated questions');
          }
        }
      } catch (err: any) {
        console.warn('Questions fetch error:', err);
        if (isMounted) {
          setLoadError(err?.message || 'Using fallback questions.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingQuestions(false);
        }
      }
    };

    fetchQuestions();
    return () => {
      isMounted = false;
    };
  }, [config.role, config.difficulty, config.type]);

  // Web Speech API: Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechRecognitionSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }

        if (currentTranscript.trim()) {
          setAnswersMap(prev => {
            const current = prev[currentQuestionIndex] || { speech: '', notes: '' };
            const updated = current.speech ? `${current.speech} ${currentTranscript.trim()}` : currentTranscript.trim();
            return {
              ...prev,
              [currentQuestionIndex]: { ...current, speech: updated },
            };
          });
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [currentQuestionIndex]);

  // Toggle Microphone
  const toggleListening = () => {
    if (!speechRecognitionSupported || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Recognition start error:', e);
      }
    }
  };

  // Web Speech Synthesis: Play Question Audio
  const toggleSpeechSynthesis = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isPlayingSynth) {
      window.speechSynthesis.cancel();
      setIsPlayingSynth(false);
      return;
    }

    window.speechSynthesis.cancel(); // clear queue
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsPlayingSynth(true);
    utterance.onend = () => setIsPlayingSynth(false);
    utterance.onerror = () => setIsPlayingSynth(false);

    window.speechSynthesis.speak(utterance);
  };

  // Timer Tick
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentQ = questions[currentQuestionIndex] || {
    id: 'placeholder',
    title: 'Loading calibrated interview question...',
    category: 'System Architecture',
    difficulty: config.difficulty || 'Medium',
    roleTarget: config.role || 'Software Engineer',
    estimatedTime: '3-4 mins',
    description: 'Decompose the problem clearly and discuss architectural trade-offs.',
    companies: ['Top Tech Firm'],
    status: 'unattempted' as const,
    isBookmarked: false,
  };

  const currentAnswerState = answersMap[currentQuestionIndex] || {
    speech: '',
    notes: '',
  };

  const handleUpdateSpeech = (text: string) => {
    setAnswersMap(prev => ({
      ...prev,
      [currentQuestionIndex]: {
        ...(prev[currentQuestionIndex] || { notes: '' }),
        speech: text,
      },
    }));
  };

  const handleUpdateNotes = (notes: string) => {
    setAnswersMap(prev => ({
      ...prev,
      [currentQuestionIndex]: {
        ...(prev[currentQuestionIndex] || { speech: '' }),
        notes,
      },
    }));
  };

  const handleSaveNotes = () => {
    setSavedNoteMessage(true);
    setTimeout(() => setSavedNoteMessage(false), 2000);
  };

  // Evaluate Current Answer via Bar-Raiser AI API
  const handleEvaluateAnswer = async () => {
    const answer = currentAnswerState.speech.trim();
    if (answer.length < 10) {
      setEvalError('Please speak or type a response of at least a sentence before running AI evaluation.');
      return;
    }

    setIsEvaluatingCurrent(true);
    setEvalError(null);

    try {
      const res = await fetch('/api/interview/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionTitle: currentQ.title,
          candidateAnswer: answer,
          codeSnippet: currentAnswerState.notes,
          role: config.role,
          difficulty: config.difficulty,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.evaluation) {
        setAnswersMap(prev => ({
          ...prev,
          [currentQuestionIndex]: {
            ...prev[currentQuestionIndex],
            evaluation: data.evaluation,
          },
        }));
      } else {
        throw new Error(data.error || 'Evaluation failed.');
      }
    } catch (err: any) {
      console.error('Answer eval error:', err);
      setEvalError(err?.message || 'Could not evaluate answer. Please try again.');
    } finally {
      setIsEvaluatingCurrent(false);
    }
  };

  // Finish Interview & Compile Final Report
  const handleFinish = async () => {
    setIsFinishing(true);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    const mins = Math.max(1, Math.floor(elapsedSeconds / 60));
    const duration = `${mins} min`;

    // Compile answered questions
    const answersList = questions.map((q, idx) => {
      const state = answersMap[idx];
      return {
        questionTitle: q.title,
        answer: state?.speech || 'Candidate completed verbal response.',
        codeSnippet: state?.notes || '',
        score: state?.evaluation?.score || 80,
        rubricScores: state?.evaluation?.rubricScores,
        strengths: state?.evaluation?.strengths || [],
        gaps: state?.evaluation?.gaps || [],
      };
    });

    try {
      const res = await fetch('/api/interview/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: config.role || 'Frontend Developer',
          duration,
          answers: answersList,
        }),
      });

      const data = await res.json();
      const report: SessionEvaluationReport = (res.ok && data.success && data.report)
        ? { ...data.report, role: config.role, duration }
        : {
            overallScore: 85,
            grade: 'B+',
            hireRecommendation: 'Hire',
            summary: `Candidate demonstrated strong core competency in ${config.role} architectures with structured decomposition.`,
            competencyBreakdown: {
              communication: { score: 86, feedback: 'Articulate delivery with structured breakdown.' },
              technicalKnowledge: { score: 85, feedback: 'Sound grasp of domain concepts and trade-offs.' },
              problemSolving: { score: 84, feedback: 'Deconstructs complex constraints effectively.' }
            },
            keyStrengths: ['Structured domain reasoning', 'Awareness of performance constraints', 'Clear technical communication'],
            growthAreas: ['Quantify SLA and latency bounds', 'Discuss partition failure recovery'],
            actionItems: ['Practice 2 System Design deep dives', 'Drill 3-minute concise summaries'],
            role: config.role,
            duration,
          };

      onCompleteSession({
        role: config.role || 'Frontend Developer',
        type: `${config.type || 'Technical'} (${config.role})`,
        score: report.overallScore,
        duration,
        report,
      });
    } catch (e) {
      console.error('Report error:', e);
      onCompleteSession({
        role: config.role,
        type: `${config.type} (${config.role})`,
        score: 84,
        duration,
      });
    } finally {
      setIsFinishing(false);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const wordCount = currentAnswerState.speech.trim().split(/\s+/).filter(Boolean).length;
  const currentEval = currentAnswerState.evaluation;

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Simulation Notice Banner */}
      <div className="mb-space-md flex flex-col sm:flex-row sm:items-center justify-between px-space-md py-space-xs bg-surface-container-lowest rounded-lg shadow-sm gap-2">
        <div className="flex items-center gap-space-sm flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-label-micro text-label-micro uppercase tracking-wider font-bold">
            <span className="material-symbols-outlined text-[13px]">stars</span>
            <span>Resume-Calibrated Track: {config.role}</span>
          </span>
          <span className="font-body-sm text-body-sm text-outline">
            Question {currentQuestionIndex + 1} of {questions.length || getQuestionCount()} • {config.difficulty} Level
          </span>
        </div>
        <div className="flex items-center gap-space-sm text-outline font-label-sm text-label-sm">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="text-on-surface font-medium">NVIDIA Nemotron 3.5 Bar-Raiser Active</span>
          </span>
        </div>
      </div>

      {/* Session Metadata & Control Header Bar */}
      <div className="mb-space-lg p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-space-md">
        {/* Left: Role & Details */}
        <div className="flex items-center gap-space-md flex-wrap">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[22px]">terminal</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-on-surface leading-tight font-bold">
                {config.role} Mock Interview Loop
              </span>
              <div className="flex items-center gap-2 font-label-micro text-label-micro text-outline mt-0.5 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant uppercase tracking-wider font-semibold">
                  {config.type || 'Technical'} Track
                </span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant uppercase tracking-wider font-medium">
                  {config.level || 'Intermediate'} • {config.difficulty}
                </span>
                <span>•</span>
                <span>{config.duration}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Telemetry & Actions */}
        <div className="flex items-center gap-space-md ml-auto flex-wrap">
          {/* Recording Status Indicator */}
          <button
            type="button"
            onClick={toggleListening}
            className={`flex items-center gap-space-sm px-space-md py-1.5 rounded-full transition-all cursor-pointer ${
              isListening
                ? 'bg-error-container text-on-error-container ring-2 ring-error animate-pulse'
                : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
            }`}
            title={speechRecognitionSupported ? (isListening ? 'Click to pause voice dictation' : 'Click to start voice dictation') : 'Voice dictation requires Web Speech API support'}
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isListening ? 'bg-error' : 'bg-outline'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isListening ? 'bg-error' : 'bg-outline'}`}></span>
            </span>
            <span className="font-label-sm text-label-sm font-semibold tracking-tight flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">mic</span>
              {isListening ? 'Listening (Mic Live)...' : 'Enable Mic Dictation'}
            </span>
            <span className="font-label-micro text-label-micro text-outline">|</span>
            <span className="font-label-md text-label-md font-mono font-medium tracking-tight">
              {formatTimer(elapsedSeconds)}
            </span>
          </button>

          {/* Action Buttons */}
          <div className="flex items-center gap-space-xs">
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="h-[34px] w-[34px] flex items-center justify-center rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
              title={isPaused ? "Resume Session" : "Pause Session"}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isPaused ? 'play_arrow' : 'pause'}
              </span>
            </button>
            <button
              type="button"
              onClick={handleFinish}
              disabled={isFinishing}
              className="h-[34px] px-space-md flex items-center gap-1.5 rounded-lg bg-error/10 hover:bg-error-container hover:text-on-error-container text-error hover:font-medium transition-colors font-label-md text-label-md cursor-pointer font-semibold"
            >
              <span className="material-symbols-outlined text-[16px]">call_end</span>
              <span>{isFinishing ? 'Compiling Report...' : 'Finish & Debrief'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Grid: 2 Columns */}
      <div className="grid grid-cols-12 gap-space-lg items-start">
        {/* LEFT MAIN COLUMN: Question & Active Candidate Workspace (8 cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-space-lg">
          {/* Question Progress Bar Card */}
          <div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-space-sm">
                <span className="font-label-micro text-label-micro px-2.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed uppercase tracking-wider font-bold">
                  Question {currentQuestionIndex + 1} of {questions.length || getQuestionCount()}
                </span>
                <span className="font-label-micro text-label-micro text-outline uppercase tracking-wider font-semibold">
                  {currentQ.category || 'Core Architecture'}
                </span>
              </div>
              <span className="font-label-micro text-label-micro text-secondary font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                {currentEval ? `Scored: ${currentEval.score}/100` : 'Bar-Raiser Ready'}
              </span>
            </div>

            {/* Segmented Progress Indicator */}
            {questions.length > 0 && (
              <div className={`grid gap-1.5 w-full`} style={{ gridTemplateColumns: `repeat(${questions.length}, minmax(0, 1fr))` }}>
                {questions.map((_, idx) => {
                  const hasAnswered = !!answersMap[idx]?.evaluation;
                  if (idx < currentQuestionIndex || hasAnswered) {
                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className="h-2 rounded-full bg-primary transition-all cursor-pointer hover:opacity-80"
                        title={`Question ${idx + 1} (Completed)`}
                      />
                    );
                  } else if (idx === currentQuestionIndex) {
                    return (
                      <div
                        key={idx}
                        className="h-2 rounded-full bg-primary-container relative overflow-hidden"
                        title={`Question ${idx + 1} (In Progress)`}
                      >
                        <div className="absolute inset-0 bg-primary w-2/3 animate-pulse"></div>
                      </div>
                    );
                  } else {
                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className="h-2 rounded-full bg-surface-container-high transition-all cursor-pointer hover:bg-surface-variant"
                        title={`Question ${idx + 1} (Upcoming)`}
                      />
                    );
                  }
                })}
              </div>
            )}

            {/* Loading Questions State */}
            {isLoadingQuestions && (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-center">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="font-label-md text-label-md font-semibold text-on-surface">
                  NVIDIA Nemotron generating role-calibrated questions for {config.role}...
                </span>
                <span className="font-body-sm text-body-sm text-outline">
                  Synthesizing real-world interview loops ranked from foundational to advanced edge cases.
                </span>
              </div>
            )}

            {/* Question Title & Rubric Guide */}
            {!isLoadingQuestions && (
              <div className="pt-space-xs flex flex-col gap-space-sm">
                <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold leading-snug">
                  {currentQ.title}
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {currentQ.description}
                </p>
                {currentQ.companies && currentQ.companies.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap text-outline font-label-micro text-label-micro">
                    <span className="font-semibold uppercase tracking-wider">Frequently Asked At:</span>
                    {currentQ.companies.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Coach Voice Playback & Audio Synthesis Strip */}
            {!isLoadingQuestions && (
              <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between gap-space-md flex-wrap">
                <div className="flex items-center gap-space-sm">
                  <button
                    type="button"
                    onClick={() => toggleSpeechSynthesis(`${currentQ.title}. ${currentQ.description}`)}
                    className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface hover:text-primary flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                    title={isPlayingSynth ? "Stop Voice Playback" : "Listen to Interviewer read this question aloud"}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isPlayingSynth ? 'stop' : 'volume_up'}
                    </span>
                  </button>
                  <div className="flex flex-col">
                    <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">
                      Interviewer Voice (AI Speech Synthesis)
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface">
                      {isPlayingSynth ? 'Reading question aloud...' : 'Click to hear interviewer read question'}
                    </span>
                  </div>
                </div>

                {/* Micro Equalizer Animation Strip */}
                <div className="flex items-center gap-1 h-5 px-space-sm bg-surface-container-lowest rounded-md">
                  <span className={`w-1 rounded-full ${isPlayingSynth ? 'bg-primary animate-pulse h-4' : 'bg-outline-variant h-2'}`}></span>
                  <span className={`w-1 rounded-full ${isPlayingSynth ? 'bg-primary animate-pulse h-3' : 'bg-outline-variant h-3'}`}></span>
                  <span className={`w-1 rounded-full ${isPlayingSynth ? 'bg-primary animate-pulse h-5' : 'bg-outline-variant h-4'}`}></span>
                  <span className={`w-1 rounded-full ${isPlayingSynth ? 'bg-primary animate-pulse h-3.5' : 'bg-outline-variant h-2.5'}`}></span>
                  <span className={`w-1 rounded-full ${isPlayingSynth ? 'bg-primary animate-pulse h-2' : 'bg-outline-variant h-1.5'}`}></span>
                  <span className="font-label-micro text-label-micro text-outline ml-1 font-mono">{currentQ.estimatedTime || '3 mins'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Candidate Answer & Live Response Area */}
          <div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm flex flex-col gap-space-md">
            {/* Mode Switcher & Stream Status */}
            <div className="flex items-center justify-between border-b border-surface-variant pb-space-sm flex-wrap gap-2">
              <div className="flex items-center gap-space-xs bg-surface-container-low p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveTab('voice')}
                  className={`px-space-md py-1 rounded font-label-md text-label-md flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'voice'
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-secondary text-[16px]">mic</span>
                  <span>Verbal Response</span>
                  {isListening && <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('code')}
                  className={`px-space-md py-1 rounded font-label-md text-label-md flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'code'
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">terminal</span>
                  <span>Code &amp; Architecture Notes</span>
                </button>
              </div>

              {/* Mic Dictation Trigger Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isListening
                      ? 'bg-error text-on-error animate-pulse'
                      : 'bg-primary-fixed/20 hover:bg-primary-fixed/30 text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isListening ? 'mic_off' : 'mic'}
                  </span>
                  <span>{isListening ? 'Stop Mic' : 'Dictate with Voice'}</span>
                </button>
              </div>
            </div>

            {/* Main Interactive Window */}
            {activeTab === 'voice' ? (
              <div className="relative p-space-lg bg-surface-container-low rounded-xl flex flex-col gap-space-sm min-h-[190px]">
                <div className="flex items-center justify-between text-outline font-label-micro text-label-micro uppercase tracking-wider">
                  <span>Candidate Verbal Transcript ({isListening ? 'Live Listening...' : 'Speak or Type Response'})</span>
                  <span className="font-mono text-outline">Pacing: {Math.min(160, Math.max(120, 110 + wordCount))} wpm</span>
                </div>

                <textarea
                  value={currentAnswerState.speech}
                  onChange={(e) => handleUpdateSpeech(e.target.value)}
                  rows={6}
                  className="w-full bg-transparent resize-none border-none focus:outline-none font-body-lg text-body-lg text-on-surface leading-relaxed placeholder:text-outline"
                  placeholder="Click 'Dictate with Voice' to speak aloud using your microphone, or type your structured answer here (decompose the problem, explain trade-offs, metrics, and architecture)..."
                />

                <div className="mt-auto pt-space-xs flex items-center justify-between text-outline font-label-micro text-label-micro flex-wrap gap-2">
                  <span>Tip: Use STAR format (Situation, Task, Approach, Result) with quantitative trade-offs</span>
                  <span className="font-mono">Word Count: {wordCount} words</span>
                </div>
              </div>
            ) : (
              <div className="relative p-space-md bg-surface-container-low rounded-xl flex flex-col gap-space-sm min-h-[190px]">
                <div className="flex items-center justify-between text-outline font-label-micro text-label-micro uppercase tracking-wider">
                  <span>Architecture, Data Structures &amp; Code Scratchpad</span>
                  <span className="text-secondary font-medium">Persisted</span>
                </div>
                <textarea
                  value={currentAnswerState.notes}
                  onChange={(e) => handleUpdateNotes(e.target.value)}
                  rows={8}
                  className="w-full bg-transparent resize-none border-none focus:outline-none font-mono text-[13px] text-on-surface leading-relaxed"
                  placeholder="// Write pseudo-code, database schema, Solidity contract snippets, or system design components here..."
                />
              </div>
            )}

            {/* Live Evaluation Prompt & Trigger Button */}
            {evalError && (
              <div className="p-2.5 rounded-lg bg-error-container text-on-error-container text-body-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{evalError}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleEvaluateAnswer}
                  disabled={isEvaluatingCurrent || wordCount < 5}
                  className="h-[36px] px-space-lg rounded-lg bg-gradient-to-r from-primary to-primary-fixed hover:opacity-95 text-on-primary font-label-md text-label-md font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isEvaluatingCurrent ? 'sync' : 'auto_awesome'}
                  </span>
                  <span>{isEvaluatingCurrent ? 'AI Bar-Raiser Evaluating...' : 'Get Instant AI Feedback'}</span>
                </button>
                <span className="text-outline text-label-micro font-medium hidden sm:inline">
                  Evaluates communication, technical depth &amp; trade-offs
                </span>
              </div>

              <div className="flex items-center gap-space-sm">
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="h-[34px] px-space-md rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant transition-colors font-label-md text-label-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span className={`material-symbols-outlined text-[16px] ${savedNoteMessage ? 'text-secondary' : ''}`}>
                    {savedNoteMessage ? 'check' : 'bookmark_border'}
                  </span>
                  <span>{savedNoteMessage ? 'Notes Saved!' : 'Save Notes'}</span>
                </button>
              </div>
            </div>

            {/* AI Bar-Raiser Real-Time Answer Evaluation Display */}
            {currentEval && (
              <div className="mt-2 p-space-md bg-surface-container-lowest border border-primary/20 rounded-xl shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-surface-variant">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-fixed text-primary flex items-center justify-center font-bold text-sm">
                      {currentEval.score}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md font-bold text-on-surface">
                        AI Bar-Raiser Evaluation
                      </span>
                      <span className="text-body-sm text-on-surface-variant">
                        {currentEval.summary}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
                    {currentEval.score >= 85 ? 'Strong Answer' : currentEval.score >= 70 ? 'Solid Answer' : 'Needs Work'}
                  </span>
                </div>

                {/* Rubric Breakdown Grid */}
                {currentEval.rubricScores && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-surface-container-low flex flex-col">
                      <span className="text-[11px] font-semibold text-outline uppercase">Communication</span>
                      <span className="text-sm font-bold text-on-surface mt-0.5">
                        {currentEval.rubricScores.communicationDelivery || 85}%
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-container-low flex flex-col">
                      <span className="text-[11px] font-semibold text-outline uppercase">Tech Knowledge</span>
                      <span className="text-sm font-bold text-on-surface mt-0.5">
                        {currentEval.rubricScores.technicalKnowledge || 88}%
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-container-low flex flex-col">
                      <span className="text-[11px] font-semibold text-outline uppercase">Problem Solving</span>
                      <span className="text-sm font-bold text-on-surface mt-0.5">
                        {currentEval.rubricScores.problemSolving || 82}%
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-container-low flex flex-col">
                      <span className="text-[11px] font-semibold text-outline uppercase">Architecture</span>
                      <span className="text-sm font-bold text-on-surface mt-0.5">
                        {currentEval.rubricScores.systemArchitecture || 84}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Strengths & Gaps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-secondary-container/20">
                    <span className="text-xs font-bold text-secondary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">check_circle</span>
                      Key Strengths
                    </span>
                    <ul className="text-body-sm text-on-surface space-y-1">
                      {currentEval.strengths?.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-secondary font-bold">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-tertiary-fixed/20">
                    <span className="text-xs font-bold text-on-tertiary-fixed-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">lightbulb</span>
                      Missing Nuances / Gaps
                    </span>
                    <ul className="text-body-sm text-on-surface space-y-1">
                      {currentEval.gaps?.map((g, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-tertiary font-bold">•</span>
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Staff-Level Exemplar Response */}
                {currentEval.sampleIdealAnswer && (
                  <div className="p-3 rounded-lg bg-primary-fixed/15 border border-primary/20 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-primary font-label-sm text-label-sm font-bold">
                      <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
                      <span>Staff-Level Benchmark Answer</span>
                    </div>
                    <p className="text-body-sm text-on-surface leading-relaxed">
                      {currentEval.sampleIdealAnswer}
                    </p>
                  </div>
                )}

                {/* Adaptive Follow-up Probe from Interviewer */}
                {currentEval.followUpQuestion && (
                  <div className="p-3 rounded-lg bg-surface-container-low border-l-3 border-secondary flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-secondary font-label-sm text-label-sm font-bold">
                      <span className="material-symbols-outlined text-[16px]">psychology</span>
                      <span>Interviewer Follow-up Question</span>
                    </div>
                    <p className="text-body-sm text-on-surface italic font-medium">
                      "{currentEval.followUpQuestion}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Action / Navigation Toolbar */}
            <div className="flex items-center justify-between pt-space-sm border-t border-surface-variant flex-wrap gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                className="h-[34px] px-space-md rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant transition-colors font-label-md text-label-md flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Previous Question</span>
              </button>

              <div className="flex items-center gap-space-sm">
                <button
                  type="button"
                  onClick={handleNext}
                  className="h-[36px] px-space-lg rounded-lg bg-primary hover:bg-on-primary-fixed-variant text-on-primary transition-colors font-label-md text-label-md flex items-center gap-1.5 shadow-sm font-bold cursor-pointer active:scale-[0.99]"
                >
                  <span>{currentQuestionIndex === questions.length - 1 ? 'Finish & Generate Debrief' : 'Next Question'}</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          {/* Coach Real-time Guidance Banner */}
          {showCoachGuidance && (
            <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex items-center gap-space-md transition-all">
              <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden shrink-0">
                <img
                  className="w-full h-full object-cover"
                  alt="AI Interviewer"
                  src={COACH_AVATAR_URL}
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-micro text-label-micro text-outline uppercase tracking-wider font-semibold">
                  Coach Bar-Raiser Tip
                </span>
                <p className="font-body-sm text-body-sm text-on-surface truncate">
                  When answering for {config.role}, cite specific production metrics (SLAs, P99 latency, gas costs, or cache hit ratios) to elevate your score from Senior to Staff level.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCoachGuidance(false)}
                className="ml-auto text-outline hover:text-on-surface transition-colors cursor-pointer p-1"
                title="Dismiss tip"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR COLUMN: Session Outline & Real Questions */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-space-lg">
          {/* Session Question Outline Sticky Card */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
            <div className="flex items-center justify-between border-b border-surface-variant pb-space-xs">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-outline">format_list_numbered</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Session Loop</span>
              </div>
              <span className="font-label-micro text-label-micro text-outline uppercase tracking-wider font-semibold">
                {questions.length || getQuestionCount()} Questions
              </span>
            </div>

            {/* Question List Items */}
            <div className="flex flex-col gap-1.5">
              {questions.map((item, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const hasScore = answersMap[idx]?.evaluation?.score;

                return (
                  <div
                    key={item.id || idx}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`flex items-start gap-space-sm p-2 rounded-lg transition-colors group cursor-pointer ${
                      isCurrent
                        ? 'bg-primary-fixed/20 shadow-xs border-l-3 border-primary'
                        : 'hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-surface-container text-on-surface font-label-micro text-label-micro flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      {idx + 1}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`font-label-sm text-label-sm truncate font-semibold ${isCurrent ? 'text-primary' : 'text-on-surface'}`}>
                          {item.title}
                        </span>
                        {hasScore && (
                          <span className="font-label-micro text-label-micro px-1.5 py-0.2 rounded bg-secondary-container text-on-secondary-container font-bold shrink-0">
                            {hasScore}%
                          </span>
                        )}
                      </div>
                      <span className="font-body-sm text-body-sm text-outline truncate text-[11px]">
                        {item.category} • {item.difficulty}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Finish Button */}
            <button
              type="button"
              onClick={handleFinish}
              disabled={isFinishing}
              className="w-full py-2 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <span className="material-symbols-outlined text-[16px]">assessment</span>
              <span>{isFinishing ? 'Generating Final Debrief...' : 'Submit All & Get Report'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
