/**
 * InterviewIQ Real-Time Speech Recognition & Audio Stream Service
 *
 * Capabilities:
 * - Direct microphone capture via Web Speech API (webkitSpeechRecognition / SpeechRecognition)
 * - Decoupled Web Audio API volume visualizer stream (0 - 100)
 * - Deterministic, non-duplicating streaming transcript engine (interim + final)
 * - Resilient auto-restart across browser recognition pauses / silence events
 * - Configurable thinking pause / silence detection
 * - Error isolation and actionable permission recovery
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
  silenceThresholdMs?: number; // Time of continuous silence before auto-submission (default: 3000ms)
  minWordsForSilenceSubmit?: number; // Minimum words spoken before silence triggers completion (default: 4)
}

export class RealTimeSpeechService {
  private recognition: any = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  private isRunning = false;
  private accumulatedSessionFinals = '';
  private currentInstanceFinal = '';
  private currentInstanceInterim = '';

  private silenceTimer: any = null;
  private restartTimer: any = null;
  private options: Required<SpeechRecognitionOptions>;
  private callbacks: SpeechRecognitionCallbacks;
  private speechStartTime: number | null = null;

  constructor(callbacks: SpeechRecognitionCallbacks, options?: SpeechRecognitionOptions) {
    this.callbacks = callbacks;
    const defaultLang =
      options?.lang ||
      (typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US');

    this.options = {
      lang: defaultLang,
      continuous: options?.continuous ?? true,
      interimResults: options?.interimResults ?? true,
      silenceThresholdMs: options?.silenceThresholdMs ?? 5500,
      minWordsForSilenceSubmit: options?.minWordsForSilenceSubmit ?? 15,
    };
  }

  public static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  public setLanguage(lang: string) {
    this.options.lang = lang;
    if (this.recognition) {
      try {
        this.recognition.lang = lang;
      } catch {}
    }
  }

  public getLanguage(): string {
    return this.options.lang;
  }

  /**
   * Initializes audio analysis and microphone capture for visualizer meter (non-blocking)
   */
  private async initAudioStream(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

    // Check if media stream already active and has live audio track
    if (this.mediaStream) {
      const liveTracks = this.mediaStream.getAudioTracks().filter((t) => t.readyState === 'live');
      if (liveTracks.length > 0) {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          try {
            await this.audioContext.resume();
          } catch {}
        }
        return;
      }
    }

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
          try {
            await this.audioContext.resume();
          } catch {}
        }

        const source = this.audioContext.createMediaStreamSource(stream);
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.3;
        source.connect(analyser);
        this.analyser = analyser;

        this.startAudioMeter();
      }
    } catch (err: any) {
      console.warn('Audio meter initialization notice (speech recognition will still proceed):', err?.name || err);
    }
  }

  /**
   * Continuous volume level analyzer loop with RMS + Peak sensing
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
      let peak = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const val = dataArray[i];
        sum += val;
        if (val > peak) peak = val;
      }
      const avg = sum / dataArray.length;

      // Responsive composite formula (blend average + peak) scaled to 0-100
      const composite = (avg * 0.7 + peak * 0.3);
      const normalized = Math.min(100, Math.round((composite / 140) * 100));

      this.callbacks.onAudioLevel?.(normalized);

      // Reset silence evaluation whenever vocal sound energy is detected
      if (normalized > 6) {
        this.handleVoiceActivity();
      }

      this.animFrameId = requestAnimationFrame(checkLevel);
    };

    checkLevel();
  }

  private handleVoiceActivity() {
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

    // Auto-submit after silence only once candidate has articulated a substantial thought
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
   * Creates and starts a browser SpeechRecognition instance
   */
  private setupRecognitionInstance(): boolean {
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

    // Clean up any lingering previous instance before recreating
    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.abort();
      } catch {}
      this.recognition = null;
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
        let instanceFinal = '';
        let instanceInterim = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res[0]?.transcript || '';
          if (res.isFinal) {
            instanceFinal += text + ' ';
          } else {
            instanceInterim += text;
          }
        }

        this.currentInstanceFinal = instanceFinal;
        this.currentInstanceInterim = instanceInterim;

        const fullCurrent = this.getFullTranscript();

        if (fullCurrent.trim().length > 0 && !this.speechStartTime) {
          this.speechStartTime = Date.now();
        }

        // Notify UI with complete up-to-date live transcript
        this.callbacks.onInterimTranscript?.(fullCurrent, false);
        this.handleVoiceActivity();
        this.scheduleSilenceEvaluation();
      };

      recognition.onerror = (event: any) => {
        const errType = event?.error;
        console.warn('Speech recognition notice:', errType);

        if (errType === 'not-allowed') {
          this.callbacks.onError?.({
            code: 'permission_denied',
            message: 'Microphone access was denied. Click the lock/camera icon in your address bar to allow microphone permissions.',
            fatal: true,
          });
          this.stop();
        } else if (errType === 'audio-capture') {
          this.callbacks.onError?.({
            code: 'audio_capture',
            message: 'No microphone was detected. Please connect a microphone or use keyboard input.',
            fatal: true,
          });
          this.stop();
        } else if (errType === 'network') {
          this.callbacks.onError?.({
            code: 'network_error',
            message: 'Speech recognition network interrupted. Reconnecting or switch to keyboard input.',
            fatal: false,
          });
        } else if (errType === 'no-speech') {
          // Normal brief pause while candidate is thinking; schedule silence check
          this.scheduleSilenceEvaluation();
        }
      };

      recognition.onend = () => {
        // If turn is still active, commit finals and restart cleanly
        if (this.isRunning) {
          if (this.currentInstanceFinal.trim()) {
            this.accumulatedSessionFinals = (
              this.accumulatedSessionFinals + ' ' + this.currentInstanceFinal
            ).trim();
          }
          this.currentInstanceFinal = '';
          this.currentInstanceInterim = '';

          // 80ms debounce prevents InvalidStateError on Chrome/Edge
          if (this.restartTimer) clearTimeout(this.restartTimer);
          this.restartTimer = setTimeout(() => {
            if (this.isRunning) {
              this.setupRecognitionInstance();
            }
          }, 80);
        } else {
          this.callbacks.onStateChange?.('inactive');
        }
      };

      this.recognition = recognition;
      recognition.start();
      return true;
    } catch (err: any) {
      console.warn('Failed to start SpeechRecognition instance:', err);
      return false;
    }
  }

  /**
   * Starts listening and streaming transcription
   */
  public async start(): Promise<boolean> {
    if (this.isRunning) {
      this.stop();
    }

    // Clear turn buffers
    this.accumulatedSessionFinals = '';
    this.currentInstanceFinal = '';
    this.currentInstanceInterim = '';
    this.speechStartTime = null;
    this.isRunning = true;

    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    if (this.restartTimer) clearTimeout(this.restartTimer);

    // Resume or init audio level meter in background (non-blocking)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch {}
    }
    this.initAudioStream().catch(() => {});

    // Launch speech recognizer
    const started = this.setupRecognitionInstance();
    if (!started) {
      this.isRunning = false;
    }
    return started;
  }

  /**
   * Returns complete consolidated transcript (all finalized segments + current interim)
   */
  public getFullTranscript(): string {
    const combined = `${this.accumulatedSessionFinals} ${this.currentInstanceFinal} ${this.currentInstanceInterim}`.trim();
    // Normalize multiple spaces into single space
    return combined.replace(/\s+/g, ' ');
  }

  public getSpeakingDurationSeconds(): number {
    if (!this.speechStartTime) return 0;
    return Math.max(1, Math.round((Date.now() - this.speechStartTime) / 1000));
  }

  /**
   * Stops listening and returns finalized answer
   */
  public stop(): string {
    this.isRunning = false;

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onend = null;
        this.recognition.onerror = null;
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
      this.mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
    this.analyser = null;
  }
}


