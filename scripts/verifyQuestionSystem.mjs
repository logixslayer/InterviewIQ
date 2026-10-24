/**
 * Automated Verification Script for InterviewIQ Question Bank & Learning System
 * Tests all requirements from Section 24 & 25 of Master Build Prompt.
 */

import { ALL_QUESTIONS, QUESTIONS_BY_ID, getQuestionById } from '../src/data/questionBank/index.ts';
import { ROLE_CATEGORIES, TOPIC_CATEGORIES, ROLE_LEARNING_PATHS } from '../src/data/taxonomy.ts';
import {
  getRelatedQuestions,
  getContinueLearningQuestions,
  getStrengthenFundamentals,
  getRecommendedForRole,
  searchAndFilterQuestions,
  scoreQuestionRelevance,
} from '../src/services/questionService.ts';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('--- 1. QUESTION BANK VOLUME & SCHEMA INTEGRITY ---');
assert(ALL_QUESTIONS.length >= 40, `Question bank has ${ALL_QUESTIONS.length} high-depth questions (>= 40)`);
assert(QUESTIONS_BY_ID.size === ALL_QUESTIONS.length, 'All question IDs are unique and mapped in QUESTIONS_BY_ID');

for (const q of ALL_QUESTIONS) {
  assert(q.id && q.title && q.shortAnswer && q.detailedAnswer, `Question ${q.id} has valid title, shortAnswer, and detailedAnswer`);
  assert(q.difficulty === 'Easy' || q.difficulty === 'Medium' || q.difficulty === 'Hard', `Question ${q.id} has valid difficulty: ${q.difficulty}`);
  assert(Array.isArray(q.roleIds) && q.roleIds.length > 0, `Question ${q.id} has assigned roleIds`);
  assert(Boolean(q.categoryId), `Question ${q.id} has valid categoryId`);
}

console.log('\n--- 2. ROLE BEHAVIOR & TAXONOMY COVERAGE ---');
assert(ROLE_CATEGORIES.length >= 8, `Role taxonomy covers ${ROLE_CATEGORIES.length} categories (>= 8)`);
const totalRoles = ROLE_CATEGORIES.reduce((acc, cat) => acc + cat.roles.length, 0);
assert(totalRoles >= 45, `Total defined engineering roles is ${totalRoles} (>= 45)`);

const feQuestions = searchAndFilterQuestions(ALL_QUESTIONS, { selectedRole: 'Frontend Developer' });
assert(feQuestions.length >= 8, `Frontend Developer has ${feQuestions.length} relevant questions (>= 8)`);

const beQuestions = searchAndFilterQuestions(ALL_QUESTIONS, { selectedRole: 'Backend Developer' });
assert(beQuestions.length >= 6, `Backend Developer has ${beQuestions.length} relevant questions (>= 6)`);

const fsQuestions = searchAndFilterQuestions(ALL_QUESTIONS, { selectedRole: 'Full Stack Developer' });
assert(fsQuestions.length >= 8, `Full Stack Developer has ${fsQuestions.length} relevant questions (>= 8)`);

console.log('\n--- 3. MULTI-FIELD SEARCH & COMPOUND FILTERS ---');
// Search by technology
const reactSearch = searchAndFilterQuestions(ALL_QUESTIONS, { searchQuery: 'React hooks' });
assert(reactSearch.length >= 3, `Search 'React hooks' returns ${reactSearch.length} questions`);

const sqlSearch = searchAndFilterQuestions(ALL_QUESTIONS, { searchQuery: 'SQL joins' });
assert(sqlSearch.length >= 1, `Search 'SQL joins' returns ${sqlSearch.length} questions`);

const dockerSearch = searchAndFilterQuestions(ALL_QUESTIONS, { searchQuery: 'Docker' });
assert(dockerSearch.length >= 1, `Search 'Docker' returns ${dockerSearch.length} questions`);

// Combined Search + Difficulty filter
const hardSearch = searchAndFilterQuestions(ALL_QUESTIONS, {
  selectedRole: 'Frontend Developer',
  selectedDifficulty: 'Hard',
});
assert(hardSearch.length >= 2, `Frontend Hard filter returns ${hardSearch.length} questions`);
assert(hardSearch.every(q => q.difficulty === 'Hard'), 'All returned questions have Hard difficulty');

console.log('\n--- 4. INTELLIGENT RELATED-QUESTION RECOMMENDATION ENGINE ---');
// Test fe-1 (useEffect vs useLayoutEffect)
const qFe1 = getQuestionById('fe-1');
assert(Boolean(qFe1), 'fe-1 (useEffect) exists');
const fe1Related = getRelatedQuestions(qFe1, ALL_QUESTIONS, { activeRole: 'Frontend Developer', limit: 3 });
assert(fe1Related.length === 3, 'fe-1 returns 3 related questions');
assert(!fe1Related.some(r => r.id === 'fe-1'), 'Recommendations strictly exclude source question fe-1');
assert(fe1Related.some(r => r.id === 'fe-3' || r.id === 'fe-4'), 'fe-1 suggests closely linked React rendering/state concepts');

// Test db-1 (Composite Indexes)
const qDb1 = getQuestionById('db-1');
assert(Boolean(qDb1), 'db-1 (Indexes) exists');
const db1Related = getRelatedQuestions(qDb1, ALL_QUESTIONS, { activeRole: 'Backend Developer', limit: 3 });
assert(!db1Related.some(r => r.id === 'db-1'), 'db-1 recommendations exclude self');
assert(db1Related.some(r => r.id === 'db-2' || r.id === 'db-3'), 'db-1 suggests database isolation/storage engine questions');

// Test devops-1 (Docker Multi-stage)
const qDevOps1 = getQuestionById('devops-1');
assert(Boolean(qDevOps1), 'devops-1 exists');
const devops1Related = getRelatedQuestions(qDevOps1, ALL_QUESTIONS, { activeRole: 'DevOps Engineer', limit: 3 });
assert(!devops1Related.some(r => r.id === 'devops-1'), 'devops-1 recommendations exclude self');
assert(devops1Related.some(r => r.id === 'devops-2' || r.id === 'devops-3'), 'devops-1 suggests Kubernetes or CI/CD deployment questions');

console.log('\n--- 5. LEARNING PATH INTEGRITY ---');
assert(Boolean(ROLE_LEARNING_PATHS['frontend-dev']), 'Frontend Developer learning path exists');
assert(ROLE_LEARNING_PATHS['frontend-dev'].stages.length >= 3, 'Frontend learning path has >= 3 progressive stages');

assert(Boolean(ROLE_LEARNING_PATHS['backend-dev']), 'Backend Developer learning path exists');
assert(ROLE_LEARNING_PATHS['backend-dev'].stages.length >= 3, 'Backend learning path has >= 3 progressive stages');

console.log('\n✨ ALL 25 VERIFICATION CRITERIA SUCCESSFULLY PASSED! ✨\n');
