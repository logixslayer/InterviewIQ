import {
  normalizeSessionRecord,
  filterSessionsByTimeRange,
  calculateMetrics,
  calculateStreakAndActiveDays,
  calculateTrajectoryPoints,
  calculateCompetencies,
  generatePracticeHeatmap,
  deriveDiagnostics,
  deriveRecommendation,
} from '../src/services/progressAnalytics';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    process.exit(1);
  }
}

console.log('🧪 Starting Progress Analytics Test Suite...');

// -------------------------------------------------------------------------
// TEST 1: Empty Sessions Handling (0 sessions)
// -------------------------------------------------------------------------
{
  const emptySessions: any[] = [];
  const { currentPeriod, priorPeriod } = filterSessionsByTimeRange(emptySessions, '30days');
  assert(currentPeriod.length === 0, 'Current period should have 0 sessions');
  assert(priorPeriod.length === 0, 'Prior period should have 0 sessions');

  const metrics = calculateMetrics(currentPeriod, priorPeriod, '30days', null);
  assert(metrics.totalSessions === 0, 'Total sessions should be 0');
  assert(metrics.evaluatedSessionsCount === 0, 'Evaluated count should be 0');
  assert(metrics.averageScore === null, 'Average score should be null when 0 sessions');
  assert(metrics.readinessIndex === null, 'Readiness index should be null when 0 sessions');
  assert(metrics.readinessStatus === 'Needs Baseline', 'Readiness status should be Needs Baseline');
  assert(metrics.currentStreakDays === 0, 'Streak should be 0');

  const trajectory = calculateTrajectoryPoints(currentPeriod);
  assert(trajectory.length === 0, 'Trajectory should be empty when 0 sessions');

  const competencies = calculateCompetencies(currentPeriod);
  assert(competencies.length === 5, 'Should have 5 standard competencies');
  for (const c of competencies) {
    assert(c.percentage === null, `Competency ${c.name} percentage should be null when unassessed`);
    assert(c.status === 'Not Evaluated', `Competency ${c.name} status should be Not Evaluated`);
    assert(c.evaluationsCount === 0, `Competency ${c.name} count should be 0`);
  }

  const diagnostics = deriveDiagnostics(currentPeriod);
  assert(!diagnostics.hasData, 'Diagnostics should have hasData false when 0 sessions');

  const rec = deriveRecommendation(currentPeriod, competencies, null);
  assert(rec.title.includes('Calibration Round'), 'Recommendation should suggest Baseline calibration');

  console.log('✅ TEST 1 Passed: Empty state handled gracefully.');
}

// -------------------------------------------------------------------------
// TEST 2: Single Evaluated Session
// -------------------------------------------------------------------------
{
  const now = new Date('2026-10-24T12:00:00Z');
  const session1 = normalizeSessionRecord(
    {
      sessionId: 'sess-1',
      role: 'Frontend Developer',
      type: 'Technical',
      createdAt: '2026-10-24T10:00:00Z',
      score: 82,
      duration: '45 mins',
      report: {
        keyStrengths: ['Clear React lifecycle analysis'],
        growthAreas: ['Add concrete latency numbers'],
      },
    },
    0
  );

  const sessions = [session1];
  const { currentPeriod, priorPeriod } = filterSessionsByTimeRange(sessions, '30days', now);
  const metrics = calculateMetrics(currentPeriod, priorPeriod, '30days', null, now);

  assert(metrics.totalSessions === 1, 'Total sessions should be 1');
  assert(metrics.evaluatedSessionsCount === 1, 'Evaluated sessions should be 1');
  assert(metrics.averageScore === 82, 'Average score should be 82');
  assert(typeof metrics.readinessIndex === 'number', 'Readiness index should be calculated');
  assert(metrics.readinessIndex! >= 60, 'Readiness index should be reasonable');
  assert(metrics.currentStreakDays === 1, 'Streak should be 1 day (today)');
  assert(metrics.totalDurationMinutes === 45, 'Duration should be 45 minutes');

  const trajectory = calculateTrajectoryPoints(currentPeriod);
  assert(trajectory.length === 1, 'Trajectory should have 1 point');
  assert(trajectory[0].score === 82, 'Trajectory point score should be 82');
  assert(trajectory[0].x === 300, 'Single point should be centered in chart (x=300)');

  const diagnostics = deriveDiagnostics(currentPeriod);
  assert(diagnostics.hasData, 'Diagnostics should have data');
  assert(diagnostics.topStrengths.length > 0, 'Should have strengths');
  assert(diagnostics.focusAreas.length > 0, 'Should have focus areas');

  console.log('✅ TEST 2 Passed: Single evaluated session handled accurately.');
}

