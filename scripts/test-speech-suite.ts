import assert from 'assert';
import { analyzeSpeech, aggregateSessionSpeech } from '../src/services/speechAnalytics.js';

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

console.log('\n--- 2. Testing Contextual "like" Discrimination ---');
// "I like React" should NOT count as a filler word
const nonFillerSample = 'I like React components because they look like clean declarative state machines.';
const nonFillerResult = analyzeSpeech(nonFillerSample, 10);
assert.strictEqual(nonFillerResult.fillerBreakdown['like'] || 0, 0, '"like" used as comparison or verb should not be tagged as filler');
console.log('✓ Contextual filtering verified.');

console.log('\n--- 3. Testing WPM & Cadence Pacing ---');
// 60 words in 30 seconds = 120 WPM (Optimal)
const words60 = Array(60).fill('architecture').join(' ');
const pacingResult = analyzeSpeech(words60, 30);
assert.strictEqual(pacingResult.wpm, 120, 'WPM should equal 120');
assert.strictEqual(pacingResult.pacingStatus, 'optimal', '120 WPM is optimal pacing');
console.log('✓ WPM & Pacing calculations verified.');

console.log('\n--- 4. Testing Multi-Turn Session Aggregation ---');
const turnA = analyzeSpeech('Um, we implemented a partitioned database cluster with Raft consensus.', 20);
const turnB = analyzeSpeech('Basically, you know, the p99 latency dropped by 45 percent after indexing.', 25);
const aggregated = aggregateSessionSpeech([turnA, turnB]);

console.log('Aggregated Session Speech:', aggregated);
assert(aggregated.totalWords > 20, 'Aggregated words calculated');
assert(aggregated.fillerWordsTotal >= 3, 'Aggregated fillers calculated');
assert(aggregated.averageWpm > 0, 'Average WPM calculated');
assert(typeof aggregated.pacingFeedback === 'string', 'Pacing feedback generated');
console.log('✓ Session aggregation verified.');

console.log('\n========================================');
console.log('ALL SPEECH ANALYTICS UNIT TESTS PASSED');
console.log('========================================');
