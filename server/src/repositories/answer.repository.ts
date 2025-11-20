import Database from 'better-sqlite3';
import { DatabaseService, toCamelCase, toSnakeCase } from '../services/database.service';
import { AnswerRow, Answer } from '../models/answer.model';

export class AnswerRepository {
  private db: Database.Database;

  constructor() {
    this.db = DatabaseService.getInstance().getDatabase();
  }

  findById(id: number): Answer | null {
    const stmt = this.db.prepare('SELECT * FROM answers WHERE id = ?');
    const row = stmt.get(id) as AnswerRow | undefined;
    return row ? toCamelCase(row) : null;
  }

  findBySubmissionId(submissionId: string): Answer[] {
    const stmt = this.db.prepare('SELECT * FROM answers WHERE submission_id = ? ORDER BY created_at ASC');
    const rows = stmt.all(submissionId) as AnswerRow[];
    return rows.map(row => toCamelCase(row));
  }

  findBySubmissionAndQuestion(submissionId: string, questionId: string): Answer | null {
    const stmt = this.db.prepare('SELECT * FROM answers WHERE submission_id = ? AND question_id = ?');
    const row = stmt.get(submissionId, questionId) as AnswerRow | undefined;
    return row ? toCamelCase(row) : null;
  }

  findAll(): Answer[] {
    const stmt = this.db.prepare('SELECT * FROM answers ORDER BY created_at DESC');
    const rows = stmt.all() as AnswerRow[];
    return rows.map(row => toCamelCase(row));
  }

  create(answer: Omit<Answer, 'id'>): Answer {
    const stmt = this.db.prepare(`
      INSERT INTO answers (submission_id, question_id, choice, reasoning, raw_json, created_at)
      VALUES (@submissionId, @questionId, @choice, @reasoning, @rawJson, @createdAt)
    `);
    const data = toSnakeCase(answer);
    const result = stmt.run(data);
    return { ...answer, id: Number(result.lastInsertRowid) };
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM answers WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  deleteBySubmissionId(submissionId: string): number {
    const stmt = this.db.prepare('DELETE FROM answers WHERE submission_id = ?');
    const result = stmt.run(submissionId);
    return result.changes;
  }
}
