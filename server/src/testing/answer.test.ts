import { setupTestDatabase, teardownTestDatabase, getTestDb } from './setup';
import { AnswerRow } from '../models/answer.model';

describe('Answer Model', () => {
  beforeAll(() => {
    setupTestDatabase();
  });

  afterAll(() => {
    teardownTestDatabase();
  });

  beforeEach(() => {
    const db = getTestDb();
    db.exec('DELETE FROM answers');
    db.exec('DELETE FROM submissions');
    
    db.prepare(`
      INSERT INTO submissions (id, queue_id, labeling_task_id, created_at)
      VALUES (?, ?, ?, ?)
    `).run('sub_1', 'queue_1', 'task_1', Date.now());
  });

  describe('Database Operations', () => {
    it('should insert an answer', () => {
      const db = getTestDb();
      const answer = {
        submission_id: 'sub_1',
        question_id: 'q1',
        choice: 'yes',
        reasoning: 'test reasoning',
        raw_json: JSON.stringify({ choice: 'yes', reasoning: 'test reasoning' }),
        created_at: Date.now(),
      };

      const stmt = db.prepare(`
        INSERT INTO answers (submission_id, question_id, choice, reasoning, raw_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        answer.submission_id,
        answer.question_id,
        answer.choice,
        answer.reasoning,
        answer.raw_json,
        answer.created_at
      );

      expect(result.changes).toBe(1);
    });

    it('should auto-increment id', () => {
      const db = getTestDb();
      const now = Date.now();
      
      const stmt = db.prepare(`
        INSERT INTO answers (submission_id, question_id, choice, reasoning, raw_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const result1 = stmt.run('sub_1', 'q1', 'yes', 'test', '{}', now);
      const result2 = stmt.run('sub_1', 'q2', 'no', 'test', '{}', now);

      expect(result2.lastInsertRowid).toBe(Number(result1.lastInsertRowid) + 1);
    });

    it('should retrieve answers by submission_id', () => {
      const db = getTestDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO answers (submission_id, question_id, choice, reasoning, raw_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('sub_1', 'q1', 'yes', 'test1', '{}', now);
      
      db.prepare(`
        INSERT INTO answers (submission_id, question_id, choice, reasoning, raw_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('sub_1', 'q2', 'no', 'test2', '{}', now);

      const rows = db.prepare('SELECT * FROM answers WHERE submission_id = ?').all('sub_1') as AnswerRow[];

      expect(rows).toHaveLength(2);
      expect(rows.every(r => r.submission_id === 'sub_1')).toBe(true);
    });

    it('should retrieve answer by submission and question', () => {
      const db = getTestDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO answers (submission_id, question_id, choice, reasoning, raw_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('sub_1', 'q1', 'yes', 'test', '{}', now);

      const row = db.prepare(
        'SELECT * FROM answers WHERE submission_id = ? AND question_id = ?'
      ).get('sub_1', 'q1') as AnswerRow;

      expect(row).toBeDefined();
      expect(row.choice).toBe('yes');
    });

    it('should handle null choice and reasoning', () => {
      const db = getTestDb();
      
      const stmt = db.prepare(`
        INSERT INTO answers (submission_id, question_id, choice, reasoning, raw_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run('sub_1', 'q1', null, null, '{}', Date.now());

      expect(result.changes).toBe(1);
      
      const row = db.prepare('SELECT * FROM answers WHERE id = ?').get(result.lastInsertRowid) as AnswerRow;
      expect(row.choice).toBeNull();
      expect(row.reasoning).toBeNull();
    });

    it('should cascade delete with submission', () => {
      const db = getTestDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO answers (submission_id, question_id, choice, reasoning, raw_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('sub_1', 'q1', 'yes', 'test', '{}', now);

      db.prepare('DELETE FROM submissions WHERE id = ?').run('sub_1');

      const rows = db.prepare('SELECT * FROM answers WHERE submission_id = ?').all('sub_1') as AnswerRow[];
      expect(rows).toHaveLength(0);
    });
  });
});
