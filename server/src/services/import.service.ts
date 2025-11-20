import { DatabaseService } from './database.service';
import {
  SubmissionRepository,
  QuestionRepository,
  AnswerRepository,
} from '../repositories';

export interface SubmissionFromJson {
  id: string;
  queue_id: string;
  labeling_task_id: string;
  created_at: number;
  questions: {
    id: string;
    question_text: string;
    question_type: string;
    rev?: number;
    choice?: string;
    reasoning?: string;
    raw_json?: any;
  }[];
}

export interface ImportResult {
  importedSubmissions: number;
  importedQuestions: number;
  importedAnswers: number;
}

export class ImportService {
  private submissionRepo: SubmissionRepository;
  private questionRepo: QuestionRepository;
  private answerRepo: AnswerRepository;

  constructor() {
    this.submissionRepo = new SubmissionRepository();
    this.questionRepo = new QuestionRepository();
    this.answerRepo = new AnswerRepository();
  }

  importSubmissions(submissions: SubmissionFromJson[]): ImportResult {
    let importedSubmissions = 0;
    let importedQuestions = 0;
    let importedAnswers = 0;

    DatabaseService.getInstance().transaction(() => {
      for (const submissionData of submissions) {
        this.submissionRepo.upsert({
          id: submissionData.id,
          queueId: submissionData.queue_id,
          labelingTaskId: submissionData.labeling_task_id,
          createdAt: submissionData.created_at,
        });
        importedSubmissions++;

        for (const questionData of submissionData.questions) {
          this.questionRepo.upsert({
            id: questionData.id,
            queueId: submissionData.queue_id,
            questionText: questionData.question_text,
            questionType: questionData.question_type,
            rev: questionData.rev,
            createdAt: submissionData.created_at,
          });
          importedQuestions++;

          this.answerRepo.create({
            submissionId: submissionData.id,
            questionId: questionData.id,
            choice: questionData.choice || null,
            reasoning: questionData.reasoning || null,
            rawJson: questionData.raw_json ? JSON.stringify(questionData.raw_json) : JSON.stringify({}),
            createdAt: submissionData.created_at,
          });
          importedAnswers++;
        }
      }
    });

    return {
      importedSubmissions,
      importedQuestions,
      importedAnswers,
    };
  }
}
