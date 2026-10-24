import { UserProfile, RecentInterviewItem, QuestionItem } from '../types';
import { SkillGapItem, SkillEvidenceState, UserLearningProgress } from '../types/learning';
import { TOPIC_TAXONOMY, ALL_SUPPORTED_ROLES, TopicDefinition } from '../data/learningTaxonomy';
import { LEARNING_RESOURCES_CATALOG } from '../data/learningResourcesCatalog';

export interface SkillGapAnalysisResult {
  hasAssessmentEvidence: boolean;
  totalGapsCount: number;
  needsImprovementCount: number;
  developingCount: number;
  onTrackCount: number;
  notAssessedCount: number;
  recommendedRoleCount: number;
  items: SkillGapItem[];
  evidenceSummary: string;
}

/**
 * Normalizes strings for robust keyword matching
 */
function normalize(str: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, ' ');
}

/**
 * Matches topic against text (growth area descriptions, question titles, categories)
 */
function matchesTopicText(topic: TopicDefinition, text: string): boolean {
  const normText = normalize(text);
  const normTopicName = normalize(topic.name);
  if (normText.includes(normTopicName) || normTopicName.includes(normText)) return true;

  // Check subtopics
  for (const sub of topic.subtopics) {
    const normSub = normalize(sub);
    if (normText.includes(normSub)) return true;
  }

  // Check topic key terms
  const terms = topic.id.split('-');
  if (terms.length > 1 && terms.every(t => normText.includes(t))) return true;

  return false;
}

/**
 * Analyzes candidate user evidence to produce transparent skill-gap diagnostics.
 * Adheres strictly to the prompt mandate:
 * - Never label an unassessed topic as weak.
 * - Do not treat absence of practice as proof of poor ability.
 * - Evidence hierarchy:
 *   1. Explicit weaknesses in assessment report feedback (growth areas).
 *   2. Low scores in assessed competencies (< 75).
 *   3. Questions flagged with status === 'review'.
 *   4. User profile focus areas.
 *   5. Incomplete activities.
 *   6. Role standard curriculum (labeled 'recommended_role' or 'not_assessed').
 */
