import { DatabaseService } from './database.service';
import {
  SubmissionRepository,
  QuestionRepository,
  AnswerRepository,
} from '../repositories';

export interface SubmissionFromJson {
  id: string;
  queueId: string;
  labelingTaskId: string;
  createdAt: number;
  questions: {
    rev?: number;
    data: {
      id: string;
      questionType: string;
      questionText: string;
    };
  }[];
  answers: {
    [questionId: string]: {
      choice?: string;
      reasoning?: string;
    };
  };
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
          queueId: submissionData.queueId,
          labelingTaskId: submissionData.labelingTaskId,
          createdAt: submissionData.createdAt,
        });
        importedSubmissions++;

        for (const questionWrapper of submissionData.questions) {
          const questionData = questionWrapper.data;
          
          this.questionRepo.upsert({
            id: questionData.id,
            queueId: submissionData.queueId,
            questionText: questionData.questionText,
            questionType: questionData.questionType,
            rev: questionWrapper.rev,
            createdAt: submissionData.createdAt,
          });
          importedQuestions++;

          const answerData = submissionData.answers[questionData.id];
          if (answerData) {
            this.answerRepo.create({
              submissionId: submissionData.id,
              questionId: questionData.id,
              choice: answerData.choice || null,
              reasoning: answerData.reasoning || null,
              rawJson: JSON.stringify(answerData),
              createdAt: submissionData.createdAt,
            });
            importedAnswers++;
          }
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
