export * from './submission.model';
export * from './question.model';
export * from './answer.model';
export * from './judge.model';
export * from './assignment.model';
export * from './evaluation.model';

export interface Queue {
  queueId: string;
  submissionsCount: number;
  questionsCount: number;
}
