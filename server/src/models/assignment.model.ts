export interface QuestionJudgeAssignment {
  id: number;
  queueId: string;
  questionId: string;
  judgeId: number;
  createdAt: number;
}

export type QuestionJudge = QuestionJudgeAssignment;

export interface CreateAssignmentInput {
  queueId: string;
  questionId: string;
  judgeId: number;
}

export interface BulkAssignmentInput {
  queueId: string;
  questionId: string;
  judgeIds: number[];
}

export interface AssignmentRow {
  id: number;
  queue_id: string;
  question_id: string;
  judge_id: number;
  created_at: number;
}

export type QuestionJudgeRow = AssignmentRow;
