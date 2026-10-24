/**
 * InterviewIQ Real-Time Speech Analytics Engine
 *
 * Provides real-time and post-turn analysis of candidate vocal delivery:
 * - Context-aware filler word identification ("um", "uh", "like", "you know", "actually", "basically", "I mean")
 * - Words per minute (WPM) and pacing calibration
 * - Hesitation and pause detection
 * - Aggregate delivery telemetry for evaluation reports
 */

export interface FillerWordRule {
  term: string;
  regex: RegExp;
  isContextual?: boolean;
}

// Configurable dictionary of conversational filler words with context-awareness
export const DEFAULT_FILLER_RULES: FillerWordRule[] = [
  // Hesitation vocables
  { term: 'um', regex: /(?:^|[,\s\.!?-])(um+)(?=[,\s\.!?-]|$)/gi },
  { term: 'uh', regex: /(?:^|[,\s\.!?-])(uh+|err?)(?=[,\s\.!?-]|$)/gi },
  { term: 'erm', regex: /(?:^|[,\s\.!?-])(erm+)(?=[,\s\.!?-]|$)/gi },
  { term: 'hmm', regex: /(?:^|[,\s\.!?-])(h+m+)(?=[,\s\.!?-]|$)/gi, isContextual: true },

  // Conversational hesitation phrases
  { term: 'you know', regex: /(?:^|[,\s])(you know)(?=[,\s\.!?-]|$)/gi },
  { term: 'I mean', regex: /(?:^|[,\s])(i mean)(?=[,\s\.!?-]|$)/gi },
  { term: 'kind of', regex: /(?:^|[,\s])(kind of|kinda)(?=[,\s\.!?-]|$)/gi },
  { term: 'sort of', regex: /(?:^|[,\s])(sort of)(?=[,\s\.!?-]|$)/gi },

  // Contextual fillers: "like", "basically", "actually"
  // "like" as filler:
  // - surrounded by punctuation: ", like,"
  // - at beginning of utterance followed by pause/clause: "^like, "
  // - followed by pronouns/hesitations: "like um", "like we", "like you know", "like basically"
  // Note: "I like React" or "looks like" is NOT matched!
  {
    term: 'like',
    regex: /(?:^|[,\s])like(?=[,\s]+(?:you know|uh|um|erm|hmm|i mean|so|we|i|it|the|yeah|when|how|what|really|\.\.\.|$|[,\.!?]))/gi,
    isContextual: true,
  },
  // "basically" as filler: at beginning of sentence or surrounded by punctuation/clause padding
  {
    term: 'basically',
    regex: /(?:^|[,\s])basically(?=[,\s]+(?:we|i|it|the|so|like|uh|um|you know|in|to|\.\.\.|$|[,\.!?]))/gi,
    isContextual: true,
  },
  // "actually" as filler: at beginning of sentence or surrounded by punctuation/hesitation
  {
    term: 'actually',
    regex: /(?:^|[,\s])actually(?=[,\s]+(?:we|i|it|the|so|like|uh|um|you know|\.\.\.|$|[,\.!?]))/gi,
    isContextual: true,
  },
];

export interface TurnSpeechMetrics {
  wordCount: number;
  durationSeconds: number;
  wpm: number;
  pacingStatus: 'slow' | 'optimal' | 'fast';
  pacingLabel: string;
  fillerCount: number;
  fillersPerMinute: number;
  fillerBreakdown: Record<string, number>;
  identifiedFillers: Array<{ word: string; count: number }>;
}

export interface CombinedSpeechMetrics {
  totalWords: number;
  totalDurationSeconds: number;
  wpm: number;
  pacingStatus: 'slow' | 'optimal' | 'fast';
  pacingLabel: string;
  fillerCount: number;
  fillersPerMinute: number;
  fillerBreakdown: Record<string, number>;
  identifiedFillers: Array<{ word: string; count: number }>;
}

/**
 * Analyzes a given transcript and duration to compute live or finalized speech telemetry.
 */
export function analyzeSpeech(
  transcript: string,
  durationSeconds: number,
  customRules: FillerWordRule[] = DEFAULT_FILLER_RULES
): TurnSpeechMetrics {
  const cleanText = transcript.trim();
  if (!cleanText) {
    return {
      wordCount: 0,
      durationSeconds,
      wpm: 0,
      pacingStatus: 'slow',
      pacingLabel: 'Silence / Waiting',
      fillerCount: 0,
      fillersPerMinute: 0,
      fillerBreakdown: {},
      identifiedFillers: [],
    };
  }

  // Count words
  const words = cleanText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Safe duration calculation (minimum 1 second to avoid divide-by-zero)
  const effectiveDuration = Math.max(1, durationSeconds);
  const minutes = effectiveDuration / 60;

  // WPM
  const wpm = Math.round(wordCount / minutes);

  // Pacing calibration (Standard tech interview optimal range is 120 - 165 WPM)
  let pacingStatus: 'slow' | 'optimal' | 'fast' = 'optimal';
  let pacingLabel = 'Optimal Pacing (120–160 WPM)';

  if (wpm < 110 && wordCount > 8) {
    pacingStatus = 'slow';
    pacingLabel = 'Deliberate / Slow Pace (<110 WPM)';
  } else if (wpm > 175 && wordCount > 15) {
    pacingStatus = 'fast';
    pacingLabel = 'Rapid Cadence (>175 WPM)';
  }

  // Analyze filler words
  const fillerBreakdown: Record<string, number> = {};
  let totalFillers = 0;

  for (const rule of customRules) {
    rule.regex.lastIndex = 0;
    const matches = [...cleanText.matchAll(rule.regex)];
    if (matches.length > 0) {
      fillerBreakdown[rule.term] = matches.length;
      totalFillers += matches.length;
    }
  }

  const fillersPerMinute = parseFloat((totalFillers / Math.max(0.2, minutes)).toFixed(1));

  const identifiedFillers = Object.entries(fillerBreakdown).map(([word, count]) => ({
    word,
    count,
  }));

  return {
    wordCount,
    durationSeconds: effectiveDuration,
    wpm,
    pacingStatus,
    pacingLabel,
    fillerCount: totalFillers,
    fillersPerMinute,
    fillerBreakdown,
    identifiedFillers,
  };
}

