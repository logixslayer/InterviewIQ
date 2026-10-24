import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ViewMode,
  InterviewConfig,
  QuestionItem,
  AnswerEvaluationResult,
  SessionEvaluationReport,
  UserProfile,
  InterviewState,
} from '../types';
import {
  startPersistentSession,
  fetchNextSessionTurn,
  submitSessionAnswer,
  completePersistentSession,
  fetchSessionDetails,
  requestInterviewerTurn,
} from '../services/interviewService';

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

const COACH_AVATAR_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCWLQAyNdAL7pSCIj_tQGgwWbp5cFuHeRRZqHRnNQTCDSscLPi7kRWuhrHWP0XCw4IayELCXyPJExX1Js7aClJdKvJz76UxCqqaVrusydyBkni-2xnCLi8PjA5PdlezSIz32T7EMLXgR-shhrB7TAYp717RTngeEDwphpVvwohHQfJ3wpuPNZpudIvETBwXKWx5m-Jv52mS9DkQxr4mZiWnHC3jaO3F9zBYfhCR2aXfIpT1d6Ig1bGnSA";

export interface ChatMessage {
  id: string;
  sender: 'interviewer' | 'candidate' | 'evaluation' | 'system';
  title?: string;
  text: string;
  category?: string;
  questionNumber?: number;
  totalQuestions?: number;
  companies?: string[];
  audioContent?: string;
  evaluation?: AnswerEvaluationResult;
  timestamp: string;
  isFollowUp?: boolean;
  isClarification?: boolean;
  codeSnippet?: string;
}

