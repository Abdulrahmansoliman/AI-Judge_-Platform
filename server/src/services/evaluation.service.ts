import OpenAI from 'openai';
import { DatabaseService } from './database.service';
import {
  SubmissionRepository,
  QuestionRepository,
  AnswerRepository,
  AssignmentRepository,
  JudgeRepository,
  EvaluationRepository,
} from '../repositories';

export interface EvaluationTask {
  submissionId: string;
  questionId: string;
  questionText: string;
  judgeId: number;
  judgeName: string;
  judgePrompt: string;
  model: string;
  answerChoice?: string;
  answerReasoning?: string;
}

export interface RunEvaluationResult {
  planned: number;
  completed: number;
  failed: number;
}

export interface EvaluationResponse {
  verdict: 'pass' | 'fail' | 'inconclusive';
  reasoning: string;
}

export class EvaluationService {
  private openai: OpenAI | null = null;
  private submissionRepo: SubmissionRepository;
  private questionRepo: QuestionRepository;
  private answerRepo: AnswerRepository;
  private assignmentRepo: AssignmentRepository;
  private judgeRepo: JudgeRepository;
  private evaluationRepo: EvaluationRepository;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    this.submissionRepo = new SubmissionRepository();
    this.questionRepo = new QuestionRepository();
    this.answerRepo = new AnswerRepository();
    this.assignmentRepo = new AssignmentRepository();
    this.judgeRepo = new JudgeRepository();
    this.evaluationRepo = new EvaluationRepository();
  }

  async runEvaluations(queueId: string, options: { rerunExisting?: boolean } = {}): Promise<RunEvaluationResult> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const submissions = this.submissionRepo.findByQueueId(queueId);
    const questions = this.questionRepo.findByQueueId(queueId);
    
    const tasks: EvaluationTask[] = [];

    for (const submission of submissions) {
      for (const question of questions) {
        const answer = this.answerRepo.findBySubmissionAndQuestion(submission.id, question.id);
        if (!answer) continue;

        const judgeIds = this.assignmentRepo.findJudgeIdsByQuestion(queueId, question.id);
        
        for (const judgeId of judgeIds) {
          if (!options.rerunExisting) {
            const existing = this.evaluationRepo.findExisting(submission.id, question.id, judgeId);
            if (existing) continue;
          }

          const judge = this.judgeRepo.findById(judgeId);
          if (!judge || !judge.active) continue;

          tasks.push({
            submissionId: submission.id,
            questionId: question.id,
            questionText: question.questionText,
            judgeId: judge.id,
            judgeName: judge.name,
            judgePrompt: judge.systemPrompt,
            model: judge.model,
            answerChoice: answer.choice || undefined,
            answerReasoning: answer.reasoning || undefined,
          });
        }
      }
    }

    let completed = 0;
    let failed = 0;

    for (const task of tasks) {
      try {
        const result = await this.evaluateTask(task);
        
        this.evaluationRepo.upsert({
          submissionId: task.submissionId,
          questionId: task.questionId,
          judgeId: task.judgeId,
          verdict: result.verdict,
          reasoning: result.reasoning,
          rawResponse: JSON.stringify(result),
        });
        
        completed++;
      } catch (error) {
        console.error(`Failed to evaluate task:`, error);
        failed++;
      }
    }

    return {
      planned: tasks.length,
      completed,
      failed,
    };
  }

  private async evaluateTask(task: EvaluationTask): Promise<EvaluationResponse> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized');
    }

    const userMessage = this.buildPrompt(task);

    const completion = await this.openai.chat.completions.create({
      model: task.model,
      messages: [
        { role: 'system', content: task.judgePrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    
    return {
      verdict: this.normalizeVerdict(parsed.verdict),
      reasoning: parsed.reasoning || '',
    };
  }

  private buildPrompt(task: EvaluationTask): string {
    let prompt = `Question: ${task.questionText}\n\n`;
    
    if (task.answerChoice) {
      prompt += `Answer Choice: ${task.answerChoice}\n`;
    }
    
    if (task.answerReasoning) {
      prompt += `Answer Reasoning: ${task.answerReasoning}\n`;
    }
    
    prompt += `\nPlease evaluate this answer and respond with JSON containing "verdict" (pass/fail/inconclusive) and "reasoning".`;
    
    return prompt;
  }

  private normalizeVerdict(verdict: any): 'pass' | 'fail' | 'inconclusive' {
    const normalized = String(verdict).toLowerCase().trim();
    
    if (normalized === 'pass' || normalized === 'approved' || normalized === 'accept') {
      return 'pass';
    }
    if (normalized === 'fail' || normalized === 'failed' || normalized === 'reject') {
      return 'fail';
    }
    return 'inconclusive';
  }
}
