export interface Answer {
  id: number;
  submissionId: string;
  questionId: string;
  choice?: string | null;
  reasoning?: string | null;
  rawJson: string;
  createdAt: number;
}

export interface CreateAnswerInput {
  submissionId: string;
  questionId: string;
  choice?: string;
  reasoning?: string;
  rawJson: string;
}

export interface AnswerRow {
  id: number;
  submission_id: string;
  question_id: string;
  choice: string | null;
  reasoning: string | null;
  raw_json: string;
  created_at: number;
}