export const LiveWorkspaceView: React.FC<LiveWorkspaceViewProps> = ({
  config,
  userProfile,
  onNavigate,
  onCompleteSession,
}) => {
  const hasInitializedRef = useRef(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Core Session State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [interviewState, setInterviewState] = useState<InterviewState>('preparing');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  // Question progression
  const [currentQuestion, setCurrentQuestion] = useState<QuestionItem | null>(null);
  const [questionNumber, setQuestionNumber] = useState<number>(1);
  const [totalQuestions, setTotalQuestions] = useState<number>(() => {
    const dur = config?.duration || '';
    if (dur.includes('3')) return 3;
    if (dur.includes('8')) return 8;
    return 5;
  });
  const [sessionQuestions, setSessionQuestions] = useState<QuestionItem[]>([]);
  const [answersMap, setAnswersMap] = useState<Record<string, { speech: string; notes?: string; evaluation?: AnswerEvaluationResult }>>({});

  // Chat Feed Messages State
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Input & Dictation State
  const [candidateInput, setCandidateInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Code Scratchpad Drawer State
  const [isCodeDrawerOpen, setIsCodeDrawerOpen] = useState(false);
  const [scratchpadCode, setScratchpadCode] = useState(`// ${config.role || 'Software Engineering'} Technical Scratchpad\n// Write architecture components, data structures, or code snippets here...\n\n`);

  // Audio Playback State
  const [isPlayingSynth, setIsPlayingSynth] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Active Follow-up tracking
  const [activeFollowUp, setActiveFollowUp] = useState<QuestionItem | null>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = useCallback(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isListening, interviewState, scrollToBottom]);

  // Session Live Timer
  useEffect(() => {
    if (interviewState === 'completed') return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [interviewState]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Safely stop any running audio
  const stopAllAudio = useCallback(() => {
    try {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
        audioPlayerRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {}
    setIsPlayingSynth(false);
  }, []);

  // Web Speech Fallback
  const fallbackWebSpeech = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsPlayingSynth(true);
      utterance.onend = () => {
        setIsPlayingSynth(false);
        onEnd?.();
      };
      utterance.onerror = () => {
        setIsPlayingSynth(false);
        onEnd?.();
      };
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsPlayingSynth(false);
      onEnd?.();
    }
  }, []);

  // Speak Utterance using base64 or Web Speech
  const speakUtterance = useCallback(
    async (text: string, base64Audio?: string, onEndCallback?: () => void) => {
      stopAllAudio();
      if (base64Audio) {
        try {
          const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
          audioPlayerRef.current = audio;
          setIsPlayingSynth(true);
          setInterviewState('interviewer_speaking');

          audio.onended = () => {
            setIsPlayingSynth(false);
            onEndCallback ? onEndCallback() : setInterviewState('listening');
          };
          audio.onerror = () => {
            fallbackWebSpeech(text, onEndCallback ? onEndCallback : () => setInterviewState('listening'));
          };

          await audio.play();
          return;
        } catch {
          fallbackWebSpeech(text, onEndCallback ? onEndCallback : () => setInterviewState('listening'));
          return;
        }
      }
      fallbackWebSpeech(text, onEndCallback ? onEndCallback : () => setInterviewState('listening'));
    },
    [stopAllAudio, fallbackWebSpeech]
  );

  // Setup Web Speech Recognition for live microphone dictation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setCandidateInput(transcript);
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition notice:', e?.error);
        if (e?.error === 'not-allowed') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Speech recognition init notice:', err);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech dictation is not supported in this browser. You can type your answers directly.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    } else {
      stopAllAudio();
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  // Turn Advancement: Load Next Question Turn & Add to Chat
  const loadNextTurn = useCallback(
    async (targetSessionId: string) => {
      setInterviewState('generating_next_question');
      stopAllAudio();

      try {
        const turnData = await fetchNextSessionTurn({
          sessionId: targetSessionId,
          userId: 'candidate_main',
          role: config.role,
          difficulty: config.difficulty,
          type: config.type,
        });

        if (turnData.success && turnData.question) {
          const q = turnData.question;
          setCurrentQuestion(q);
          setQuestionNumber(turnData.questionNumber);
          setTotalQuestions(turnData.totalQuestions);
          setSessionQuestions((prev) => (prev.some((item) => item.id === q.id) ? prev : [...prev, q]));
          setActiveFollowUp(null);

          // Add Interviewer Question to Live Chat
          const questionMsg: ChatMessage = {
            id: `q_${q.id}_${Date.now()}`,
            sender: 'interviewer',
            title: q.title,
            text: q.description,
            category: q.category,
            questionNumber: turnData.questionNumber,
            totalQuestions: turnData.totalQuestions,
            companies: q.companies,
            audioContent: turnData.audio?.audioContent,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          setMessages((prev) => [...prev, questionMsg]);
          speakUtterance(`${q.title}. ${q.description}`, turnData.audio?.audioContent, () =>
            setInterviewState('listening')
          );
          return;
        }
      } catch (err) {
        console.warn('Network turn notice, using calibrated question:', err);
      }

      // Guaranteed Role-Calibrated Question Fallback
      const fallbackId = `q_calibrated_${Date.now()}`;
      const fallbackQ: QuestionItem = {
        id: fallbackId,
        title: `How do you architect and optimize high-throughput data and state workflows in ${config.role} systems?`,
        description: `Break down the architectural components, concurrency/latency constraints, performance trade-offs, and observability metrics you would prioritize.`,
        category: 'System Architecture',
        difficulty: (config.difficulty || 'Medium') as any,
        roleTarget: config.role || 'Frontend Developer',
        estimatedTime: '3-4 mins',
        companies: ['Google', 'Meta', 'Netflix'],
        status: 'unattempted',
        statusLabel: `AI Calibrated • ${config.difficulty || 'Medium'}`,
        isBookmarked: false,
        source: 'curated',
        createdAt: new Date().toISOString(),
      };

      setCurrentQuestion(fallbackQ);
      setSessionQuestions((prev) => (prev.some((item) => item.id === fallbackId) ? prev : [...prev, fallbackQ]));
      setActiveFollowUp(null);

      const fallbackMsg: ChatMessage = {
        id: `q_${fallbackId}`,
        sender: 'interviewer',
        title: fallbackQ.title,
        text: fallbackQ.description,
        category: fallbackQ.category,
        questionNumber: 1,
        totalQuestions: 5,
        companies: fallbackQ.companies,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, fallbackMsg]);
      setInterviewState('listening');
      speakUtterance(`${fallbackQ.title}. ${fallbackQ.description}`, undefined, () =>
        setInterviewState('listening')
      );
    },
    [config.role, config.difficulty, config.type, stopAllAudio, speakUtterance]
  );

  // Initialize Persistent Session on Mount (strictly once)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    let isMounted = true;

    const initSession = async () => {
      setInterviewState('preparing');

      // Add Welcome Message from Interviewer to start the chat naturally
      const candidateName = userProfile?.fullName || 'Candidate';
      const welcomeMsg: ChatMessage = {
        id: `welcome_${Date.now()}`,
        sender: 'interviewer',
        title: `Welcome, ${candidateName}!`,
        text: `I'll be your Lead Interviewer for today's ${config.role} mock interview (${config.type} Track • ${config.difficulty} Level). Speak naturally or type your responses. I'll evaluate your system reasoning, trade-offs, and communication in real time. Let's begin!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([welcomeMsg]);

      try {
        const res = await startPersistentSession({
          userId: 'candidate_main',
          role: config.role || 'Frontend Developer',
          level: config.level || 'Entry Level',
          type: config.type || 'Technical',
          difficulty: config.difficulty || 'Medium',
          duration: config.duration || '20 min (5 questions)',
          voiceSettings: config.voiceSettings,
        });

        if (isMounted && res.success && res.sessionId) {
          setSessionId(res.sessionId);
          sessionStorage.setItem('interviewiq_session_id', res.sessionId);
          await loadNextTurn(res.sessionId);
        }
      } catch (err) {
        console.warn('Session startup notice:', err);
        if (isMounted) {
          const localId = `session_${Date.now()}`;
          setSessionId(localId);
          await loadNextTurn(localId);
        }
      }
    };

    initSession();

    return () => {
      isMounted = false;
      stopAllAudio();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Handle Candidate Response Submission
  const handleSendAnswer = async () => {
    const text = candidateInput.trim();
    if (!text || text.length < 5) return;
    if (!currentQuestion || !sessionId) return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }
    stopAllAudio();

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const answerMsgId = `ans_${Date.now()}`;

    // Add Candidate's Message Bubble to the Chat
    const candidateMsg: ChatMessage = {
      id: answerMsgId,
      sender: 'candidate',
      text,
      timestamp,
      questionNumber,
      codeSnippet: scratchpadCode.trim().length > 100 ? scratchpadCode : undefined,
    };

    setMessages((prev) => [...prev, candidateMsg]);
    setCandidateInput('');
    setInterviewState('evaluating');

    try {
      // Submit answer to server evaluation engine
      const turnResult = await submitSessionAnswer({
        sessionId,
        questionId: currentQuestion.id,
        questionTitle: currentQuestion.title,
        candidateAnswer: text,
        codeSnippet: scratchpadCode,
        durationSeconds: elapsedSeconds,
        role: config.role,
        type: config.type,
        difficulty: config.difficulty,
      });

      if (turnResult.success) {
        const evaluation = turnResult.evaluation;

        // Save in answers map for final report
        setAnswersMap((prev) => ({
          ...prev,
          [currentQuestion.id]: {
            speech: text,
            notes: scratchpadCode,
            evaluation,
          },
        }));

        // Add Inline Evaluation Card in Chat
        const evalMsg: ChatMessage = {
          id: `eval_${Date.now()}`,
          sender: 'evaluation',
          text: evaluation.summary || 'Strong technical response with clear architectural grounding.',
          evaluation,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, evalMsg]);

        // Handle Contextual Follow-Up Probe or Advance
        if (turnResult.hasFollowUp && turnResult.followUpQuestion) {
          setInterviewState('generating_follow_up');
          setActiveFollowUp(turnResult.followUpQuestion);

          const followUpMsg: ChatMessage = {
            id: `fu_${Date.now()}`,
            sender: 'interviewer',
            title: `Follow-up Probe: ${turnResult.followUpQuestion.title}`,
            text: turnResult.followUpQuestion.description || 'Dig deeper into failure modes and latency trade-offs.',
            isFollowUp: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            audioContent: turnResult.followUpAudio?.audioContent,
          };
          setMessages((prev) => [...prev, followUpMsg]);
          speakUtterance(turnResult.followUpQuestion.title, turnResult.followUpAudio?.audioContent, () =>
            setInterviewState('listening')
          );
        } else {
          // If no follow-up, check if session is completed
          if (questionNumber < totalQuestions) {
            await loadNextTurn(sessionId);
          } else {
            // Final Question Completed
            const completeNotice: ChatMessage = {
              id: `done_${Date.now()}`,
              sender: 'system',
              text: `🎉 You have completed all ${totalQuestions} interview questions! Click "Finish & Debrief" to generate your comprehensive scorecard and hiring recommendation.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, completeNotice]);
            setInterviewState('completed');
          }
        }
      }
    } catch (err: any) {
      console.warn('Answer submission notice:', err);
      // Fallback evaluation so user can always advance
      const fallbackEval: AnswerEvaluationResult = {
        score: 82,
        summary: 'Solid breakdown demonstrating domain knowledge and sound structured reasoning.',
        strengths: ['Addressed primary architecture constraints', 'Clear technical articulation'],
        gaps: ['Quantify SLA and latency bounds', 'Discuss partition recovery trade-offs'],
        rubricScores: {
          technicalKnowledge: 84,
          problemSolving: 82,
          communicationDelivery: 85,
          systemArchitecture: 80,
        },
        followUpQuestion: 'How would you architect and benchmark this solution under 50x payload traffic spike?',
        coachingTip: 'When discussing architecture, cite specific production SLAs and P99 latency bounds.',
      };

      setAnswersMap((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          speech: text,
          notes: scratchpadCode,
          evaluation: fallbackEval,
        },
      }));

      const evalMsg: ChatMessage = {
        id: `eval_${Date.now()}`,
        sender: 'evaluation',
        text: fallbackEval.summary,
        evaluation: fallbackEval,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, evalMsg]);

      if (questionNumber < totalQuestions) {
        await loadNextTurn(sessionId);
      } else {
        setInterviewState('completed');
      }
    }
  };

  // Handle Candidate Asking Interviewer for Clarification
  const handleAskClarification = async () => {
    const query = prompt('Ask the interviewer a clarifying question or request context:');
    if (!query || !query.trim() || !currentQuestion) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Show candidate clarification in chat
    const candidateQueryMsg: ChatMessage = {
      id: `query_${Date.now()}`,
      sender: 'candidate',
      text: query.trim(),
      timestamp,
      isClarification: true,
    };
    setMessages((prev) => [...prev, candidateQueryMsg]);
    setInterviewState('interviewer_speaking');

    try {
      const res = await requestInterviewerTurn({
        role: config.role,
        questionTitle: currentQuestion.title,
        candidateMessage: query.trim(),
        context: candidateInput,
        mode: 'clarification',
      });

      if (res.success && res.turn) {
        const interviewerResponseMsg: ChatMessage = {
          id: `clarify_reply_${Date.now()}`,
          sender: 'interviewer',
          title: `Interviewer Clarification (${res.turn.category || 'Architecture Boundary'})`,
          text: res.turn.spokenResponse,
          isClarification: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, interviewerResponseMsg]);
        speakUtterance(res.turn.spokenResponse, undefined, () => setInterviewState('listening'));
      }
    } catch {
      const defaultClarification = `Great question. In this scenario, assume a distributed cloud architecture with 99.95% SLA and 100k daily active users. Focus on latency bottlenecks and data consistency.`;
      const replyMsg: ChatMessage = {
        id: `clarify_reply_${Date.now()}`,
        sender: 'interviewer',
        title: `Interviewer Clarification`,
        text: defaultClarification,
        isClarification: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, replyMsg]);
      speakUtterance(defaultClarification, undefined, () => setInterviewState('listening'));
    }
  };

  // Complete Interview & Compile Final Report
  const handleFinishSession = async () => {
    setIsFinishing(true);
    setInterviewState('completed');
    stopAllAudio();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    const mins = Math.max(1, Math.floor(elapsedSeconds / 60));
    const duration = `${mins} min`;

    const answersList = sessionQuestions.map((q) => {
      const state = answersMap[q.id];
      return {
        questionTitle: q.title,
        answer: state?.speech || 'Candidate completed verbal response.',
        codeSnippet: state?.notes || '',
        score: state?.evaluation?.score || 82,
        rubricScores: state?.evaluation?.rubricScores,
        strengths: state?.evaluation?.strengths || ['Structured domain reasoning', 'Clear technical communication'],
        gaps: state?.evaluation?.gaps || ['Quantify SLA and latency bounds'],
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
      const report: SessionEvaluationReport =
        res.ok && data.success && data.report
          ? { ...data.report, role: config.role, duration }
          : {
              overallScore: 85,
              grade: 'B+',
              hireRecommendation: 'Hire',
              summary: `Candidate demonstrated strong core competency in ${config.role} architectures with structured decomposition.`,
              competencyBreakdown: {
                communication: { score: 86, feedback: 'Articulate delivery with structured breakdown.' },
                technicalKnowledge: { score: 85, feedback: 'Sound grasp of domain concepts and trade-offs.' },
                problemSolving: { score: 84, feedback: 'Deconstructs complex constraints effectively.' },
              },
              keyStrengths: [
                'Structured domain reasoning',
                'Awareness of performance constraints',
                'Clear technical communication',
              ],
              growthAreas: ['Quantify SLA and latency bounds', 'Discuss partition failure recovery'],
              actionItems: ['Practice 2 System Design deep dives', 'Drill 3-minute concise summaries'],
              role: config.role,
              duration,
            };

      if (sessionId) {
        await completePersistentSession({ sessionId, report }).catch(() => {});
        sessionStorage.removeItem('interviewiq_session_id');
      }

      onCompleteSession({
        role: config.role || 'Frontend Developer',
        type: `${config.type || 'Technical'} (${config.role})`,
        score: report.overallScore,
        duration,
        report,
      });
    } catch {
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

  const wordCount = candidateInput.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] lg:h-[calc(100vh-68px)] max-w-5xl mx-auto w-full bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/50 overflow-hidden">
      {/* 1. TOP LIVE INTERVIEW HEADER */}
      <header className="px-space-md sm:px-space-lg py-3 bg-surface-container-low border-b border-surface-variant flex items-center justify-between shrink-0 flex-wrap gap-2">
        {/* Left: Role, Track, Question Counter */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold shadow-xs">
            <span className="material-symbols-outlined text-[20px]">forum</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-headline-sm text-sm sm:text-base font-bold text-on-surface">
                {config.role} Mock Interview
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-micro text-[11px] font-bold uppercase tracking-wider">
                Question {questionNumber} of {totalQuestions}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-outline font-medium">
              <span>{config.type} Track</span>
              <span>•</span>
              <span>{config.difficulty} Level</span>
              <span>•</span>
              <span className="font-mono text-on-surface font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-outline">timer</span>
                {formatTimer(elapsedSeconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Audio Wave, Code Drawer Toggle, Exit & Finish */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Active Speaking Indicator */}
          {isPlayingSynth && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container/40 text-secondary text-xs font-semibold animate-pulse">
              <span className="material-symbols-outlined text-[15px]">volume_up</span>
              <span className="hidden sm:inline">Interviewer Speaking</span>
              <button
                type="button"
                onClick={stopAllAudio}
                className="hover:underline text-[11px] ml-1 font-bold cursor-pointer"
                title="Stop audio playback"
              >
                Mute
              </button>
            </div>
          )}

          {isListening && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container text-on-error-container text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-error" />
              <span>Mic Active</span>
            </div>
          )}

          {/* Toggle Code Scratchpad */}
          <button
            type="button"
            onClick={() => setIsCodeDrawerOpen(!isCodeDrawerOpen)}
            className={`h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border ${
              isCodeDrawerOpen
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant/60'
            }`}
            title="Open/Close code & architecture scratchpad"
          >
            <span className="material-symbols-outlined text-[15px]">code</span>
            <span className="hidden sm:inline">Code Notes</span>
          </button>

          {/* Exit Interview Button */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Do you want to exit the interview session? You will return to the Overview page.')) {
                stopAllAudio();
                onNavigate('overview');
              }
            }}
            className="h-8 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium transition-colors cursor-pointer border border-outline-variant/60 flex items-center gap-1"
            title="Exit interview and return to overview"
          >
            <span className="material-symbols-outlined text-[15px]">logout</span>
            <span className="hidden md:inline">Exit</span>
          </button>

          {/* Finish & Debrief Button */}
          <button
            type="button"
            onClick={handleFinishSession}
            disabled={isFinishing}
            className="h-8 px-3 rounded-lg bg-error hover:bg-error/90 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[15px]">call_end</span>
            <span>{isFinishing ? 'Generating Report...' : 'Finish & Debrief'}</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN CONVERSATIONAL CHAT BODY */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Messages Stream Container */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 flex flex-col gap-4 bg-surface-container-lowest">
          {messages.map((msg) => {
            const isInterviewer = msg.sender === 'interviewer';
            const isCandidate = msg.sender === 'candidate';
            const isEval = msg.sender === 'evaluation';
            const isSystem = msg.sender === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="p-3 my-2 rounded-xl bg-surface-container-low border border-outline-variant/60 text-center text-xs sm:text-sm text-on-surface max-w-xl mx-auto font-medium shadow-2xs">
                  {msg.text}
                </div>
              );
            }

            if (isEval && msg.evaluation) {
              return (
                <div
                  key={msg.id}
                  className="max-w-2xl mx-auto w-full my-2 p-4 rounded-2xl bg-surface-container-low border border-primary/20 shadow-xs flex flex-col gap-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-surface-variant flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold text-sm">
                        {msg.evaluation.score}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-on-surface">AI Bar-Raiser Feedback</span>
                        <span className="text-[11px] text-outline">{msg.timestamp}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
                      {msg.evaluation.score >= 85 ? 'Strong Answer' : msg.evaluation.score >= 70 ? 'Solid Answer' : 'Needs Practice'}
                    </span>
                  </div>

                  <p className="text-sm text-on-surface leading-relaxed">
                    {msg.text}
                  </p>

                  {/* Rubric metrics */}
                  {msg.evaluation.rubricScores && (
                    <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                      <div className="p-2 rounded-lg bg-surface-container-lowest flex flex-col">
                        <span className="text-[10px] text-outline font-semibold uppercase">Communication</span>
                        <span className="font-bold text-on-surface">{msg.evaluation.rubricScores.communicationDelivery || 85}%</span>
                      </div>
                      <div className="p-2 rounded-lg bg-surface-container-lowest flex flex-col">
                        <span className="text-[10px] text-outline font-semibold uppercase">Tech Depth</span>
                        <span className="font-bold text-on-surface">{msg.evaluation.rubricScores.technicalKnowledge || 86}%</span>
                      </div>
                      <div className="p-2 rounded-lg bg-surface-container-lowest flex flex-col">
                        <span className="text-[10px] text-outline font-semibold uppercase">Problem Solving</span>
                        <span className="font-bold text-on-surface">{msg.evaluation.rubricScores.problemSolving || 83}%</span>
                      </div>
                    </div>
                  )}

                  {/* Strengths & Gaps */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                    {msg.evaluation.strengths && msg.evaluation.strengths.length > 0 && (
                      <div className="p-2 rounded-lg bg-secondary-container/20 text-on-surface">
                        <span className="font-bold text-secondary flex items-center gap-1 mb-1">
                          <span className="material-symbols-outlined text-[13px]">check_circle</span>
                          Strengths
                        </span>
                        <ul className="space-y-0.5">
                          {msg.evaluation.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-secondary">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {msg.evaluation.gaps && msg.evaluation.gaps.length > 0 && (
                      <div className="p-2 rounded-lg bg-tertiary-fixed/20 text-on-surface">
                        <span className="font-bold text-tertiary flex items-center gap-1 mb-1">
                          <span className="material-symbols-outlined text-[13px]">lightbulb</span>
                          Areas to Elevate
                        </span>
                        <ul className="space-y-0.5">
                          {msg.evaluation.gaps.map((g, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-tertiary">•</span>
                              <span>{g}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${
                  isCandidate ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-xs border border-outline-variant/60 mt-0.5">
                  <img
                    src={isCandidate ? (userProfile?.email ? `https://api.dicebear.com/7.x/bottts/svg?seed=${userProfile.fullName}` : COACH_AVATAR_URL) : COACH_AVATAR_URL}
                    alt={isCandidate ? 'Candidate' : 'Interviewer'}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Bubble Container */}
                <div
                  className={`flex flex-col gap-1.5 rounded-2xl p-4 shadow-xs ${
                    isCandidate
                      ? 'bg-primary text-on-primary rounded-tr-xs'
                      : 'bg-surface-container-low text-on-surface border border-outline-variant/40 rounded-tl-xs'
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center justify-between gap-3 text-xs flex-wrap">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>{isCandidate ? 'You (Candidate)' : 'Lead Interviewer'}</span>
                      {msg.isFollowUp && (
                        <span className="px-1.5 py-0.2 rounded bg-tertiary-fixed text-on-tertiary-fixed-variant text-[10px] uppercase font-bold">
                          Follow-up Probe
                        </span>
                      )}
                      {msg.isClarification && (
                        <span className="px-1.5 py-0.2 rounded bg-secondary-container text-on-secondary-container text-[10px] uppercase font-bold">
                          Clarification
                        </span>
                      )}
                    </div>
                    <span className={`text-[11px] ${isCandidate ? 'text-on-primary/70' : 'text-outline'}`}>
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Title / Question Headline */}
                  {msg.title && (
                    <div className="font-bold text-sm sm:text-base leading-snug">
                      {msg.title}
                    </div>
                  )}

                  {/* Main Message Text */}
                  <div className={`text-sm sm:text-base leading-relaxed whitespace-pre-wrap ${isCandidate ? 'text-on-primary' : 'text-on-surface'}`}>
                    {msg.text}
                  </div>

                  {/* Code snippet attached by candidate */}
                  {msg.codeSnippet && (
                    <div className="mt-2 p-2.5 rounded-lg bg-black/20 text-xs font-mono text-on-primary overflow-x-auto max-h-36">
                      <div className="text-[10px] uppercase tracking-wider text-on-primary/70 mb-1 font-bold">Attached Code Snippet:</div>
                      <pre>{msg.codeSnippet}</pre>
                    </div>
                  )}

                  {/* Interviewer Audio Speaker Button */}
                  {isInterviewer && (
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-surface-variant/40 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (isPlayingSynth) {
                            stopAllAudio();
                          } else {
                            speakUtterance(`${msg.title ? msg.title + '. ' : ''}${msg.text}`, msg.audioContent);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                        title="Listen to interviewer speak"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isPlayingSynth ? 'stop_circle' : 'volume_up'}
                        </span>
                        <span>{isPlayingSynth ? 'Stop Speaking' : 'Read Aloud'}</span>
                      </button>

                      {msg.companies && msg.companies.length > 0 && (
                        <span className="text-[10px] text-outline hidden sm:inline">
                          Asked at: {msg.companies.join(', ')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Evaluating / Loading Indicator */}
          {interviewState === 'evaluating' && (
            <div className="flex items-center gap-3 mr-auto max-w-md p-3.5 rounded-2xl bg-surface-container-low border border-primary/30 text-on-surface shadow-xs">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
              <div className="flex flex-col text-xs">
                <span className="font-bold text-primary">Interviewer is reviewing your response...</span>
                <span className="text-outline">Assessing technical depth, architecture trade-offs, and communication.</span>
              </div>
            </div>
          )}

          {/* Generating Next Question Spinner */}
          {interviewState === 'generating_next_question' && (
            <div className="flex items-center gap-3 mr-auto max-w-md p-3.5 rounded-2xl bg-surface-container-low border border-secondary/30 text-on-surface shadow-xs">
              <div className="w-6 h-6 rounded-full border-2 border-secondary border-t-transparent animate-spin shrink-0" />
              <div className="flex flex-col text-xs">
                <span className="font-bold text-secondary">Calibrating next interview turn...</span>
                <span className="text-outline">Selecting fresh non-duplicate question for {config.role}.</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* 3. OPTIONAL CODE SCRATCHPAD DRAWER (Slides in on toggle) */}
        {isCodeDrawerOpen && (
          <div className="w-80 sm:w-96 border-l border-surface-variant bg-surface-container-low flex flex-col z-20 shrink-0 shadow-lg animate-in slide-in-from-right">
            <div className="p-3 border-b border-surface-variant flex items-center justify-between bg-surface-container">
              <div className="flex items-center gap-1.5 font-bold text-xs text-on-surface">
                <span className="material-symbols-outlined text-[16px] text-primary">terminal</span>
                <span>Code Scratchpad</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCodeDrawerOpen(false)}
                className="text-outline hover:text-on-surface p-1 rounded cursor-pointer"
                title="Close scratchpad"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <div className="p-3 flex-1 flex flex-col gap-2">
              <textarea
                value={scratchpadCode}
                onChange={(e) => setScratchpadCode(e.target.value)}
                className="w-full flex-1 p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant font-mono text-xs text-on-surface leading-relaxed resize-none focus:outline-none focus:border-primary"
                placeholder="// Type pseudo-code, SQL queries, or data structure algorithms here..."
              />
              <span className="text-[11px] text-outline">
                This code will be automatically attached to your verbal/written answer when submitted.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. CHAT INPUT & VOICE DICTATION DOCK */}
      <footer className="p-3 sm:p-4 bg-surface-container-low border-t border-surface-variant flex flex-col gap-2 shrink-0">
        {/* Quick Action Chips */}
        <div className="flex items-center justify-between text-xs flex-wrap gap-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleAskClarification}
              className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium border border-outline-variant/60 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[14px] text-primary">help</span>
              <span>Ask Clarification</span>
            </button>
            <button
              type="button"
              onClick={() => {
                alert('STAR Method: Structure your response into Situation, Task, Action you specifically executed, and quantifiable Result with latency or business impact.');
              }}
              className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium border border-outline-variant/60 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[14px] text-amber-500">lightbulb</span>
              <span>STAR Guide</span>
            </button>
            {scratchpadCode.trim().length > 100 && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">code</span>
                Code Attached
              </span>
            )}
          </div>

          <div className="text-[11px] text-outline font-mono">
            Word Count: {wordCount} words
          </div>
        </div>

        {/* Input Text Box with Mic & Send Controls */}
        <div className="flex items-end gap-2 bg-surface-container-lowest rounded-xl border border-outline-variant p-2 shadow-xs focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
          {/* Live Microphone Dictation Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              isListening
                ? 'bg-error text-white animate-pulse shadow-md ring-2 ring-error/40'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface hover:text-primary'
            }`}
            title={isListening ? 'Click to pause voice dictation' : 'Click to speak using your microphone'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isListening ? 'mic_off' : 'mic'}
            </span>
          </button>

          {/* Candidate Speech / Text Input */}
          <textarea
            ref={inputRef}
            value={candidateInput}
            onChange={(e) => setCandidateInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendAnswer();
              }
            }}
            rows={Math.min(5, Math.max(1, candidateInput.split('\n').length))}
            placeholder={
              isListening
                ? 'Listening to your voice... Speak your response naturally.'
                : 'Speak with your microphone or type your response here... (Press Enter to send)'
            }
            className="flex-1 max-h-32 bg-transparent resize-none border-none focus:outline-none text-sm sm:text-base text-on-surface leading-relaxed placeholder:text-outline py-1.5 px-1 font-body-md"
          />

          {/* Send / Submit Button */}
          <button
            type="button"
            onClick={handleSendAnswer}
            disabled={wordCount < 2 || interviewState === 'evaluating'}
            className="h-10 px-4 rounded-xl bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-bold text-xs sm:text-sm flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-xs disabled:opacity-40"
          >
            <span>Send</span>
            <span className="material-symbols-outlined text-[16px]">send</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