/**
 * Computes combined live and session speech metrics so filler count does not reset to 0
 * when the candidate is between turns.
 */
export function computeCombinedMetrics(
  turnsList: TurnSpeechMetrics[],
  activeTurnMetrics?: TurnSpeechMetrics
): CombinedSpeechMetrics {
  const completedWords = turnsList.reduce((acc, t) => acc + t.wordCount, 0);
  const completedSeconds = turnsList.reduce((acc, t) => acc + t.durationSeconds, 0);
  const completedFillers = turnsList.reduce((acc, t) => acc + t.fillerCount, 0);

  const activeWords = activeTurnMetrics ? activeTurnMetrics.wordCount : 0;
  const activeSeconds = activeTurnMetrics ? activeTurnMetrics.durationSeconds : 0;
  const activeFillers = activeTurnMetrics ? activeTurnMetrics.fillerCount : 0;

  const totalWords = completedWords + activeWords;
  const totalDurationSeconds = Math.max(1, completedSeconds + activeSeconds);
  const totalMinutes = Math.max(0.1, totalDurationSeconds / 60);

  const totalFillers = completedFillers + activeFillers;
  const fillersPerMinute = parseFloat((totalFillers / totalMinutes).toFixed(1));

  // Determine current active or overall WPM
  const wpm = activeTurnMetrics && activeTurnMetrics.wpm > 0
    ? activeTurnMetrics.wpm
    : Math.round(totalWords / totalMinutes);

  let pacingStatus: 'slow' | 'optimal' | 'fast' = 'optimal';
  let pacingLabel = 'Optimal Pacing (120–160 WPM)';

  if (wpm < 110 && totalWords > 8) {
    pacingStatus = 'slow';
    pacingLabel = 'Deliberate / Slow Pace (<110 WPM)';
  } else if (wpm > 175 && totalWords > 15) {
    pacingStatus = 'fast';
    pacingLabel = 'Rapid Cadence (>175 WPM)';
  }

  // Combine filler breakdown
  const combinedBreakdown: Record<string, number> = {};
  for (const t of turnsList) {
    for (const [w, c] of Object.entries(t.fillerBreakdown)) {
      combinedBreakdown[w] = (combinedBreakdown[w] || 0) + c;
    }
  }
  if (activeTurnMetrics) {
    for (const [w, c] of Object.entries(activeTurnMetrics.fillerBreakdown)) {
      combinedBreakdown[w] = (combinedBreakdown[w] || 0) + c;
    }
  }

  const identifiedFillers = Object.entries(combinedBreakdown).map(([word, count]) => ({
    word,
    count,
  }));

  return {
    totalWords,
    totalDurationSeconds,
    wpm,
    pacingStatus,
    pacingLabel,
    fillerCount: totalFillers,
    fillersPerMinute,
    fillerBreakdown: combinedBreakdown,
    identifiedFillers,
  };
}

/**
 * Aggregates speech telemetry across all turns in an interview session.
 */
export function aggregateSessionSpeech(turnsMetrics: TurnSpeechMetrics[]) {
  if (turnsMetrics.length === 0) {
    return {
      totalWords: 0,
      averageWpm: 0,
      fillerWordsTotal: 0,
      fillerWordsPerMinute: 0,
      fillerWordBreakdown: {},
      speakingDurationSeconds: 0,
      pacingFeedback: 'Candidate spoke clearly with conversational pacing.',
    };
  }

  const totalWords = turnsMetrics.reduce((sum, m) => sum + m.wordCount, 0);
  const totalSeconds = turnsMetrics.reduce((sum, m) => sum + m.durationSeconds, 0);
  const totalFillers = turnsMetrics.reduce((sum, m) => sum + m.fillerCount, 0);
  const totalMinutes = Math.max(0.1, totalSeconds / 60);

  const averageWpm = Math.round(totalWords / totalMinutes);
  const fillerWordsPerMinute = parseFloat((totalFillers / totalMinutes).toFixed(1));

  const combinedBreakdown: Record<string, number> = {};
  for (const m of turnsMetrics) {
    for (const [w, c] of Object.entries(m.fillerBreakdown)) {
      combinedBreakdown[w] = (combinedBreakdown[w] || 0) + c;
    }
  }

  let pacingFeedback = 'Strong delivery: conversational rhythm with low filler word density.';
  if (fillerWordsPerMinute > 4.5) {
    pacingFeedback = `Noticeable verbal fillers (${fillerWordsPerMinute}/min). Focus on pausing comfortably during pauses rather than using verbal padding.`;
  } else if (averageWpm > 175) {
    pacingFeedback = `High speaking cadence (${averageWpm} WPM). Practice intentional breathing and structured STAR bullet pacing.`;
  } else if (averageWpm < 105 && totalWords > 40) {
    pacingFeedback = `Measured delivery (${averageWpm} WPM). Good composure; ensure technical depth is fully articulated within session time limits.`;
  }

  return {
    totalWords,
    averageWpm,
    fillerWordsTotal: totalFillers,
    fillerWordsPerMinute,
    fillerWordBreakdown: combinedBreakdown,
    speakingDurationSeconds: totalSeconds,
    pacingFeedback,
  };
}

