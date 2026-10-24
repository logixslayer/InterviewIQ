/**
 * InterviewIQ Real-Time Speech Recognition & Audio Stream Service
 *
 * Capabilities:
 * - Direct microphone capture via Web Audio API & Web Speech API
 * - Incremental streaming transcription with interim partial results
 * - Live audio level / volume visualizer stream (0 - 100)
 * - Intelligent turn-taking silence detection with configurable thinking pause grace period
 * - Resilience against automatic browser recognizer disconnects
 * - Actionable permission and error recovery
 */

export interface SpeechRecognitionCallbacks {
  onInterimTranscript?: (text: string, isFinal: boolean) => void;
  onFinalTranscript?: (text: string) => void;
  onAudioLevel?: (level: number) => void; // 0 - 100 RMS volume
  onSilenceTimeout?: (finalText: string) => void; // Triggered when candidate finishes answer
  onError?: (error: { code: string; message: string; fatal: boolean }) => void;
  onStateChange?: (state: 'inactive' | 'listening' | 'speaking' | 'paused') => void;
}

export interface SpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  silenceThresholdMs?: number; // Time of continuous silence before auto-submission in continuous mode (default: 2800ms)
  minWordsForSilenceSubmit?: number; // Minimum words spoken before silence triggers completion (default: 4)
}

export class RealTimeSpeechService {
  private recognition: any = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  private isRunning = false;
  private isSpeaking = false;
  private finalTranscriptAccumulated = '';
  private currentInterim = '';

  private silenceTimer: any = null;
  private options: Required<SpeechRecognitionOptions>;
  private callbacks: SpeechRecognitionCallbacks;
  private speechStartTime: number | null = null;
  private wordCountAtLastCheck = 0;

  constructor(callbacks: SpeechRecognitionCallbacks, options?: SpeechRecognitionOptions) {
    this.callbacks = callbacks;
    this.options = {
      lang: options?.lang || 'en-US',
      continuous: options?.continuous ?? true,
      interimResults: options?.interimResults ?? true,
      silenceThresholdMs: options?.silenceThresholdMs ?? 2800,
      minWordsForSilenceSubmit: options?.minWordsForSilenceSubmit ?? 4,
    };
  }

