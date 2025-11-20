import Database from 'better-sqlite3';
import { DatabaseService } from '../services/database.service';
import { SubmissionRow, Submission } from '../models/submission.model';

export class SubmissionRepository {
  private db: Database.Database;

  constructor() {
    this.db = DatabaseService.getInstance().getDatabase();
  }

  findById(id: string): Submission | null {
    const stmt = this.db.prepare('SELECT * FROM submissions WHERE id = ?');
    const row = stmt.get(id) as SubmissionRow | undefined;
    return row ? DatabaseService.toCamelCase(row) : null;
  }

  findAll(): Submission[] {
    const stmt = this.db.prepare('SELECT * FROM submissions ORDER BY created_at DESC');
    const rows = stmt.all() as SubmissionRow[];
    return rows.map(row => DatabaseService.toCamelCase(row));
  }

  findByQueueId(queueId: string): Submission[] {
    const stmt = this.db.prepare('SELECT * FROM submissions WHERE queue_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(queueId) as SubmissionRow[];
    return rows.map(row => DatabaseService.toCamelCase(row));
  }

  create(submission: Submission): Submission {
    const stmt = this.db.prepare(`
      INSERT INTO submissions (id, queue_id, labeling_task_id, created_at)
      VALUES (@id, @queueId, @labelingTaskId, @createdAt)
    `);
    const data = DatabaseService.toSnakeCase(submission);
    stmt.run(data);
    return submission;
  }

  upsert(submission: Submission): Submission {
    const stmt = this.db.prepare(`
      INSERT INTO submissions (id, queue_id, labeling_task_id, created_at)
      VALUES (@id, @queueId, @labelingTaskId, @createdAt)
      ON CONFLICT(id) DO UPDATE SET
        queue_id = excluded.queue_id,
        labeling_task_id = excluded.labeling_task_id,
        created_at = excluded.created_at
    `);
    const data = DatabaseService.toSnakeCase(submission);
    stmt.run(data);
    return submission;
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM submissions WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  countByQueueId(queueId: string): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM submissions WHERE queue_id = ?');
    const result = stmt.get(queueId) as { count: number };
    return result.count;
  }
}
