import { QuestionItem } from '../../types';
import { FRONTEND_QUESTIONS } from './frontendQuestions';
import { BACKEND_QUESTIONS } from './backendQuestions';
import { DATABASE_QUESTIONS } from './databaseQuestions';
import { SYSTEM_DESIGN_QUESTIONS } from './systemDesignQuestions';
import { AIML_QUESTIONS } from './aimlQuestions';
import { FULLSTACK_QUESTIONS } from './fullstackQuestions';
import { DSA_QUESTIONS } from './dsaQuestions';
import { DEVOPS_CLOUD_QUESTIONS } from './devopsCloudQuestions';
import { QA_SECURITY_QUESTIONS } from './qaSecurityQuestions';
import { BEHAVIORAL_QUESTIONS } from './behavioralQuestions';

export const ALL_QUESTIONS: QuestionItem[] = [
  ...FRONTEND_QUESTIONS,
  ...BACKEND_QUESTIONS,
  ...DATABASE_QUESTIONS,
  ...SYSTEM_DESIGN_QUESTIONS,
  ...AIML_QUESTIONS,
  ...FULLSTACK_QUESTIONS,
  ...DSA_QUESTIONS,
  ...DEVOPS_CLOUD_QUESTIONS,
  ...QA_SECURITY_QUESTIONS,
  ...BEHAVIORAL_QUESTIONS,
];

// O(1) Lookup Map by Question ID
export const QUESTIONS_BY_ID = new Map<string, QuestionItem>(
  ALL_QUESTIONS.map(q => [q.id, q])
);

// Helper lookups
export function getQuestionById(id: string): QuestionItem | undefined {
  return QUESTIONS_BY_ID.get(id);
}

export function getQuestionsByRole(roleId: string): QuestionItem[] {
  return ALL_QUESTIONS.filter(q => q.roleIds?.includes(roleId) || q.roleTarget.toLowerCase().includes(roleId.replace('-', ' ')));
}

export function getQuestionsByTopic(topicId: string): QuestionItem[] {
  return ALL_QUESTIONS.filter(q => q.topicId === topicId || q.categoryId === topicId);
}

export {
  FRONTEND_QUESTIONS,
  BACKEND_QUESTIONS,
  DATABASE_QUESTIONS,
  SYSTEM_DESIGN_QUESTIONS,
  AIML_QUESTIONS,
  FULLSTACK_QUESTIONS,
  DSA_QUESTIONS,
  DEVOPS_CLOUD_QUESTIONS,
  QA_SECURITY_QUESTIONS,
  BEHAVIORAL_QUESTIONS,
};