  public static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  /**
   * Initializes audio analysis and microphone capture
   */
  private async initAudioStream(): Promise<boolean> {
    if (this.mediaStream) return true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.mediaStream = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        const source = this.audioContext.createMediaStreamSource(stream);
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.4;
        source.connect(analyser);
        this.analyser = analyser;

        this.startAudioMeter();
      }
      return true;
    } catch (err: any) {
      console.warn('Microphone audio stream notice:', err?.name || err);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        this.callbacks.onError?.({
          code: 'permission_denied',
          message: 'Microphone permission was denied. Please allow microphone access in your browser address bar to speak.',
          fatal: true,
        });
      } else {
        this.callbacks.onError?.({
          code: 'mic_unavailable',
          message: 'Microphone is unavailable or in use by another application.',
          fatal: false,
        });
      }
      return false;
    }
  }

  /**
   * Continuous volume level analyzer loop
   */
  private startAudioMeter() {
    if (!this.analyser) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const checkLevel = () => {
      if (!this.isRunning || !this.analyser) {
        this.callbacks.onAudioLevel?.(0);
        return;
      }

      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      // Scale 0 - 100 with non-linear boost for soft voices
      const normalized = Math.min(100, Math.round((avg / 128) * 100));

      this.callbacks.onAudioLevel?.(normalized);

      // If voice volume is active, reset silence timer if candidate has spoken
      if (normalized > 12) {
        this.handleVoiceActivity();
      }

      this.animFrameId = requestAnimationFrame(checkLevel);
    };

    checkLevel();
  }

  private handleVoiceActivity() {
    // If silence timer was ticking, reset it because candidate is still articulating
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private scheduleSilenceEvaluation() {
    if (!this.isRunning) return;
    if (this.silenceTimer) clearTimeout(this.silenceTimer);

    const fullText = this.getFullTranscript();
    const words = fullText.trim().split(/\s+/).filter(Boolean);

    // Only auto-submit if candidate has spoken a meaningful answer
    if (words.length >= this.options.minWordsForSilenceSubmit) {
      this.silenceTimer = setTimeout(() => {
        if (!this.isRunning) return;
        const finalAns = this.getFullTranscript().trim();
        if (finalAns.split(/\s+/).filter(Boolean).length >= this.options.minWordsForSilenceSubmit) {
          this.callbacks.onSilenceTimeout?.(finalAns);
        }
      }, this.options.silenceThresholdMs);
    }
  }

  /**
   * Starts listening and streaming transcription
   */
  public async start(): Promise<boolean> {
    if (this.isRunning) return true;

    // Reset accumulated buffers for new turn
    this.finalTranscriptAccumulated = '';
    this.currentInterim = '';
    this.speechStartTime = null;

    // Ensure mic stream is initialized
    const micReady = await this.initAudioStream();
    if (!micReady) return false;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.callbacks.onError?.({
        code: 'not_supported',
        message: 'Speech recognition is not natively supported in this browser. Please use Chrome, Edge, or Brave.',
        fatal: true,
      });
      return false;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = this.options.continuous;
      recognition.interimResults = this.options.interimResults;
      recognition.lang = this.options.lang;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        this.isRunning = true;
        this.callbacks.onStateChange?.('listening');
      };

      recognition.onresult = (event: any) => {
        let interimStr = '';
        let newlyFinalized = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const transcript = res[0]?.transcript || '';

          if (res.isFinal) {
            newlyFinalized += transcript + ' ';
          } else {
            interimStr += transcript;
          }
        }

        if (newlyFinalized) {
          this.finalTranscriptAccumulated += newlyFinalized;
          this.currentInterim = '';
        } else {
          this.currentInterim = interimStr;
        }

        const fullCurrent = this.getFullTranscript();

        if (fullCurrent.trim().length > 0 && !this.speechStartTime) {
          this.speechStartTime = Date.now();
        }

        // Notify UI of live interim text
        this.callbacks.onInterimTranscript?.(fullCurrent, false);
        this.handleVoiceActivity();
        this.scheduleSilenceEvaluation();
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event notice:', event?.error);
        if (event?.error === 'not-allowed') {
          this.callbacks.onError?.({
            code: 'permission_denied',
            message: 'Microphone access was denied. Please allow microphone permissions to speak.',
            fatal: true,
          });
          this.stop();
        } else if (event?.error === 'no-speech') {
          // Normal brief silence, do not error out
          this.scheduleSilenceEvaluation();
        }
      };

      recognition.onend = () => {
        // If still supposed to be running (e.g. browser paused after brief pause), auto-restart
        if (this.isRunning) {
          try {
            recognition.start();
          } catch {
            // Already started or restarting
          }
        }
      };

      this.recognition = recognition;
      recognition.start();
      this.isRunning = true;
      return true;
    } catch (err: any) {
      console.warn('Recognition start exception:', err);
      this.isRunning = false;
      return false;
    }
  }

  /**
   * Returns complete consolidated transcript (finalized + current interim)
   */
  public getFullTranscript(): string {
    const combined = `${this.finalTranscriptAccumulated} ${this.currentInterim}`.trim();
    // Normalize multi-spaces
    return combined.replace(/\s+/g, ' ');
  }

  public getSpeakingDurationSeconds(): number {
    if (!this.speechStartTime) return 0;
    return Math.max(1, Math.round((Date.now() - this.speechStartTime) / 1000));
  }

  /**
   * Stops listening and cleans up streams
   */
  public stop(): string {
    this.isRunning = false;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }

    this.callbacks.onAudioLevel?.(0);
    this.callbacks.onStateChange?.('inactive');

    const finalAnswer = this.getFullTranscript();
    this.callbacks.onFinalTranscript?.(finalAnswer);
    return finalAnswer;
  }

  /**
   * Complete release of audio devices (e.g. on unmount or session exit)
   */
  public destroy() {
    this.stop();

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
  }
}