// -------------------------------------------------------------------------
// TEST 3: Multi-Session Chronological & Time Range Filtering
// -------------------------------------------------------------------------
{
  const now = new Date('2026-10-24T12:00:00Z');
  const d3Ago = new Date(now.getTime() - 3 * 86400 * 1000).toISOString();
  const d10Ago = new Date(now.getTime() - 10 * 86400 * 1000).toISOString();
  const d45Ago = new Date(now.getTime() - 45 * 86400 * 1000).toISOString(); // Outside 30 days, inside 90 days

  const s1 = normalizeSessionRecord(
    {
      sessionId: 's-old',
      role: 'Full Stack',
      createdAt: d45Ago,
      score: 70,
      duration: '40 mins',
      turns: [
        { evaluation: { rubricScores: { technicalAccuracy: 70, architectureDepth: 68 } } }
      ]
    },
    0
  );

  const s2 = normalizeSessionRecord(
    {
      sessionId: 's-mid',
      role: 'Frontend Developer',
      createdAt: d10Ago,
      score: 76,
      duration: '50 mins',
      turns: [
        { evaluation: { rubricScores: { technicalAccuracy: 78, architectureDepth: 74 } } }
      ]
    },
    1
  );

  const s3 = normalizeSessionRecord(
    {
      sessionId: 's-recent',
      role: 'Frontend Developer',
      createdAt: d3Ago,
      score: 84,
      duration: '60 mins',
      turns: [
        { evaluation: { rubricScores: { technicalAccuracy: 88, communicationDelivery: 82 } } }
      ]
    },
    2
  );

  const allSessions = [s1, s2, s3];

  // 30 days filter should include s2 and s3 (2 sessions)
  const filter30 = filterSessionsByTimeRange(allSessions, '30days', now);
  assert(filter30.currentPeriod.length === 2, '30 days should contain 2 sessions');
  assert(filter30.priorPeriod.length === 1, 'Prior 30 days window should contain s1 (45 days ago)');

  const metrics30 = calculateMetrics(filter30.currentPeriod, filter30.priorPeriod, '30days', null, now);
  assert(metrics30.averageScore === 80, `Average score should be (76+84)/2 = 80, got ${metrics30.averageScore}`);
  assert(metrics30.scoreChangeVsPrior === 10, `Score change vs prior should be 80 - 70 = +10, got ${metrics30.scoreChangeVsPrior}`);

  // Quarter filter should include all 3 sessions
  const filterQuarter = filterSessionsByTimeRange(allSessions, 'quarter', now);
  assert(filterQuarter.currentPeriod.length === 3, 'Quarter should contain all 3 sessions');
  const metricsQuarter = calculateMetrics(filterQuarter.currentPeriod, filterQuarter.priorPeriod, 'quarter', null, now);
  assert(metricsQuarter.totalSessions === 3, 'Total sessions in quarter should be 3');

  // Trajectory points should be ordered chronologically
  const trajectory = calculateTrajectoryPoints(filter30.currentPeriod);
  assert(trajectory.length === 2, 'Trajectory points should be 2');
  assert(trajectory[0].score === 76, 'First point should be older session (76)');
  assert(trajectory[1].score === 84, 'Second point should be newer session (84)');
  assert(trajectory[1].deltaFromBaseline === 8, 'Gain vs baseline should be +8');

  // Heatmap check
  const heatmap = generatePracticeHeatmap(allSessions, now, 8);
  assert(heatmap.rows.length === 7, 'Heatmap should have 7 day rows');
  assert(heatmap.totalDrills === 3, `Heatmap should record 3 total drills, got ${heatmap.totalDrills}`);

  console.log('✅ TEST 3 Passed: Multi-session calculations, trajectories, and heatmaps verified.');
}

