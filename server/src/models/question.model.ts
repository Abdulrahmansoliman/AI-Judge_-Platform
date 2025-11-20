export interface Question {
  id: string;
  queueId: string;
  questionText: string;
  questionType: string;
  rev?: number;
  createdAt: number;
}

export interface QuestionWithAssignments extends Question {
  assignedJudgeIds: number[];
}

export interface QuestionRow {
  id: string;
  queue_id: string;
  question_text: string;
  question_type: string;
  rev: number | null;
  created_at: number;
}
