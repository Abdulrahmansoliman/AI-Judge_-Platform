import {
  QuestionRepository,
  SubmissionRepository,
} from '../repositories';

export interface QueueInfo {
  queueId: string;
  submissionsCount: number;
  questionsCount: number;
}

export interface QuestionWithAssignments {
  id: string;
  text: string;
  type: string;
  assignedJudgeIds: number[];
}

export interface QueueQuestionsResult {
  questions: QuestionWithAssignments[];
}

export class QueueService {
  private submissionRepo: SubmissionRepository;
  private questionRepo: QuestionRepository;

  constructor() {
    this.submissionRepo = new SubmissionRepository();
    this.questionRepo = new QuestionRepository();
  }

  getQueues(): QueueInfo[] {
    const submissions = this.submissionRepo.findAll();
    const queueMap = new Map<string, { submissions: number; questions: number }>();

    for (const submission of submissions) {
      const existing = queueMap.get(submission.queueId);
      if (existing) {
        existing.submissions++;
      } else {
        const questionsCount = this.questionRepo.countByQueueId(submission.queueId);
        queueMap.set(submission.queueId, {
          submissions: 1,
          questions: questionsCount,
        });
      }
    }

    return Array.from(queueMap.entries()).map(([queueId, counts]) => ({
      queueId,
      submissionsCount: counts.submissions,
      questionsCount: counts.questions,
    }));
  }

  getQueueQuestions(queueId: string, assignmentRepo: any): QueueQuestionsResult {
    const questions = this.questionRepo.findByQueueId(queueId);
    
    const questionsWithAssignments: QuestionWithAssignments[] = questions.map(q => ({
      id: q.id,
      text: q.questionText,
      type: q.questionType,
      assignedJudgeIds: assignmentRepo.findJudgeIdsByQuestion(queueId, q.id),
    }));

    return { questions: questionsWithAssignments };
  }
}
