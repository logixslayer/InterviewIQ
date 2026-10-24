import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RealTimeSpeechMetrics } from '../types';

interface RealtimeAVStudioProps {
  isListening: boolean;
  onToggleListening: () => void;
  candidateSpeech: string;
  interviewerSpeaking: boolean;
  onInterviewerSpeakQuestion: () => void;
  onAskInterviewer: (message: string) => void;
  role: string;
  questionTitle: string;
  speechMetrics: RealTimeSpeechMetrics;
  onMetricsUpdate?: (metrics: RealTimeSpeechMetrics) => void;
}

const COACH_AVATAR_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCWLQAyNdAL7pSCIj_tQGgwWbp5cFuHeRRZqHRnNQTCDSscLPi7kRWuhrHWP0XCw4IayELCXyPJExX1Js7aClJdKvJz76UxCqqaVrusydyBkni-2xnCLi8PjA5PdlezSIz32T7EMLXgR-shhrB7TAYp717RTngeEDwphpVvwohHQfJ3wpuPNZpudIvETBwXKWx5m-Jv52mS9DkQxr4mZiWnHC3jaO3F9zBYfhCR2aXfIpT1d6Ig1bGnSA";

const FILLER_WORDS_LIST = ['um', 'uh', 'like', 'you know', 'actually', 'basically', 'literally', 'sort of', 'kind of', 'i mean', 'right?'];

