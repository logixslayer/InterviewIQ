import assert from 'assert';
import { analyzeSpeech, aggregateSessionSpeech, computeCombinedMetrics } from '../src/services/speechAnalytics.js';

console.log('--- 1. Testing Filler Word Identification ---');

// Sentence with typical verbal hesitations
const sampleTranscript1 = 'Um, basically we designed a distributed cache, you know, to avoid latency bottlenecks, like, when users make queries.';
const result1 = analyzeSpeech(sampleTranscript1, 15);

console.log('Result 1:', {
  wordCount: result1.wordCount,
  fillerCount: result1.fillerCount,
  breakdown: result1.fillerBreakdown,
  wpm: result1.wpm,
  pacing: result1.pacingLabel,
});

assert(result1.fillerCount >= 4, 'Should detect at least 4 filler words (um, basically, you know, like)');
assert(result1.fillerBreakdown['um'] === 1, 'Should detect "um"');
assert(result1.fillerBreakdown['basically'] === 1, 'Should detect "basically"');
assert(result1.fillerBreakdown['you know'] === 1, 'Should detect "you know"');
console.log('✓ Filler word identification verified.');

console.log('\n--- 2. Testing Contextual "like" & Technical Terms Discrimination ---');
// "I like React" should NOT count as a filler word
const nonFillerSample = 'I like React components because they look like clean declarative state machines.';
const nonFillerResult = analyzeSpeech(nonFillerSample, 10);
assert.strictEqual(nonFillerResult.fillerBreakdown['like'] || 0, 0, '"like" used as comparison or verb should not be tagged as filler');

// "I used React to build the interface" should NOT count "used" or any term as filler
const technicalSample = 'I used React to build the interface with modular components and immutable state.';
const technicalResult = analyzeSpeech(technicalSample, 12);
assert.strictEqual(technicalResult.fillerCount, 0, 'Clean technical sentence should have 0 fillers');
console.log('✓ Contextual filtering & technical vocabulary verified.');

console.log('\n--- 3. Testing Hesitations: Erm, Hmm, Kind of, Sort of ---');
const hesitationSample = 'Erm, hmm, it was kind of tricky to sort of balance write availability and consensus.';
const hesitationResult = analyzeSpeech(hesitationSample, 14);
assert(hesitationResult.fillerBreakdown['erm'] === 1, 'Should detect "erm"');
assert(hesitationResult.fillerBreakdown['hmm'] === 1, 'Should detect "hmm"');
assert(hesitationResult.fillerBreakdown['kind of'] === 1, 'Should detect "kind of"');
assert(hesitationResult.fillerBreakdown['sort of'] === 1, 'Should detect "sort of"');
console.log('✓ Hesitation vocables (erm, hmm, kind of, sort of) verified.');

console.log('\n--- 4. Testing WPM & Cadence Pacing ---');
// 60 words in 30 seconds = 120 WPM (Optimal)
const words60 = Array(60).fill('architecture').join(' ');
const pacingResult = analyzeSpeech(words60, 30);
assert.strictEqual(pacingResult.wpm, 120, 'WPM should equal 120');
assert.strictEqual(pacingResult.pacingStatus, 'optimal', '120 WPM is optimal pacing');
console.log('✓ WPM & Pacing calculations verified.');

console.log('\n--- 5. Testing Multi-Turn Session Aggregation & Cumulative Persistence ---');
const turnA = analyzeSpeech('Um, we implemented a partitioned database cluster with Raft consensus.', 20);
const turnB = analyzeSpeech('Basically, you know, the p99 latency dropped by 45 percent after indexing.', 25);
const aggregated = aggregateSessionSpeech([turnA, turnB]);

console.log('Aggregated Session Speech:', aggregated);
assert(aggregated.totalWords > 20, 'Aggregated words calculated');
assert(aggregated.fillerWordsTotal >= 3, 'Aggregated fillers calculated');
assert(aggregated.averageWpm > 0, 'Average WPM calculated');
assert(typeof aggregated.pacingFeedback === 'string', 'Pacing feedback generated');

// Test that computeCombinedMetrics preserves session filler count when active transcript is empty (between turns)
const betweenTurnsMetrics = computeCombinedMetrics([turnA, turnB], undefined);
assert(betweenTurnsMetrics.fillerCount >= 3, 'Filler count must NOT reset to 0 between turns');
assert(betweenTurnsMetrics.totalWords > 20, 'Word count must be preserved between turns');
console.log('✓ Between-turns cumulative metrics persistence verified.');

console.log('\n========================================');
console.log('ALL SPEECH ANALYTICS UNIT TESTS PASSED');
console.log('========================================');

