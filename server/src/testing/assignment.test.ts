import { setupTestDatabase, teardownTestDatabase, getTestDb } from './setup';
import { AssignmentRow } from '../models/assignment.model';

describe('Assignment Model', () => {
  beforeAll(() => {
    setupTestDatabase();
  });

  afterAll(() => {
    teardownTestDatabase();
  });

  let testJudgeId: number;

  beforeEach(() => {
    const db = getTestDb();
    db.exec('DELETE FROM question_judges');
    db.exec('DELETE FROM judges');
    
    const now = Date.now();
    const result = db.prepare(`
      INSERT INTO judges (name, system_prompt, model, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('Judge 1', 'prompt', 'gpt-4o-mini', 1, now, now);
    
    testJudgeId = Number(result.lastInsertRowid);
  });

  describe('Database Operations', () => {
    it('should insert an assignment', () => {
      const db = getTestDb();
      const assignment = {
        queue_id: 'queue_1',
        question_id: 'q1',
        judge_id: testJudgeId,
        created_at: Date.now(),
      };

      const stmt = db.prepare(`
        INSERT INTO question_judges (queue_id, question_id, judge_id, created_at)
        VALUES (?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        assignment.queue_id,
        assignment.question_id,
        assignment.judge_id,
        assignment.created_at
      );

      expect(result.changes).toBe(1);
    });

    it('should enforce unique constraint', () => {
      const db = getTestDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO question_judges (queue_id, question_id, judge_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run('queue_1', 'q1', testJudgeId, now);

      expect(() => {
        db.prepare(`
          INSERT INTO question_judges (queue_id, question_id, judge_id, created_at)
          VALUES (?, ?, ?, ?)
        `).run('queue_1', 'q1', testJudgeId, now);
      }).toThrow();
    });

    it('should allow same judge for different questions', () => {
      const db = getTestDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO question_judges (queue_id, question_id, judge_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run('queue_1', 'q1', testJudgeId, now);
      
      db.prepare(`
        INSERT INTO question_judges (queue_id, question_id, judge_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run('queue_1', 'q2', testJudgeId, now);

      const rows = db.prepare('SELECT * FROM question_judges WHERE judge_id = ?').all(testJudgeId) as AssignmentRow[];
      expect(rows).toHaveLength(2);
    });

    it('should retrieve assignments by queue and question', () => {
      const db = getTestDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO question_judges (queue_id, question_id, judge_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run('queue_1', 'q1', testJudgeId, now);

      const rows = db.prepare(
        'SELECT * FROM question_judges WHERE queue_id = ? AND question_id = ?'
      ).all('queue_1', 'q1') as AssignmentRow[];

      expect(rows).toHaveLength(1);
      expect(rows[0].judge_id).toBe(testJudgeId);
    });

    it('should cascade delete when judge is deleted', () => {
      const db = getTestDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO question_judges (queue_id, question_id, judge_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run('queue_1', 'q1', testJudgeId, now);

      db.prepare('DELETE FROM judges WHERE id = ?').run(testJudgeId);

      const rows = db.prepare('SELECT * FROM question_judges').all() as AssignmentRow[];
      expect(rows).toHaveLength(0);
    });

    it('should filter by queue_id using index', () => {
      const db = getTestDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO question_judges (queue_id, question_id, judge_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run('queue_1', 'q1', testJudgeId, now);
      
      db.prepare(`
        INSERT INTO question_judges (queue_id, question_id, judge_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run('queue_1', 'q2', testJudgeId, now);

      const rows = db.prepare('SELECT * FROM question_judges WHERE queue_id = ?').all('queue_1') as AssignmentRow[];
      expect(rows).toHaveLength(2);
    });
  });
});
