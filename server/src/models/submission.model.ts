import { Question } from './question.model';
import { Answer } from './answer.model';

export interface Submission {
  id: string;
  queueId: string;
  labelingTaskId: string;
  createdAt: number;
}

export interface SubmissionWithDetails extends Submission {
  questions: Question[];
  answers: Answer[];
}

export interface SubmissionJSON {
  id: string;
  queueId: string;
  labelingTaskId: string;
  createdAt: number;
  questions: QuestionJSON[];
  answers: Record<string, AnswerJSON>;
}

export interface QuestionJSON {
  rev: number;
  data: {
    id: string;
    questionType: string;
    questionText: string;
  };
}

export interface AnswerJSON {
  choice?: string;
  reasoning?: string;
  [key: string]: any;
}

export interface SubmissionRow {
  id: string;
  queue_id: string;
  labeling_task_id: string;
  created_at: number;
}
