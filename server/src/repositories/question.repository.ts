import Database from 'better-sqlite3';
import { DatabaseService, toCamelCase, toSnakeCase } from '../services/database.service';
import { QuestionRow, Question } from '../models/question.model';

export class QuestionRepository {
  private db: Database.Database;

  constructor() {
    this.db = DatabaseService.getInstance().getDatabase();
  }

  findById(id: string, queueId: string): Question | null {
    const stmt = this.db.prepare('SELECT * FROM questions WHERE id = ? AND queue_id = ?');
    const row = stmt.get(id, queueId) as QuestionRow | undefined;
    return row ? toCamelCase(row) : null;
  }

  findByQueueId(queueId: string): Question[] {
    const stmt = this.db.prepare('SELECT * FROM questions WHERE queue_id = ? ORDER BY created_at ASC');
    const rows = stmt.all(queueId) as QuestionRow[];
    return rows.map(row => toCamelCase(row));
  }

  findAll(): Question[] {
    const stmt = this.db.prepare('SELECT * FROM questions ORDER BY created_at DESC');
    const rows = stmt.all() as QuestionRow[];
    return rows.map(row => toCamelCase(row));
  }

  create(question: Question): Question {
    const stmt = this.db.prepare(`
      INSERT INTO questions (id, queue_id, question_text, question_type, rev, created_at)
      VALUES (@id, @queueId, @questionText, @questionType, @rev, @createdAt)
    `);
    const data = toSnakeCase(question);
    stmt.run(data);
    return question;
  }

  upsert(question: Question): Question {
    const stmt = this.db.prepare(`
      INSERT INTO questions (id, queue_id, question_text, question_type, rev, created_at)
      VALUES (@id, @queueId, @questionText, @questionType, @rev, @createdAt)
      ON CONFLICT(id, queue_id) DO UPDATE SET
        question_text = excluded.question_text,
        question_type = excluded.question_type,
        rev = excluded.rev,
        created_at = excluded.created_at
    `);
    const data = toSnakeCase(question);
    stmt.run(data);
    return question;
  }

  delete(id: string, queueId: string): boolean {
    const stmt = this.db.prepare('DELETE FROM questions WHERE id = ? AND queue_id = ?');
    const result = stmt.run(id, queueId);
    return result.changes > 0;
  }

  countByQueueId(queueId: string): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM questions WHERE queue_id = ?');
    const result = stmt.get(queueId) as { count: number };
    return result.count;
  }
}
