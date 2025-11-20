import Database from 'better-sqlite3';
import { DatabaseService, toCamelCase, toSnakeCase } from '../services/database.service';
import { EvaluationRow, Evaluation, CreateEvaluationInput } from '../models/evaluation.model';

export class EvaluationRepository {
  private db: Database.Database;

  constructor() {
    this.db = DatabaseService.getInstance().getDatabase();
  }

  findById(id: number): Evaluation | null {
    const stmt = this.db.prepare('SELECT * FROM evaluations WHERE id = ?');
    const row = stmt.get(id) as EvaluationRow | undefined;
    return row ? toCamelCase(row) : null;
  }

  findAll(): Evaluation[] {
    const stmt = this.db.prepare('SELECT * FROM evaluations ORDER BY created_at DESC');
    const rows = stmt.all() as EvaluationRow[];
    return rows.map(row => toCamelCase(row));
  }

  findBySubmissionId(submissionId: string): Evaluation[] {
    const stmt = this.db.prepare('SELECT * FROM evaluations WHERE submission_id = ? ORDER BY created_at ASC');
    const rows = stmt.all(submissionId) as EvaluationRow[];
    return rows.map(row => toCamelCase(row));
  }

  findByFilters(filters: {
    judgeIds?: number[];
    questionIds?: string[];
    verdicts?: string[];
    submissionId?: string;
  }): Evaluation[] {
    let query = 'SELECT * FROM evaluations WHERE 1=1';
    const params: any[] = [];

    if (filters.submissionId) {
      query += ' AND submission_id = ?';
      params.push(filters.submissionId);
    }

    if (filters.judgeIds && filters.judgeIds.length > 0) {
      query += ` AND judge_id IN (${filters.judgeIds.map(() => '?').join(',')})`;
      params.push(...filters.judgeIds);
    }

    if (filters.questionIds && filters.questionIds.length > 0) {
      query += ` AND question_id IN (${filters.questionIds.map(() => '?').join(',')})`;
      params.push(...filters.questionIds);
    }

    if (filters.verdicts && filters.verdicts.length > 0) {
      query += ` AND verdict IN (${filters.verdicts.map(() => '?').join(',')})`;
      params.push(...filters.verdicts);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as EvaluationRow[];
    return rows.map(row => toCamelCase(row));
  }

  findExisting(submissionId: string, questionId: string, judgeId: number): Evaluation | null {
    const stmt = this.db.prepare(`
      SELECT * FROM evaluations 
      WHERE submission_id = ? AND question_id = ? AND judge_id = ?
    `);
    const row = stmt.get(submissionId, questionId, judgeId) as EvaluationRow | undefined;
    return row ? toCamelCase(row) : null;
  }

  create(input: CreateEvaluationInput): Evaluation {
    const evaluation: Omit<Evaluation, 'id'> = {
      ...input,
      createdAt: Date.now(),
    };

    const stmt = this.db.prepare(`
      INSERT INTO evaluations (submission_id, question_id, judge_id, verdict, reasoning, raw_response, created_at)
      VALUES (@submissionId, @questionId, @judgeId, @verdict, @reasoning, @rawResponse, @createdAt)
    `);
    const data = toSnakeCase(evaluation);
    const result = stmt.run(data);
    return { ...evaluation, id: Number(result.lastInsertRowid) };
  }

  upsert(input: CreateEvaluationInput): Evaluation {
    const evaluation: Omit<Evaluation, 'id'> = {
      ...input,
      createdAt: Date.now(),
    };

    const stmt = this.db.prepare(`
      INSERT INTO evaluations (submission_id, question_id, judge_id, verdict, reasoning, raw_response, created_at)
      VALUES (@submissionId, @questionId, @judgeId, @verdict, @reasoning, @rawResponse, @createdAt)
      ON CONFLICT(submission_id, question_id, judge_id) DO UPDATE SET
        verdict = excluded.verdict,
        reasoning = excluded.reasoning,
        raw_response = excluded.raw_response,
        created_at = excluded.created_at
    `);
    const data = toSnakeCase(evaluation);
    const result = stmt.run(data);
    
    const existing = this.findExisting(input.submissionId, input.questionId, input.judgeId);
    return existing || { ...evaluation, id: Number(result.lastInsertRowid) };
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM evaluations WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
