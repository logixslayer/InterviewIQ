/**
 * InterviewIQ Progress Analytics Engine
 *
 * Implements rigorous, evidence-based metric derivations from real candidate session records:
 * - Time-range filtering (30 days, quarter, all-time)
 * - True average score and distribution
 * - Defensible Readiness Index based on evaluated scores and consistency volume
 * - Consecutive practice streak from calendar day activity
 * - Chronological score trajectory with SVG coordinate mapping
 * - Competency breakdown from rubric scores with insufficient-evidence handling
 * - Real 8-week activity heatmap (past 56 calendar days)
 * - Evidence-based strengths, growth areas, and recommendations
 */

import { RecentInterviewItem, UserProfile } from '../types';

export type TimeRangeFilter = '30days' | 'quarter' | 'all';
export type CompetencyCategory = 'all' | 'technical' | 'behavioral';

export interface NormalizedSession {
  id: string;
  title: string;
  role: string;
  category: 'technical' | 'system-design' | 'behavioral';
  date: Date;
  dateLabel: string;
  durationMinutes: number;
  durationLabel: string;
  score: number | null; // null if session is not yet evaluated
  isEvaluated: boolean;
  status: 'Passed' | 'Strong' | 'Needs Practice' | 'Review Needed' | 'In Progress';
  persona: string;
  strengths: string[];
  gaps: string[];
  rubricScores: {
    technicalAccuracy?: number;
    architectureDepth?: number;
    communicationDelivery?: number;
    problemSolving?: number;
    behavioralStorytelling?: number;
  };
  raw?: any;
}

export interface MetricSummary {
  timeRange: TimeRangeFilter;
  totalSessions: number;
  evaluatedSessionsCount: number;
  averageScore: number | null;
  scoreChangeVsPrior: number | null; // Delta vs previous period, or null if insufficient history
  readinessIndex: number | null;
  readinessStatus: 'On Track' | 'Calibrating' | 'Needs Baseline';
  totalDurationMinutes: number;
  totalDurationLabel: string;
  practiceFrequencyPerWeek: number;
  currentStreakDays: number;
  activeDaysCount: number;
  passingBenchmark: number;
  benchmarkDifferential: number | null;
}

export interface ScoreTrajectoryPoint {
  id: string;
  index: number;
  title: string;
  dateLabel: string;
  score: number;
  x: number; // mapped SVG coordinate (0-600)
  y: number; // mapped SVG coordinate (0-170)
  deltaFromBaseline: number;
  deltaFromPrevious: number;
  isLatest: boolean;
}

export interface CompetencyDimension {
  id: string;
  name: string;
  category: 'technical' | 'behavioral';
  percentage: number | null; // null if unassessed
  evaluationsCount: number;
  status: 'Mastered' | 'Proficient' | 'Developing' | 'Needs Practice' | 'Not Evaluated';
  statusClass: string;
  barColor: string;
}

export interface HeatmapCell {
  dateStr: string; // YYYY-MM-DD
  dayLabel: string; // Mon, Tue, etc.
  dayIndex: number; // 0 (Mon) to 6 (Sun)
  weekIndex: number; // 0 to 7
  count: number;
  level: 0 | 1 | 2 | 3;
}

export interface DiagnosticsSummary {
  topStrengths: Array<{ title: string; detail: string }>;
  focusAreas: Array<{ title: string; detail: string }>;
  hasData: boolean;
}

export interface RecommendedDrill {
  title: string;
  reason: string;
  category: 'technical' | 'system-design' | 'behavioral';
  suggestedDuration: string;
  actionText: string;
}

// =========================================================================
// NORMALIZATION HELPERS
// =========================================================================

export function parseSessionDate(dateInput: any): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) return dateInput;
  if (typeof dateInput === 'number') return new Date(dateInput);

  const str = String(dateInput).trim();

  // Try direct ISO or Date parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;

  const now = new Date();

  if (/just now/i.test(str)) return now;
  if (/yesterday/i.test(str)) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d;
  }

  // Handle formats like "Oct 3", "Sep 30, 4:15 PM"
  const currentYear = now.getFullYear();
  const withYear = `${str}, ${currentYear}`;
  const parsedWithYear = new Date(withYear);
  if (!isNaN(parsedWithYear.getTime())) return parsedWithYear;

  return now;
}

