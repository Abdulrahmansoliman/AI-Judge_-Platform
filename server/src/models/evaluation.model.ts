export type Verdict = 'pass' | 'fail' | 'inconclusive';

export interface Evaluation {
  id: number;
  submissionId: string;
  questionId: string;
  judgeId: number;
  verdict: Verdict;
  reasoning: string;
  rawResponse: string;
  createdAt: number;
}

export interface CreateEvaluationInput {
  submissionId: string;
  questionId: string;
  judgeId: number;
  verdict: Verdict;
  reasoning: string;
  rawResponse: string;
}

export interface EvaluationWithMeta extends Evaluation {
  submissionQueueId?: string;
  questionText?: string;
  questionType?: string;
  judgeName?: string;
  judgeModel?: string;
}

export interface EvaluationRow {
  id: number;
  submission_id: string;
  question_id: string;
  judge_id: number;
  verdict: string;
  reasoning: string;
  raw_response: string;
  created_at: number;
}

export interface EvaluationFilters {
  judgeIds?: number[];
  questionIds?: string[];
  verdicts?: Verdict[];
  queueId?: string;
}

export interface EvaluationStats {
  total: number;
  passed: number;
  failed: number;
  inconclusive: number;
  passRate: number;
}