export function analyzeSkillGaps(
  selectedRoleTitle: string,
  userProfile?: UserProfile | null,
  recentInterviews?: RecentInterviewItem[],
  questions?: QuestionItem[],
  _userProgress?: UserLearningProgress | null
): SkillGapAnalysisResult {
  const normalizedSelectedRole = normalize(selectedRoleTitle);
  const matchedRoleDef = ALL_SUPPORTED_ROLES.find(r =>
    normalize(r.title).includes(normalizedSelectedRole) ||
    normalizedSelectedRole.includes(normalize(r.title))
  );

  // Relevant topics for this role or all topics if All Roles
  const relevantTopics = TOPIC_TAXONOMY.filter(topic => {
    if (selectedRoleTitle === 'All Roles' || !matchedRoleDef) return true;
    return topic.roles.some(r => normalize(r).includes(normalizedSelectedRole) || normalizedSelectedRole.includes(normalize(r)));
  });

  const interviewsList = recentInterviews || [];
  const questionsList = questions || [];

  // Track if any real assessment data exists
  let hasRealEvidence = false;

  const gapItems: SkillGapItem[] = relevantTopics.map(topic => {
    // 1. Search for explicit weaknesses in assessment reports
    let explicitWeaknessEvidence: string | null = null;
    let lowestAssessmentScore: number | null = null;
    let highestAssessmentScore: number | null = null;
    let assessedDate: string | undefined = undefined;

    for (const interview of interviewsList) {
      const interviewNorm = normalize(interview.role + ' ' + interview.track + ' ' + interview.scope);
      const isRelevantInterview = topic.roles.some(r => interviewNorm.includes(normalize(r))) ||
        interviewNorm.includes(normalizedSelectedRole);

      if (isRelevantInterview || interviewsList.length <= 3) {
        if (typeof interview.score === 'number') {
          hasRealEvidence = true;
          if (lowestAssessmentScore === null || interview.score < lowestAssessmentScore) {
            lowestAssessmentScore = interview.score;
          }
          if (highestAssessmentScore === null || interview.score > highestAssessmentScore) {
            highestAssessmentScore = interview.score;
          }
          if (interview.completed) assessedDate = interview.completed;
        }

        // Check report growth areas
        if (interview.report?.growthAreas && Array.isArray(interview.report.growthAreas)) {
          for (const area of interview.report.growthAreas) {
            if (matchesTopicText(topic, area)) {
              explicitWeaknessEvidence = `Assessment feedback on ${interview.role || 'session'} flagged: "${area}"`;
              break;
            }
          }
        }
      }
    }

    // 2. Search for question-level activity in question library
    const matchingQuestions = questionsList.filter(q =>
      matchesTopicText(topic, q.title) ||
      matchesTopicText(topic, q.category) ||
      matchesTopicText(topic, q.description)
    );

    const reviewQuestions = matchingQuestions.filter(q => q.status === 'review');
    const passedQuestions = matchingQuestions.filter(q => q.status === 'passed');

    if (matchingQuestions.some(q => q.status !== 'unattempted')) {
      hasRealEvidence = true;
    }

    // 3. Match resources for this topic
    const relatedResources = LEARNING_RESOURCES_CATALOG.filter(res =>
      res.topic === topic.name ||
      res.subtopics.some(st => topic.subtopics.includes(st)) ||
      matchesTopicText(topic, res.title)
    );
    const recommendedResourceIds = relatedResources.map(r => r.id);
    const relatedQuestionIds = matchingQuestions.map(q => q.id);

    // 4. Determine state using strict evidence hierarchy
    let state: SkillEvidenceState = 'not_assessed';
    let evidenceSource: SkillGapItem['evidenceSource'] = 'role_standard';
    let evidenceDetails = `No assessments or practice sessions recorded yet for ${topic.name}.`;
    let priorityScore = 30;

    if (explicitWeaknessEvidence) {
      // Top Tier Evidence: Explicit feedback
      state = 'needs_improvement';
      evidenceSource = 'assessment_report';
      evidenceDetails = explicitWeaknessEvidence;
      priorityScore = 95;
    } else if (reviewQuestions.length > 0) {
      // Second Tier: Question review needed
      state = 'needs_improvement';
      evidenceSource = 'question_review';
      evidenceDetails = `${reviewQuestions.length} practice question(s) flagged as "Needs Review" (e.g. ${reviewQuestions[0].title.slice(0, 50)}...)`;
      priorityScore = 88;
    } else if (lowestAssessmentScore !== null && lowestAssessmentScore < 75) {
      // Low score in relevant track
      state = 'needs_improvement';
      evidenceSource = 'assessment_report';
      evidenceDetails = `Recent technical assessment score was ${lowestAssessmentScore}% (below the 75% benchmark threshold).`;
      priorityScore = 82;
    } else if (passedQuestions.length > 0 && passedQuestions.length < matchingQuestions.length) {
      // Developing: some passed, some unattempted or inconsistent
      state = 'developing';
      evidenceSource = 'question_review';
      evidenceDetails = `Demonstrated initial competence on ${passedQuestions.length} question(s), with further depth recommended.`;
      priorityScore = 65;
    } else if (highestAssessmentScore !== null && highestAssessmentScore >= 85 && passedQuestions.length > 0) {
      // On track: high score and verified passed questions
      state = 'on_track';
      evidenceSource = 'assessment_report';
      evidenceDetails = `High score of ${highestAssessmentScore}% and passing marks in practice exercises.`;
      priorityScore = 20;
    } else if (userProfile?.topSkills?.some(skill => normalize(topic.name).includes(normalize(skill)))) {
      // User claimed skill in profile, but not rigorously assessed in mock interview
      state = 'developing';
      evidenceSource = 'user_profile';
      evidenceDetails = `Listed in your profile top skills. Complete a targeted mock interview to verify and benchmark.`;
      priorityScore = 55;
    } else if (topic.essentialForJunior || topic.essentialForSenior) {
      // Core role curriculum without assessment
      state = 'recommended_role';
      evidenceSource = 'role_standard';
      evidenceDetails = `Core essential competency for ${selectedRoleTitle}. Not yet assessed in your practice history.`;
      priorityScore = 45;
    } else {
      // Unassessed secondary topic
      state = 'not_assessed';
      evidenceSource = 'role_standard';
      evidenceDetails = `Optional or advanced topic for ${selectedRoleTitle}. No assessment records found.`;
      priorityScore = 15;
    }

    return {
      id: `gap-${topic.id}`,
      topic: topic.name,
      category: topic.category,
      role: selectedRoleTitle,
      state,
      score: lowestAssessmentScore ?? undefined,
      evidenceSource,
      evidenceDetails,
      lastEvaluatedDate: assessedDate,
      priorityScore,
      recommendedResourceIds,
      relatedQuestionIds
    };
  });

  // Sort by priorityScore descending
  gapItems.sort((a, b) => b.priorityScore - a.priorityScore);

  const needsImprovementCount = gapItems.filter(g => g.state === 'needs_improvement').length;
  const developingCount = gapItems.filter(g => g.state === 'developing').length;
  const onTrackCount = gapItems.filter(g => g.state === 'on_track').length;
  const notAssessedCount = gapItems.filter(g => g.state === 'not_assessed').length;
  const recommendedRoleCount = gapItems.filter(g => g.state === 'recommended_role').length;

  let evidenceSummary = '';
  if (hasRealEvidence && needsImprovementCount > 0) {
    evidenceSummary = `Based on your recent assessment reports and practice history, ${needsImprovementCount} topic(s) have verified growth areas requiring focused practice.`;
  } else if (hasRealEvidence) {
    evidenceSummary = `All evaluated competencies are on track or developing. Explore curriculum recommendations to expand role depth.`;
  } else {
    evidenceSummary = `No assessment history recorded yet. Showing essential role curriculum. Complete a mock interview or question drill to unlock personalized diagnostics.`;
  }

  return {
    hasAssessmentEvidence: hasRealEvidence,
    totalGapsCount: gapItems.length,
    needsImprovementCount,
    developingCount,
    onTrackCount,
    notAssessedCount,
    recommendedRoleCount,
    items: gapItems,
    evidenceSummary
  };
}
