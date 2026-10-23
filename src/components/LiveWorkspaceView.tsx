import React, { useState, useEffect } from 'react';
import { ViewMode, InterviewConfig } from '../types';
import { SESSION_OUTLINE_ITEMS } from '../data/mockData';

interface LiveWorkspaceViewProps {
  config: InterviewConfig;
  onNavigate: (view: ViewMode) => void;
  onCompleteSession: (sessionData?: { role: string; type: string; score: number; duration: string }) => void;
}

const COACH_AVATAR_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCWLQAyNdAL7pSCIj_tQGgwWbp5cFuHeRRZqHRnNQTCDSscLPi7kRWuhrHWP0XCw4IayELCXyPJExX1Js7aClJdKvJz76UxCqqaVrusydyBkni-2xnCLi8PjA5PdlezSIz32T7EMLXgR-shhrB7TAYp717RTngeEDwphpVvwohHQfJ3wpuPNZpudIvETBwXKWx5m-Jv52mS9DkQxr4mZiWnHC3jaO3F9zBYfhCR2aXfIpT1d6Ig1bGnSA";

export const LiveWorkspaceView: React.FC<LiveWorkspaceViewProps> = ({
  config,
  onNavigate: _onNavigate,
  onCompleteSession,
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'code'>('voice');
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(272); // 04:32
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(2); // Question 3 (0-indexed)
  const [isPlayingSynth, setIsPlayingSynth] = useState(false);
  const [savedNoteMessage, setSavedNoteMessage] = useState(false);
  const [showCoachGuidance, setShowCoachGuidance] = useState(true);
  const [scratchNotes, setScratchNotes] = useState(
`// Architecture Scratchpad
// Decouple streaming telemetry ingestion from React tree
const useTelemetryFeed = (streamUrl) => {
  const bufferRef = useRef([]);
  const [batch, setBatch] = useState([]);

  useEffect(() => {
    const ws = new WebSocket(streamUrl);
    ws.onmessage = (event) => {
      bufferRef.current.push(JSON.parse(event.data));
    };

    // Schedule 60fps raf batch flush
    const frameId = requestAnimationFrame(function flush() {
      if (bufferRef.current.length > 0) {
        setBatch([...bufferRef.current]);
        bufferRef.current = [];
      }
      requestAnimationFrame(flush);
    });

    return () => {
      ws.close();
      cancelAnimationFrame(frameId);
    };
  }, [streamUrl]);

  return batch;
};`
  );

  const [candidateSpeech, setCandidateSpeech] = useState(
    "First, I would decouple the high-frequency streaming telemetry updates from the parent view by isolating the data ingestion into a dedicated custom hook or observable subscription, preventing cascade re-renders across static navigation and sibling panels. Second, for the actual rendered feed of thousands of rows, I'd implement virtualized lists using react-window or tanstack-virtual so only the visible viewport items (around 20-30 DOM nodes) are mounted in the DOM tree..."
  );

  // Timer tick effect
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSaveNotes = () => {
    setSavedNoteMessage(true);
    setTimeout(() => setSavedNoteMessage(false), 2000);
  };

  const handleFinish = () => {
    const mins = Math.max(1, Math.floor(elapsedSeconds / 60));
    const score = Math.floor(Math.random() * 12) + 82; // realistic mock performance score 82-93
    onCompleteSession({
      role: config.role || 'Frontend Developer',
      type: `${config.type || 'Technical'} (${config.role || 'Frontend'} & System)`,
      score,
      duration: `${mins} min`,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < 7) {
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

  const wordCount = candidateSpeech.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Simulation Notice Banner */}
      <div className="mb-space-md flex flex-col sm:flex-row sm:items-center justify-between px-space-md py-space-xs bg-surface-container-lowest rounded-lg shadow-sm gap-2">
        <div className="flex items-center gap-space-sm">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-micro text-label-micro uppercase tracking-wider font-semibold">
            <span className="material-symbols-outlined text-[12px] text-tertiary">info</span>
            <span>Interactive Simulation Preview</span>
          </span>
          <span className="font-body-sm text-body-sm text-outline">
            Screen 3 of 3 • Mock Interview Workspace
          </span>
        </div>
        <div className="flex items-center gap-space-sm text-outline font-label-sm text-label-sm">
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span>Low Latency AI Engine: Active (12ms)</span>
          </span>
        </div>
      </div>

      {/* Session Metadata & Control Header Bar */}
      <div className="mb-space-lg p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-space-md">
        {/* Left: Role & Details */}
        <div className="flex items-center gap-space-md flex-wrap">
          <div className="flex items-center gap-space-sm">
            <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">code_blocks</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-on-surface leading-tight font-semibold">
                {config.role || 'Frontend Developer'} (React &amp; Architecture)
              </span>
              <div className="flex items-center gap-2 font-label-micro text-label-micro text-outline mt-0.5">
                <span className="px-1.5 py-0.5 rounded bg-surface-container-low text-on-surface-variant uppercase tracking-wider font-semibold">
                  {config.type || 'Technical'}
                </span>
                <span>•</span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container-low text-on-surface-variant uppercase tracking-wider font-medium">
                  {config.difficulty || 'Medium'} Difficulty
                </span>
                <span>•</span>
                <span>Est. 20 min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Telemetry & Actions */}
        <div className="flex items-center gap-space-md ml-auto flex-wrap">
          {/* Recording Status Indicator */}
          <div className="flex items-center gap-space-sm px-space-md py-1.5 rounded-full bg-surface-container-low">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isMuted ? 'bg-outline' : 'bg-error'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isMuted ? 'bg-outline' : 'bg-error'}`}></span>
            </span>
            <span className="font-label-sm text-label-sm text-on-surface font-medium tracking-tight">
              {isMuted ? 'Mic Muted' : 'Mic Active'}
            </span>
            <span className="font-label-micro text-label-micro text-outline">|</span>
            <span className="font-label-md text-label-md text-on-surface font-mono font-medium tracking-tight">
              {formatTimer(elapsedSeconds)}
            </span>
            <span className="font-label-micro text-label-micro text-outline font-mono">/ 20:00</span>
          </div>

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
              className="h-[34px] px-space-md flex items-center gap-1.5 rounded-lg bg-surface-container-low hover:bg-error-container hover:text-on-error-container text-outline hover:font-medium transition-colors font-label-md text-label-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">call_end</span>
              <span>End Interview</span>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="font-label-micro text-label-micro px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed uppercase tracking-wider font-semibold">
                  Question {currentQuestionIndex + 1} of 8
                </span>
                <span className="font-label-micro text-label-micro text-outline uppercase tracking-wider font-semibold">
                  System Design &amp; Frontend Architecture
                </span>
              </div>
              <span className="font-label-micro text-label-micro text-secondary font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                AI Evaluation Running
              </span>
            </div>

            {/* Segmented 8-part Progress Indicator */}
            <div className="grid grid-cols-8 gap-1.5 w-full">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
                if (idx < currentQuestionIndex) {
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className="h-1.5 rounded-full bg-primary transition-all cursor-pointer hover:opacity-80"
                      title={`Question ${idx + 1} (Completed)`}
                    />
                  );
                } else if (idx === currentQuestionIndex) {
                  return (
                    <div
                      key={idx}
                      className="h-1.5 rounded-full bg-primary-container relative overflow-hidden"
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
                      className="h-1.5 rounded-full bg-surface-container-high transition-all cursor-pointer hover:bg-surface-variant"
                      title={`Question ${idx + 1} (Upcoming)`}
                    />
                  );
                }
              })}
            </div>

            {/* Question Title & Prompt Specification */}
            <div className="pt-space-xs flex flex-col gap-space-sm">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
                How would you optimize re-renders and virtual DOM memory overhead in a large-scale real-time dashboard displaying streaming telemetry data?
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Focus on component decomposition, memoization strategies (<code className="px-1.5 py-0.5 rounded bg-surface-container-low text-primary font-mono text-[12px]">React.memo</code>, <code className="px-1.5 py-0.5 rounded bg-surface-container-low text-primary font-mono text-[12px]">useMemo</code>), windowing/virtualization techniques, and state colocation.
              </p>
            </div>

            {/* AI Coach Voice Playback & Audio Synthesis Strip */}
            <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-sm">
                <button
                  type="button"
                  onClick={() => setIsPlayingSynth(!isPlayingSynth)}
                  className="w-7 h-7 rounded-full bg-surface-container-lowest text-on-surface hover:text-primary flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                  title="Replay Audio Synth"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isPlayingSynth ? 'pause' : 'replay'}
                  </span>
                </button>
                <div className="flex flex-col">
                  <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">
                    Coach Synth Voice (Nova)
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface">
                    {isPlayingSynth ? 'Speaking synthesized prompt...' : 'Question audio playback complete'}
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
                <span className="font-label-micro text-label-micro text-outline ml-1 font-mono">00:18</span>
              </div>
            </div>
          </div>

          {/* Candidate Answer & Live Response Area */}
          <div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm flex flex-col gap-space-md">
            {/* Mode Switcher & Stream Status */}
            <div className="flex items-center justify-between border-b border-surface-variant pb-space-sm">
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
                  <span>Voice Response</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
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
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  <span>Code &amp; Scratchpad</span>
                </button>
              </div>

              {/* Live Transcribing Telemetry Badge */}
              <div className="flex items-center gap-space-xs">
                <span className="font-label-micro text-label-micro uppercase text-secondary font-medium tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  Live Speech-to-Text
                </span>
              </div>
            </div>

            {/* Main Interactive Window */}
            {activeTab === 'voice' ? (
              <div className="relative p-space-lg bg-surface-container-low rounded-xl flex flex-col gap-space-sm min-h-[170px]">
                <div className="flex items-center justify-between text-outline font-label-micro text-label-micro uppercase tracking-wider">
                  <span>Speech Recognition Stream (Candidate Audio)</span>
                  <span className="font-mono text-outline">Confidence: 98.4%</span>
                </div>

                <div className="font-body-lg text-body-lg text-on-surface leading-relaxed">
                  <span 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => setCandidateSpeech(e.currentTarget.textContent || '')}
                    className="outline-none focus:bg-surface-container-lowest/60 rounded p-1 transition-colors block"
                  >
                    {candidateSpeech}
                  </span>
                  <span className="inline-block w-1.5 h-4 ml-1 bg-primary align-middle animate-pulse"></span>
                </div>

                <div className="mt-auto pt-space-xs flex items-center justify-between text-outline font-label-micro text-label-micro">
                  <span>Speak clearly into microphone or edit transcript directly</span>
                  <span className="font-mono">Word Count: {wordCount} words</span>
                </div>
              </div>
            ) : (
              <div className="relative p-space-md bg-surface-container-low rounded-xl flex flex-col gap-space-sm min-h-[170px]">
                <div className="flex items-center justify-between text-outline font-label-micro text-label-micro uppercase tracking-wider">
                  <span>Code &amp; Architectural Notes</span>
                  <span className="text-secondary font-medium">Auto-synced</span>
                </div>
                <textarea
                  value={scratchNotes}
                  onChange={(e) => setScratchNotes(e.target.value)}
                  rows={8}
                  className="w-full bg-transparent resize-none border-none focus:outline-none font-mono text-[13px] text-on-surface leading-relaxed"
                  placeholder="// Type scratch notes, code snippets, or architecture diagrams here..."
                />
              </div>
            )}

            {/* Live Speech Cadence & Fluency Metrics Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm p-space-sm bg-surface-container rounded-lg">
              <div className="flex items-center gap-space-sm p-space-xs bg-surface-container-lowest rounded-md px-space-md">
                <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[16px]">speed</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-micro text-label-micro text-outline uppercase font-semibold">Pacing cadence</span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    135 wpm <span className="text-secondary font-normal text-label-sm">(Optimal)</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-space-sm p-space-xs bg-surface-container-lowest rounded-md px-space-md">
                <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[16px]">filter_list_off</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-micro text-label-micro text-outline uppercase font-semibold">Filler word count</span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    0 detected <span className="text-secondary font-normal text-label-sm">(Clean)</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-space-sm p-space-xs bg-surface-container-lowest rounded-md px-space-md">
                <div className="w-7 h-7 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[16px]">graphic_eq</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-micro text-label-micro text-outline uppercase font-semibold">Acoustic clarity</span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    94% <span className="text-primary font-normal text-label-sm">(High)</span>
                  </span>
                </div>
              </div>
            </div>

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
                  onClick={handleSaveNotes}
                  className="h-[34px] px-space-md rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant transition-colors font-label-md text-label-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span className={`material-symbols-outlined text-[16px] ${savedNoteMessage ? 'text-secondary' : ''}`}>
                    {savedNoteMessage ? 'check' : 'bookmark_border'}
                  </span>
                  <span>{savedNoteMessage ? 'Notes Saved!' : 'Save Notes'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="h-[34px] px-space-lg rounded-lg bg-primary hover:bg-on-primary-fixed-variant text-on-primary transition-colors font-label-md text-label-md flex items-center gap-1.5 shadow-sm font-semibold cursor-pointer active:scale-[0.99]"
                >
                  <span>{currentQuestionIndex === 7 ? 'Finish & View Report' : 'Submit & Next Question'}</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Interviewer Simulation Canvas Overlay / Quick Tip */}
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
                  Coach Real-time Guidance
                </span>
                <p className="font-body-sm text-body-sm text-on-surface truncate">
                  Remember to address how you would measure performance metrics in production (e.g., Interaction to Next Paint or Long Animation Frames).
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

        {/* RIGHT SIDEBAR COLUMN: Session Outline, Rubric & Quality (4 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-space-lg">
          {/* Session Question Outline Sticky Card */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
            <div className="flex items-center justify-between border-b border-surface-variant pb-space-xs">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-outline">format_list_numbered</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Session Outline</span>
              </div>
              <span className="font-label-micro text-label-micro text-outline uppercase tracking-wider font-semibold">
                8 Questions
              </span>
            </div>

            {/* Question List Items */}
            <div className="flex flex-col gap-1">
              {SESSION_OUTLINE_ITEMS.map((item, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const isPassed = idx < currentQuestionIndex;

                return (
                  <div
                    key={item.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`flex items-start gap-space-sm p-space-xs rounded-lg transition-colors group cursor-pointer ${
                      isCurrent
                        ? 'bg-surface-container-low shadow-sm border-l-2 border-primary'
                        : 'hover:bg-surface-container-low'
                    }`}
                  >
                    {isPassed ? (
                      <div className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </div>
                    ) : isCurrent ? (
                      <div className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[14px]">record_voice_over</span>
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-label-micro text-outline font-semibold">
                        {item.id}
                      </div>
                    )}

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-label-sm text-label-sm truncate ${
                          isCurrent ? 'text-primary font-semibold' : isPassed ? 'text-on-surface font-medium' : 'text-on-surface-variant'
                        }`}>
                          {item.title}
                        </span>
                        {isCurrent ? (
                          <span className="font-label-micro text-label-micro px-1.5 py-0.2 rounded bg-primary-fixed text-on-primary-fixed uppercase tracking-wider font-semibold">
                            Active
                          </span>
                        ) : (
                          <span className="font-label-micro text-label-micro text-outline">
                            {item.duration}
                          </span>
                        )}
                      </div>
                      <span className="font-body-sm text-body-sm text-outline truncate">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dynamic Evaluation Rubric Tracking Panel */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
            <div className="flex items-center justify-between border-b border-surface-variant pb-space-xs">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-outline">analytics</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Target Competencies</span>
              </div>
              <span className="font-label-micro text-label-micro text-secondary font-medium">Live Scoring</span>
            </div>

            <div className="flex flex-col gap-space-sm">
              <div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface font-medium">Architecture Decisions</span>
                  <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-micro text-label-micro font-semibold uppercase">
                    Observed: Strong
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-outline">
                  Separation of streaming ingestion from UI tree verified.
                </span>
              </div>

              <div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface font-medium">Performance Awareness</span>
                  <span className="px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-micro text-label-micro font-semibold uppercase">
                    Evaluating...
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-outline">
                  Virtualization cited; waiting for memory profiling answer.
                </span>
              </div>

              <div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface font-medium">Structured Delivery</span>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-micro text-label-micro uppercase font-semibold">
                    STAR Baseline
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-outline">
                  Clear sequential breakdown without filler hesitation.
                </span>
              </div>
            </div>
          </div>

          {/* Quick Session Controls & Environmental Telemetry */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-sm">
            <div className="flex items-center justify-between font-label-micro text-label-micro text-outline uppercase tracking-wider font-semibold">
              <span>Environment &amp; Hardware</span>
              <span className="text-secondary font-medium">All Checks Passing</span>
            </div>

            <div className="flex items-center justify-between p-space-xs rounded bg-surface-container-low">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[16px] text-outline">mic</span>
                <span className="font-body-sm text-body-sm text-on-surface">Default - MacBook Pro Mic</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`h-6 px-2 rounded font-label-micro text-label-micro uppercase transition-colors cursor-pointer ${
                  isMuted ? 'bg-error-container text-on-error-container font-semibold' : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
            </div>

            <div className="flex items-center justify-between p-space-xs rounded bg-surface-container-low">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[16px] text-outline">network_wifi</span>
                <span className="font-body-sm text-body-sm text-on-surface">Stream Latency: 12ms</span>
              </div>
              <span className="font-label-micro text-label-micro text-secondary font-medium">Optimal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