export const RealtimeAVStudio: React.FC<RealtimeAVStudioProps> = ({
  isListening,
  onToggleListening,
  candidateSpeech,
  interviewerSpeaking,
  onInterviewerSpeakQuestion,
  onAskInterviewer,
  role,
  questionTitle,
  speechMetrics,
  onMetricsUpdate,
}) => {
  // Media Stream States
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [customQuestionInput, setCustomQuestionInput] = useState('');
  const [showClarificationInput, setShowClarificationInput] = useState(false);

  // Refs for media and audio processing
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const speechStartTimeRef = useRef<number | null>(null);

  // Initialize or Toggle Camera
  const toggleCamera = async () => {
    if (isCameraOn) {
      // Turn off video tracks
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getVideoTracks().forEach(track => track.stop());
        const remainingAudio = mediaStreamRef.current.getAudioTracks();
        if (remainingAudio.length === 0) {
          mediaStreamRef.current = null;
        }
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraOn(false);
      setCameraError(null);
    } else {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: true,
        });

        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
        initAudioAnalyser(stream);
      } catch (err: any) {
        console.warn('Camera access denied or unavailable:', err);
        setCameraError('Camera access unavailable. Using audio telemetry mode.');
        setIsCameraOn(false);
      }
    }
  };

  // Audio Analyser Setup
  const initAudioAnalyser = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      } else if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      const audioCtx = audioContextRef.current;
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      startCanvasVisualizer();
    } catch (e) {
      console.warn('Audio analyser init error:', e);
    }
  };

  // Canvas visualizer loop
  const startCanvasVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      // Calculate RMS for audio level meter
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength;
      const normalizedLevel = Math.min(100, Math.round((avg / 128) * 100));
      setAudioLevel(normalizedLevel);

      // Render glowing frequency bars on canvas
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barCount = 24;
      const barWidth = Math.floor(width / barCount) - 2;

      for (let i = 0; i < barCount; i++) {
        const dataIdx = Math.floor((i / barCount) * bufferLength);
        const val = dataArray[dataIdx] || 0;
        const barHeight = Math.max(3, (val / 255) * (height - 6));
        const x = i * (barWidth + 2);
        const y = height - barHeight;

        // Gradient based on volume intensity
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#6366f1'); // Indigo
        gradient.addColorStop(0.6, '#8b5cf6'); // Purple
        gradient.addColorStop(1, '#06b6d4'); // Cyan

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();
      }
    };

    render();
  };

  // Start standalone audio listener for waveform if camera is off
  const initMicrophoneAudio = async () => {
    if (analyserRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      mediaStreamRef.current = stream;
      initAudioAnalyser(stream);
    } catch (err) {
      console.warn('Microphone stream error for analyser:', err);
    }
  };

  useEffect(() => {
    if (isListening) {
      initMicrophoneAudio();
      if (!speechStartTimeRef.current) {
        speechStartTimeRef.current = Date.now();
      }
      lastSpeechTimeRef.current = Date.now();
    }
  }, [isListening]);

  // Real-time Speech Analytics Calculation
  const analyzeSpeechRealtime = useCallback(() => {
    const text = candidateSpeech.trim();
    if (!text) {
      return {
        wpm: 0,
        pacingLabel: 'Ready to speak',
        pacingStatus: 'optimal' as const,
        fillerWordsCount: 0,
        fillerWordDetails: {},
        silenceDurationSeconds: 0,
        rubricCoverage: {
          context: false,
          architecture: false,
          metrics: false,
          tradeoffs: false,
        },
      };
    }

    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Elapsed speech calculation
    const elapsedMinutes = speechStartTimeRef.current 
      ? Math.max(0.15, (Date.now() - speechStartTimeRef.current) / 60000)
      : Math.max(0.15, wordCount / 130);

    const calculatedWpm = Math.round(wordCount / elapsedMinutes);

    let pacingLabel = 'Optimal Pacing';
    let pacingStatus: 'slow' | 'optimal' | 'fast' = 'optimal';

    if (calculatedWpm < 110) {
      pacingLabel = 'Deliberate / Slow (<110 wpm)';
      pacingStatus = 'slow';
    } else if (calculatedWpm > 165) {
      pacingLabel = 'Rapid / Rushing (>165 wpm)';
      pacingStatus = 'fast';
    } else {
      pacingLabel = `Optimal Pace (~${calculatedWpm} wpm)`;
      pacingStatus = 'optimal';
    }

    // Filler word detection
    const lower = text.toLowerCase();
    const fillerDetails: Record<string, number> = {};
    let totalFillers = 0;

    FILLER_WORDS_LIST.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = lower.match(regex);
      if (matches && matches.length > 0) {
        fillerDetails[filler] = matches.length;
        totalFillers += matches.length;
      }
    });

    // Rubric concept detection
    const rubricCoverage = {
      context: /\b(problem|context|legacy|requirement|customer|user|scenario|traffic)\b/i.test(lower),
      architecture: /\b(architecture|decouple|pipeline|service|cache|queue|database|schema|component|layer)\b/i.test(lower),
      metrics: /\b(latency|p99|ms|throughput|qps|sla|scale|bandwidth|memory|cost|cpu)\b/i.test(lower),
      tradeoffs: /\b(trade-off|tradeoff|however|versus|alternatively|compromise|failover|resilience|bottleneck)\b/i.test(lower),
    };

    const silenceDuration = isListening 
      ? Math.floor((Date.now() - lastSpeechTimeRef.current) / 1000) 
      : 0;

    return {
      wpm: calculatedWpm,
      pacingLabel,
      pacingStatus,
      fillerWordsCount: totalFillers,
      fillerWordDetails: fillerDetails,
      silenceDurationSeconds: silenceDuration,
      rubricCoverage,
    };
  }, [candidateSpeech, isListening]);

  // Recalculate speech metrics whenever candidate speaks
  useEffect(() => {
    lastSpeechTimeRef.current = Date.now();
    const metrics = analyzeSpeechRealtime();
    onMetricsUpdate?.(metrics);
  }, [candidateSpeech, analyzeSpeechRealtime, onMetricsUpdate]);

  // Cleanup media on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleSendClarification = () => {
    if (!customQuestionInput.trim()) return;
    onAskInterviewer(customQuestionInput.trim());
    setCustomQuestionInput('');
    setShowClarificationInput(false);
  };

  return (
    <div className="flex flex-col gap-space-md w-full">
      {/* Real-Time Dual Stage Container (Interviewer & Candidate) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md items-stretch">
        {/* INTERVIEWER FEED CARD */}
        <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant flex flex-col justify-between relative overflow-hidden group">
          {/* Top Bar Indicator */}
          <div className="flex items-center justify-between pb-space-xs border-b border-surface-variant">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${interviewerSpeaking ? 'bg-secondary animate-ping' : 'bg-secondary'}`} />
              <span className="font-label-sm text-label-sm font-bold text-on-surface">
                AI Bar-Raiser (Interviewer)
              </span>
            </div>
            <span className="font-label-micro text-label-micro px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold">
              {interviewerSpeaking ? 'Speaking Aloud' : 'Active Listener'}
            </span>
          </div>

          {/* Central Interviewer Persona Avatar with Audio Wave Ring */}
          <div className="py-4 flex flex-col items-center justify-center gap-3 text-center my-auto">
            <div className="relative">
              <div className={`w-20 h-20 rounded-full overflow-hidden border-2 transition-all ${
                interviewerSpeaking 
                  ? 'border-secondary ring-4 ring-secondary/30 scale-105' 
                  : 'border-surface-variant'
              }`}>
                <img
                  src={COACH_AVATAR_URL}
                  alt="Interviewer"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Pulsing ring during speech */}
              {interviewerSpeaking && (
                <div className="absolute inset-0 rounded-full border-2 border-secondary animate-ping pointer-events-none opacity-40"></div>
              )}
            </div>

            <div className="flex flex-col items-center">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface leading-snug">
                Lead Interviewer ({role})
              </span>
              <span className="font-body-sm text-body-sm text-outline mt-0.5 max-w-xs">
                {interviewerSpeaking
                  ? 'Reading question & providing spoken feedback...'
                  : 'Listening to your architectural breakdown and STAR trade-offs.'}
              </span>
            </div>
          </div>

          {/* Quick Conversational Actions */}
          <div className="pt-space-xs border-t border-surface-variant flex items-center justify-between gap-2 flex-wrap">
            <button
              type="button"
              onClick={onInterviewerSpeakQuestion}
              className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-label-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Hear interviewer speak the current question"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">
                {interviewerSpeaking ? 'stop_circle' : 'volume_up'}
              </span>
              <span>{interviewerSpeaking ? 'Stop Speaking' : 'Read Question Aloud'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowClarificationInput(!showClarificationInput)}
              className="px-3 py-1.5 rounded-lg bg-primary-fixed/20 hover:bg-primary-fixed/30 text-primary text-label-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              <span>Ask Interviewer a Clarification</span>
            </button>
          </div>

          {/* Clarification Inline Dialog */}
          {showClarificationInput && (
            <div className="mt-2 p-2.5 bg-surface-container-low rounded-lg flex flex-col gap-2 border border-primary/20">
              <span className="text-xs font-semibold text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-primary">help_outline</span>
                Ask the interviewer about constraints, scale, or requirements:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customQuestionInput}
                  onChange={(e) => setCustomQuestionInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendClarification()}
                  placeholder="e.g. Can we assume traffic peaks at 50k QPS? Should we optimize for memory?"
                  className="flex-1 px-2.5 py-1.5 text-xs rounded bg-surface-container-lowest border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                />
                <button
                  type="button"
                  onClick={handleSendClarification}
                  disabled={!customQuestionInput.trim()}
                  className="px-3 py-1.5 rounded bg-primary text-on-primary text-xs font-bold hover:opacity-90 disabled:opacity-40 cursor-pointer"
                >
                  Ask
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CANDIDATE FEED CARD (Webcam + Real-Time Audio Spectrum Visualizer) */}
        <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant flex flex-col justify-between relative overflow-hidden">
          {/* Top Bar Indicator */}
          <div className="flex items-center justify-between pb-space-xs border-b border-surface-variant">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-error animate-ping' : 'bg-outline'}`} />
              <span className="font-label-sm text-label-sm font-bold text-on-surface">
                Candidate Feed (You)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isCameraOn && (
                <span className="font-label-micro text-label-micro px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">visibility</span>
                  <span>Camera Live</span>
                </span>
              )}
              <span className={`font-label-micro text-label-micro px-2 py-0.5 rounded-full font-semibold ${
                isListening ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-outline'
              }`}>
                {isListening ? 'Mic Live & Analyzing' : 'Mic Inactive'}
              </span>
            </div>
          </div>

          {/* Central Candidate View: Live Video Feed OR Placeholder */}
          <div className="relative my-auto w-full h-[180px] bg-surface-container-low rounded-lg overflow-hidden flex items-center justify-center border border-outline-variant/30 mt-2">
            {isCameraOn ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                <div className="w-14 h-14 rounded-full bg-surface-container-high text-outline flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">videocam_off</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface">
                    Camera is currently off
                  </span>
                  <span className="font-label-micro text-label-micro text-outline">
                    Click "Enable Camera" below for full mock interview presence
                  </span>
                </div>
              </div>
            )}

            {/* Overlaid Audio Spectrum Visualizer at Bottom of Video Area */}
            <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-surface-container-lowest/90 to-transparent flex items-end px-3 pb-1">
              <canvas
                ref={canvasRef}
                width={280}
                height={32}
                className="w-full h-8"
              />
            </div>

            {/* Voice Activity Decibel Meter Indicator */}
            {isListening && (
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-surface-container-lowest/80 backdrop-blur-xs text-[10px] font-mono text-on-surface flex items-center gap-1 shadow-xs">
                <span className="material-symbols-outlined text-[12px] text-error">graphic_eq</span>
                <span>{audioLevel}% Vol</span>
              </div>
            )}
          </div>

          {cameraError && (
            <span className="text-[11px] text-tertiary mt-1 text-center font-medium">
              {cameraError}
            </span>
          )}

          {/* Bottom Controls for Candidate Feed */}
          <div className="pt-space-xs border-t border-surface-variant flex items-center justify-between gap-2 mt-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleListening}
                className={`px-3 py-1.5 rounded-lg text-label-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isListening
                    ? 'bg-error text-on-error animate-pulse'
                    : 'bg-primary text-on-primary hover:bg-primary/90'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isListening ? 'mic' : 'mic_none'}
                </span>
                <span>{isListening ? 'Mute Mic' : 'Start Mic'}</span>
              </button>

              <button
                type="button"
                onClick={toggleCamera}
                className={`px-3 py-1.5 rounded-lg text-label-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isCameraOn
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isCameraOn ? 'videocam' : 'videocam_off'}
                </span>
                <span>{isCameraOn ? 'Disable Camera' : 'Enable Camera'}</span>
              </button>
            </div>

            {/* Visualizer status */}
            <span className="font-label-micro text-label-micro text-outline flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">equalizer</span>
              <span>Real-Time Web Audio API</span>
            </span>
          </div>
        </div>
      </div>

      {/* REAL-TIME SPEECH TELEMETRY HUD BAR */}
      <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Pacing Metric (WPM) */}
        <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">Speaking Pacing</span>
            <span className="material-symbols-outlined text-[16px] text-outline">speed</span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-headline-sm text-headline-sm font-bold font-mono text-on-surface">
              {speechMetrics.wpm || 0}
            </span>
            <span className="text-xs text-outline font-medium">WPM</span>
          </div>
          <span className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${
            speechMetrics.pacingStatus === 'optimal' 
              ? 'text-secondary' 
              : speechMetrics.pacingStatus === 'fast' 
              ? 'text-tertiary' 
              : 'text-primary'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>{speechMetrics.pacingLabel}</span>
          </span>
        </div>

        {/* Filler Word Counter */}
        <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">Filler Word Meter</span>
            <span className="material-symbols-outlined text-[16px] text-outline">record_voice_over</span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`font-headline-sm text-headline-sm font-bold font-mono ${
              speechMetrics.fillerWordsCount === 0 ? 'text-secondary' : speechMetrics.fillerWordsCount <= 3 ? 'text-on-surface' : 'text-error'
            }`}>
              {speechMetrics.fillerWordsCount}
            </span>
            <span className="text-xs text-outline font-medium">words</span>
          </div>
          <div className="flex items-center gap-1 mt-1 overflow-x-auto text-[10px]">
            {Object.keys(speechMetrics.fillerWordDetails).length > 0 ? (
              Object.entries(speechMetrics.fillerWordDetails).slice(0, 3).map(([word, count]) => (
                <span key={word} className="px-1.5 py-0.2 rounded bg-tertiary-fixed/30 text-on-tertiary-fixed-variant font-mono">
                  "{word}" ×{count}
                </span>
              ))
            ) : (
              <span className="text-secondary font-medium">Clean delivery (No filler words)</span>
            )}
          </div>
        </div>

        {/* Real-Time STAR Concept Coverage */}
        <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col justify-between col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
              Real-Time Architectural Rubric Checklist
            </span>
            <span className="text-[10px] text-secondary font-bold">Auto-detected as you speak</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-1.5">
            <div className={`p-1.5 rounded flex items-center gap-1.5 text-xs font-semibold ${
              speechMetrics.rubricCoverage.context ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-outline'
            }`}>
              <span className="material-symbols-outlined text-[14px]">
                {speechMetrics.rubricCoverage.context ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span>Problem Context</span>
            </div>

            <div className={`p-1.5 rounded flex items-center gap-1.5 text-xs font-semibold ${
              speechMetrics.rubricCoverage.architecture ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-outline'
            }`}>
              <span className="material-symbols-outlined text-[14px]">
                {speechMetrics.rubricCoverage.architecture ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span>Architecture</span>
            </div>

            <div className={`p-1.5 rounded flex items-center gap-1.5 text-xs font-semibold ${
              speechMetrics.rubricCoverage.metrics ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-outline'
            }`}>
              <span className="material-symbols-outlined text-[14px]">
                {speechMetrics.rubricCoverage.metrics ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span>SLAs &amp; Metrics</span>
            </div>

            <div className={`p-1.5 rounded flex items-center gap-1.5 text-xs font-semibold ${
              speechMetrics.rubricCoverage.tradeoffs ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-outline'
            }`}>
              <span className="material-symbols-outlined text-[14px]">
                {speechMetrics.rubricCoverage.tradeoffs ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span>Trade-offs</span>
            </div>
          </div>
          <span className="text-[10px] text-outline mt-1 truncate">
            Target: articulate clear architectural boundaries, state machine trade-offs, and latency bounds.
          </span>
        </div>
      </div>
    </div>
  );
};