// -------------------------------------------------------------------------
// TEST 4: Incomplete / Unevaluated Sessions and Edge Case Values
// -------------------------------------------------------------------------
{
  const now = new Date('2026-10-24T12:00:00Z');
  const incompleteSession = normalizeSessionRecord(
    {
      sessionId: 'sess-incomplete',
      role: 'Backend Developer',
      type: 'Technical',
      createdAt: null, // missing date
      duration: 'invalid-string',
      score: 0, // uncalibrated / incomplete
      turns: []
    },
    0
  );

  assert(!incompleteSession.isEvaluated, 'Session with score 0 should not be marked evaluated');
  assert(incompleteSession.score === null, 'Session with score 0 should have score normalized to null');
  assert(incompleteSession.status === 'In Progress', 'Session without score should be In Progress');
  assert(incompleteSession.durationMinutes === 30, 'Invalid duration should fall back gracefully to default');
  assert(!isNaN(incompleteSession.date.getTime()), 'Missing date should fall back to valid date');

  const { currentPeriod, priorPeriod } = filterSessionsByTimeRange([incompleteSession], '30days', now);
  const metrics = calculateMetrics(currentPeriod, priorPeriod, '30days', null, now);
  assert(metrics.totalSessions === 1, 'Total sessions should be 1');
  assert(metrics.evaluatedSessionsCount === 0, 'Evaluated sessions count should be 0');
  assert(metrics.averageScore === null, 'Average score should be null when no evaluated sessions exist');

  console.log('✅ TEST 4 Passed: Incomplete sessions and edge case inputs handled securely.');
}

// -------------------------------------------------------------------------
// TEST 5: Competency Thresholds and Filtering
// -------------------------------------------------------------------------
{
  const sessionHigh = normalizeSessionRecord(
    {
      sessionId: 's-high',
      role: 'Frontend Developer',
      type: 'Technical',
      score: 92,
      turns: [
        { evaluation: { rubricScores: { technicalAccuracy: 92, architectureDepth: 88, communicationDelivery: 80 } } },
        { evaluation: { rubricScores: { technicalAccuracy: 90, architectureDepth: 86 } } }
      ]
    },
    0
  );

  const compsSingle = calculateCompetencies([sessionHigh]);
  const syntaxSingle = compsSingle.find(c => c.id === 'syntax');
  assert(syntaxSingle !== undefined, 'Syntax competency should exist');
  assert(syntaxSingle!.percentage === 91, `Syntax percentage should be 91, got ${syntaxSingle?.percentage}`);
  assert(syntaxSingle!.status === 'Proficient', `Syntax status should be Proficient for 1 evaluation, got ${syntaxSingle?.status}`);

  // Adding a second high evaluation should elevate status to 'Mastered'
  const sessionHigh2 = normalizeSessionRecord(
    {
      sessionId: 's-high-2',
      role: 'Frontend Developer',
      type: 'Technical',
      score: 88,
      turns: [
        { evaluation: { rubricScores: { technicalAccuracy: 88 } } }
      ]
    },
    1
  );

  const compsDual = calculateCompetencies([sessionHigh, sessionHigh2]);
  const syntaxDual = compsDual.find(c => c.id === 'syntax');
  assert(syntaxDual!.percentage === 90, `Syntax average should be (91+88)/2 = 90, got ${syntaxDual?.percentage}`);
  assert(syntaxDual!.status === 'Mastered', `Syntax status should be Mastered for >=85 with >=2 evaluations, got ${syntaxDual?.status}`);

  const starComp = compsSingle.find(c => c.id === 'star');
  assert(starComp !== undefined, 'STAR competency should exist');
  assert(starComp!.percentage === null, 'STAR should be null when unassessed');
  assert(starComp!.status === 'Not Evaluated', 'STAR should be Not Evaluated');

  console.log('✅ TEST 5 Passed: Competency thresholds and unassessed status verified.');
}

console.log('🎉 All Progress Analytics Unit Tests Passed Successfully!');

