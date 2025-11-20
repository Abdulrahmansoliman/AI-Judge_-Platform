import Database from 'better-sqlite3';
import { DatabaseService } from '../services/database.service';
import { QuestionJudgeRow, QuestionJudge } from '../models/assignment.model';

export class AssignmentRepository {
  private db: Database.Database;

  constructor() {
    this.db = DatabaseService.getInstance().getDatabase();
  }

  findById(id: number): QuestionJudge | null {
    const stmt = this.db.prepare('SELECT * FROM question_judges WHERE id = ?');
    const row = stmt.get(id) as QuestionJudgeRow | undefined;
    return row ? DatabaseService.toCamelCase(row) : null;
  }

  findByQueueAndQuestion(queueId: string, questionId: string): QuestionJudge[] {
    const stmt = this.db.prepare(`
      SELECT * FROM question_judges 
      WHERE queue_id = ? AND question_id = ? 
      ORDER BY created_at ASC
    `);
    const rows = stmt.all(queueId, questionId) as QuestionJudgeRow[];
    return rows.map(row => DatabaseService.toCamelCase(row));
  }

  findByQueueId(queueId: string): QuestionJudge[] {
    const stmt = this.db.prepare('SELECT * FROM question_judges WHERE queue_id = ? ORDER BY created_at ASC');
    const rows = stmt.all(queueId) as QuestionJudgeRow[];
    return rows.map(row => DatabaseService.toCamelCase(row));
  }

  findJudgeIdsByQuestion(queueId: string, questionId: string): number[] {
    const stmt = this.db.prepare(`
      SELECT judge_id FROM question_judges 
      WHERE queue_id = ? AND question_id = ?
      ORDER BY judge_id ASC
    `);
    const rows = stmt.all(queueId, questionId) as { judge_id: number }[];
    return rows.map(row => row.judge_id);
  }

  create(assignment: Omit<QuestionJudge, 'id'>): QuestionJudge {
    const stmt = this.db.prepare(`
      INSERT INTO question_judges (queue_id, question_id, judge_id, created_at)
      VALUES (@queueId, @questionId, @judgeId, @createdAt)
    `);
    const data = DatabaseService.toSnakeCase(assignment);
    const result = stmt.run(data);
    return { ...assignment, id: Number(result.lastInsertRowid) };
  }

  replaceAssignments(queueId: string, questionId: string, judgeIds: number[]): void {
    DatabaseService.getInstance().transaction(() => {
      const deleteStmt = this.db.prepare(`
        DELETE FROM question_judges WHERE queue_id = ? AND question_id = ?
      `);
      deleteStmt.run(queueId, questionId);

      if (judgeIds.length > 0) {
        const insertStmt = this.db.prepare(`
          INSERT INTO question_judges (queue_id, question_id, judge_id, created_at)
          VALUES (@queueId, @questionId, @judgeId, @createdAt)
        `);

        const now = Date.now();
        for (const judgeId of judgeIds) {
          const data = DatabaseService.toSnakeCase({
            queueId,
            questionId,
            judgeId,
            createdAt: now,
          });
          insertStmt.run(data);
        }
      }
    });
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM question_judges WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  deleteByQueueAndQuestion(queueId: string, questionId: string): number {
    const stmt = this.db.prepare('DELETE FROM question_judges WHERE queue_id = ? AND question_id = ?');
    const result = stmt.run(queueId, questionId);
    return result.changes;
  }
}
