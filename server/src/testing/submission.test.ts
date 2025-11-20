import { setupTestDatabase, teardownTestDatabase, getTestDb } from './setup';
import { SubmissionRow, SubmissionJSON } from '../models/submission.model';

describe('Submission Model', () => {
  beforeAll(() => {
    setupTestDatabase();
  });

  afterAll(() => {
    teardownTestDatabase();
  });

  beforeEach(() => {
    const db = getTestDb();
    db.exec('DELETE FROM submissions');
  });

  describe('Database Operations', () => {
    it('should insert a submission', () => {
      const db = getTestDb();
      const submission: Omit<SubmissionRow, 'id'> & { id: string } = {
        id: 'sub_1',
        queue_id: 'queue_1',
        labeling_task_id: 'task_1',
        created_at: Date.now(),
      };

      const stmt = db.prepare(`
        INSERT INTO submissions (id, queue_id, labeling_task_id, created_at)
        VALUES (?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        submission.id,
        submission.queue_id,
        submission.labeling_task_id,
        submission.created_at
      );

      expect(result.changes).toBe(1);
    });

    it('should retrieve a submission by id', () => {
      const db = getTestDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO submissions (id, queue_id, labeling_task_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run('sub_1', 'queue_1', 'task_1', now);

      const row = db.prepare('SELECT * FROM submissions WHERE id = ?').get('sub_1') as SubmissionRow;

      expect(row).toBeDefined();
      expect(row.id).toBe('sub_1');
      expect(row.queue_id).toBe('queue_1');
      expect(row.labeling_task_id).toBe('task_1');
      expect(row.created_at).toBe(now);
    });

    it('should retrieve submissions by queue_id', () => {
      const db = getTestDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO submissions (id, queue_id, labeling_task_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run('sub_1', 'queue_1', 'task_1', now);
      
      db.prepare(`
        INSERT INTO submissions (id, queue_id, labeling_task_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run('sub_2', 'queue_1', 'task_1', now + 1000);

      const rows = db.prepare('SELECT * FROM submissions WHERE queue_id = ?').all('queue_1') as SubmissionRow[];

      expect(rows).toHaveLength(2);
      expect(rows.every(r => r.queue_id === 'queue_1')).toBe(true);
    });

    it('should enforce primary key constraint', () => {
      const db = getTestDb();
      const now = Date.now();
      
      db.prepare(`
        INSERT INTO submissions (id, queue_id, labeling_task_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run('sub_1', 'queue_1', 'task_1', now);

      expect(() => {
        db.prepare(`
          INSERT INTO submissions (id, queue_id, labeling_task_id, created_at)
          VALUES (?, ?, ?, ?)
        `).run('sub_1', 'queue_1', 'task_1', now);
      }).toThrow();
    });

    it('should order by created_at using index', () => {
      const db = getTestDb();
      
      db.prepare(`
        INSERT INTO submissions (id, queue_id, labeling_task_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run('sub_1', 'queue_1', 'task_1', 1000);
      
      db.prepare(`
        INSERT INTO submissions (id, queue_id, labeling_task_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run('sub_2', 'queue_1', 'task_1', 3000);
      
      db.prepare(`
        INSERT INTO submissions (id, queue_id, labeling_task_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run('sub_3', 'queue_1', 'task_1', 2000);

      const rows = db.prepare('SELECT * FROM submissions ORDER BY created_at DESC').all() as SubmissionRow[];

      expect(rows[0].id).toBe('sub_2');
      expect(rows[1].id).toBe('sub_3');
      expect(rows[2].id).toBe('sub_1');
    });
  });

  describe('Type Validation', () => {
    it('should match SubmissionJSON structure', () => {
      const json: SubmissionJSON = {
        id: 'sub_1',
        queueId: 'queue_1',
        labelingTaskId: 'task_1',
        createdAt: Date.now(),
        questions: [
          {
            rev: 1,
            data: {
              id: 'q1',
              questionType: 'single_choice',
              questionText: 'Test?',
            },
          },
        ],
        answers: {
          q1: {
            choice: 'yes',
            reasoning: 'test',
          },
        },
      };

      expect(json.id).toBeDefined();
      expect(json.queueId).toBeDefined();
      expect(json.questions).toBeInstanceOf(Array);
      expect(json.answers).toBeInstanceOf(Object);
    });
  });
});