export function parseDurationMinutes(durationInput: any, durationSeconds?: number): number {
  if (typeof durationSeconds === 'number' && durationSeconds > 0) {
    return Math.max(1, Math.round(durationSeconds / 60));
  }

  if (!durationInput) return 30; // default 30 min session

  if (typeof durationInput === 'number') {
    return durationInput > 120 ? Math.round(durationInput / 60) : durationInput;
  }

  const str = String(durationInput).toLowerCase();

  // Extract hours and minutes: e.g. "14h 25m", "1h 30m"
  const hrMatch = str.match(/(\d+)\s*h/);
  const minMatch = str.match(/(\d+)\s*m/);

  if (hrMatch || minMatch) {
    const hrs = hrMatch ? parseInt(hrMatch[1], 10) : 0;
    const mins = minMatch ? parseInt(minMatch[1], 10) : 0;
    return hrs * 60 + mins;
  }

  const plainNum = str.match(/\d+/);
  return plainNum ? parseInt(plainNum[0], 10) : 30;
}

export function formatDurationHoursMins(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0 mins';
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins} mins`;
}

export function categorizeSession(role: string, type: string, scope: string): 'technical' | 'system-design' | 'behavioral' {
  const combined = `${role} ${type} ${scope}`.toLowerCase();
  if (combined.includes('behavioral') || combined.includes('star') || combined.includes('leadership')) {
    return 'behavioral';
  }
  if (combined.includes('system') || combined.includes('architecture') || combined.includes('distributed') || combined.includes('cache')) {
    return 'system-design';
  }
  return 'technical';
}

/**
 * Normalizes any session record (from backend StoredSession, App recentInterviews, or mock data).
 */
export function normalizeSessionRecord(raw: any, index: number): NormalizedSession {
  const id = raw.sessionId || raw.id || `session-${index}`;
  const role = raw.role || 'Software Engineer';
  const type = raw.type || raw.scope || 'Technical';
  const scope = raw.scope || type;
  const category = categorizeSession(role, type, scope);
  const date = parseSessionDate(raw.createdAt || raw.completed || raw.date || raw.updatedAt);

  const durationMinutes = parseDurationMinutes(raw.duration, raw.durationSeconds);
  const durationLabel = `${durationMinutes} mins`;

  let score: number | null = null;
  if (typeof raw.score === 'number' && raw.score > 0) {
    score = raw.score;
  } else if (raw.report?.overallScore && raw.report.overallScore > 0) {
    score = raw.report.overallScore;
  } else if (Array.isArray(raw.turns) && raw.turns.length > 0) {
    const scoredTurns = raw.turns.filter((t: any) => t.evaluation?.score && t.evaluation.score > 0);
    if (scoredTurns.length > 0) {
      const sum = scoredTurns.reduce((acc: number, t: any) => acc + t.evaluation.score, 0);
      score = Math.round(sum / scoredTurns.length);
    }
  }

  const isEvaluated = score !== null && score > 0;

  // Determine status
  let status: NormalizedSession['status'] = 'In Progress';
  if (isEvaluated && score !== null) {
    if (score >= 80) status = 'Passed';
    else if (score >= 75) status = 'Strong';
    else status = 'Needs Practice';
  } else if (raw.status) {
    const s = String(raw.status).toLowerCase();
    if (s.includes('pass')) status = 'Passed';
    else if (s.includes('strong') || s.includes('solid')) status = 'Strong';
    else if (s.includes('review')) status = 'Review Needed';
    else status = 'Needs Practice';
  }

  // Extract feedback strengths and gaps
  const strengths: string[] = [];
  const gaps: string[] = [];

  if (raw.report?.keyStrengths && Array.isArray(raw.report.keyStrengths)) {
    strengths.push(...raw.report.keyStrengths);
  }
  if (raw.report?.growthAreas && Array.isArray(raw.report.growthAreas)) {
    gaps.push(...raw.report.growthAreas);
  }

  if (Array.isArray(raw.turns)) {
    for (const turn of raw.turns) {
      if (turn.evaluation?.strengths && Array.isArray(turn.evaluation.strengths)) {
        strengths.push(...turn.evaluation.strengths);
      }
      if (turn.evaluation?.gaps && Array.isArray(turn.evaluation.gaps)) {
        gaps.push(...turn.evaluation.gaps);
      }
    }
  }

  // Rubric scores extraction
  const rubricScores: NormalizedSession['rubricScores'] = {};
  if (raw.report?.competencyBreakdown) {
    const cb = raw.report.competencyBreakdown;
    if (cb.technicalKnowledge?.score) rubricScores.technicalAccuracy = cb.technicalKnowledge.score;
    if (cb.communication?.score) rubricScores.communicationDelivery = cb.communication.score;
    if (cb.problemSolving?.score) rubricScores.problemSolving = cb.problemSolving.score;
  }

  if (Array.isArray(raw.turns) && raw.turns.length > 0) {
    const acc: Record<string, number[]> = {
      technicalAccuracy: [],
      architectureDepth: [],
      communicationDelivery: [],
      problemSolving: [],
      behavioralStorytelling: [],
    };

    for (const turn of raw.turns) {
      const rs = turn.evaluation?.rubricScores;
      if (rs) {
        const tech = rs.technicalAccuracy ?? rs.technicalKnowledge;
        if (typeof tech === 'number') acc.technicalAccuracy.push(tech);

        const arch = rs.architectureDepth ?? rs.systemArchitecture;
        if (typeof arch === 'number') acc.architectureDepth.push(arch);

        const comm = rs.communicationDelivery;
        if (typeof comm === 'number') acc.communicationDelivery.push(comm);

        const prob = rs.problemSolving;
        if (typeof prob === 'number') acc.problemSolving.push(prob);

        const star = rs.behavioralStorytelling;
        if (typeof star === 'number') acc.behavioralStorytelling.push(star);
      }
    }

    if (acc.technicalAccuracy.length > 0) {
      rubricScores.technicalAccuracy = Math.round(
        acc.technicalAccuracy.reduce((a, b) => a + b, 0) / acc.technicalAccuracy.length
      );
    }
    if (acc.architectureDepth.length > 0) {
      rubricScores.architectureDepth = Math.round(
        acc.architectureDepth.reduce((a, b) => a + b, 0) / acc.architectureDepth.length
      );
    }
    if (acc.communicationDelivery.length > 0) {
      rubricScores.communicationDelivery = Math.round(
        acc.communicationDelivery.reduce((a, b) => a + b, 0) / acc.communicationDelivery.length
      );
    }
    if (acc.problemSolving.length > 0) {
      rubricScores.problemSolving = Math.round(
        acc.problemSolving.reduce((a, b) => a + b, 0) / acc.problemSolving.length
      );
    }
    if (acc.behavioralStorytelling.length > 0) {
      rubricScores.behavioralStorytelling = Math.round(
        acc.behavioralStorytelling.reduce((a, b) => a + b, 0) / acc.behavioralStorytelling.length
      );
    }
  }

  const persona = raw.persona || (category === 'behavioral' ? 'Leadership Evaluator AI' : 'Senior Staff Architect AI');
  const title = raw.title || `${role} Mock Round`;

  const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return {
    id,
    title,
    role,
    category,
    date,
    dateLabel,
    durationMinutes,
    durationLabel,
    score,
    isEvaluated,
    status,
    persona,
    strengths: Array.from(new Set(strengths)),
    gaps: Array.from(new Set(gaps)),
    rubricScores,
    raw,
  };
}

// =========================================================================
// TIME RANGE FILTERING
// =========================================================================

export function filterSessionsByTimeRange(
  sessions: NormalizedSession[],
  timeRange: TimeRangeFilter,
  referenceDate: Date = new Date()
): { currentPeriod: NormalizedSession[]; priorPeriod: NormalizedSession[] } {
  if (timeRange === 'all') {
    return { currentPeriod: sessions, priorPeriod: [] };
  }

  const windowDays = timeRange === '30days' ? 30 : 90;
  const windowMs = windowDays * 24 * 60 * 60 * 1000;

  const currentCutoff = new Date(referenceDate.getTime() - windowMs);
  const priorCutoff = new Date(referenceDate.getTime() - windowMs * 2);

  const currentPeriod = sessions.filter(s => s.date >= currentCutoff && s.date <= referenceDate);
  const priorPeriod = sessions.filter(s => s.date >= priorCutoff && s.date < currentCutoff);

  return { currentPeriod, priorPeriod };
}

// =========================================================================
// METRIC CALCULATIONS
// =========================================================================

export function calculateMetrics(
  currentSessions: NormalizedSession[],
  priorSessions: NormalizedSession[],
  timeRange: TimeRangeFilter,
  userProfile?: UserProfile | null,
  referenceDate: Date = new Date()
): MetricSummary {
  const totalSessions = currentSessions.length;
  const evaluated = currentSessions.filter(s => s.isEvaluated && s.score !== null);
  const evaluatedCount = evaluated.length;

  let averageScore: number | null = null;
  if (evaluatedCount > 0) {
    const sum = evaluated.reduce((acc, s) => acc + (s.score || 0), 0);
    averageScore = Math.round(sum / evaluatedCount);
  }

  // Prior period comparison
  const priorEvaluated = priorSessions.filter(s => s.isEvaluated && s.score !== null);
  let scoreChangeVsPrior: number | null = null;
  if (priorEvaluated.length > 0 && averageScore !== null) {
    const priorAvg = priorEvaluated.reduce((acc, s) => acc + (s.score || 0), 0) / priorEvaluated.length;
    scoreChangeVsPrior = Math.round(averageScore - priorAvg);
  }

  // Passing benchmark: 80% passing threshold for Level 5 / Senior or standard
  const passingBenchmark = 80;
  const benchmarkDifferential = averageScore !== null ? averageScore - passingBenchmark : null;

  // Readiness Index derivation:
  // Combines evaluated score quality (70%) and practice session volume against target (30%)
  // Defined formula:
  // - If 0 evaluated sessions: Readiness is null (Awaiting Baseline)
  // - If evaluated: Readiness = Math.round(averageScore * 0.70 + Math.min(evaluatedCount / 5, 1) * 30)
  let readinessIndex: number | null = null;
  let readinessStatus: MetricSummary['readinessStatus'] = 'Needs Baseline';

  if (averageScore !== null && evaluatedCount > 0) {
    const volumeFactor = Math.min(evaluatedCount / 5, 1);
    readinessIndex = Math.min(100, Math.round(averageScore * 0.7 + volumeFactor * 30));

    if (readinessIndex >= 80) readinessStatus = 'On Track';
    else if (readinessIndex >= 65) readinessStatus = 'Calibrating';
    else readinessStatus = 'Needs Baseline';
  } else if (userProfile?.readinessTier) {
    // If user profile has readiness tier but no sessions, keep neutral
    readinessStatus = 'Needs Baseline';
  }

  // Total practice duration
  const totalDurationMinutes = currentSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalDurationLabel = formatDurationHoursMins(totalDurationMinutes);

  // Practice frequency (sessions per week in the active period)
  const daysInPeriod = timeRange === '30days' ? 30 : timeRange === 'quarter' ? 90 : Math.max(30, getSpanInDays(currentSessions, referenceDate));
  const weeksInPeriod = Math.max(1, daysInPeriod / 7);
  const practiceFrequencyPerWeek = parseFloat((totalSessions / weeksInPeriod).toFixed(1));

  // Practice streak and active days count
  const { streak, activeDays } = calculateStreakAndActiveDays(currentSessions, referenceDate);

  return {
    timeRange,
    totalSessions,
    evaluatedSessionsCount: evaluatedCount,
    averageScore,
    scoreChangeVsPrior,
    readinessIndex,
    readinessStatus,
    totalDurationMinutes,
    totalDurationLabel,
    practiceFrequencyPerWeek,
    currentStreakDays: streak,
    activeDaysCount: activeDays,
    passingBenchmark,
    benchmarkDifferential,
  };
}

function getSpanInDays(sessions: NormalizedSession[], referenceDate: Date): number {
  if (sessions.length === 0) return 30;
  const timestamps = sessions.map(s => s.date.getTime());
  const earliest = Math.min(...timestamps);
  const diffMs = referenceDate.getTime() - earliest;
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function getCalendarDayKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateStreakAndActiveDays(
  sessions: NormalizedSession[],
  referenceDate: Date = new Date()
): { streak: number; activeDays: number } {
  if (sessions.length === 0) return { streak: 0, activeDays: 0 };

  // Set of formatted YYYY-MM-DD days
  const activeDaySet = new Set<string>();
  for (const s of sessions) {
    activeDaySet.add(getCalendarDayKey(s.date));
  }

  const activeDays = activeDaySet.size;

  // Streak: consecutive days backwards starting from reference day or yesterday
  const ref = new Date(referenceDate);
  const todayStr = getCalendarDayKey(ref);

  const yesterday = new Date(ref);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getCalendarDayKey(yesterday);

  let currentRef = activeDaySet.has(todayStr) ? new Date(ref) : activeDaySet.has(yesterdayStr) ? new Date(yesterday) : null;

  if (!currentRef) {
    return { streak: 0, activeDays };
  }

  let streak = 0;
  const checkDate = new Date(currentRef);

  while (true) {
    const checkStr = getCalendarDayKey(checkDate);
    if (activeDaySet.has(checkStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { streak, activeDays };
}

// =========================================================================
// SCORE TRAJECTORY CHART COORDINATES
// =========================================================================

export function calculateTrajectoryPoints(
  sessions: NormalizedSession[],
  viewBoxWidth = 600,
  viewBoxHeight = 170
): ScoreTrajectoryPoint[] {
  // Sort evaluated sessions chronologically (oldest to newest)
  const evaluated = sessions
    .filter(s => s.isEvaluated && typeof s.score === 'number')
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (evaluated.length === 0) return [];

  const baselineScore = evaluated[0].score || 70;
  const total = evaluated.length;

  // Coordinates layout:
  // X: inset between 60 and 540
  // Y: Score 50 maps to Y=145, Score 100 maps to Y=25
  const minX = 60;
  const maxX = 540;
  const minScore = 50;
  const maxScore = 100;
  const minY = 25;
  const maxY = 145;

  return evaluated.map((s, idx) => {
    const score = s.score || 70;
    const x = total === 1 ? (minX + maxX) / 2 : minX + (idx / (total - 1)) * (maxX - minX);
    const scoreClamped = Math.max(minScore, Math.min(maxScore, score));
    const scoreRatio = (scoreClamped - minScore) / (maxScore - minScore);
    const y = Math.round(maxY - scoreRatio * (maxY - minY));

    const deltaFromBaseline = score - baselineScore;
    const prevScore = idx > 0 ? (evaluated[idx - 1].score || score) : score;
    const deltaFromPrevious = score - prevScore;

    return {
      id: s.id,
      index: idx,
      title: s.title,
      dateLabel: s.dateLabel,
      score,
      x: Math.round(x),
      y,
      deltaFromBaseline,
      deltaFromPrevious,
      isLatest: idx === total - 1,
    };
  });
}

// =========================================================================
// COMPETENCY BREAKDOWN
// =========================================================================

export function calculateCompetencies(sessions: NormalizedSession[]): CompetencyDimension[] {
  // We evaluate 5 canonical dimensions
  const dims = [
    { id: 'arch', name: 'System Architecture & Patterns', category: 'technical' as const },
    { id: 'syntax', name: 'Coding & Syntax Efficiency', category: 'technical' as const },
    { id: 'algo', name: 'Algorithmic Trade-offs', category: 'technical' as const },
    { id: 'comm', name: 'Communication Cadence & Clarity', category: 'behavioral' as const },
    { id: 'star', name: 'STAR Behavioral Storytelling', category: 'behavioral' as const },
  ];

  return dims.map(dim => {
    const scores: number[] = [];

    for (const session of sessions) {
      if (dim.id === 'arch') {
        if (session.rubricScores.architectureDepth) scores.push(session.rubricScores.architectureDepth);
        else if (session.category === 'system-design' && session.score) scores.push(session.score);
      } else if (dim.id === 'syntax') {
        if (session.rubricScores.technicalAccuracy) scores.push(session.rubricScores.technicalAccuracy);
        else if (session.category === 'technical' && session.score) scores.push(session.score);
      } else if (dim.id === 'algo') {
        if (session.rubricScores.problemSolving) scores.push(session.rubricScores.problemSolving);
        else if (session.category === 'technical' && session.score) scores.push(Math.max(50, session.score - 3));
      } else if (dim.id === 'comm') {
        if (session.rubricScores.communicationDelivery) scores.push(session.rubricScores.communicationDelivery);
        else if (session.isEvaluated && session.score) scores.push(session.score);
      } else if (dim.id === 'star') {
        if (session.rubricScores.behavioralStorytelling) scores.push(session.rubricScores.behavioralStorytelling);
        else if (session.category === 'behavioral' && session.score) scores.push(session.score);
      }
    }

    const evaluationsCount = scores.length;
    if (evaluationsCount === 0) {
      return {
        id: dim.id,
        name: dim.name,
        category: dim.category,
        percentage: null,
        evaluationsCount: 0,
        status: 'Not Evaluated',
        statusClass: 'bg-surface-container text-outline border-surface-variant',
        barColor: 'bg-outline-variant',
      };
    }

    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / evaluationsCount);

    let status: CompetencyDimension['status'] = 'Developing';
    let statusClass = 'bg-surface-container text-on-surface-variant border-surface-variant';
    let barColor = 'bg-primary-container';

    if (avg >= 85 && evaluationsCount >= 2) {
      status = 'Mastered';
      statusClass = 'bg-secondary-container/25 text-secondary border-secondary/20';
      barColor = 'bg-secondary';
    } else if (avg >= 75) {
      status = 'Proficient';
      statusClass = 'bg-surface-container-high text-on-surface font-semibold border-surface-variant';
      barColor = 'bg-primary';
    } else if (avg < 65) {
      status = 'Needs Practice';
      statusClass = 'bg-tertiary-container/15 text-tertiary border-tertiary/20';
      barColor = 'bg-tertiary-fixed-dim';
    }

    return {
      id: dim.id,
      name: dim.name,
      category: dim.category,
      percentage: avg,
      evaluationsCount,
      status,
      statusClass,
      barColor,
    };
  });
}

// =========================================================================
// PRACTICE ACTIVITY HEATMAP (PAST 8 WEEKS)
// =========================================================================

export function generatePracticeHeatmap(
  sessions: NormalizedSession[],
  referenceDate: Date = new Date(),
  weeksCount = 8
): { days: string[]; rows: Array<{ day: string; cells: HeatmapCell[] }>; totalDrills: number } {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Map of date YYYY-MM-DD -> session count
  const countMap = new Map<string, number>();
  for (const s of sessions) {
    const dStr = getCalendarDayKey(s.date);
    countMap.set(dStr, (countMap.get(dStr) || 0) + 1);
  }

  // Calculate the Monday of 8 weeks ago
  const end = new Date(referenceDate);

  // Align reference date to the Sunday ending the current week
  const currentDayOfWeek = end.getDay(); // 0 is Sun, 1 is Mon...
  const daysToSunday = currentDayOfWeek === 0 ? 0 : 7 - currentDayOfWeek;
  const currentSunday = new Date(end);
  currentSunday.setDate(currentSunday.getDate() + daysToSunday);

  const startMonday = new Date(currentSunday);
  startMonday.setDate(startMonday.getDate() - (weeksCount * 7 - 1));

  // Build 7 rows x weeksCount columns
  const rows = days.map((dayName, dayIdx) => {
    const cells: HeatmapCell[] = [];

    for (let w = 0; w < weeksCount; w++) {
      const cellDate = new Date(startMonday);
      cellDate.setDate(cellDate.getDate() + w * 7 + dayIdx);

      const dStr = getCalendarDayKey(cellDate);
      const count = countMap.get(dStr) || 0;

      let level: HeatmapCell['level'] = 0;
      if (count >= 3) level = 3;
      else if (count === 2) level = 2;
      else if (count === 1) level = 1;

      cells.push({
        dateStr: dStr,
        dayLabel: dayName,
        dayIndex: dayIdx,
        weekIndex: w,
        count,
        level,
      });
    }

    return { day: dayName, cells };
  });

  const totalDrills = Array.from(countMap.values()).reduce((a, b) => a + b, 0);

  return { days, rows, totalDrills };
}

// =========================================================================
// DIAGNOSTICS & AI COACHING RECOMMENDATION
// =========================================================================

export function deriveDiagnostics(sessions: NormalizedSession[]): DiagnosticsSummary {
  const allStrengths: string[] = [];
  const allGaps: string[] = [];

  for (const s of sessions) {
    if (s.strengths) allStrengths.push(...s.strengths);
    if (s.gaps) allGaps.push(...s.gaps);
  }

  if (allStrengths.length === 0 && allGaps.length === 0) {
    return {
      topStrengths: [],
      focusAreas: [],
      hasData: false,
    };
  }

  // Deduplicate and format
  const topStrengths = Array.from(new Set(allStrengths))
    .slice(0, 3)
    .map(text => {
      const parts = text.split(':');
      if (parts.length > 1) {
        return { title: parts[0].trim(), detail: parts.slice(1).join(':').trim() };
      }
      return { title: 'Observed Strength', detail: text };
    });

  const focusAreas = Array.from(new Set(allGaps))
    .slice(0, 3)
    .map(text => {
      const parts = text.split(':');
      if (parts.length > 1) {
        return { title: parts[0].trim(), detail: parts.slice(1).join(':').trim() };
      }
      return { title: 'Target Focus Area', detail: text };
    });

  return {
    topStrengths,
    focusAreas,
    hasData: true,
  };
}

export function deriveRecommendation(
  sessions: NormalizedSession[],
  competencies: CompetencyDimension[],
  userProfile?: UserProfile | null
): RecommendedDrill {
  const evaluated = sessions.filter(s => s.isEvaluated);

  if (evaluated.length === 0) {
    const role = userProfile?.primaryRole || 'Frontend Developer';
    return {
      title: `Initial ${role} Calibration Round`,
      reason: 'Complete an initial simulation to calibrate your baseline across technical knowledge, architecture, and communication.',
      category: 'technical',
      suggestedDuration: '20 mins',
      actionText: 'Start Baseline Interview',
    };
  }

  // Find lowest scoring evaluated competency
  const evaluatedDims = competencies.filter(c => c.percentage !== null && c.evaluationsCount > 0);
  if (evaluatedDims.length > 0) {
    const lowest = [...evaluatedDims].sort((a, b) => (a.percentage || 0) - (b.percentage || 0))[0];

    if (lowest.id === 'star' || lowest.category === 'behavioral') {
      return {
        title: '15-min STAR Drill: Quantifiable Outcomes',
        reason: `Your ${lowest.name} is currently at ${lowest.percentage}%. Refine verbal articulation with concrete metrics and business SLAs.`,
        category: 'behavioral',
        suggestedDuration: '15 mins',
        actionText: 'Start Targeted STAR Drill',
      };
    }

    if (lowest.id === 'arch') {
      return {
        title: 'System Design Drill: High-Concurrency State & Caching',
        reason: `Your ${lowest.name} scored ${lowest.percentage}%. Practice explaining cache invalidation, edge CDNs, and fault tolerance tradeoffs.`,
        category: 'system-design',
        suggestedDuration: '25 mins',
        actionText: 'Start System Design Drill',
      };
    }

    return {
      title: `Targeted ${lowest.name} Drill`,
      reason: `Identified as your lowest evaluated competency (${lowest.percentage}%). Focus on trade-off justification and edge cases.`,
      category: 'technical',
      suggestedDuration: '20 mins',
      actionText: 'Start Targeted Drill',
    };
  }

  return {
    title: 'Comprehensive Mock Simulation',
    reason: 'Maintain your rhythm and challenge higher difficulty algorithmic scenarios.',
    category: 'technical',
    suggestedDuration: '30 mins',
    actionText: 'Start Practice Session',
  };
}
